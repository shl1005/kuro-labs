import sys
import os

# Ensure current directory is on sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, SessionLocal, Base
from models import Product, Order, OrderItem, InventoryLog

PRODUCTS_DATA = [
    {
        "name": "Keychron Q1 Pro Wireless Custom Mechanical Keyboard",
        "slug": "keychron-q1-pro-wireless-custom-mechanical-keyboard",
        "description": "75% layout QMK/VIA wireless custom mechanical keyboard with CNC aluminum body and hot-swappable switches.",
        "price_cents": 19900,
        "stock_quantity": 15,
        "category": "Keyboards",
        "image_url": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "name": "Mode Sonnet High-End Custom Mechanical Keyboard",
        "slug": "mode-sonnet-custom-mechanical-keyboard",
        "description": "Premium compact 75% mechanical keyboard engineered with internal brass weights and gasket-mounted acoustic design.",
        "price_cents": 29900,
        "stock_quantity": 8,
        "category": "Keyboards",
        "image_url": "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "name": "Sony WH-1000XM5 Wireless Noise-Canceling Headphones",
        "slug": "sony-wh-1000xm5-noise-canceling-headphones",
        "description": "Industry-leading active noise canceling wireless headphones with two processors, 8 microphones, and up to 30-hour battery life.",
        "price_cents": 39900,
        "stock_quantity": 20,
        "category": "Audio",
        "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "name": "Bose QuietComfort 45 Wireless Noise-Canceling Headphones",
        "slug": "bose-quietcomfort-45-wireless-headphones",
        "description": "Iconic noise canceling over-ear headphones with TriPort acoustic architecture, Quiet/Aware modes, and lightweight comfort.",
        "price_cents": 27900,
        "stock_quantity": 0,  # Specifically set to 0 stock
        "category": "Audio",
        "image_url": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "name": "Logitech MX Master 3S Wireless Performance Mouse",
        "slug": "logitech-mx-master-3s-wireless-mouse",
        "description": "Ergonomic productivity mouse featuring Quiet Click switches, 8K DPI any-surface tracking, and MagSpeed electromagnetic scrolling.",
        "price_cents": 9900,
        "stock_quantity": 25,
        "category": "Mice",
        "image_url": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "name": "Pulsar X2V2 Wireless Ultra-Lightweight Gaming Mouse",
        "slug": "pulsar-x2v2-wireless-gaming-mouse",
        "description": "Symmetrical ultralight 53g gaming mouse with optical switches, PAW3395 sensor, and lag-free 2.4GHz wireless connectivity.",
        "price_cents": 9500,
        "stock_quantity": 18,
        "category": "Mice",
        "image_url": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "name": "Grovemade Wool Felt Desk Pad & Mat",
        "slug": "grovemade-wool-felt-desk-pad",
        "description": "Natural German merino wool felt desk mat providing warmth, cushioning, and an organized aesthetic for your workspace.",
        "price_cents": 7000,
        "stock_quantity": 30,
        "category": "Desk Accessories",
        "image_url": "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "name": "Minimalist Full-Grain Leather Extended Desk Mat",
        "slug": "minimalist-leather-extended-desk-mat",
        "description": "Handcrafted water-resistant vegan and full-grain leather desk blotter with anti-slip suede base for keyboards and mice.",
        "price_cents": 4500,
        "stock_quantity": 40,
        "category": "Desk Accessories",
        "image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    },
]


def seed_database():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Check if products already exist
        for item in PRODUCTS_DATA:
            existing = db.query(Product).filter(Product.slug == item["slug"]).first()
            if not existing:
                product = Product(**item)
                db.add(product)
                print(f"Added product: {item['name']} (Stock: {item['stock_quantity']})")
            else:
                existing.name = item["name"]
                existing.description = item["description"]
                existing.price_cents = item["price_cents"]
                existing.stock_quantity = item["stock_quantity"]
                existing.category = item["category"]
                existing.image_url = item["image_url"]
                print(f"Updated product: {item['name']} (Stock: {item['stock_quantity']})")

        db.commit()
        print("Database seeded successfully with 8 products (including 1 out-of-stock item).")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
