import re
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from database import engine, Base, get_db
from models import Product, Order, OrderItem, InventoryLog
from schemas import (
    ProductCreate,
    ProductResponse,
    OrderCreate,
    OrderResponse,
    OrderStatusUpdate,
    RestockRequest,
    ChatRequest,
    ChatResponse,
    InventoryLogResponse,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables exist on startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="E-Commerce Backend API",
    version="1.0.0",
    description="FastAPI + SQLAlchemy + SQLite backend service for consumer tech products",
    lifespan=lifespan,
)

# 1. CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "E-Commerce Backend API",
        "docs_url": "/docs",
    }


# 4. Core Endpoints

# GET /api/products: Filterable by category and search keyword
@app.get("/api/products", response_model=List[ProductResponse])
def get_products(
    category: Optional[str] = Query(None, description="Filter products by category name"),
    search: Optional[str] = Query(None, description="Search products by keyword in name or description"),
    q: Optional[str] = Query(None, description="Alternative alias for search query"),
    db: Session = Depends(get_db),
):
    query = db.query(Product)

    if category:
        query = query.filter(Product.category.ilike(f"%{category.strip()}%"))

    search_term = (search or q or "").strip()
    if search_term:
        term = f"%{search_term}%"
        query = query.filter(
            or_(
                Product.name.ilike(term),
                Product.description.ilike(term),
                Product.category.ilike(term),
            )
        )

    return query.all()


# GET /api/products/{id}: Get single product details
@app.get("/api/products/{id}", response_model=ProductResponse)
def get_product(id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {id} not found",
        )
    return product


# POST /api/products: Create a new product in the catalog
@app.post("/api/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    with db.begin():
        slug = (payload.slug or "").strip().lower()
        if not slug:
            slug = re.sub(r"[^a-z0-9]+", "-", payload.name.lower()).strip("-")

        existing = db.query(Product).filter(Product.slug == slug).first()
        if existing:
            import uuid
            slug = f"{slug}-{uuid.uuid4().hex[:6]}"

        new_product = Product(
            name=payload.name.strip(),
            slug=slug,
            description=payload.description.strip(),
            price_cents=payload.price_cents,
            stock_quantity=payload.stock_quantity,
            category=payload.category.strip(),
            image_url=payload.image_url.strip(),
        )
        db.add(new_product)
        db.flush()

        if payload.stock_quantity > 0:
            log_entry = InventoryLog(
                product_id=new_product.id,
                change_amount=payload.stock_quantity,
                reason="RESTOCK",
            )
            db.add(log_entry)

    db.refresh(new_product)
    return new_product


# POST /api/checkout: Atomic transaction with stock verification and logging
@app.post("/api/checkout", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def checkout(payload: OrderCreate, db: Session = Depends(get_db)):
    if not payload.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain at least one item.",
        )

    # Wrap entire checkout process inside an atomic transaction
    created_order_id = None
    try:
        with db.begin():
            total_cents = 0
            order_items_to_create = []

            for item_req in payload.items:
                product = db.query(Product).filter(Product.id == item_req.product_id).first()
                if not product:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Product with ID {item_req.product_id} not found.",
                    )

                # Check if product is out of stock
                if product.stock_quantity <= 0:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"Product '{product.name}' is currently out of stock.",
                    )

                # Check if requested quantity exceeds stock
                if item_req.quantity > product.stock_quantity:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=(
                            f"Requested quantity of {item_req.quantity} exceeds available "
                            f"stock of {product.stock_quantity} for '{product.name}'."
                        ),
                    )

                # Atomically decrement stock
                product.stock_quantity -= item_req.quantity

                # Record InventoryLog
                inventory_log = InventoryLog(
                    product_id=product.id,
                    change_amount=-item_req.quantity,
                    reason="PURCHASE",
                )
                db.add(inventory_log)

                line_total = product.price_cents * item_req.quantity
                total_cents += line_total

                order_items_to_create.append(
                    {
                        "product_id": product.id,
                        "quantity": item_req.quantity,
                        "unit_price_cents": product.price_cents,
                    }
                )

            # Insert Order record
            new_order = Order(
                customer_name=payload.customer_name,
                customer_email=payload.customer_email,
                status="PENDING",
                total_cents=total_cents,
            )
            db.add(new_order)
            db.flush()  # Generate ID for new_order

            created_order_id = new_order.id

            # Insert OrderItem records
            for item_data in order_items_to_create:
                order_item = OrderItem(
                    order_id=new_order.id,
                    product_id=item_data["product_id"],
                    quantity=item_data["quantity"],
                    unit_price_cents=item_data["unit_price_cents"],
                )
                db.add(order_item)

    except HTTPException:
        # Re-raise HTTPExceptions so FastAPI returns 409 / 404 / 400 with exact status & message
        # db.begin() context manager guarantees automatic rollback on unhandled exception
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during checkout: {str(exc)}",
        )

    # Fetch newly created order with eagerly loaded items
    full_order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == created_order_id)
        .first()
    )
    return full_order


