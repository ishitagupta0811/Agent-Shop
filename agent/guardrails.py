import logging
from typing import Dict, Any, Tuple, Optional
from db.repositories import ProductRepository

logger = logging.getLogger("agentshop.guardrails")

class MerchantGuardrailsEngine:
    """
    Enforces merchant-defined policies, feature toggles, discount ceilings, and inventory checks.
    """

    @staticmethod
    def is_strategy_enabled(strategy: str, config: Dict[str, Any]) -> bool:
        """Check if merchant has enabled a specific recommendation strategy."""
        mapping = {
            "UPSELL": "upsell_enabled",
            "CROSS_SELL": "cross_sell_enabled",
            "SMART_BUNDLE": "bundle_enabled",
            "DEAD_STOCK_PUSH": "dead_stock_enabled",
            "CART_ABANDONMENT": "bundle_enabled",
        }
        config_key = mapping.get(strategy.upper())
        if not config_key:
            return False
        return bool(config.get(config_key, True))

    @staticmethod
    def cap_discount_percentage(requested_discount_pct: float, config: Dict[str, Any]) -> float:
        """Cap discount percentage to merchant-defined ceiling (e.g. max 15%)."""
        max_allowed = float(config.get("max_discount_percentage", 15.0))
        bounded = max(0.0, min(requested_discount_pct, max_allowed))
        if bounded < requested_discount_pct:
            logger.info(f"Guardrail: Capped requested discount {requested_discount_pct}% to merchant max {max_allowed}%")
        return round(bounded, 2)

    @staticmethod
    def validate_stock_availability(product_id: int) -> bool:
        """Ensure recommended product is currently in stock."""
        product = ProductRepository.get_product_by_id(product_id)
        if not product:
            return False
        stock = product.get("stock_quantity", 0)
        return stock > 0

    @staticmethod
    def validate_recommendation(
        strategy: str,
        target_product_id: Optional[int],
        requested_discount_pct: float,
        config: Dict[str, Any]
    ) -> Tuple[bool, str, float]:
        """
        Full guardrail validation check.
        Returns (is_valid, reason, capped_discount_percent).
        """
        # 1. Feature Toggle Check
        if not MerchantGuardrailsEngine.is_strategy_enabled(strategy, config):
            return False, f"Strategy '{strategy}' is disabled by merchant configuration.", 0.0

        # 2. Stock Check
        if target_product_id and not MerchantGuardrailsEngine.validate_stock_availability(target_product_id):
            return False, f"Target product #{target_product_id} is out of stock.", 0.0

        # 3. Discount Cap Check
        capped_discount = MerchantGuardrailsEngine.cap_discount_percentage(requested_discount_pct, config)

        return True, "Valid recommendation under merchant guardrails.", capped_discount
