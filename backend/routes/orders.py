"""
Orders API Routes — Order creation from cart with Razorpay order initialization.
All database operations use existing repositories from db/repositories.py.
"""

import logging
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, Field
from typing import Optional

import razorpay

from config.settings import settings
from db.database import get_db_connection
from db.repositories import CartRepository, AuditLogRepository
from db.models import AuditLogCreate

logger = logging.getLogger("agentshop.orders")
router = APIRouter()

# Initialize Razorpay client (test mode)
razorpay_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


class CreateOrderRequest(BaseModel):
    session_id: str
    discount_amount: float = Field(default=0.0, ge=0)
    is_ai_driven: bool = False


@router.post("/orders/create")
def create_order(body: CreateOrderRequest):
    """
    Create an order from the active cart:
    1. Read cart items from CartRepository.
    2. Insert order + order_items into SQLite.
    3. Create a Razorpay order in test mode.
    4. Return Razorpay order_id for frontend checkout.
    """
    # 1. Get cart summary
    cart_summary = CartRepository.get_cart_summary(body.session_id)
    if not cart_summary["items"]:
        raise HTTPException(status_code=400, detail="Cart is empty. Add items before creating an order.")

    total_amount = cart_summary["total_amount"]
    discount = min(body.discount_amount, total_amount)
    final_amount = round(total_amount - discount, 2)

    if final_amount <= 0:
        raise HTTPException(status_code=400, detail="Final order amount must be greater than zero.")

    # Check if any cart item was AI-recommended
    has_ai_items = any(item.get("was_recommended") for item in cart_summary["items"])
    is_ai_driven = body.is_ai_driven or has_ai_items

    # 2. Insert order into SQLite
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO orders (session_id, total_amount, discount_amount, final_amount, is_ai_driven, status)
            VALUES (?, ?, ?, ?, ?, 'CREATED')
        """, (body.session_id, total_amount, discount, final_amount, int(is_ai_driven)))
        order_id = cursor.lastrowid

        # Insert order items
        for item in cart_summary["items"]:
            cursor.execute("""
                INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, is_ai_driven)
                VALUES (?, ?, ?, ?, ?)
            """, (
                order_id,
                item["product_id"],
                item["quantity"],
                item["price"],
                int(item.get("was_recommended", False))
            ))

    # 3. Create Razorpay order (test mode) — amount in paise
    razorpay_amount = int(final_amount * 100)
    try:
        rz_order = razorpay_client.order.create({
            "amount": razorpay_amount,
            "currency": "INR",
            "receipt": f"agentshop_order_{order_id}",
            "notes": {
                "session_id": body.session_id,
                "order_id": str(order_id),
                "is_ai_driven": str(is_ai_driven)
            }
        })
        razorpay_order_id = rz_order["id"]
    except Exception as e:
        logger.error(f"Razorpay order creation failed: {e}")
        # Update order status to FAILED
        with get_db_connection() as conn:
            conn.execute("UPDATE orders SET status = 'FAILED' WHERE id = ?", (order_id,))
        raise HTTPException(status_code=502, detail=f"Payment gateway error: {str(e)}")

    # 4. Save Razorpay order ID back to our order
    with get_db_connection() as conn:
        conn.execute(
            "UPDATE orders SET razorpay_order_id = ? WHERE id = ?",
            (razorpay_order_id, order_id)
        )

    # 5. Log audit event
    AuditLogRepository.create_log(AuditLogCreate(
        session_id=body.session_id,
        event_type="ORDER_CREATED",
        strategy_used="AI_DRIVEN" if is_ai_driven else "ORGANIC",
        revenue_impact=0.0,
        status="SHOWN",
        explanation_text=f"Order #{order_id} created with {len(cart_summary['items'])} items. Razorpay order: {razorpay_order_id}"
    ))

    # 6. Mark cart as checked out
    CartRepository.update_cart_status(body.session_id, "checked_out")

    logger.info(f"Order #{order_id} created. Razorpay: {razorpay_order_id}, Amount: ₹{final_amount}")

    return {
        "order_id": order_id,
        "razorpay_order_id": razorpay_order_id,
        "razorpay_key_id": settings.RAZORPAY_KEY_ID,
        "total_amount": total_amount,
        "discount_amount": discount,
        "final_amount": final_amount,
        "final_amount_paise": razorpay_amount,
        "currency": "INR",
        "is_ai_driven": is_ai_driven,
        "items_count": len(cart_summary["items"]),
        "status": "CREATED"
    }


@router.get("/orders/{order_id}")
def get_order(order_id: int):
    """Fetch a single order with its items."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM orders WHERE id = ?", (order_id,))
        order = cursor.fetchone()
        if not order:
            raise HTTPException(status_code=404, detail=f"Order #{order_id} not found")
        order = dict(order)

        cursor.execute("""
            SELECT oi.*, p.name as product_name
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        """, (order_id,))
        order["items"] = [dict(row) for row in cursor.fetchall()]

    return order


@router.get("/orders")
def list_orders(
    x_session_id: Optional[str] = Header(None, alias="X-Session-Id")
):
    """List orders. Optionally filter by session ID."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if x_session_id:
            cursor.execute(
                "SELECT * FROM orders WHERE session_id = ? ORDER BY created_at DESC",
                (x_session_id,)
            )
        else:
            cursor.execute("SELECT * FROM orders ORDER BY created_at DESC LIMIT 50")
        return {"orders": [dict(row) for row in cursor.fetchall()]}
