"""
UrbanDrop Buyer E-Commerce Web Application (Streamlit)
Phase 4: Buyer E-Commerce Experience & Razorpay Payment Integration
"""

import sys
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import uuid
import logging
import requests
import streamlit as st

from config.settings import settings
from db.repositories import ProductRepository, CartRepository, AuditLogRepository

logger = logging.getLogger("agentshop.buyer_app")

# Streamlit Page Config
st.set_page_config(
    page_title="UrbanDrop — AI Growth & Agentic Commerce",
    page_icon="🛍️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# API Base URL
API_BASE_URL = f"http://localhost:{settings.PORT}/api"

# --- Custom Styling & Design System ---
CUSTOM_CSS = """
<style>
    /* Global Theme Overrides */
    .stApp {
        background-color: #0F172A;
        color: #F8FAFC;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    
    /* Header Branding */
    .brand-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 0 1.5rem 0;
        border-bottom: 1px solid #1E293B;
        margin-bottom: 1.5rem;
    }
    .brand-logo {
        font-size: 1.8rem;
        font-weight: 800;
        background: linear-gradient(135deg, #38BDF8 0%, #818CF8 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        letter-spacing: -0.5px;
    }
    .brand-tagline {
        color: #94A3B8;
        font-size: 0.85rem;
        margin-top: 2px;
    }

    /* Product Cards */
    .product-card {
        background-color: #1E293B;
        border-radius: 12px;
        padding: 1rem;
        border: 1px solid #334155;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        margin-bottom: 1.5rem;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }
    .product-card:hover {
        transform: translateY(-4px);
        border-color: #38BDF8;
        box-shadow: 0 10px 25px -5px rgba(56, 189, 248, 0.15);
    }
    .product-image {
        width: 100%;
        height: 180px;
        object-fit: cover;
        border-radius: 8px;
        margin-bottom: 0.75rem;
        background-color: #0F172A;
    }
    .product-title {
        font-size: 1.1rem;
        font-weight: 700;
        color: #F8FAFC;
        margin-bottom: 0.25rem;
    }
    .product-price {
        font-size: 1.25rem;
        font-weight: 800;
        color: #38BDF8;
        margin: 0.5rem 0;
    }
    .badge-category {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 600;
        background-color: #334155;
        color: #CBD5E1;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .badge-premium {
        background-color: #FEF3C7;
        color: #92400E;
    }
    .badge-deadstock {
        background-color: #FEE2E2;
        color: #991B1B;
    }
    
    /* AI Assistant Drawer Card */
    .ai-assistant-card {
        background: linear-gradient(135deg, #1E1B4B 0%, #311B92 100%);
        border: 1px solid #6366F1;
        border-radius: 12px;
        padding: 1.25rem;
        margin-top: 1rem;
        color: #F8FAFC;
        box-shadow: 0 10px 30px -5px rgba(99, 102, 241, 0.3);
    }
    .ai-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 700;
        background-color: #10B981;
        color: #042F2E;
        text-transform: uppercase;
        margin-bottom: 0.75rem;
    }
    .ai-quote {
        font-style: italic;
        color: #E2E8F0;
        font-size: 0.9rem;
        line-height: 1.4;
        margin: 0.75rem 0;
        padding-left: 0.75rem;
        border-left: 3px solid #38BDF8;
    }

    /* Checkout & Modal Styling */
    .checkout-summary-box {
        background-color: #1E293B;
        border-radius: 12px;
        padding: 1.5rem;
        border: 1px solid #334155;
    }
</style>
"""
st.markdown(CUSTOM_CSS, unsafe_allow_html=True)

# --- Session State Initialization ---
if "session_id" not in st.session_state:
    st.session_state.session_id = f"session_{uuid.uuid4().hex[:8]}"

if "active_view" not in st.session_state:
    st.session_state.active_view = "catalog"

if "selected_category" not in st.session_state:
    st.session_state.selected_category = "All"

if "selected_product_id" not in st.session_state:
    st.session_state.selected_product_id = None

if "active_recommendation" not in st.session_state:
    st.session_state.active_recommendation = None

if "recent_order" not in st.session_state:
    st.session_state.recent_order = None


# --- API Helper Functions with Direct Fallback ---
def get_session_headers():
    return {"X-Session-Id": st.session_state.session_id}

def fetch_products(category=None):
    try:
        url = f"{API_BASE_URL}/products"
        params = {"category": category} if category and category != "All" else {}
        resp = requests.get(url, params=params, timeout=3)
        if resp.status_code == 200:
            return resp.json().get("products", [])
    except Exception:
        pass
    
    # Fallback to repository directly
    products = ProductRepository.get_all_products()
    if category and category != "All":
        products = [p for p in products if p["category"].lower() == category.lower()]
    return products

def fetch_cart_summary():
    try:
        url = f"{API_BASE_URL}/cart"
        resp = requests.get(url, headers=get_session_headers(), timeout=3)
        if resp.status_code == 200:
            return resp.json()
    except Exception:
        pass
    
    return CartRepository.get_cart_summary(st.session_state.session_id)

def add_to_cart_api(product_id, quantity=1, was_recommended=False, recommendation_type=None):
    try:
        url = f"{API_BASE_URL}/cart/add"
        payload = {
            "product_id": product_id,
            "quantity": quantity,
            "was_recommended": was_recommended,
            "recommendation_type": recommendation_type
        }
        resp = requests.post(url, json=payload, headers=get_session_headers(), timeout=3)
        if resp.status_code == 200:
            return resp.json()
    except Exception:
        pass
    
    return CartRepository.add_item(
        session_id=st.session_state.session_id,
        product_id=product_id,
        quantity=quantity,
        was_recommended=was_recommended,
        recommendation_type=recommendation_type
    )

def update_cart_quantity_api(product_id, quantity):
    try:
        url = f"{API_BASE_URL}/cart/item/{product_id}"
        resp = requests.put(url, json={"quantity": quantity}, headers=get_session_headers(), timeout=3)
        if resp.status_code == 200:
            return resp.json()
    except Exception:
        pass
    
    CartRepository.update_quantity(st.session_id, product_id, quantity)
    return fetch_cart_summary()

def remove_from_cart_api(product_id):
    try:
        url = f"{API_BASE_URL}/cart/item/{product_id}"
        resp = requests.delete(url, headers=get_session_headers(), timeout=3)
        if resp.status_code == 200:
            return resp.json()
    except Exception:
        pass
    
    CartRepository.remove_item(st.session_state.session_id, product_id)
    return fetch_cart_summary()

def trigger_agent_recommendation(buyer_action="VIEW_PRODUCT", product_id=None):
    try:
        url = f"{API_BASE_URL}/agent/recommend"
        payload = {
            "session_id": st.session_state.session_id,
            "buyer_action": buyer_action,
            "product_id": product_id
        }
        resp = requests.post(url, json=payload, timeout=4)
        if resp.status_code == 200:
            rec = resp.json()
            if rec.get("recommendation_id"):
                st.session_state.active_recommendation = rec
                return rec
    except Exception as e:
        logger.warning(f"Agent recommendation call failed: {e}")
    return None

def accept_recommendation_api(rec_id):
    try:
        url = f"{API_BASE_URL}/agent/recommend/{rec_id}/accept"
        resp = requests.post(url, json={"session_id": st.session_state.session_id}, timeout=3)
        if resp.status_code == 200:
            st.session_state.active_recommendation = None
            return resp.json()
    except Exception:
        pass
    
    # Direct fallback
    log = AuditLogRepository.get_all_logs(limit=10)
    target_log = next((l for l in log if l["id"] == rec_id), None)
    if target_log and target_log.get("target_product_id"):
        AuditLogRepository.update_log_status(rec_id, "ACCEPTED", revenue_impact=100.0)
        CartRepository.add_item(
            st.session_state.session_id,
            target_log["target_product_id"],
            quantity=1,
            was_recommended=True,
            recommendation_type=target_log.get("strategy_used")
        )
    st.session_state.active_recommendation = None
    return fetch_cart_summary()

def reject_recommendation_api(rec_id):
    try:
        url = f"{API_BASE_URL}/agent/recommend/{rec_id}/reject"
        requests.post(url, json={"session_id": st.session_state.session_id}, timeout=3)
    except Exception:
        AuditLogRepository.update_log_status(rec_id, "REJECTED", revenue_impact=0.0)
    st.session_state.active_recommendation = None

def create_order_api(discount_amount=0.0, is_ai_driven=False):
    try:
        url = f"{API_BASE_URL}/orders/create"
        payload = {
            "session_id": st.session_state.session_id,
            "discount_amount": discount_amount,
            "is_ai_driven": is_ai_driven
        }
        resp = requests.post(url, json=payload, timeout=4)
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        logger.error(f"Order creation API failed: {e}")
    return None

def verify_payment_api(razorpay_order_id, payment_id, signature):
    try:
        url = f"{API_BASE_URL}/payments/verify"
        payload = {
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": signature
        }
        resp = requests.post(url, json=payload, timeout=4)
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        logger.error(f"Payment verification API failed: {e}")
    return None


# --- TOP HEADER & NAVIGATION ---
cart_summary = fetch_cart_summary()
cart_item_count = cart_summary.get("total_items", 0)
cart_total_amount = cart_summary.get("total_amount", 0.0)

col_logo, col_space, col_cart = st.columns([4, 4, 3])

with col_logo:
    st.markdown("""
        <div class="brand-header">
            <div>
                <div class="brand-logo">UrbanDrop</div>
                <div class="brand-tagline">AI-Powered Streetwear & Apparel</div>
            </div>
        </div>
    """, unsafe_allow_html=True)

with col_cart:
    st.write("")
    cart_button_label = f"🛒 Cart ({cart_item_count}) — ₹{cart_total_amount:,.2f}"
    if st.button(cart_button_label, width='stretch', type="primary"):
        st.session_state.active_view = "cart"
        st.rerun()

# Category Navigation Bar
categories = ["All", "tshirts", "hoodies", "bottoms", "jackets", "shoes"]
selected_cat = st.radio(
    "Category Filter",
    options=categories,
    index=categories.index(st.session_state.selected_category),
    horizontal=True,
    label_visibility="collapsed"
)

if selected_cat != st.session_state.selected_category:
    st.session_state.selected_category = selected_cat
    st.session_state.active_view = "catalog"
    st.rerun()

st.divider()


# --- VIEW ROUTING ---

# 1. CATALOG GRID VIEW
if st.session_state.active_view == "catalog":
    products = fetch_products(st.session_state.selected_category)
    
    st.subheader("Explore UrbanDrop Collection")
    
    if not products:
        st.info("No products found in this category.")
    else:
        # Render 3-column Grid
        cols_per_row = 3
        for i in range(0, len(products), cols_per_row):
            cols = st.columns(cols_per_row)
            row_products = products[i:i + cols_per_row]
            
            for j, p in enumerate(row_products):
                with cols[j]:
                    img_url = p.get("image_url") or "https://via.placeholder.com/300x200?text=UrbanDrop"
                    is_premium = p.get("is_premium")
                    is_deadstock = p.get("is_dead_stock")
                    
                    badge_html = ""
                    if is_premium:
                        badge_html += '<span class="badge-category badge-premium">✨ PREMIUM</span> '
                    if is_deadstock:
                        badge_html += '<span class="badge-category badge-deadstock">🔥 SPECIAL DEAL</span> '
                    badge_html += f'<span class="badge-category">{p["category"]}</span>'

                    if p.get("image_url"):
                        st.image(p["image_url"], width='stretch')
                    
                    st.markdown(f"""
                        <div>
                            {badge_html}
                            <div class="product-title">{p['name']}</div>
                            <div style="color: #94A3B8; font-size: 0.85rem; height: 38px; overflow: hidden;">{p.get('description', '')}</div>
                            <div class="product-price">₹{p['price']:,.2f}</div>
                        </div>
                    """, unsafe_allow_html=True)
                    
                    btn_col1, btn_col2 = st.columns(2)
                    with btn_col1:
                        if st.button("View Details", key=f"details_{p['id']}", width='stretch'):
                            st.session_state.selected_product_id = p["id"]
                            st.session_state.active_view = "product_detail"
                            # Trigger AI recommendation for viewing item
                            trigger_agent_recommendation("VIEW_PRODUCT", p["id"])
                            st.rerun()

                    with btn_col2:
                        if st.button("Quick Add", key=f"quick_{p['id']}", width='stretch', type="secondary"):
                            add_to_cart_api(p["id"], quantity=1)
                            # Trigger AI recommendation for adding to cart
                            trigger_agent_recommendation("ADD_TO_CART", p["id"])
                            st.toast(f"Added {p['name']} to cart!", icon="🛒")
                            st.rerun()


# 2. PRODUCT DETAIL VIEW
elif st.session_state.active_view == "product_detail":
    prod_id = st.session_state.selected_product_id
    if not prod_id:
        st.session_state.active_view = "catalog"
        st.rerun()
        
    product = ProductRepository.get_product_by_id(prod_id)
    if not product:
        st.error("Product not found.")
        if st.button("Back to Catalog"):
            st.session_state.active_view = "catalog"
            st.rerun()
    else:
        if st.button("← Back to Collection"):
            st.session_state.active_view = "catalog"
            st.rerun()
            
        detail_col1, detail_col2 = st.columns([5, 6])
        
        with detail_col1:
            img_url = product.get("image_url") or "https://via.placeholder.com/400x300?text=UrbanDrop"
            st.image(img_url, width='stretch')
            
        with detail_col2:
            st.title(product["name"])
            st.caption(f"Category: {product['category'].upper()} | Item #{product['id']}")
            
            st.markdown(f"### ₹{product['price']:,.2f}")
            st.write(product.get("description", ""))
            
            st.write("---")
            stock_qty = product.get("stock_quantity", 0)
            if stock_qty > 10:
                st.success(f"In Stock ({stock_qty} available)")
            elif stock_qty > 0:
                st.warning(f"Low Stock — Only {stock_qty} left!")
            else:
                st.error("Out of Stock")

            qty = st.number_input("Quantity", min_value=1, max_value=max(1, stock_qty), value=1)
            
            if st.button("🛒 Add to Cart", type="primary", width='stretch', disabled=(stock_qty <= 0)):
                add_to_cart_api(product["id"], quantity=qty)
                trigger_agent_recommendation("ADD_TO_CART", product["id"])
                st.toast(f"Added {qty}x {product['name']} to cart!", icon="🛒")
                st.session_state.active_view = "cart"
                st.rerun()


# 3. CART & CHECKOUT VIEW
elif st.session_state.active_view == "cart":
    if st.button("← Continue Shopping"):
        st.session_state.active_view = "catalog"
        st.rerun()

    st.header("Shopping Cart & Checkout")
    
    cart_summary = fetch_cart_summary()
    items = cart_summary.get("items", [])
    
    if not items:
        st.info("Your shopping cart is currently empty.")
        if st.button("Explore Catalog", type="primary"):
            st.session_state.active_view = "catalog"
            st.rerun()
    else:
        cart_col, summary_col = st.columns([7, 5])
        
        with cart_col:
            st.subheader("Cart Items")
            for item in items:
                with st.container():
                    c1, c2, c3, c4 = st.columns([2, 5, 3, 2])
                    with c1:
                        # Fetch item image if available
                        prod_data = ProductRepository.get_product_by_id(item["product_id"])
                        img = prod_data.get("image_url") if prod_data else "https://via.placeholder.com/80x80"
                        st.image(img, width=70)
                    with c2:
                        st.markdown(f"**{item['product_name']}**")
                        if item.get("was_recommended"):
                            st.markdown('<span class="badge-category badge-premium">✨ AI Recommended</span>', unsafe_allow_html=True)
                        st.caption(f"₹{item['price']:,.2f} each")
                    with c3:
                        new_qty = st.number_input(
                            "Qty",
                            min_value=1,
                            max_value=99,
                            value=item["quantity"],
                            key=f"cart_qty_{item['product_id']}",
                            label_visibility="collapsed"
                        )
                        if new_qty != item["quantity"]:
                            update_cart_quantity_api(item["product_id"], new_qty)
                            st.rerun()
                    with c4:
                        st.markdown(f"**₹{item['subtotal']:,.2f}**")
                        if st.button("❌", key=f"remove_{item['product_id']}", help="Remove Item"):
                            remove_from_cart_api(item["product_id"])
                            st.rerun()
                    st.divider()

        with summary_col:
            st.markdown('<div class="checkout-summary-box">', unsafe_allow_html=True)
            st.subheader("Order Summary")
            
            subtotal = cart_summary.get("total_amount", 0.0)
            st.write(f"Subtotal: **₹{subtotal:,.2f}**")
            st.write("Shipping: **FREE (UrbanDrop Special)**")
            st.write("Taxes (GST 18%): **Included**")
            st.divider()
            st.markdown(f"### Total: ₹{subtotal:,.2f}")
            st.markdown('</div>', unsafe_allow_html=True)
            
            st.write("")
            
            # Razorpay Test Checkout Trigger
            if st.button("💳 Proceed to Razorpay Test Checkout", type="primary", width='stretch'):
                # Create Order via Backend
                order_res = create_order_api(discount_amount=0.0, is_ai_driven=any(i.get("was_recommended") for i in items))
                if order_res and order_res.get("razorpay_order_id"):
                    st.session_state.recent_order = order_res
                    st.session_state.active_view = "checkout_payment"
                    st.rerun()
                else:
                    st.error("Failed to initialize Razorpay payment order. Please try again.")


# 4. RAZORPAY TEST PAYMENT MODAL VIEW
elif st.session_state.active_view == "checkout_payment":
    order = st.session_state.recent_order
    if not order:
        st.session_state.active_view = "cart"
        st.rerun()

    st.header("💳 Razorpay Test Mode Payment Gateway")
    
    st.info("⚡ Test Mode Enabled — No actual funds will be charged.")
    
    st.markdown(f"""
        **Merchant**: UrbanDrop Store  
        **Razorpay Order ID**: `{order['razorpay_order_id']}`  
        **Amount Payable**: **₹{order['final_amount']:,.2f}** ({order['final_amount_paise']} paise)  
        **Razorpay Key ID**: `{order['razorpay_key_id']}`  
    """)
    
    st.write("---")
    
    col_pay, col_cancel = st.columns(2)
    
    with col_pay:
        if st.button("✅ Complete Test Payment (Simulate Success)", type="primary", width='stretch'):
            # Verify payment with backend
            mock_payment_id = f"pay_test_{uuid.uuid4().hex[:8]}"
            mock_signature = "test_mode_valid_signature"
            
            # In test mode, call verify
            verify_res = verify_payment_api(order["razorpay_order_id"], mock_payment_id, mock_signature)
            if verify_res and verify_res.get("status") in ("verified", "already_verified"):
                st.balloons()
                st.session_state.active_view = "checkout_success"
                st.rerun()
            else:
                st.error("Payment verification failed.")

    with col_cancel:
        if st.button("❌ Cancel Payment", width='stretch'):
            st.session_state.active_view = "cart"
            st.rerun()


# 5. ORDER SUCCESS CONFIRMATION VIEW
elif st.session_state.active_view == "checkout_success":
    st.balloons()
    st.success("🎉 Payment Successful! Your order has been placed.")
    
    order = st.session_state.recent_order or {}
    
    st.markdown(f"""
        ### Order Confirmation Receipt
        - **Order Number**: #{order.get('order_id', 'N/A')}
        - **Razorpay Order ID**: `{order.get('razorpay_order_id', 'N/A')}`
        - **Total Paid**: **₹{order.get('final_amount', 0.0):,.2f}**
        - **Status**: **PAID (Razorpay Test Mode Verified)**
    """)
    
    st.divider()
    if st.button("🛍️ Continue Shopping", type="primary"):
        st.session_state.recent_order = None
        st.session_state.active_view = "catalog"
        st.rerun()


# --- INTERACTIVE AI SHOPPING ASSISTANT SIDEBAR / DRAWER ---
with st.sidebar:
    st.markdown("### 🤖 AI Style & Value Assistant")
    st.caption("Powered by UrbanDrop LangGraph Revenue Engine")
    st.write("---")

    rec = st.session_state.active_recommendation
    
    if not rec:
        st.info("💡 Browse items or view cart to receive personalized AI outfit recommendations and exclusive bundle savings!")
    else:
        st.markdown('<div class="ai-assistant-card">', unsafe_allow_html=True)
        
        strategy = rec.get("strategy", "AI_RECOMMENDED")
        target_prod = rec.get("target_product") or {}
        explanation = rec.get("explanation", "")
        rec_id = rec.get("recommendation_id")
        
        badge_text = f"✨ {strategy.replace('_', ' ')}"
        st.markdown(f'<div class="ai-badge">{badge_text}</div>', unsafe_allow_html=True)
        
        if strategy == "UPSELL":
            curr_prod_id = st.session_state.get("selected_product_id") or 1
            curr_prod = ProductRepository.get_product_by_id(curr_prod_id)
            
            st.markdown("#### 🚀 Upgrade Comparison")
            if curr_prod:
                up_col1, up_arrow, up_col2 = st.columns([4, 2, 4])
                with up_col1:
                    st.caption("Current Item")
                    if curr_prod.get("image_url"):
                        st.image(curr_prod["image_url"], width='stretch')
                    st.markdown(f"**{curr_prod['name']}**")
                    st.caption(f"₹{curr_prod['price']:,.2f}")
                with up_arrow:
                    st.markdown("<br><h3 style='text-align: center; color: #38BDF8;'>➔</h3>", unsafe_allow_html=True)
                    price_diff = round(target_prod.get('price', 0.0) - curr_prod['price'], 2)
                    st.markdown(f"<div style='text-align: center; color: #10B981; font-weight: 700; font-size: 0.8rem;'>+₹{price_diff:,.0f}</div>", unsafe_allow_html=True)
                with up_col2:
                    st.caption("Upgrade Choice")
                    if target_prod.get("image_url"):
                        st.image(target_prod["image_url"], width='stretch')
                    st.markdown(f"**{target_prod.get('name', '')}**")
                    st.caption(f"₹{target_prod.get('price', 0.0):,.2f}")
        else:
            rec_img_col, rec_txt_col = st.columns([4, 6])
            with rec_img_col:
                img_url = target_prod.get("image_url") or "https://via.placeholder.com/200x150"
                st.image(img_url, width='stretch')
            with rec_txt_col:
                st.markdown(f"**{target_prod.get('name', 'Recommended Item')}**")
                if strategy in ("SMART_BUNDLE", "DEAD_STOCK_PUSH", "CART_ABANDONMENT"):
                    st.markdown(f"~~₹{rec.get('original_price', 0.0):,.2f}~~")
                    st.markdown(f"**₹{rec.get('final_price', 0.0):,.2f}**")
                    st.success(f"Save ₹{rec.get('savings_amount', 0.0):,.2f}")
                else:
                    st.write(f"Price: **₹{rec.get('final_price', target_prod.get('price', 0.0)):,.2f}**")

        st.markdown(f'<div class="ai-quote">"{explanation}"</div>', unsafe_allow_html=True)

        st.markdown('</div>', unsafe_allow_html=True)
        st.write("")
        
        col_acc, col_rej = st.columns(2)
        with col_acc:
            if st.button("✅ Accept", key="accept_ai_rec", type="primary", width='stretch'):
                accept_recommendation_api(rec_id)
                st.toast("Accepted AI Recommendation! Item added to cart.", icon="✨")
                st.session_state.active_view = "cart"
                st.rerun()

        with col_rej:
            if st.button("❌ Decline", key="reject_ai_rec", width='stretch'):
                reject_recommendation_api(rec_id)
                st.toast("Declined recommendation.")
                st.rerun()
