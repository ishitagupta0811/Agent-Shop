"""
Agent API Routes — AI Recommendations, Acceptance, Rejection, and Telemetry.
Phase 3: LangGraph Agentic Engine Integration.
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, Field

from agent.graph import run_agent_recommendation
from db.repositories import AuditLogRepository, CartRepository, ProductRepository, get_db_connection

logger = logging.getLogger("agentshop.routes.agent")
router = APIRouter()

class RecommendRequest(BaseModel):
    session_id: str
    buyer_action: str = Field(default="VIEW_PRODUCT", description="VIEW_PRODUCT, ADD_TO_CART, VIEW_CART, CART_INACTIVITY")
    product_id: Optional[int] = None

class ActionRequest(BaseModel):
    session_id: str

@router.post("/agent/recommend")
def get_recommendation(body: RecommendRequest):
    """
    Trigger LangGraph agent recommendation workflow for a given buyer action and session context.
    """
    try:
        payload = run_agent_recommendation(
            session_id=body.session_id,
            buyer_action=body.buyer_action,
            product_id=body.product_id
        )
        return payload
    except Exception as e:
        logger.error(f"Error executing agent recommendation graph: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Agent recommendation error: {str(e)}")

@router.post("/agent/recommend/{rec_id}/accept")
def accept_recommendation(rec_id: int, body: ActionRequest):
    """
    Accept an AI recommendation:
    1. Mark audit log entry as 'ACCEPTED'.
    2. Automatically add recommended product to buyer's cart with was_recommended=True.
    3. Calculate revenue impact.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM audit_logs WHERE id = ?", (rec_id,))
        log = cursor.fetchone()
        if not log:
            raise HTTPException(status_code=404, detail=f"Recommendation audit log #{rec_id} not found.")
        log_dict = dict(log)

    target_product_id = log_dict.get("target_product_id")
    if not target_product_id:
        raise HTTPException(status_code=400, detail="Recommendation log has no associated product.")

    product = ProductRepository.get_product_by_id(target_product_id)
    if not product:
        raise HTTPException(status_code=404, detail=f"Target product #{target_product_id} not found.")

    # Calculate revenue impact based on product price and applied discount
    discount_pct = log_dict.get("discount_applied", 0.0)
    original_price = product["price"]
    revenue_impact = round(original_price * (1 - discount_pct / 100.0), 2)

    # 1. Update Audit Log
    AuditLogRepository.update_log_status(log_id=rec_id, status="ACCEPTED", revenue_impact=revenue_impact)

    # 2. Add product to Cart
    strategy = log_dict.get("strategy_used", "AI_RECOMMENDED").lower()
    cart_summary = CartRepository.add_item(
        session_id=body.session_id,
        product_id=target_product_id,
        quantity=1,
        was_recommended=True,
        recommendation_type=strategy
    )

    logger.info(f"Recommendation #{rec_id} ACCEPTED by session {body.session_id}. Product #{target_product_id} added to cart.")

    return {
        "status": "accepted",
        "recommendation_id": rec_id,
        "product": product,
        "revenue_impact": revenue_impact,
        "cart": cart_summary
    }

@router.post("/agent/recommend/{rec_id}/reject")
def reject_recommendation(rec_id: int, body: ActionRequest):
    """
    Reject an AI recommendation:
    Mark audit log entry as 'REJECTED' with zero revenue impact.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM audit_logs WHERE id = ?", (rec_id,))
        log = cursor.fetchone()
        if not log:
            raise HTTPException(status_code=404, detail=f"Recommendation audit log #{rec_id} not found.")

    AuditLogRepository.update_log_status(log_id=rec_id, status="REJECTED", revenue_impact=0.0)
    logger.info(f"Recommendation #{rec_id} REJECTED by session {body.session_id}.")

    return {
        "status": "rejected",
        "recommendation_id": rec_id,
        "session_id": body.session_id
    }
