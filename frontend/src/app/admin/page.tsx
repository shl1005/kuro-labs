"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product, OrderResponse } from "@/types";
import {
  fetchProducts,
  fetchOrders,
  restockProduct,
  updateOrderStatus,
  createProduct,
} from "@/lib/api";
import { useCurrency } from "@/store/useCurrencyStore";
import {
  Package,
  Layers,
  ShoppingBag,
  ArrowLeft,
  RefreshCcw,
  Plus,
  Loader2,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  AlertOctagon,
  X,
} from "lucide-react";

const CATEGORY_PRESETS = ["Keyboards", "Audio", "Lifestyle", "Accessories", "Mice"];

export default function AdminDashboardPage() {
  const { currency, toggleCurrency, formatPrice } = useCurrency();
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"inventory" | "orders">("inventory");

  // Inline restock states: map of productId -> input quantity string
  const [restockInputs, setRestockInputs] = useState<Record<number, string>>({});
  const [restockingId, setRestockingId] = useState<number | null>(null);

  // Status updating state: map of orderId -> boolean
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  // Notification message
  const [bannerNotice, setBannerNotice] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Create Product Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    category: "Lifestyle",
    price: "",
    stock_quantity: "20",
    description: "",
    image_url: "",
  });

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [prodsData, ordersData] = await Promise.all([
        fetchProducts(),
        fetchOrders(),
      ]);
      setProducts(prodsData);
      setOrders(ordersData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load dashboard data";
      setBannerNotice({ text: msg, type: "error" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  const handleRestock = async (productId: number) => {
    const qtyStr = restockInputs[productId] || "5";
    const qty = parseInt(qtyStr, 10);

    if (isNaN(qty) || qty <= 0) {
      setBannerNotice({ text: "Please enter a valid positive restock number.", type: "error" });
      return;
    }

    setRestockingId(productId);
    try {
      const updatedProduct = await restockProduct(productId, qty);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? updatedProduct : p))
      );
      setRestockInputs((prev) => ({ ...prev, [productId]: "" }));
      setBannerNotice({
        text: `Restocked "${updatedProduct.name}" by +${qty} units (New total: ${updatedProduct.stock_quantity}).`,
        type: "success",
      });
      setTimeout(() => setBannerNotice(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to restock";
      setBannerNotice({ text: msg, type: "error" });
    } finally {
      setRestockingId(null);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const updatedOrder = await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? updatedOrder : o))
      );
      setBannerNotice({
        text: `Order #${orderId} status changed to ${newStatus}.`,
        type: "success",
      });
      setTimeout(() => setBannerNotice(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update order status";
      setBannerNotice({ text: msg, type: "error" });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productForm.name.trim()) {
      setBannerNotice({ text: "Product name is required.", type: "error" });
      return;
    }

    const priceNum = parseFloat(productForm.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setBannerNotice({ text: "Please provide a valid price greater than $0.", type: "error" });
      return;
    }

    const stockNum = parseInt(productForm.stock_quantity, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      setBannerNotice({ text: "Stock quantity must be a non-negative integer.", type: "error" });
      return;
    }

    const imageUrl = productForm.image_url.trim() || "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=1200&q=80";

    setIsSubmittingProduct(true);
    try {
      const newProduct = await createProduct({
        name: productForm.name.trim(),
        category: productForm.category.trim(),
        price_cents: Math.round(priceNum * 100),
        stock_quantity: stockNum,
        description: productForm.description.trim() || "Precision-crafted workspace hardware.",
        image_url: imageUrl,
      });

      // Automatically refresh inventory and orders
      await loadData();

      setIsCreateModalOpen(false);
      setProductForm({
        name: "",
        category: "Lifestyle",
        price: "",
        stock_quantity: "20",
        description: "",
        image_url: "",
      });

      setBannerNotice({
        text: `Product "${newProduct.name}" created successfully and added to catalog!`,
        type: "success",
      });
      setTimeout(() => setBannerNotice(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create product";
      setBannerNotice({ text: msg, type: "error" });
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Metrics
  const lowStockProducts = products.filter((p) => p.stock_quantity <= 3);
  const totalRevenue = orders.reduce((sum, o) => sum + o.total_cents, 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
      {/* Top Admin Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/shop"
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition-colors px-2 py-1 rounded-md hover:bg-zinc-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Store</span>
            </Link>

            <div className="h-4 w-px bg-zinc-800" />

            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-wider text-zinc-100 uppercase">
                KURO // OPS
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                ADMIN CONSOLE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Currency Switcher Pill Toggle */}
            <button
              onClick={toggleCurrency}
              type="button"
              aria-label={`Toggle currency switcher: currently ${mounted ? currency : "USD"}`}
              title="Toggle between USD ($) and INR (₹)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/90 hover:border-zinc-700 hover:bg-zinc-850 text-xs font-mono font-medium text-zinc-200 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="font-semibold text-zinc-100">
                {mounted ? (currency === "USD" ? "USD ($)" : "INR (₹)") : "USD ($)"}
              </span>
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>

            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-850 text-xs text-zinc-300 hover:text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Admin Page Main Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Operations &amp; Inventory Dashboard
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Real-time stock controls, order pipeline fulfillment, and SKU provisioning.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 text-sm font-semibold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>

        {/* Banner Notification */}
        {bannerNotice && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center justify-between animate-in fade-in ${
              bannerNotice.type === "success"
                ? "border-emerald-800/60 bg-emerald-950/30 text-emerald-300"
                : "border-rose-800/60 bg-rose-950/30 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {bannerNotice.type === "success" ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertOctagon className="w-4 h-4 shrink-0" />
              )}
              <span>{bannerNotice.text}</span>
            </div>
            <button
              onClick={() => setBannerNotice(null)}
              className="text-zinc-500 hover:text-zinc-300 text-xs font-mono cursor-pointer"
            >
              DISMISS
            </button>
          </div>
        )}

        {/* Dashboard KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono uppercase">
              <span>Catalog Size</span>
              <Layers className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="text-2xl font-mono font-semibold text-zinc-100">
              {loading ? "..." : products.length}
            </div>
            <div className="text-xs text-zinc-400">Total tech SKUs</div>
          </div>

          <div
            className={`p-4 rounded-xl border transition-colors space-y-1 backdrop-blur-md shadow-sm ${
              lowStockProducts.length > 0
                ? "border-amber-800/50 bg-amber-950/40 text-amber-400"
                : "border-zinc-800/80 bg-zinc-950/80"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono uppercase">
              <span>Low Stock Alert</span>
              <AlertTriangle
                className={`w-4 h-4 ${
                  lowStockProducts.length > 0 ? "text-amber-400 animate-pulse" : "text-zinc-500"
                }`}
              />
            </div>
            <div
              className={`text-2xl font-mono font-semibold ${
                lowStockProducts.length > 0 ? "text-amber-300" : "text-zinc-100"
              }`}
            >
              {loading ? "..." : lowStockProducts.length}
            </div>
            <div className="text-xs text-zinc-400">&le; 3 units remaining</div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono uppercase">
              <span>Total Orders</span>
              <ShoppingBag className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="text-2xl font-mono font-semibold text-zinc-100">
              {loading ? "..." : orders.length}
            </div>
            <div className="text-xs text-zinc-400">Processed checkouts</div>
          </div>

          <div className="p-4 rounded-xl border border-emerald-800/50 bg-emerald-950/40 backdrop-blur-md space-y-1 shadow-sm text-emerald-400">
            <div className="flex items-center justify-between text-xs text-emerald-400/80 font-mono uppercase">
              <span>Gross Volume</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-mono font-semibold text-emerald-300" suppressHydrationWarning>
              {loading ? "..." : formatPrice(totalRevenue)}
            </div>
            <div className="text-xs text-emerald-400/70">Captured revenue</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-zinc-800 flex items-center justify-between">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("inventory")}
              className={`pb-3 text-sm font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "inventory"
                  ? "border-white text-white font-semibold"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Inventory Management ({products.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("orders")}
              className={`pb-3 text-sm font-medium border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "orders"
                  ? "border-white text-white font-semibold"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Order Pipeline ({orders.length})</span>
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 mb-2 rounded-lg border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-xs font-medium text-zinc-200 hover:text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create SKU</span>
          </button>
        </div>

        {/* Tab 1: Inventory Management */}
        {activeTab === "inventory" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-zinc-100">Inventory Management</h2>
              <p className="text-sm text-zinc-400 mt-1">
                Products highlighted in <span className="text-amber-400 font-medium">amber/red</span> indicate critical inventory (&le; 3 units). Use inline restock to replenish.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/80">
                      <th className="text-xs font-mono font-semibold tracking-wider uppercase text-zinc-400 py-3.5 px-4">
                        Product SKU
                      </th>
                      <th className="text-xs font-mono font-semibold tracking-wider uppercase text-zinc-400 py-3.5 px-4">
                        Category
                      </th>
                      <th className="text-xs font-mono font-semibold tracking-wider uppercase text-zinc-400 py-3.5 px-4">
                        Price
                      </th>
                      <th className="text-xs font-mono font-semibold tracking-wider uppercase text-zinc-400 py-3.5 px-4">
                        Stock Status
                      </th>
                      <th className="text-xs font-mono font-semibold tracking-wider uppercase text-zinc-400 py-3.5 px-4 text-right">
                        Inline Restock
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-zinc-500 font-mono">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                          Loading inventory records...
                        </td>
                      </tr>
                    ) : products.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-zinc-500 text-sm">
                          No products found in database.
                        </td>
                      </tr>
                    ) : (
                      products.map((product) => {
                        const isCritical = product.stock_quantity <= 3 && product.stock_quantity > 0;
                        const isSoldOut = product.stock_quantity === 0;

                        return (
                          <tr
                            key={product.id}
                            className={`group transition-colors duration-150 hover:bg-zinc-900/60 ${
                              isSoldOut
                                ? "bg-rose-950/20"
                                : isCritical
                                ? "bg-amber-950/15"
                                : ""
                            }`}
                          >
                            {/* Product Info */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-800 shrink-0">
                                  <Image
                                    src={product.image_url}
                                    alt={product.name}
                                    fill
                                    sizes="44px"
                                    className="object-cover"
                                  />
                                </div>
                                <div className="min-w-0 max-w-xs">
                                  <div className="text-base font-medium text-zinc-100 truncate">
                                    {product.name}
                                  </div>
                                  <div className="text-sm font-mono text-zinc-400 truncate">
                                    {product.slug}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="py-3.5 px-4">
                              <span className="text-sm font-mono text-zinc-400 uppercase">
                                {product.category}
                              </span>
                            </td>

                            {/* Price */}
                            <td className="py-3.5 px-4 text-base font-mono font-semibold text-zinc-200" suppressHydrationWarning>
                              {formatPrice(product.price_cents)}
                            </td>

                            {/* Stock Status Badge */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                {product.stock_quantity <= 3 ? (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full animate-pulse bg-rose-500/20 text-rose-400 border border-rose-500/40">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                                    <span className="text-base font-mono font-semibold text-rose-300 mr-0.5">
                                      {product.stock_quantity}
                                    </span>
                                    {product.stock_quantity === 0 ? "Sold Out" : "Low Stock"}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/50 text-emerald-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    <span className="text-base font-mono font-semibold text-emerald-200 mr-0.5">
                                      {product.stock_quantity}
                                    </span>
                                    In Stock
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Inline Restock */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-2">
                                <input
                                  type="number"
                                  min="1"
                                  max="500"
                                  placeholder="+5"
                                  value={restockInputs[product.id] ?? ""}
                                  onChange={(e) =>
                                    setRestockInputs((prev) => ({
                                      ...prev,
                                      [product.id]: e.target.value,
                                    }))
                                  }
                                  className="w-20 text-base text-zinc-100 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg font-mono text-center placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                                />
                                <button
                                  onClick={() => handleRestock(product.id)}
                                  disabled={restockingId === product.id}
                                  className="px-3.5 py-2 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 text-sm font-semibold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-40"
                                >
                                  {restockingId === product.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Plus className="w-3.5 h-3.5" />
                                  )}
                                  <span>Restock</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Order Pipeline */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-zinc-100">Order Pipeline</h2>
              <p className="text-sm text-zinc-400 mt-1">
                Incoming customer orders. Update fulfillment status directly via the pipeline dropdown.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/80">
                      <th className="text-xs font-mono font-semibold tracking-wider uppercase text-zinc-400 py-3.5 px-4">
                        Order ID
                      </th>
                      <th className="text-xs font-mono font-semibold tracking-wider uppercase text-zinc-400 py-3.5 px-4">
                        Customer Details
                      </th>
                      <th className="text-xs font-mono font-semibold tracking-wider uppercase text-zinc-400 py-3.5 px-4">
                        Items Ordered
                      </th>
                      <th className="text-xs font-mono font-semibold tracking-wider uppercase text-zinc-400 py-3.5 px-4">
                        Total Volume
                      </th>
                      <th className="text-xs font-mono font-semibold tracking-wider uppercase text-zinc-400 py-3.5 px-4">
                        Pipeline Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-zinc-500 font-mono">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
                          Loading customer orders...
                        </td>
                      </tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-zinc-500 text-sm">
                          No orders recorded yet. Complete a checkout from the shop to view it here!
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr
                          key={order.id}
                          className="transition-colors duration-150 hover:bg-zinc-900/60"
                        >
                          {/* Order ID & Date */}
                          <td className="py-3.5 px-4">
                            <div className="text-sm font-mono text-zinc-400 font-semibold">
                              #{order.id}
                            </div>
                            <div className="text-xs font-mono text-zinc-500 mt-0.5">
                              {new Date(order.created_at).toLocaleDateString()}{" "}
                              {new Date(order.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </td>

                          {/* Customer */}
                          <td className="py-3.5 px-4">
                            <div className="text-base font-medium text-zinc-100">
                              {order.customer_email}
                            </div>
                            <div className="text-sm text-zinc-400">
                              {order.customer_name}
                            </div>
                          </td>

                          {/* Items */}
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="space-y-0.5">
                              {order.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="text-xs text-zinc-300 truncate font-mono"
                                >
                                  {item.quantity}× {item.product?.name || `Product #${item.product_id}`}
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Total */}
                          <td className="py-3.5 px-4 text-base font-mono font-semibold text-zinc-200" suppressHydrationWarning>
                            {formatPrice(order.total_cents)}
                          </td>

                          {/* Status Dropdown */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <select
                                value={order.status}
                                disabled={updatingOrderId === order.id}
                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                className={`text-base text-zinc-100 px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg font-mono font-medium focus:outline-none transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                                  order.status === "SHIPPED"
                                    ? "border-emerald-800 text-emerald-300"
                                    : order.status === "PROCESSING"
                                    ? "border-sky-800 text-sky-300"
                                    : "border-amber-800 text-amber-300"
                                }`}
                              >
                                <option value="PENDING" className="bg-zinc-900 text-zinc-200">
                                  PENDING
                                </option>
                                <option value="PROCESSING" className="bg-zinc-900 text-zinc-200">
                                  PROCESSING
                                </option>
                                <option value="SHIPPED" className="bg-zinc-900 text-zinc-200">
                                  SHIPPED
                                </option>
                              </select>

                              {updatingOrderId === order.id && (
                                <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Product Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-md transition-all duration-300 ease-out animate-in fade-in"
            onClick={() => !isSubmittingProduct && setIsCreateModalOpen(false)}
          />

          <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-zinc-950/95 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-300 ease-out">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-zinc-100">
                      Add Product
                    </h3>
                    <p className="text-sm text-zinc-400">
                      Add a new item to Kuro Labs catalog &amp; initialize inventory
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmittingProduct}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateProductSubmit} className="mt-5 space-y-4">
                {/* Product Name */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-zinc-300">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) =>
                      setProductForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g. Kuro Precision Ceramic Keycaps"
                    className="w-full text-base text-zinc-100 px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-zinc-300">
                    Category *
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {CATEGORY_PRESETS.map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() =>
                          setProductForm((prev) => ({ ...prev, category: cat }))
                        }
                        className={`text-xs px-2.5 py-1 rounded-md border transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                          productForm.category === cat
                            ? "bg-white text-zinc-950 font-semibold border-white"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    required
                    value={productForm.category}
                    onChange={(e) =>
                      setProductForm((prev) => ({ ...prev, category: e.target.value }))
                    }
                    placeholder="Or enter custom category"
                    className="w-full text-base text-zinc-100 px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>

                {/* Price and Stock Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-zinc-300">
                      Price ($ USD) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-base">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.5"
                        required
                        value={productForm.price}
                        onChange={(e) =>
                          setProductForm((prev) => ({ ...prev, price: e.target.value }))
                        }
                        placeholder="79.00"
                        className="w-full pl-8 pr-3 text-base text-zinc-100 px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg font-mono placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-zinc-300">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={productForm.stock_quantity}
                      onChange={(e) =>
                        setProductForm((prev) => ({
                          ...prev,
                          stock_quantity: e.target.value,
                        }))
                      }
                      placeholder="20"
                      className="w-full text-base text-zinc-100 px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg font-mono placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-zinc-300">
                    Product Description
                  </label>
                  <textarea
                    rows={3}
                    value={productForm.description}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Brief architectural details, materials, switch types, and ergonomics..."
                    className="w-full text-base text-zinc-100 px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors resize-none"
                  />
                </div>

                {/* Image URL */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-zinc-300">
                      Unsplash Image URL
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setProductForm((prev) => ({
                          ...prev,
                          image_url:
                            "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=1200&q=80",
                        }))
                      }
                      className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Fill Sample URL
                    </button>
                  </div>
                  <input
                    type="url"
                    value={productForm.image_url}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        image_url: e.target.value,
                      }))
                    }
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full text-base text-zinc-100 px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-zinc-850 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={isSubmittingProduct}
                    className="flex-1 py-2.5 rounded-lg border border-zinc-800 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingProduct}
                    className="flex-1 py-2.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 text-sm font-semibold transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingProduct ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating Product...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Create &amp; Publish</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
