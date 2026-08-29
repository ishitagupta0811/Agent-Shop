-- AgentShop SQLite Database Schema
-- UrbanDrop AI Growth & Agentic Commerce Engine

PRAGMA foreign_keys = ON;

-- 1. Core Products Table
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    price REAL NOT NULL CHECK(price >= 0),
    category TEXT NOT NULL,
    margin_percent REAL DEFAULT 40.0,
    is_premium BOOLEAN DEFAULT 0,
    image_url TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Product Relationships Graph (Upsell & Cross-Sell mappings)
CREATE TABLE IF NOT EXISTS product_relationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_product_id INTEGER NOT NULL,
    target_product_id INTEGER NOT NULL,
    relation_type TEXT NOT NULL CHECK(relation_type IN ('UPSELL', 'CROSS_SELL', 'BUNDLE_MATCH')),
    priority_score REAL DEFAULT 1.0,
    FOREIGN KEY (source_product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (target_product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(source_product_id, target_product_id, relation_type)
);

-- 3. Inventory & Velocity Tracking
CREATE TABLE IF NOT EXISTS inventory (
    product_id INTEGER PRIMARY KEY,
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK(stock_quantity >= 0),
    units_sold INTEGER NOT NULL DEFAULT 0 CHECK(units_sold >= 0),
    sales_velocity_score REAL DEFAULT 0.0,
    is_dead_stock BOOLEAN DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 4. Merchant Configuration & Policy Guardrails
CREATE TABLE IF NOT EXISTS merchant_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    upsell_enabled BOOLEAN DEFAULT 1,
    cross_sell_enabled BOOLEAN DEFAULT 1,
    bundle_enabled BOOLEAN DEFAULT 1,
    dead_stock_enabled BOOLEAN DEFAULT 1,
    max_discount_percentage REAL DEFAULT 15.0 CHECK(max_discount_percentage BETWEEN 0 AND 50),
    require_approval BOOLEAN DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Audit Trail Telemetry
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'RECOMMENDATION_SHOWN', 'RECOMMENDATION_ACCEPTED', 'RECOMMENDATION_REJECTED', 'ORDER_CREATED', 'PAYMENT_COMPLETED'
    strategy_used TEXT,       -- 'UPSELL', 'CROSS_SELL', 'SMART_BUNDLE', 'DEAD_STOCK_PUSH', 'CART_ABANDONMENT'
    target_product_id INTEGER,
    discount_applied REAL DEFAULT 0.0,
    explanation_text TEXT,
    status TEXT NOT NULL DEFAULT 'SHOWN', -- 'SHOWN', 'ACCEPTED', 'REJECTED', 'EXPIRED'
    revenue_impact REAL DEFAULT 0.0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (target_product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- 6. Orders
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    razorpay_order_id TEXT UNIQUE,
    razorpay_payment_id TEXT,
    total_amount REAL NOT NULL CHECK(total_amount >= 0),
    discount_amount REAL DEFAULT 0.0,
    final_amount REAL NOT NULL CHECK(final_amount >= 0),
    is_ai_driven BOOLEAN DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'CREATED', -- 'CREATED', 'PAID', 'FAILED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
    price_at_purchase REAL NOT NULL CHECK(price_at_purchase >= 0),
    is_ai_driven BOOLEAN DEFAULT 0,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Indexes for rapid lookup
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_relationships_source ON product_relationships(source_product_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON product_relationships(target_product_id);
CREATE INDEX IF NOT EXISTS idx_audit_session ON audit_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_status ON audit_logs(status);

-- 8. Carts Table
CREATE TABLE IF NOT EXISTS carts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'checked_out', 'abandoned')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Cart Items Table
CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cart_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
    was_recommended BOOLEAN DEFAULT 0,
    recommendation_type TEXT, -- 'upsell', 'cross_sell', 'bundle', 'dead_stock', 'cart_abandonment'
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(cart_id, product_id)
);

-- Indexes for carts and cart_items
CREATE INDEX IF NOT EXISTS idx_carts_session ON carts(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product ON cart_items(product_id);

