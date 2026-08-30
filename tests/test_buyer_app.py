import pytest
from data.seed_data import seed_catalog
from db.repositories import ProductRepository, CartRepository

@pytest.fixture(autouse=True)
def setup_db():
    seed_catalog()

def test_buyer_app_product_filtering():
    """Verify category filtering for buyer app."""
    all_products = ProductRepository.get_all_products()
    assert len(all_products) >= 15
    
    tees = [p for p in all_products if p["category"].lower() == "tees"]
    assert len(tees) >= 3
    
    shoes = [p for p in all_products if p["category"].lower() == "shoes"]
    assert len(shoes) >= 4

def test_buyer_app_cart_operations():
    """Verify buyer app cart integration."""
    session_id = "test_buyer_session_999"
    
    # 1. Cart is initially empty
    summary = CartRepository.get_cart_summary(session_id)
    assert summary["total_items"] == 0
    
    # 2. Add product
    basic_tee = ProductRepository.get_product_by_name("Basic White Tee")
    CartRepository.add_item(session_id, basic_tee["id"], quantity=2)
    
    summary2 = CartRepository.get_cart_summary(session_id)
    assert summary2["total_items"] == 2
    assert summary2["total_amount"] == 2 * 399.0

def test_buyer_app_image_urls():
    """Verify all 15 catalog items have valid image_url values."""
    products = ProductRepository.get_all_products()
    for p in products:
        assert "image_url" in p
        assert p["image_url"].startswith("http")
