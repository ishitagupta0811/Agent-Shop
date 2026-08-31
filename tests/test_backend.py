import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from backend.main import app
from db.database import init_db
from data.seed_data import seed_catalog

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_test_db():
    seed_catalog()

def test_health_endpoints():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["service"] == "AgentShop API"

    response_health = client.get("/health")
    assert response_health.status_code == 200
    assert response_health.json()["status"] == "healthy"

def test_catalog_endpoints():
    # 1. List products
    resp = client.get("/api/products")
    assert resp.status_code == 200
    products = resp.json()["products"]
    assert len(products) >= 15

    # 2. Get single product by ID
    product_id = products[0]["id"]
    resp_prod = client.get(f"/api/products/{product_id}")
    assert resp_prod.status_code == 200
    assert resp_prod.json()["name"] == products[0]["name"]
    assert "upsell" in resp_prod.json()
    assert "cross_sells" in resp_prod.json()

    # 3. Search product by name
    resp_search = client.get("/api/products/search/Basic%20White%20T-Shirt")
    assert resp_search.status_code == 200
    assert resp_search.json()["name"] == "Basic White T-Shirt"

    # 4. List categories
    resp_cat = client.get("/api/categories")
    assert resp_cat.status_code == 200
    assert "tshirts" in resp_cat.json()["categories"]

    # 5. List dead stock
    resp_dead = client.get("/api/dead-stock")
    assert resp_dead.status_code == 200
    assert resp_dead.json()["count"] > 0

def test_cart_endpoints():
    headers = {"X-Session-Id": "backend_test_session_456"}

    # 1. Add item to cart
    resp_add = client.post(
        "/api/cart/add",
        json={"product_id": 1, "quantity": 2, "was_recommended": False},
        headers=headers
    )
    assert resp_add.status_code == 200
    cart_summary = resp_add.json()
    assert cart_summary["total_items"] == 2

    # 2. Add recommended item
    resp_add_rec = client.post(
        "/api/cart/add",
        json={"product_id": 6, "quantity": 1, "was_recommended": True, "recommendation_type": "cross_sell"},
        headers=headers
    )
    assert resp_add_rec.status_code == 200
    assert resp_add_rec.json()["total_items"] == 3

    # 3. Get Cart
    resp_get = client.get("/api/cart", headers=headers)
    assert resp_get.status_code == 200
    assert resp_get.json()["total_items"] == 3

    # 4. Update item quantity
    resp_update = client.put(
        "/api/cart/item/1",
        json={"quantity": 4},
        headers=headers
    )
    assert resp_update.status_code == 200
    assert resp_update.json()["total_items"] == 5

    # 5. Remove item
    resp_del = client.delete("/api/cart/item/6", headers=headers)
    assert resp_del.status_code == 200
    assert resp_del.json()["total_items"] == 4

    # 6. Clear cart
    resp_clear = client.delete("/api/cart/clear", headers=headers)
    assert resp_clear.status_code == 200
    assert resp_clear.json()["total_items"] == 0

@patch("backend.routes.orders.razorpay_client")
def test_order_creation_with_razorpay(mock_razorpay_client):
    import uuid
    headers = {"X-Session-Id": f"backend_order_session_{uuid.uuid4().hex[:6]}"}

    # 1. Populate cart
    client.post("/api/cart/add", json={"product_id": 1, "quantity": 2}, headers=headers)
    client.post(
        "/api/cart/add",
        json={"product_id": 2, "quantity": 1, "was_recommended": True, "recommendation_type": "upsell"},
        headers=headers
    )

    mock_rz_id = f"order_mock_{uuid.uuid4().hex[:8]}"
    # Mock Razorpay order creation
    mock_razorpay_client.order.create.return_value = {
        "id": mock_rz_id,
        "entity": "order",
        "amount": 10000,
        "currency": "INR",
        "status": "created"
    }

    # 2. Create Order
    resp_order = client.post(
        "/api/orders/create",
        json={"session_id": headers["X-Session-Id"], "discount_amount": 50.0, "is_ai_driven": True}
    )
    assert resp_order.status_code == 200
    data = resp_order.json()

    assert data["order_id"] > 0
    assert data["razorpay_order_id"] == mock_rz_id
    assert data["status"] == "CREATED"
    assert data["is_ai_driven"] is True

    # 3. Get Order by ID
    order_id = data["order_id"]
    resp_get_order = client.get(f"/api/orders/{order_id}")
    assert resp_get_order.status_code == 200
    assert resp_get_order.json()["razorpay_order_id"] == mock_rz_id
    assert len(resp_get_order.json()["items"]) == 2

@patch("backend.routes.payments.razorpay_client")
def test_payment_verification(mock_razorpay_client):
    import uuid
    session_id = f"backend_payment_session_{uuid.uuid4().hex[:6]}"
    headers = {"X-Session-Id": session_id}

    # 1. Populate cart & mock order creation
    client.post("/api/cart/add", json={"product_id": 1, "quantity": 1}, headers=headers)

    mock_rz_id = f"order_pay_mock_{uuid.uuid4().hex[:8]}"
    with patch("backend.routes.orders.razorpay_client") as mock_rz_order:
        mock_rz_order.order.create.return_value = {"id": mock_rz_id}
        resp_order = client.post(
            "/api/orders/create",
            json={"session_id": session_id}
        )
    
    razorpay_order_id = resp_order.json()["razorpay_order_id"]

    # Mock signature verification success
    mock_razorpay_client.utility.verify_payment_signature.return_value = True

    # 2. Verify payment
    resp_pay = client.post("/api/payments/verify", json={
        "razorpay_order_id": razorpay_order_id,
        "razorpay_payment_id": f"pay_mock_{uuid.uuid4().hex[:8]}",
        "razorpay_signature": "mock_valid_signature_abc123"
    })
    assert resp_pay.status_code == 200
    assert resp_pay.json()["status"] == "verified"


def test_merchant_endpoints():
    # 1. Get config
    resp_cfg = client.get("/api/merchant/config")
    assert resp_cfg.status_code == 200
    assert resp_cfg.json()["max_discount_percentage"] == 15.0

    # 2. Update config
    resp_update = client.put("/api/merchant/config", json={"max_discount_percentage": 20.0, "require_approval": True})
    assert resp_update.status_code == 200
    assert resp_update.json()["max_discount_percentage"] == 20.0
    assert resp_update.json()["require_approval"] == 1

    # 3. Get metrics
    resp_metrics = client.get("/api/merchant/metrics")
    assert resp_metrics.status_code == 200
    assert "total_revenue" in resp_metrics.json()

    # 4. Get audit logs
    resp_logs = client.get("/api/merchant/audit-logs")
    assert resp_logs.status_code == 200
    assert "logs" in resp_logs.json()
