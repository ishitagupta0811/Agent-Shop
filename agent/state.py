from typing import TypedDict, Optional, Dict, Any, List

class AgentState(TypedDict, total=False):
    """
    State payload tracked throughout the LangGraph agent recommendation graph.
    """
    session_id: str
    buyer_action: str  # 'VIEW_PRODUCT', 'ADD_TO_CART', 'VIEW_CART', 'CART_INACTIVITY'
    current_product_id: Optional[int]
    cart: Dict[str, Any]
    merchant_config: Dict[str, Any]
    
    # Strategy & Candidates
    strategy: Optional[str]  # 'UPSELL', 'CROSS_SELL', 'SMART_BUNDLE', 'DEAD_STOCK_PUSH', 'CART_ABANDONMENT'
    candidate_product: Optional[Dict[str, Any]]
    bundle_products: Optional[List[Dict[str, Any]]]
    
    # Pricing & Guardrails
    original_price: float
    discount_applied: float
    final_price: float
    savings_amount: float
    
    # Output & Telemetry
    explanation_text: Optional[str]
    recommendation_payload: Optional[Dict[str, Any]]
    audit_log_id: Optional[int]
    
    # Execution Flags
    is_valid: bool
    error: Optional[str]
