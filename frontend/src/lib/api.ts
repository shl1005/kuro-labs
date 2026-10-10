import { Product, ProductCreatePayload, CheckoutPayload, OrderResponse, ChatResponse } from "@/types";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export { formatCurrency, type Currency } from "./currency";

export async function fetchProducts(category?: string, search?: string): Promise<Product[]> {
  const url = new URL(`${API_BASE_URL}/api/products`);
  if (category && category !== "All") {
    url.searchParams.append("category", category);
  }
  if (search && search.trim()) {
    url.searchParams.append("search", search.trim());
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.statusText}`);
  }

  return res.json();
}

export async function checkoutOrder(
  payload: CheckoutPayload
): Promise<{ success: boolean; data?: OrderResponse; error?: string; status?: number }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      const errorMessage = data?.detail || `Checkout failed (${res.status})`;
      return {
        success: false,
        error: errorMessage,
        status: res.status,
      };
    }

    return {
      success: true,
      data,
      status: res.status,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error occurred during checkout";
    return {
      success: false,
      error: message,
      status: 500,
    };
  }
}

export async function sendChatMessage(message: string): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.detail || `AI chat request failed (${res.status})`);
  }

  return res.json();
}

export async function fetchOrders(): Promise<OrderResponse[]> {
  const res = await fetch(`${API_BASE_URL}/api/orders`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch orders: ${res.statusText}`);
  }

  return res.json();
}

export async function updateOrderStatus(orderId: number, status: string): Promise<OrderResponse> {
  const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.detail || `Failed to update order status (${res.status})`);
  }

  return res.json();
}

export async function restockProduct(productId: number, quantity: number): Promise<Product> {
  const res = await fetch(`${API_BASE_URL}/api/products/${productId}/restock`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ quantity }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.detail || `Failed to restock product (${res.status})`);
  }

  return res.json();
}

export async function createProduct(payload: ProductCreatePayload): Promise<Product> {
  const res = await fetch(`${API_BASE_URL}/api/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.detail || `Failed to create product (${res.status})`);
  }

  return res.json();
}

