from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    name: str
    slug: str
    description: str
    price_cents: int
    stock_quantity: int
    category: str
    image_url: str


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1)
    slug: Optional[str] = None
    description: str = Field(..., min_length=1)
    price_cents: int = Field(gt=0, description="Price in cents (e.g. 19900 for $199.00)")
    stock_quantity: int = Field(default=0, ge=0, description="Available stock units")
    category: str = Field(..., min_length=1)
    image_url: str = Field(..., min_length=1)


class ProductResponse(ProductBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0, description="Quantity must be at least 1")


class OrderItemResponse(BaseModel):
    id: int
    order_id: int
    product_id: int
    quantity: int
    unit_price_cents: int
    product: Optional[ProductResponse] = None

    model_config = ConfigDict(from_attributes=True)


class OrderCreate(BaseModel):
    customer_name: str = Field(..., min_length=1)
    customer_email: str = Field(..., min_length=1)
    items: List[OrderItemCreate] = Field(..., min_length=1)


class OrderStatusUpdate(BaseModel):
    status: str = Field(..., description="Allowed statuses: PENDING, PROCESSING, SHIPPED")


class OrderResponse(BaseModel):
    id: int
    customer_name: str
    customer_email: str
    status: str
    total_cents: int
    created_at: datetime
    items: List[OrderItemResponse] = []

    model_config = ConfigDict(from_attributes=True)


class RestockRequest(BaseModel):
    quantity: int = Field(gt=0, description="Quantity to restock must be positive")


class InventoryLogResponse(BaseModel):
    id: int
    product_id: int
    change_amount: int
    reason: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str
    suggested_products: List[ProductResponse]
