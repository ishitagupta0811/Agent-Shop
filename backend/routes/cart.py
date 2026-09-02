"""
Cart API Routes — Session-based cart management.
All database operations use CartRepository from db/repositories.py.
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, Field
from typing import Optional

from db.repositories import CartRepository, ProductRepository, AuditLogRepository
from db.models import AuditLogCreate

router = APIRouter()


def _get_session_id(x_session_id: Optional[str] = Header(None, alias="X-Session-Id")) -> str:
    """Extract session ID from request header, or raise 400."""
    if not x_session_id:
        raise HTTPException(status_code=400, detail="X-Session-Id header is required")
    return x_session_id


# --- Request Bodies ---
class AddItemRequest(BaseModel):
    product_id: int
    quantity: int = Field(default=1, gt=0)
    was_recommended: bool = False
    recommendation_type: Optional[str] = None


class UpdateQuantityRequest(BaseModel):
    quantity: int = Field(..., gt=0)


# --- Cart Endpoints ---
@router.get("/cart")
def get_cart(x_session_id: Optional[str] = Header(None, alias="X-Session-Id")):
    """Get the active cart summary for the current session."""
    session_id = _get_session_id(x_session_id)
    summary = CartRepository.get_cart_summary(session_id)
    return summary


@router.post("/cart/add")
def add_to_cart(
    body: AddItemRequest,
    x_session_id: Optional[str] = Header(None, alias="X-Session-Id")
):
    """Add a product to the session cart. If product already exists, quantity is incremented."""
    session_id = _get_session_id(x_session_id)

    # Validate product exists
    product = ProductRepository.get_product_by_id(body.product_id)
    if not product:
        raise HTTPException(status_code=404, detail=f"Product with id {body.product_id} not found")

    summary = CartRepository.add_item(
        session_id=session_id,
        product_id=body.product_id,
        quantity=body.quantity,
        was_recommended=body.was_recommended,
        recommendation_type=body.recommendation_type
    )
    AuditLogRepository.create_log(AuditLogCreate(
        session_id=session_id,
        event_type="CART_ADD",
        strategy_used=(body.recommendation_type or "ORGANIC").upper(),
        target_product_id=body.product_id,
        discount_applied=0.0,
        explanation_text=f"Added {body.quantity}x '{product['name']}' to cart",
        status="ACCEPTED" if body.was_recommended else "ORGANIC",
        revenue_impact=0.0
    ))
    return summary


@router.put("/cart/item/{product_id}")
def update_cart_item(
    product_id: int,
    body: UpdateQuantityRequest,
    x_session_id: Optional[str] = Header(None, alias="X-Session-Id")
):
    """Update the quantity of a specific product in the cart."""
    session_id = _get_session_id(x_session_id)
    updated = CartRepository.update_quantity(session_id, product_id, body.quantity)
    if not updated:
        raise HTTPException(status_code=404, detail="Item not found in cart")
    return CartRepository.get_cart_summary(session_id)


@router.delete("/cart/item/{product_id}")
def remove_from_cart(
    product_id: int,
    x_session_id: Optional[str] = Header(None, alias="X-Session-Id")
):
    """Remove a product from the cart."""
    session_id = _get_session_id(x_session_id)
    removed = CartRepository.remove_item(session_id, product_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Item not found in cart")
    AuditLogRepository.create_log(AuditLogCreate(
        session_id=session_id,
        event_type="CART_REMOVE",
        strategy_used="ORGANIC",
        target_product_id=product_id,
        discount_applied=0.0,
        explanation_text=f"Removed product #{product_id} from cart",
        status="REJECTED",
        revenue_impact=0.0
    ))
    return CartRepository.get_cart_summary(session_id)


@router.delete("/cart/clear")
def clear_cart(x_session_id: Optional[str] = Header(None, alias="X-Session-Id")):
    """Clear all items from the cart."""
    session_id = _get_session_id(x_session_id)
    CartRepository.clear_cart(session_id)
    return CartRepository.get_cart_summary(session_id)