# GET /api/orders: List all orders for admin panel
@app.get("/api/orders", response_model=List[OrderResponse])
def get_orders(db: Session = Depends(get_db)):
    orders = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .order_by(Order.created_at.desc())
        .all()
    )
    return orders


# PATCH /api/orders/{id}/status: Update order status
@app.patch("/api/orders/{id}/status", response_model=OrderResponse)
def update_order_status(id: int, payload: OrderStatusUpdate, db: Session = Depends(get_db)):
    valid_statuses = ["PENDING", "PROCESSING", "SHIPPED"]
    normalized_status = payload.status.strip().upper()

    if normalized_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{payload.status}'. Allowed values are: {', '.join(valid_statuses)}",
        )

    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == id)
        .first()
    )
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {id} not found.",
        )

    order.status = normalized_status
    db.commit()
    db.refresh(order)
    return order


# POST /api/products/{id}/restock: Increment inventory count and log
@app.post("/api/products/{id}/restock", response_model=ProductResponse)
def restock_product(id: int, payload: RestockRequest, db: Session = Depends(get_db)):
    if payload.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Restock quantity must be greater than zero.",
        )

    with db.begin():
        product = db.query(Product).filter(Product.id == id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {id} not found.",
            )

        product.stock_quantity += payload.quantity
        log_entry = InventoryLog(
            product_id=product.id,
            change_amount=payload.quantity,
            reason="RESTOCK",
        )
        db.add(log_entry)

    db.refresh(product)
    return product


# GET /api/inventory/logs: List inventory audit logs (useful for verification and admin panel)
@app.get("/api/inventory/logs", response_model=List[InventoryLogResponse])
def get_inventory_logs(
    product_id: Optional[int] = Query(None, description="Filter logs by product ID"),
    db: Session = Depends(get_db),
):
    query = db.query(InventoryLog)
    if product_id:
        query = query.filter(InventoryLog.product_id == product_id)
    return query.order_by(InventoryLog.created_at.desc()).all()


