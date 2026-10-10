export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price_cents: number;
  stock_quantity: number;
  category: string;
  image_url: string;
}

export interface ProductCreatePayload {
  name: string;
  slug?: string;
  description: string;
  price_cents: number;
  stock_quantity: number;
  category: string;
  image_url: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItemPayload {
  product_id: number;
  quantity: number;
}

export interface CheckoutPayload {
  customer_name: string;
  customer_email: string;
  items: OrderItemPayload[];
}

export interface OrderItemResponse {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price_cents: number;
  product?: Product;
}

export interface OrderResponse {
  id: number;
  customer_name: string;
  customer_email: string;
  status: "PENDING" | "PROCESSING" | "SHIPPED";
  total_cents: number;
  created_at: string;
  items: OrderItemResponse[];
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  reply: string;
  suggested_products: Product[];
}
