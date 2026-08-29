"""
Payments API Routes — Razorpay payment signature verification and order status update.
All database operations use existing repositories from db/repositories.py.
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

import razorpay

from config.settings import settings
from db.database import get_db_connection
from db.repositories import AuditLogRepository
from db.models import AuditLogCreate

logger = logging.getLogger("agentshop.payments")
router = APIRouter()

# Reuse Razorpay client
razorpay_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@router.post("/payments/verify")
def verify_payment(body: VerifyPaymentRequest):
    """
    Verify Razorpay payment signature:
    1. Call razorpay.utility.verify_payment_signature().
    2. If valid, update order status to PAID.
    3. If invalid, update order status to FAILED.
    4. Log audit event for PAYMENT_COMPLETED or PAYMENT_FAILED.
    """
    # 1. Look up internal order by razorpay_order_id
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM orders WHERE razorpay_order_id = ?", (body.razorpay_order_id,))
        order = cursor.fetchone()
        if not order:
            raise HTTPException(
                status_code=404,
                detail=f"No order found for Razorpay order ID: {body.razorpay_order_id}"
            )
        order = dict(order)

    if order["status"] == "PAID":
        return {
            "status": "already_verified",
            "order_id": order["id"],
            "message": "This payment has already been verified."
        }

    # 2. Verify signature
    try:
        razorpay_client.utility.verify_payment_signature({
            "razorpay_order_id": body.razorpay_order_id,
            "razorpay_payment_id": body.razorpay_payment_id,
            "razorpay_signature": body.razorpay_signature
        })
        signature_valid = True
    except razorpay.errors.SignatureVerificationError:
        signature_valid = False
    except Exception as e:
        logger.error(f"Signature verification error: {e}")
        raise HTTPException(status_code=500, detail=f"Verification error: {str(e)}")

    # 3. Update order status
    if signature_valid:
        new_status = "PAID"
        event_type = "PAYMENT_COMPLETED"
    else:
        new_status = "FAILED"
        event_type = "PAYMENT_FAILED"

    with get_db_connection() as conn:
        conn.execute(
            "UPDATE orders SET status = ?, razorpay_payment_id = ? WHERE id = ?",
            (new_status, body.razorpay_payment_id, order["id"])
        )

    # 4. Log audit event
    AuditLogRepository.create_log(AuditLogCreate(
        session_id=order["session_id"],
        event_type=event_type,
        strategy_used="AI_DRIVEN" if order["is_ai_driven"] else "ORGANIC",
        revenue_impact=order["final_amount"] if signature_valid else 0.0,
        status="ACCEPTED" if signature_valid else "REJECTED",
        explanation_text=f"Payment {'verified' if signature_valid else 'failed'} for order #{order['id']}. Payment ID: {body.razorpay_payment_id}"
    ))

    logger.info(f"Payment {'verified' if signature_valid else 'FAILED'} for order #{order['id']}")

    if not signature_valid:
        raise HTTPException(
            status_code=400,
            detail="Payment signature verification failed. Payment is invalid."
        )

    return {
        "status": "verified",
        "order_id": order["id"],
        "razorpay_payment_id": body.razorpay_payment_id,
        "amount_paid": order["final_amount"],
        "message": "Payment verified successfully."
    }