# 5. AI Intent & Recommendation Route
# POST /api/chat: Takes { message: string }, parses keywords and budget in Python, returns recommendation & products
@app.post("/api/chat", response_model=ChatResponse)
def chat_recommendation(payload: ChatRequest, db: Session = Depends(get_db)):
    raw_message = payload.message.strip()
    msg_lower = raw_message.lower()

    # 1. Budget extraction
    max_budget_cents: Optional[int] = None
    budget_patterns = [
        r"(?:under|below|less than|within|max of|maximum of|budget of)\s*\$?(\d+(?:\.\d{1,2})?)",
        r"\$?(\d+(?:\.\d{1,2})?)\s*(?:or less|budget|max|dollars|bucks)",
    ]
    for pattern in budget_patterns:
        match = re.search(pattern, msg_lower)
        if match:
            try:
                dollars = float(match.group(1))
                max_budget_cents = int(dollars * 100)
                break
            except ValueError:
                pass

    # 2. Category and keyword detection
    detected_categories = []
    keyword_filters = []

    # Mechanical Keyboard intent
    if any(k in msg_lower for k in ["mechanical keyboard", "keyboard", "keyboards", "switches", "typing"]):
        detected_categories.append("Keyboards")
        if "mechanical" in msg_lower:
            keyword_filters.append("mechanical")

    # Headphones / Audio intent
    if any(k in msg_lower for k in ["headphone", "headphones", "audio", "noise-canceling", "noise canceling", "anc", "sound", "earphones"]):
        detected_categories.append("Audio")
        if "noise" in msg_lower or "canceling" in msg_lower:
            keyword_filters.append("noise-canceling")

    # Mice intent
    if any(k in msg_lower for k in ["mouse", "mice", "trackball"]):
        detected_categories.append("Mice")

    # Desk Mat / Accessories intent
    if any(k in msg_lower for k in ["desk mat", "desk pad", "mat", "pad", "desk accessories", "desk setup"]):
        detected_categories.append("Desk Accessories")

    # Gaming intent
    is_gaming = "gaming" in msg_lower or "gamer" in msg_lower
    if is_gaming:
        keyword_filters.append("gaming")

    # Minimalist intent
    is_minimalist = "minimalist" in msg_lower or "minimal" in msg_lower
    if is_minimalist:
        keyword_filters.append("minimalist")

    # Wireless intent
    is_wireless = "wireless" in msg_lower
    if is_wireless:
        keyword_filters.append("wireless")

    # 3. Query building
    query = db.query(Product)

    if detected_categories:
        query = query.filter(Product.category.in_(detected_categories))

    if max_budget_cents is not None:
        query = query.filter(Product.price_cents <= max_budget_cents)

    for kw in keyword_filters:
        term = f"%{kw}%"
        query = query.filter(
            or_(
                Product.name.ilike(term),
                Product.description.ilike(term),
                Product.category.ilike(term),
            )
        )

    products = query.all()

    # Fallback search if strict filter returned 0 items
    if not products:
        fallback_query = db.query(Product)
        if max_budget_cents is not None:
            fallback_query = fallback_query.filter(Product.price_cents <= max_budget_cents)
        
        # Try matching any token > 3 chars
        tokens = [t for t in re.findall(r"\b[a-zA-Z]{3,}\b", msg_lower) if t not in ["under", "with", "want", "need", "show", "give", "find", "some", "like", "have"]]
        if tokens:
            token_conditions = [
                or_(Product.name.ilike(f"%{t}%"), Product.description.ilike(f"%{t}%"), Product.category.ilike(f"%{t}%"))
                for t in tokens
            ]
            fallback_query = fallback_query.filter(or_(*token_conditions))
            products = fallback_query.all()

    # If still empty and budget was specified, return top items under budget regardless of category
    if not products and max_budget_cents is not None:
        products = db.query(Product).filter(Product.price_cents <= max_budget_cents).limit(4).all()

    # If still completely empty (e.g. no products matched, or generic message like "hi")
    if not products:
        products = db.query(Product).limit(4).all()

    # 4. Craft natural language reply
    budget_str = f" under ${max_budget_cents / 100:.2f}" if max_budget_cents is not None else ""
    target_topics = []
    if detected_categories:
        target_topics.append("/".join(detected_categories).lower())
    if is_gaming:
        target_topics.append("gaming gear")
    if is_minimalist:
        target_topics.append("minimalist setup gear")

    topic_str = " and ".join(target_topics) if target_topics else "gear"

    if len(products) == 1:
        prod = products[0]
        stock_status = (
            f"currently in stock ({prod.stock_quantity} available)"
            if prod.stock_quantity > 0
            else "currently out of stock"
        )
        reply = (
            f"I found the perfect match for your {topic_str}{budget_str}: "
            f"the **{prod.name}** priced at ${prod.price_cents / 100:.2f}. "
            f"{prod.description} It is {stock_status}."
        )
    elif len(products) > 1:
        product_summaries = []
        for p in products[:3]:
            avail = "In Stock" if p.stock_quantity > 0 else "Out of Stock"
            product_summaries.append(f"- **{p.name}** (${p.price_cents / 100:.2f} - {avail}): {p.description}")
        
        reply = (
            f"Here are my top recommendations for your {topic_str}{budget_str}:\n\n"
            + "\n".join(product_summaries)
            + "\n\nLet me know if you would like more details or want to proceed with an order!"
        )
    else:
        reply = (
            f"I couldn't find any items matching your exact criteria{budget_str}. "
            "Here are some popular consumer tech favorites from our catalog you might love!"
        )

    return ChatResponse(reply=reply, suggested_products=products)
