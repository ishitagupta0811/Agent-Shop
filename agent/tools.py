import logging
from typing import Dict, Any, List, Optional
import anthropic

from config.settings import settings
from db.repositories import (
    ProductRepository, InventoryRepository, RelationshipRepository
)
from agent import prompts

logger = logging.getLogger("agentshop.tools")

def get_upsell_candidate(product_id: int) -> Optional[Dict[str, Any]]:
    """Retrieve higher-tier upsell upgrade candidate for a given product."""
    base_product = ProductRepository.get_product_by_id(product_id)
    if not base_product:
        return None

    target_product = RelationshipRepository.get_upsell(product_id)
    if not target_product:
        return None

    price_delta = round(target_product["price"] - base_product["price"], 2)
    return {
        "base_product": base_product,
        "target_product": target_product,
        "price_delta": max(0.0, price_delta)
    }

def get_cross_sell_candidate(product_id: int, cart_product_ids: List[int]) -> Optional[Dict[str, Any]]:
    """Retrieve complementary cross-sell candidate not already in cart."""
    cross_sells = RelationshipRepository.get_cross_sells(product_id)
    for item in cross_sells:
        if item["id"] not in cart_product_ids and item.get("stock_quantity", 0) > 0:
            return item
    return None

def create_smart_bundle(base_product_id: int, cart_product_ids: List[int], discount_pct: float) -> Optional[Dict[str, Any]]:
    """Create an outfit bundle combining base product with complementary cross-sell item."""
    base_product = ProductRepository.get_product_by_id(base_product_id)
    if not base_product:
        return None

    cross_item = get_cross_sell_candidate(base_product_id, cart_product_ids)
    if not cross_item:
        return None

    original_total = round(base_product["price"] + cross_item["price"], 2)
    savings = round(original_total * (discount_pct / 100.0), 2)
    final_total = round(original_total - savings, 2)

    return {
        "items": [base_product, cross_item],
        "target_product": cross_item,
        "original_total": original_total,
        "final_total": final_total,
        "savings": savings,
        "discount_percent": discount_pct
    }

def fetch_dead_stock_candidate(cart_product_ids: List[int]) -> Optional[Dict[str, Any]]:
    """Fetch slow-moving inventory item suitable for liquidation push."""
    dead_stock_items = InventoryRepository.get_dead_stock_items()
    for item in dead_stock_items:
        if item["id"] not in cart_product_ids and item.get("stock_quantity", 0) > 0:
            return item
    return None

def generate_ai_explanation(strategy: str, context: Dict[str, Any]) -> str:
    """
    Generate recommendation explanation using Anthropic Claude LLM tool.
    Falls back gracefully to deterministic templates if API key is not configured.
    """
    api_key = settings.ANTHROPIC_API_KEY
    is_valid_key = api_key and not api_key.startswith("sk-ant-placeholder")

    if is_valid_key:
        try:
            client = anthropic.Anthropic(api_key=api_key)
            prompt_template = getattr(prompts, f"{strategy}_PROMPT", None)
            if prompt_template:
                user_msg = prompt_template.format(**context)
                response = client.messages.create(
                    model="claude-3-haiku-20240307",
                    max_tokens=100,
                    system=prompts.SYSTEM_PROMPT,
                    messages=[{"role": "user", "content": user_msg}]
                )
                return response.content[0].text.strip()
        except Exception as e:
            logger.warning(f"Claude API call failed ({e}). Falling back to template explanation.")

    # Fallback Deterministic Explanation Engine
    if strategy == "UPSELL":
        return f"Upgrade to {context.get('target_product_name')} for just ₹{context.get('price_delta')} more — crafted with premium materials for superior comfort and durability."
    elif strategy == "CROSS_SELL":
        return f"Pair your {context.get('source_product_name')} with {context.get('target_product_name')} to complete the look effortlessly."
    elif strategy == "SMART_BUNDLE":
        return f"Get the complete outfit package ({context.get('bundle_item_names')}) and save ₹{context.get('savings')} ({context.get('discount_percent')}% OFF)!"
    elif strategy == "DEAD_STOCK_PUSH":
        return f"Limited Time Spotlight: Grab the versatile {context.get('target_product_name')} at {context.get('discount_percent')}% OFF (Save ₹{context.get('savings')})!"
    elif strategy == "CART_ABANDONMENT":
        return f"Complete your order today and unlock an exclusive ₹{context.get('savings')} discount on your cart!"

    return "Recommended for you based on style pairing and merchant value."
