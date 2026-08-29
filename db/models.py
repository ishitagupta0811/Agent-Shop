from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

# --- Product Models ---
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float = Field(..., ge=0)
    category: str
    margin_percent: float = Field(default=40.0, ge=0, le=100)
    is_premium: bool = False
    image_url: Optional[str] = ""

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- Inventory Models ---
class Inventory(BaseModel):
    product_id: int
    stock_quantity: int = Field(default=0, ge=0)
    units_sold: int = Field(default=0, ge=0)
    sales_velocity_score: float = 0.0
    is_dead_stock: bool = False
    updated_at: Optional[datetime] = None

class ProductDetail(Product):
    inventory: Optional[Inventory] = None
    upsell_product_id: Optional[int] = None
    cross_sell_product_ids: List[int] = []

# --- Product Relationship Models ---
class ProductRelationship(BaseModel):
    id: Optional[int] = None
    source_product_id: int
    target_product_id: int
    relation_type: str  # 'UPSELL', 'CROSS_SELL', 'BUNDLE_MATCH'
    priority_score: float = 1.0

# --- Merchant Config Models ---
class MerchantConfig(BaseModel):
    id: int = 1
    upsell_enabled: bool = True
    cross_sell_enabled: bool = True
    bundle_enabled: bool = True
    dead_stock_enabled: bool = True
    max_discount_percentage: float = Field(default=15.0, ge=0, le=50)
    require_approval: bool = False
    updated_at: Optional[datetime] = None

class MerchantConfigUpdate(BaseModel):
    upsell_enabled: Optional[bool] = None
    cross_sell_enabled: Optional[bool] = None
    bundle_enabled: Optional[bool] = None
    dead_stock_enabled: Optional[bool] = None
    max_discount_percentage: Optional[float] = Field(default=None, ge=0, le=50)
    require_approval: Optional[bool] = None

# --- Audit Log Models ---
class AuditLogCreate(BaseModel):
    session_id: str
    event_type: str
    strategy_used: Optional[str] = None
    target_product_id: Optional[int] = None
    discount_applied: float = 0.0
    explanation_text: Optional[str] = None
    status: str = "SHOWN"
    revenue_impact: float = 0.0

class AuditLog(AuditLogCreate):
    id: int
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Order & Checkout Models ---
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(default=1, gt=0)
    price_at_purchase: float
    is_ai_driven: bool = False

class OrderItem(OrderItemCreate):
    id: int
    order_id: int

class OrderCreate(BaseModel):
    session_id: str
    items: List[OrderItemCreate]
    total_amount: float
    discount_amount: float = 0.0
    final_amount: float
    is_ai_driven: bool = False

class Order(BaseModel):
    id: int
    session_id: str
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    total_amount: float
    discount_amount: float
    final_amount: float
    is_ai_driven: bool
    status: str
    created_at: datetime
    items: List[OrderItem] = []

# --- Cart Models ---
class CartItemAdd(BaseModel):
    product_id: int
    quantity: int = Field(default=1, gt=0)
    was_recommended: bool = False
    recommendation_type: Optional[str] = None

class CartItemUpdate(BaseModel):
    quantity: int = Field(..., gt=0)

class CartItemDetail(BaseModel):
    id: int
    cart_id: int
    product_id: int
    product_name: str
    category: str
    price: float
    quantity: int
    subtotal: float
    was_recommended: bool = False
    recommendation_type: Optional[str] = None
    added_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Cart(BaseModel):
    id: int
    session_id: str
    status: str = "active"  # 'active', 'checked_out', 'abandoned'
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CartSummary(BaseModel):
    cart_id: int
    session_id: str
    status: str
    items: List[CartItemDetail] = []
    total_amount: float = 0.0
    total_items: int = 0

