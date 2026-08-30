import logging
from typing import Dict, Any, Optional, List
from langgraph.graph import StateGraph, END

from agent.state import AgentState
from agent.guardrails import MerchantGuardrailsEngine
from agent.tools import (
    get_upsell_candidate, get_cross_sell_candidate, create_smart_bundle,
    fetch_dead_stock_candidate, generate_ai_explanation
)
from db.repositories import (
    MerchantConfigRepository, CartRepository, AuditLogRepository, ProductRepository
)
from db.models import AuditLogCreate

logger = logging.getLogger("agentshop.graph")

def evaluate_context_node(state: AgentState) -> AgentState:
    """Node 1: Read session context, cart items, and merchant configuration."""
    session_id = state["session_id"]
    merchant_config = MerchantConfigRepository.get_config()
    cart_summary = CartRepository.get_cart_summary(session_id)

    state["merchant_config"] = merchant_config
    state["cart"] = cart_summary
    state["is_valid"] = True
    return state

def select_strategy_node(state: AgentState) -> AgentState:
    """Node 2: Select optimal recommendation strategy based on buyer action & merchant toggles."""
    buyer_action = state.get("buyer_action", "VIEW_PRODUCT")
    config = state["merchant_config"]
    cart_items = state["cart"].get("items", [])

    strategy = None

    if buyer_action == "VIEW_PRODUCT":
        if config.get("upsell_enabled", True) and state.get("current_product_id"):
            strategy = "UPSELL"
        elif config.get("cross_sell_enabled", True) and state.get("current_product_id"):
            strategy = "CROSS_SELL"
        elif config.get("dead_stock_enabled", True):
            strategy = "DEAD_STOCK_PUSH"
    elif buyer_action == "ADD_TO_CART":
        if config.get("cross_sell_enabled", True):
            strategy = "CROSS_SELL"
        elif config.get("bundle_enabled", True):
            strategy = "SMART_BUNDLE"
    elif buyer_action == "VIEW_CART":
        if config.get("bundle_enabled", True) and cart_items:
            strategy = "SMART_BUNDLE"
        elif config.get("dead_stock_enabled", True):
            strategy = "DEAD_STOCK_PUSH"
    elif buyer_action == "CART_INACTIVITY":
        if config.get("bundle_enabled", True) and cart_items:
            strategy = "CART_ABANDONMENT"
        elif config.get("dead_stock_enabled", True):
            strategy = "DEAD_STOCK_PUSH"

    state["strategy"] = strategy or "CROSS_SELL"
    return state

def fetch_candidate_node(state: AgentState) -> AgentState:
    """Node 3: Fetch recommendation candidates & pricing metadata."""
    strategy = state["strategy"]
    current_product_id = state.get("current_product_id")
    cart_items = state["cart"].get("items", [])
    cart_product_ids = [item["product_id"] for item in cart_items]
    config = state["merchant_config"]
    max_discount_pct = config.get("max_discount_percentage", 15.0)

    if strategy == "UPSELL" and current_product_id:
        upsell_data = get_upsell_candidate(current_product_id)
        if upsell_data:
            state["candidate_product"] = upsell_data["target_product"]
            state["original_price"] = upsell_data["target_product"]["price"]
            state["discount_applied"] = 0.0
            state["final_price"] = upsell_data["target_product"]["price"]
            state["savings_amount"] = 0.0
        else:
            # Fallback to CROSS_SELL if no upsell target exists
            state["strategy"] = "CROSS_SELL"
            return fetch_candidate_node(state)

    elif strategy == "CROSS_SELL":
        ref_id = current_product_id or (cart_product_ids[0] if cart_product_ids else 1)
        candidate = get_cross_sell_candidate(ref_id, cart_product_ids)
        if candidate:
            state["candidate_product"] = candidate
            state["original_price"] = candidate["price"]
            state["discount_applied"] = 0.0
            state["final_price"] = candidate["price"]
            state["savings_amount"] = 0.0
        else:
            state["strategy"] = "DEAD_STOCK_PUSH"
            return fetch_candidate_node(state)

    elif strategy == "SMART_BUNDLE":
        ref_id = current_product_id or (cart_product_ids[0] if cart_product_ids else 1)
        bundle_data = create_smart_bundle(ref_id, cart_product_ids, max_discount_pct)
        if bundle_data:
            state["candidate_product"] = bundle_data["target_product"]
            state["bundle_products"] = bundle_data["items"]
            state["original_price"] = bundle_data["original_total"]
            state["discount_applied"] = bundle_data["discount_percent"]
            state["final_price"] = bundle_data["final_total"]
            state["savings_amount"] = bundle_data["savings"]
        else:
            state["strategy"] = "CROSS_SELL"
            return fetch_candidate_node(state)

    elif strategy == "DEAD_STOCK_PUSH":
        candidate = fetch_dead_stock_candidate(cart_product_ids)
        if candidate:
            state["candidate_product"] = candidate
            discount_pct = MerchantGuardrailsEngine.cap_discount_percentage(15.0, config)
            orig = candidate["price"]
            savings = round(orig * (discount_pct / 100.0), 2)
            state["original_price"] = orig
            state["discount_applied"] = discount_pct
            state["final_price"] = round(orig - savings, 2)
            state["savings_amount"] = savings
        else:
            state["is_valid"] = False
            state["error"] = "No eligible recommendation candidates found."

    elif strategy == "CART_ABANDONMENT":
        cart_total = state["cart"].get("total_amount", 0.0)
        if cart_total > 0:
            discount_pct = MerchantGuardrailsEngine.cap_discount_percentage(10.0, config)
            savings = round(cart_total * (discount_pct / 100.0), 2)
            state["original_price"] = cart_total
            state["discount_applied"] = discount_pct
            state["final_price"] = round(cart_total - savings, 2)
            state["savings_amount"] = savings
        else:
            state["is_valid"] = False

    return state

