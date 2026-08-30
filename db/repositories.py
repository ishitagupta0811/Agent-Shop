import sqlite3
import logging
from typing import List, Optional, Dict, Any
from db.database import get_db_connection
from db.models import (
    Product, Inventory, ProductRelationship, MerchantConfig, MerchantConfigUpdate,
    AuditLog, AuditLogCreate, Order, OrderCreate, OrderItem
)

logger = logging.getLogger("agentshop.repository")

class ProductRepository:
    @staticmethod
    def get_all_products() -> List[Dict[str, Any]]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT p.*, i.stock_quantity, i.units_sold, i.sales_velocity_score, i.is_dead_stock
                FROM products p
                LEFT JOIN inventory i ON p.id = i.product_id
                ORDER BY p.id ASC
            """)
            return [dict(row) for row in cursor.fetchall()]

    @staticmethod
    def get_product_by_id(product_id: int) -> Optional[Dict[str, Any]]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT p.*, i.stock_quantity, i.units_sold, i.sales_velocity_score, i.is_dead_stock
                FROM products p
                LEFT JOIN inventory i ON p.id = i.product_id
                WHERE p.id = ?
            """, (product_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    @staticmethod
    def get_product_by_name(name: str) -> Optional[Dict[str, Any]]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT p.*, i.stock_quantity, i.units_sold, i.sales_velocity_score, i.is_dead_stock
                FROM products p
                LEFT JOIN inventory i ON p.id = i.product_id
                WHERE LOWER(p.name) = LOWER(?)
            """, (name.strip(),))
            row = cursor.fetchone()
            return dict(row) if row else None

    @staticmethod
    def insert_product(name: str, description: str, price: float, category: str, margin_percent: float, is_premium: bool, image_url: str = "") -> int:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO products (name, description, price, category, margin_percent, is_premium, image_url)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(name) DO UPDATE SET
                    description=excluded.description,
                    price=excluded.price,
                    category=excluded.category,
                    margin_percent=excluded.margin_percent,
                    is_premium=excluded.is_premium,
                    image_url=excluded.image_url
            """, (name, description, price, category, margin_percent, is_premium, image_url))
            
            cursor.execute("SELECT id FROM products WHERE LOWER(name) = LOWER(?)", (name.strip(),))
            return cursor.fetchone()["id"]


class InventoryRepository:
    @staticmethod
    def upsert_inventory(product_id: int, stock_quantity: int, units_sold: int, velocity_score: float, is_dead_stock: bool) -> None:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO inventory (product_id, stock_quantity, units_sold, sales_velocity_score, is_dead_stock, updated_at)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(product_id) DO UPDATE SET
                    stock_quantity=excluded.stock_quantity,
                    units_sold=excluded.units_sold,
                    sales_velocity_score=excluded.sales_velocity_score,
                    is_dead_stock=excluded.is_dead_stock,
                    updated_at=CURRENT_TIMESTAMP
            """, (product_id, stock_quantity, units_sold, velocity_score, is_dead_stock))

    @staticmethod
    def get_dead_stock_items() -> List[Dict[str, Any]]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT p.*, i.stock_quantity, i.units_sold, i.sales_velocity_score
                FROM products p
                JOIN inventory i ON p.id = i.product_id
                WHERE i.is_dead_stock = 1 AND i.stock_quantity > 0
                ORDER BY i.stock_quantity DESC
            """)
            return [dict(row) for row in cursor.fetchall()]


