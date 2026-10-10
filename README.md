\# KURO // LABS — E-Commerce Engine \& Operations Suite



A high-performance, decoupled e-commerce architecture and order management system built with Next.js, FastAPI, and SQLite. Features an AI-driven shopping concierge, dynamic multi-currency recomputation (USD/INR), and an interactive merchant operations console.



\---



\## ⚡ Architecture Overview



\- \*\*Frontend:\*\* Next.js (App Router), TypeScript, Tailwind CSS, Lucide Icons

\- \*\*Backend:\*\* FastAPI (Python), Uvicorn, SQLite, SQLAlchemy / Pydantic

\- \*\*State \& Currency:\*\* Dynamic client-side dual-currency engine (`USD $` ⟷ `INR ₹`) with automatic recomputation across cart, storefront, and operations tables

\- \*\*AI Shopping Concierge:\*\* Semantic intent parser matching queries to catalog inventory

\- \*\*Operations Console (`/admin`):\*\* Real-time inventory telemetry, low-stock threshold triggers, and zero-race-condition inline restocking



\---



\## 🛠 Key Features



\### 🛍 Customer Experience

\- \*\*Curated Catalog:\*\* Category filtering (`Audio`, `Keyboards`, `Accessories`, `Mice`), search indexing, and real-time stock pills.

\- \*\*AI Concierge:\*\* Natural language chat interface recommending in-stock items with interactive mini-cards.

\- \*\*Slide-Over Cart \& Drawer:\*\* Instant quantity incrementation, subtotal recalculation, and multi-currency formatting.

\- \*\*Order Confirmation Modal:\*\* Post-checkout atomic receipt generation (`ORD-XXXXXX`) with multi-stage status progress bar.



\### ⚙ Merchant Operations Console (`/admin`)

\- \*\*Executive Telemetry:\*\* Live counters for Gross Volume, Processed Orders, Active Tech SKUs, and Low Stock Alerts.

\- \*\*Fulfillment Pipeline:\*\* Multi-stage order status progression (`PENDING` ➔ `PROCESSING` ➔ `SHIPPED`).

\- \*\*Atomic Restocking:\*\* Inline single-click inventory restock controls.



\---



\## 🚀 Local Development Setup



\### 1. Clone Repository \& Setup Backend

```bash

git clone \[https://github.com/](https://github.com/)<your-username>/kuro-labs.git

cd kuro-labs/backend



\# Create virtual environment

python -m venv venv



\# Activate virtual environment (Windows):

.\\venv\\Scripts\\activate

\# Activate virtual environment (macOS/Linux):

source venv/bin/activate



\# Install dependencies \& seed catalog

pip install -r requirements.txt

python seed.py



\# Launch FastAPI server

python -m uvicorn main:app --reload --port 8000