def apply_guardrails_node(state: AgentState) -> AgentState:
    """Node 4: Validate strategy against merchant guardrails & cap discounts."""
    if not state.get("is_valid", True):
        return state

    strategy = state["strategy"]
    candidate = state.get("candidate_product")
    target_id = candidate["id"] if candidate else None
    requested_discount = state.get("discount_applied", 0.0)
    config = state["merchant_config"]

    is_valid, reason, capped_discount = MerchantGuardrailsEngine.validate_recommendation(
        strategy=strategy,
        target_product_id=target_id,
        requested_discount_pct=requested_discount,
        config=config
    )

    if not is_valid:
        state["is_valid"] = False
        state["error"] = reason
        return state

    # Update with capped discount
    if capped_discount != requested_discount:
        state["discount_applied"] = capped_discount
        orig = state.get("original_price", 0.0)
        state["savings_amount"] = round(orig * (capped_discount / 100.0), 2)
        state["final_price"] = round(orig - state["savings_amount"], 2)

    return state

def generate_explanation_node(state: AgentState) -> AgentState:
    """Node 5: Compose buyer explanation via Claude / fallback generator."""
    if not state.get("is_valid", True):
        return state

    strategy = state["strategy"]
    candidate = state.get("candidate_product") or {}
    curr_prod_id = state.get("current_product_id")
    curr_prod = ProductRepository.get_product_by_id(curr_prod_id) if curr_prod_id else None

    context = {
        "strategy": strategy,
        "base_product_name": curr_prod["name"] if curr_prod else "item",
        "base_price": curr_prod["price"] if curr_prod else 0.0,
        "source_product_name": curr_prod["name"] if curr_prod else "your selection",
        "source_price": curr_prod["price"] if curr_prod else 0.0,
        "target_product_name": candidate.get("name", "Item"),
        "target_price": candidate.get("price", 0.0),
        "price_delta": state.get("savings_amount", 0.0) if strategy == "UPSELL" else round(candidate.get("price", 0.0) - (curr_prod["price"] if curr_prod else 0.0), 2),
        "bundle_item_names": ", ".join([p["name"] for p in state.get("bundle_products", [candidate])]),
        "original_total": state.get("original_price", 0.0),
        "final_total": state.get("final_price", 0.0),
        "savings": state.get("savings_amount", 0.0),
        "discount_percent": state.get("discount_applied", 0.0),
    }

    explanation = generate_ai_explanation(strategy, context)
    state["explanation_text"] = explanation
    return state

def log_audit_node(state: AgentState) -> AgentState:
    """Node 6: Persist audit log entry and build final recommendation payload."""
    if not state.get("is_valid", True):
        return state

    session_id = state["session_id"]
    strategy = state["strategy"]
    candidate = state.get("candidate_product") or {}
    target_id = candidate.get("id")

    audit_id = AuditLogRepository.create_log(AuditLogCreate(
        session_id=session_id,
        event_type="RECOMMENDATION_SHOWN",
        strategy_used=strategy,
        target_product_id=target_id,
        discount_applied=state.get("discount_applied", 0.0),
        explanation_text=state.get("explanation_text", ""),
        status="SHOWN",
        revenue_impact=0.0
    ))

    state["audit_log_id"] = audit_id

    # Construct final payload
    state["recommendation_payload"] = {
        "recommendation_id": audit_id,
        "session_id": session_id,
        "strategy": strategy,
        "target_product": candidate,
        "bundle_products": state.get("bundle_products", []),
        "original_price": state.get("original_price", 0.0),
        "discount_applied": state.get("discount_applied", 0.0),
        "savings_amount": state.get("savings_amount", 0.0),
        "final_price": state.get("final_price", 0.0),
        "explanation": state.get("explanation_text", ""),
        "status": "SHOWN"
    }
    return state

# --- LangGraph Graph Assembly ---
builder = StateGraph(AgentState)

builder.add_node("evaluate_context", evaluate_context_node)
builder.add_node("select_strategy", select_strategy_node)
builder.add_node("fetch_candidate", fetch_candidate_node)
builder.add_node("apply_guardrails", apply_guardrails_node)
builder.add_node("generate_explanation", generate_explanation_node)
builder.add_node("log_audit", log_audit_node)

builder.set_entry_point("evaluate_context")

builder.add_edge("evaluate_context", "select_strategy")
builder.add_edge("select_strategy", "fetch_candidate")
builder.add_edge("fetch_candidate", "apply_guardrails")
builder.add_edge("apply_guardrails", "generate_explanation")
builder.add_edge("generate_explanation", "log_audit")
builder.add_edge("log_audit", END)

agent_graph = builder.compile()

def run_agent_recommendation(session_id: str, buyer_action: str = "VIEW_PRODUCT", product_id: Optional[int] = None) -> Dict[str, Any]:
    """Execute compiled agent recommendation graph."""
    initial_state: AgentState = {
        "session_id": session_id,
        "buyer_action": buyer_action,
        "current_product_id": product_id,
    }

    final_state = agent_graph.invoke(initial_state)

    if not final_state.get("is_valid", True):
        return {
            "status": "no_recommendation",
            "session_id": session_id,
            "message": final_state.get("error", "No recommendation generated under current context.")
        }

    return final_state.get("recommendation_payload", {})
