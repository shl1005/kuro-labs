import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from models import Product, Order, OrderItem, InventoryLog

client = TestClient(app)


def run_tests():
    print("=== 1. Testing GET /api/products ===")
    res = client.get("/api/products")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    products = res.json()
    assert len(products) == 8, f"Expected 8 products, got {len(products)}"
    print(f"PASS: Fetched {len(products)} products.")

    print("\n=== 2. Testing Category and Keyword Filters ===")
    res = client.get("/api/products?category=Keyboards")
    assert res.status_code == 200
    kb_products = res.json()
    assert len(kb_products) == 2, f"Expected 2 keyboards, got {len(kb_products)}"
    print(f"PASS: Category filter returned {len(kb_products)} keyboards.")

    res = client.get("/api/products?search=gaming")
    assert res.status_code == 200
    gaming_products = res.json()
    assert len(gaming_products) >= 1, "Expected at least 1 gaming product"
    print(f"PASS: Search filter returned {len(gaming_products)} products.")

    print("\n=== 3. Testing POST /api/checkout (Out of stock 409) ===")
    # Find out of stock item (Bose QC45)
    out_of_stock_item = next(p for p in products if p["stock_quantity"] == 0)
    print(f"Testing out of stock product: {out_of_stock_item['name']} (ID: {out_of_stock_item['id']})")
    
    res = client.post(
        "/api/checkout",
        json={
            "customer_name": "Test User",
            "customer_email": "test@example.com",
            "items": [{"product_id": out_of_stock_item["id"], "quantity": 1}],
        },
    )
    assert res.status_code == 409, f"Expected 409 Conflict, got {res.status_code}: {res.text}"
    print(f"PASS: Out of stock check returned 409 Conflict: {res.json()['detail']}")

    print("\n=== 4. Testing POST /api/checkout (Requested qty > stock 409) ===")
    in_stock_item = next(p for p in products if p["stock_quantity"] > 0)
    res = client.post(
        "/api/checkout",
        json={
            "customer_name": "Test User",
            "customer_email": "test@example.com",
            "items": [{"product_id": in_stock_item["id"], "quantity": in_stock_item["stock_quantity"] + 10}],
        },
    )
    assert res.status_code == 409, f"Expected 409 Conflict, got {res.status_code}: {res.text}"
    print(f"PASS: Exceeding stock returned 409 Conflict: {res.json()['detail']}")

    print("\n=== 5. Testing POST /api/checkout (Successful Atomic Transaction) ===")
    initial_stock = in_stock_item["stock_quantity"]
    purchase_qty = 2
    res = client.post(
        "/api/checkout",
        json={
            "customer_name": "Alex Tech",
            "customer_email": "alex@tech.dev",
            "items": [{"product_id": in_stock_item["id"], "quantity": purchase_qty}],
        },
    )
    assert res.status_code == 201, f"Expected 201 Created, got {res.status_code}: {res.text}"
    order = res.json()
    assert order["customer_name"] == "Alex Tech"
    assert order["status"] == "PENDING"
    assert order["total_cents"] == in_stock_item["price_cents"] * purchase_qty
    assert len(order["items"]) == 1
    order_id = order["id"]
    print(f"PASS: Order #{order_id} created successfully. Total: ${order['total_cents'] / 100:.2f}")

    # Verify inventory decrement in DB
    db = SessionLocal()
    updated_prod = db.query(Product).filter(Product.id == in_stock_item["id"]).first()
    assert updated_prod.stock_quantity == initial_stock - purchase_qty
    print(f"PASS: Stock decremented from {initial_stock} to {updated_prod.stock_quantity}.")

    # Verify inventory log
    log = (
        db.query(InventoryLog)
        .filter(InventoryLog.product_id == in_stock_item["id"], InventoryLog.reason == "PURCHASE")
        .order_by(InventoryLog.created_at.desc())
        .first()
    )
    assert log is not None
    assert log.change_amount == -purchase_qty
    print(f"PASS: InventoryLog recorded PURCHASE of {log.change_amount} units.")
    db.close()

    print("\n=== 6. Testing GET /api/orders ===")
    res = client.get("/api/orders")
    assert res.status_code == 200
    orders = res.json()
    assert len(orders) >= 1
    print(f"PASS: Retrieved {len(orders)} order(s).")

    print("\n=== 7. Testing PATCH /api/orders/{id}/status ===")
    res = client.patch(f"/api/orders/{order_id}/status", json={"status": "PROCESSING"})
    assert res.status_code == 200
    assert res.json()["status"] == "PROCESSING"

    res = client.patch(f"/api/orders/{order_id}/status", json={"status": "SHIPPED"})
    assert res.status_code == 200
    assert res.json()["status"] == "SHIPPED"
    print("PASS: Order status updated to PROCESSING then SHIPPED.")

    res = client.patch(f"/api/orders/{order_id}/status", json={"status": "INVALID_STATUS"})
    assert res.status_code == 400
    print(f"PASS: Invalid status rejected with 400 Bad Request.")

    print("\n=== 8. Testing POST /api/products/{id}/restock ===")
    current_stock = updated_prod.stock_quantity
    restock_qty = 10
    res = client.post(f"/api/products/{in_stock_item['id']}/restock", json={"quantity": restock_qty})
    assert res.status_code == 200
    restocked_product = res.json()
    assert restocked_product["stock_quantity"] == current_stock + restock_qty
    print(f"PASS: Product restocked from {current_stock} to {restocked_product['stock_quantity']}.")

    # Verify inventory log for RESTOCK
    db = SessionLocal()
    restock_log = (
        db.query(InventoryLog)
        .filter(InventoryLog.product_id == in_stock_item["id"], InventoryLog.reason == "RESTOCK")
        .order_by(InventoryLog.created_at.desc())
        .first()
    )
    assert restock_log is not None
    assert restock_log.change_amount == restock_qty
    print(f"PASS: InventoryLog recorded RESTOCK of +{restock_log.change_amount} units.")
    db.close()

    print("\n=== 9. Testing POST /api/chat (AI Intent & Recommendation) ===")
    # Query 1: Mechanical keyboard under $250
    res = client.post("/api/chat", json={"message": "I'm looking for a mechanical keyboard under $250"})
    assert res.status_code == 200
    chat_data = res.json()
    print("Chat reply 1:", chat_data["reply"])
    assert len(chat_data["suggested_products"]) > 0
    assert all(p["category"] == "Keyboards" for p in chat_data["suggested_products"])
    assert all(p["price_cents"] <= 25000 for p in chat_data["suggested_products"])
    print(f"PASS: Found {len(chat_data['suggested_products'])} keyboard(s) under $250.")

    # Query 2: Noise-canceling headphones
    res = client.post("/api/chat", json={"message": "Can you recommend noise-canceling headphones?"})
    assert res.status_code == 200
    chat_data2 = res.json()
    print("Chat reply 2:", chat_data2["reply"])
    assert len(chat_data2["suggested_products"]) > 0
    assert any("Headphones" in p["name"] or p["category"] == "Audio" for p in chat_data2["suggested_products"])
    print(f"PASS: Found {len(chat_data2['suggested_products'])} audio product(s).")

    # Query 3: Gaming gear under $100
    res = client.post("/api/chat", json={"message": "Show me gaming gear under $100"})
    assert res.status_code == 200
    chat_data3 = res.json()
    print("Chat reply 3:", chat_data3["reply"])
    assert len(chat_data3["suggested_products"]) > 0
    assert all(p["price_cents"] <= 10000 for p in chat_data3["suggested_products"])
    print(f"PASS: Found {len(chat_data3['suggested_products'])} gaming product(s) under $100.")

    print("\n=== 10. Testing CORS Headers ===")
    res = client.options(
        "/api/products",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "http://localhost:3000"
    print("PASS: CORS headers configured and verified for http://localhost:3000.")

    print("\nALL BACKEND TESTS PASSED SUCCESSFULLY! [OK]")


if __name__ == "__main__":
    run_tests()
