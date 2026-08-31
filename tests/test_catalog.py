import pytest
from db.database import get_db_connection, init_db
from db.repositories import (
    ProductRepository, InventoryRepository, RelationshipRepository, MerchantConfigRepository, CartRepository
)
from data.seed_data import seed_catalog

@pytest.fixture(autouse=True)
def setup_test_database():
    """Seed catalog database before running tests."""
    seed_catalog()

def test_db_tables_exist():
    """Verify that all 9 required SQLite tables exist."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = {row["name"] for row in cursor.fetchall()}
    
    expected_tables = {
        "products", "product_relationships", "inventory",
        "merchant_config", "audit_logs", "orders", "order_items",
        "carts", "cart_items"
    }
    assert expected_tables.issubset(tables), f"Missing tables: {expected_tables - tables}"

def test_product_ingestion():
    """Verify 15 UrbanDrop products ingested from CSV."""
    products = ProductRepository.get_all_products()
    assert len(products) >= 15
    
    basic_tshirt = ProductRepository.get_product_by_name("Basic White T-Shirt")
    assert basic_tshirt is not None
    assert basic_tshirt["price"] == 399.0
    assert basic_tshirt["category"] == "tshirts"
    assert basic_tshirt["is_premium"] == 0

def test_upsell_relationships():
    """Verify upsell graph mapping: Basic White T-Shirt -> Premium White T-Shirt."""
    basic_tshirt = ProductRepository.get_product_by_name("Basic White T-Shirt")
    assert basic_tshirt is not None
    
    upsell_item = RelationshipRepository.get_upsell(basic_tshirt["id"])
    assert upsell_item is not None
    assert upsell_item["name"] == "Premium White T-Shirt"
    assert upsell_item["price"] > basic_tshirt["price"]

def test_cross_sell_relationships():
    """Verify cross-sell graph mappings for Blue Slim Jeans."""
    jeans = ProductRepository.get_product_by_name("Blue Slim Jeans")
    assert jeans is not None
    
    cross_sells = RelationshipRepository.get_cross_sells(jeans["id"])
    cross_sell_names = {item["name"] for item in cross_sells}
    
    assert "White Sneakers" in cross_sell_names or "Denim Jacket" in cross_sell_names

def test_dead_stock_detection():
    """Verify slow moving items (high stock, low sales) are flagged as dead stock."""
    dead_stock_items = InventoryRepository.get_dead_stock_items()
    dead_stock_names = {item["name"] for item in dead_stock_items}
    
    assert "Cargo Joggers" in dead_stock_names or "Track Pants" in dead_stock_names or "Sport Sandals" in dead_stock_names

def test_merchant_config_defaults():
    """Verify default merchant guardrail settings."""
    config = MerchantConfigRepository.get_config()
    assert config["upsell_enabled"] == 1
    assert config["cross_sell_enabled"] == 1
    assert config["bundle_enabled"] == 1
    assert config["dead_stock_enabled"] == 1
    assert config["max_discount_percentage"] == 15.0
    assert config["require_approval"] == 0

def test_cart_repository_operations():
    """Verify CartRepository methods: create_cart, add_item, update_quantity, remove_item, clear_cart."""
    session_id = "test_session_123"
    
    # 1. Get/Create Cart
    cart = CartRepository.get_cart(session_id)
    assert cart is not None
    assert cart["session_id"] == session_id
    assert cart["status"] == "active"
    
    # 2. Get Products
    basic_tshirt = ProductRepository.get_product_by_name("Basic White T-Shirt")
    jeans = ProductRepository.get_product_by_name("Blue Slim Jeans")
    
    # 3. Add Items
    summary1 = CartRepository.add_item(session_id, basic_tshirt["id"], quantity=2)
    assert summary1["total_items"] == 2
    assert summary1["total_amount"] == 2 * 399.0
    
    # Add recommended item
    summary2 = CartRepository.add_item(
        session_id, jeans["id"], quantity=1, was_recommended=True, recommendation_type="cross_sell"
    )
    assert summary2["total_items"] == 3
    assert len(summary2["items"]) == 2
    
    # Verify recommended flag
    rec_item = next(i for i in summary2["items"] if i["product_id"] == jeans["id"])
    assert rec_item["was_recommended"] == 1
    assert rec_item["recommendation_type"] == "cross_sell"
    
    # 4. Update Quantity
    updated = CartRepository.update_quantity(session_id, basic_tshirt["id"], quantity=5)
    assert updated is True
    summary3 = CartRepository.get_cart_summary(session_id)
    assert summary3["total_items"] == 6
    
    # 5. Remove Item
    removed = CartRepository.remove_item(session_id, jeans["id"])
    assert removed is True
    summary4 = CartRepository.get_cart_summary(session_id)
    assert len(summary4["items"]) == 1
    
    # 6. Clear Cart
    cleared = CartRepository.clear_cart(session_id)
    assert cleared is True
    summary5 = CartRepository.get_cart_summary(session_id)
    assert summary5["total_items"] == 0
    assert len(summary5["items"]) == 0
    
    # 7. Update Cart Status
    status_updated = CartRepository.update_cart_status(session_id, "checked_out")
    assert status_updated is True