class RelationshipRepository:
    @staticmethod
    def add_relationship(source_id: int, target_id: int, relation_type: str, priority_score: float = 1.0) -> None:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO product_relationships (source_product_id, target_product_id, relation_type, priority_score)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(source_product_id, target_product_id, relation_type) DO UPDATE SET
                    priority_score=excluded.priority_score
            """, (source_id, target_id, relation_type, priority_score))

    @staticmethod
    def get_upsell(source_id: int) -> Optional[Dict[str, Any]]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT p.*, i.stock_quantity
                FROM product_relationships r
                JOIN products p ON r.target_product_id = p.id
                JOIN inventory i ON p.id = i.product_id
                WHERE r.source_product_id = ? AND r.relation_type = 'UPSELL' AND i.stock_quantity > 0
                ORDER BY r.priority_score DESC
                LIMIT 1
            """, (source_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    @staticmethod
    def get_cross_sells(source_id: int) -> List[Dict[str, Any]]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT p.*, i.stock_quantity
                FROM product_relationships r
                JOIN products p ON r.target_product_id = p.id
                JOIN inventory i ON p.id = i.product_id
                WHERE r.source_product_id = ? AND r.relation_type = 'CROSS_SELL' AND i.stock_quantity > 0
                ORDER BY r.priority_score DESC
            """, (source_id,))
            return [dict(row) for row in cursor.fetchall()]


class MerchantConfigRepository:
    @staticmethod
    def get_config() -> Dict[str, Any]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM merchant_config WHERE id = 1")
            row = cursor.fetchone()
            if not row:
                cursor.execute("""
                    INSERT INTO merchant_config (id, upsell_enabled, cross_sell_enabled, bundle_enabled, dead_stock_enabled, max_discount_percentage, require_approval)
                    VALUES (1, 1, 1, 1, 1, 15.0, 0)
                """)
                cursor.execute("SELECT * FROM merchant_config WHERE id = 1")
                row = cursor.fetchone()
            return dict(row)

    @staticmethod
    def update_config(update_data: Dict[str, Any]) -> Dict[str, Any]:
        valid_fields = [
            "upsell_enabled", "cross_sell_enabled", "bundle_enabled",
            "dead_stock_enabled", "max_discount_percentage", "require_approval"
        ]
        updates = []
        params = []
        for k, v in update_data.items():
            if k in valid_fields and v is not None:
                updates.append(f"{k} = ?")
                params.append(v)
        
        if updates:
            params.append(1)
            sql = f"UPDATE merchant_config SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
            with get_db_connection() as conn:
                conn.execute(sql, params)
        
        return MerchantConfigRepository.get_config()


class AuditLogRepository:
    @staticmethod
    def create_log(log: AuditLogCreate) -> int:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO audit_logs (session_id, event_type, strategy_used, target_product_id, discount_applied, explanation_text, status, revenue_impact)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (log.session_id, log.event_type, log.strategy_used, log.target_product_id, log.discount_applied, log.explanation_text, log.status, log.revenue_impact))
            return cursor.lastrowid

    @staticmethod
    def update_log_status(log_id: int, status: str, revenue_impact: float = 0.0) -> None:
        with get_db_connection() as conn:
            conn.execute("""
                UPDATE audit_logs
                SET status = ?, revenue_impact = ?
                WHERE id = ?
            """, (status, revenue_impact, log_id))

    @staticmethod
    def get_all_logs(limit: int = 100) -> List[Dict[str, Any]]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT a.*, p.name as target_product_name
                FROM audit_logs a
                LEFT JOIN products p ON a.target_product_id = p.id
                ORDER BY a.timestamp DESC
                LIMIT ?
            """, (limit,))
            return [dict(row) for row in cursor.fetchall()]

    @staticmethod
    def get_metrics_summary() -> Dict[str, Any]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Total orders & AI-driven revenue
            cursor.execute("""
                SELECT 
                    COALESCE(SUM(final_amount), 0.0) as total_revenue,
                    COALESCE(SUM(CASE WHEN is_ai_driven = 1 THEN final_amount ELSE 0.0 END), 0.0) as ai_revenue,
                    COUNT(id) as total_orders,
                    COALESCE(SUM(CASE WHEN is_ai_driven = 1 THEN 1 ELSE 0 END), 0) as ai_orders
                FROM orders
                WHERE status = 'PAID'
            """)
            order_stats = dict(cursor.fetchone())

            # Recommendation conversion stats
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_recommendations,
                    COALESCE(SUM(CASE WHEN status = 'ACCEPTED' THEN 1 ELSE 0 END), 0) as accepted_recommendations
                FROM audit_logs
                WHERE event_type = 'RECOMMENDATION_SHOWN'
            """)
            rec_stats = dict(cursor.fetchone())

            total_recs = rec_stats["total_recommendations"]
            accepted_recs = rec_stats["accepted_recommendations"]
            conversion_rate = (accepted_recs / total_recs * 100.0) if total_recs > 0 else 0.0

            return {
                "total_revenue": order_stats["total_revenue"],
                "ai_revenue": order_stats["ai_revenue"],
                "organic_revenue": order_stats["total_revenue"] - order_stats["ai_revenue"],
                "ai_revenue_lift_percent": ((order_stats["ai_revenue"] / order_stats["total_revenue"] * 100.0) if order_stats["total_revenue"] > 0 else 0.0),
                "total_orders": order_stats["total_orders"],
                "total_recommendations": total_recs,
                "accepted_recommendations": accepted_recs,
                "conversion_rate_percent": round(conversion_rate, 2)
            }


class CartRepository:
    @staticmethod
    def create_cart(session_id: str) -> Dict[str, Any]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO carts (session_id, status, created_at, updated_at)
                VALUES (?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT(session_id) DO UPDATE SET
                    status = 'active',
                    updated_at = CURRENT_TIMESTAMP
            """, (session_id,))
            cursor.execute("SELECT * FROM carts WHERE session_id = ?", (session_id,))
            return dict(cursor.fetchone())

    @staticmethod
    def get_cart(session_id: str) -> Dict[str, Any]:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM carts WHERE session_id = ? AND status = 'active'", (session_id,))
            row = cursor.fetchone()
            if not row:
                return CartRepository.create_cart(session_id)
            return dict(row)

    @staticmethod
    def get_cart_items(session_id: str) -> List[Dict[str, Any]]:
        cart = CartRepository.get_cart(session_id)
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 
                    ci.id,
                    ci.cart_id,
                    ci.product_id,
                    p.name as product_name,
                    p.category,
                    p.price,
                    ci.quantity,
                    (p.price * ci.quantity) as subtotal,
                    ci.was_recommended,
                    ci.recommendation_type,
                    ci.added_at
                FROM cart_items ci
                JOIN products p ON ci.product_id = p.id
                WHERE ci.cart_id = ?
                ORDER BY ci.added_at ASC
            """, (cart["id"],))
            return [dict(row) for row in cursor.fetchall()]

    @staticmethod
    def add_item(
        session_id: str,
        product_id: int,
        quantity: int = 1,
        was_recommended: bool = False,
        recommendation_type: Optional[str] = None
    ) -> Dict[str, Any]:
        cart = CartRepository.get_cart(session_id)
        cart_id = cart["id"]
        
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO cart_items (cart_id, product_id, quantity, was_recommended, recommendation_type, added_at)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(cart_id, product_id) DO UPDATE SET
                    quantity = quantity + excluded.quantity,
                    was_recommended = excluded.was_recommended,
                    recommendation_type = COALESCE(excluded.recommendation_type, recommendation_type)
            """, (cart_id, product_id, quantity, int(was_recommended), recommendation_type))
            
            cursor.execute("UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", (cart_id,))
            
        return CartRepository.get_cart_summary(session_id)

    @staticmethod
    def remove_item(session_id: str, product_id: int) -> bool:
        cart = CartRepository.get_cart(session_id)
        cart_id = cart["id"]
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?", (cart_id, product_id))
            deleted = cursor.rowcount > 0
            if deleted:
                cursor.execute("UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", (cart_id,))
            return deleted

    @staticmethod
    def update_quantity(session_id: str, product_id: int, quantity: int) -> bool:
        if quantity <= 0:
            return CartRepository.remove_item(session_id, product_id)
            
        cart = CartRepository.get_cart(session_id)
        cart_id = cart["id"]
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE cart_items
                SET quantity = ?
                WHERE cart_id = ? AND product_id = ?
            """, (quantity, cart_id, product_id))
            updated = cursor.rowcount > 0
            if updated:
                cursor.execute("UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", (cart_id,))
            return updated

    @staticmethod
    def clear_cart(session_id: str) -> bool:
        cart = CartRepository.get_cart(session_id)
        cart_id = cart["id"]
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM cart_items WHERE cart_id = ?", (cart_id,))
            cursor.execute("UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", (cart_id,))
            return True

    @staticmethod
    def update_cart_status(session_id: str, status: str) -> bool:
        valid_statuses = ('active', 'checked_out', 'abandoned')
        if status not in valid_statuses:
            raise ValueError(f"Invalid status: {status}. Must be one of {valid_statuses}")
            
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE carts
                SET status = ?, updated_at = CURRENT_TIMESTAMP
                WHERE session_id = ? AND status = 'active'
            """, (status, session_id))
            return cursor.rowcount > 0

    @staticmethod
    def get_cart_summary(session_id: str) -> Dict[str, Any]:
        cart = CartRepository.get_cart(session_id)
        items = CartRepository.get_cart_items(session_id)
        
        total_amount = sum(item["subtotal"] for item in items)
        total_items = sum(item["quantity"] for item in items)
        
        return {
            "cart_id": cart["id"],
            "session_id": cart["session_id"],
            "status": cart["status"],
            "items": items,
            "total_amount": round(total_amount, 2),
            "total_items": total_items
        }

