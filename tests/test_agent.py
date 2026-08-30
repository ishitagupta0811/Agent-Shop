import pytest
import uuid
from fastapi.testclient import TestClient

from backend.main import app
from data.seed_data import seed_catalog
from agent.graph import run_agent_recommendation
from db.repositories import ProductRepository, MerchantConfigRepository, AuditLogRepository, CartRepository

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    seed_catalog()

def test_upsell_recommendation_graph():
    session_id = f"test_session_upsell_{uuid.uuid4().hex[:6]}"
    basic_tee = ProductRepository.get_product_by_name("Basic White Tee")
    
    payload = run_agent_recommendation(
        session_id=session_id,
        buyer_action="VIEW_PRODUCT",
        product_id=basic_tee["id"]
    )
    
    assert "recommendation_id" in payload
    assert payload["strategy"] == "UPSELL"
    assert payload["target_product"]["name"] == "Premium White Tee"
    assert payload["status"] == "SHOWN"
    assert len(payload["explanation"]) > 0

def test_cross_sell_recommendation_graph():
    session_id = f"test_session_cross_{uuid.uuid4().hex[:6]}"
    jeans = ProductRepository.get_product_by_name("Blue Slim Jeans")
    
    payload = run_agent_recommendation(
        session_id=session_id,
        buyer_action="ADD_TO_CART",
        product_id=jeans["id"]
    )
    
    assert "recommendation_id" in payload
    assert payload["strategy"] in ("CROSS_SELL", "SMART_BUNDLE")
    assert payload["status"] == "SHOWN"

def test_guardrail_disabled_upsell_fallback():
    session_id = f"test_session_disabled_{uuid.uuid4().hex[:6]}"
    basic_tee = ProductRepository.get_product_by_name("Basic White Tee")
    
    # Disable upsell in merchant config
    MerchantConfigRepository.update_config({"upsell_enabled": False})
    
    payload = run_agent_recommendation(
        session_id=session_id,
        buyer_action="VIEW_PRODUCT",
        product_id=basic_tee["id"]
    )
    
    # Should fall back to CROSS_SELL or DEAD_STOCK_PUSH
    assert payload["strategy"] != "UPSELL"

def test_agent_api_recommend():
    session_id = f"api_rec_{uuid.uuid4().hex[:6]}"
    basic_tee = ProductRepository.get_product_by_name("Basic White Tee")
    
    resp = client.post("/api/agent/recommend", json={
        "session_id": session_id,
        "buyer_action": "VIEW_PRODUCT",
        "product_id": basic_tee["id"]
    })
    
    assert resp.status_code == 200
    data = resp.json()
    assert "recommendation_id" in data
    assert data["session_id"] == session_id

def test_agent_api_accept_recommendation():
    session_id = f"api_accept_{uuid.uuid4().hex[:6]}"
    basic_tee = ProductRepository.get_product_by_name("Basic White Tee")
    
    # 1. Get recommendation
    resp_rec = client.post("/api/agent/recommend", json={
        "session_id": session_id,
        "buyer_action": "VIEW_PRODUCT",
        "product_id": basic_tee["id"]
    })
    assert resp_rec.status_code == 200
    rec_id = resp_rec.json()["recommendation_id"]
    
    # 2. Accept recommendation
    resp_accept = client.post(f"/api/agent/recommend/{rec_id}/accept", json={
        "session_id": session_id
    })
    assert resp_accept.status_code == 200
    accept_data = resp_accept.json()
    assert accept_data["status"] == "accepted"
    assert accept_data["revenue_impact"] > 0
    
    # Verify cart has recommended item
    cart = CartRepository.get_cart_summary(session_id)
    rec_cart_item = next(i for i in cart["items"] if i["product_id"] == accept_data["product"]["id"])
    assert rec_cart_item["was_recommended"] == 1

def test_agent_api_reject_recommendation():
    session_id = f"api_reject_{uuid.uuid4().hex[:6]}"
    basic_tee = ProductRepository.get_product_by_name("Basic White Tee")
    
    # 1. Get recommendation
    resp_rec = client.post("/api/agent/recommend", json={
        "session_id": session_id,
        "buyer_action": "VIEW_PRODUCT",
        "product_id": basic_tee["id"]
    })
    assert resp_rec.status_code == 200
    rec_id = resp_rec.json()["recommendation_id"]
    
    # 2. Reject recommendation
    resp_reject = client.post(f"/api/agent/recommend/{rec_id}/reject", json={
        "session_id": session_id
    })
    assert resp_reject.status_code == 200
    assert resp_reject.json()["status"] == "rejected"
    
    # Verify audit log status is REJECTED
    logs = AuditLogRepository.get_all_logs(limit=10)
    target_log = next(l for l in logs if l["id"] == rec_id)
    assert target_log["status"] == "REJECTED"
