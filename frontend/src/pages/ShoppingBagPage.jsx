import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, ShieldCheck, Tag, Trash2, Heart, CreditCard, Check } from 'lucide-react';
import RazorpayCheckoutModal from '../components/buyer/RazorpayCheckoutModal';
import { api } from '../api';

export default function ShoppingBagPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], total_items: 0, total_amount: 0 });
  const [pincode, setPincode] = useState('');
  const [pincodeMsg, setPincodeMsg] = useState('');
  const [checkoutOrder, setCheckoutOrder] = useState(null);
  const [selectedDonation, setSelectedDonation] = useState(10);

  useEffect(() => {
    loadCart();
  }, []);

  const [productsList, setProductsList] = useState([]);

  const loadCart = async () => {
    try {
      const data = await api.getCart();
      setCart(data || { items: [], total_items: 0, total_amount: 0 });
      const pData = await api.getProducts('All');
      if (pData && pData.products) {
        setProductsList(pData.products);
      }
    } catch (err) {
      console.error('Failed to load cart or products:', err);
    }
  };

  const handleUpdateQuantity = async (productId, quantity) => {
    try {
      await api.updateCartQuantity(productId, quantity);
      await loadCart();
    } catch (err) {
      console.error('Failed to update qty:', err);
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      await api.removeFromCart(productId);
      await loadCart();
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  const handleMoveToWishlist = async (item) => {
    try {
      // Save to localStorage wishlist
      const saved = localStorage.getItem('agentshop_wishlist');
      const wishlist = saved ? JSON.parse(saved) : [];
      if (!wishlist.some(p => p.id === item.product_id)) {
        wishlist.push({
          id: item.product_id,
          name: item.product_name,
          price: item.price,
          image_url: item.image_url
        });
        localStorage.setItem('agentshop_wishlist', JSON.stringify(wishlist));
      }
      await api.removeFromCart(item.product_id);
      await loadCart();
    } catch (err) {
      console.error('Failed to move to wishlist:', err);
    }
  };

  const handlePincodeSubmit = (e) => {
    e.preventDefault();
    if (pincode.trim().length >= 6) {
      setPincodeMsg(`✓ Serviceable at ${pincode}! Delivery by Tomorrow, 5 PM.`);
    }
  };

  const handlePlaceOrder = async () => {
    try {
      const isAiDriven = cart.items.some(i => i.was_recommended);
      const res = await api.createOrder(0, isAiDriven);
      if (res && res.razorpay_order_id) {
        setCheckoutOrder(res);
      }
    } catch (err) {
      console.error('Failed to place order:', err);
    }
  };

  const handleVerifyPayment = async (orderId, paymentId, signature) => {
    const res = await api.verifyPayment(orderId, paymentId, signature);
    await loadCart();
    return res;
  };

  const items = cart.items || [];
  const subtotal = cart.total_amount || 0;
  const totalItems = cart.total_items || 0;
  const platformFee = items.length > 0 ? 23 : 0;
  const couponDiscount = items.length > 0 ? 120 : 0;
  const totalMRP = Math.round(subtotal * 1.5) + couponDiscount;
  const discountOnMRP = totalMRP - subtotal - couponDiscount;
  const finalTotal = Math.max(0, subtotal - couponDiscount + platformFee + (selectedDonation || 0));

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6F2', color: '#0F172A' }}>
      {/* Header */}
      <header style={{ background: '#FFFFFF', borderBottom: '1px solid #F1E5DE', padding: '1rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={() => navigate('/')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B', fontWeight: 700 }}
            >
              <ArrowLeft size={20} /> Continue Shopping
            </button>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShoppingBag size={26} style={{ color: '#FF3E6C' }} /> UrbanDrop
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700, color: '#10B981' }}>
            <ShieldCheck size={18} /> 100% SECURE CHECKOUT
          </div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 1rem', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #F1E5DE', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <ShoppingBag size={64} style={{ color: '#FFC4A4', marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>Your Shopping Bag is empty</h2>
            <p style={{ color: '#64748B', marginBottom: '1.5rem' }}>Explore our latest collection and add items to your bag!</p>
            <Link to="/" className="btn btn-coral-large" style={{ display: 'inline-flex', width: 'auto', padding: '0.8rem 2rem' }}>
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className="bag-checkout-grid">
            {/* Left Column */}
            <div className="bag-left-col">
              {/* Delivery Pincode Box */}
              <div className="pincode-card-box">
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>
                  Check delivery time & services
                </div>
                <form onSubmit={handlePincodeSubmit} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="ENTER PIN CODE"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    maxLength={6}
                    style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #FF3E6C', fontSize: '0.82rem', fontWeight: 700, color: '#FF3E6C', outline: 'none' }}
                  />
                  <button type="submit" style={{ background: 'transparent', border: '1px solid #FF3E6C', color: '#FF3E6C', fontWeight: 800, padding: '0.45rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem' }}>
                    CHECK
                  </button>
                </form>
              </div>
              {pincodeMsg && <div style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 700, marginTop: '-0.5rem', marginBottom: '1rem' }}>{pincodeMsg}</div>}

              {/* Items Selected Header */}
              <div className="items-selected-bar">
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={16} style={{ color: '#FF3E6C' }} /> {totalItems}/{totalItems} ITEMS SELECTED
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>
                  <span style={{ cursor: 'pointer', marginRight: '1rem' }} onClick={() => items.forEach(i => handleRemoveItem(i.product_id))}>REMOVE ALL</span>
                </div>
              </div>

              {/* Product Cards List */}
              <div className="bag-items-list">
                {items.map((item) => {
                  const mrpItem = Math.round(item.price * 1.6);
                  const itemDiscount = mrpItem - item.price;
                  return (
                    <div key={item.product_id} className="bag-item-card">
                      <img 
                        src={
                          item.image_url || 
                          (productsList.find(p => p.id === item.product_id) || {}).image_url || 
                          'https://images.unsplash.com/photo-1665172653765-a685be8bd8b0?w=600'
                        } 
                        alt={item.product_name} 
                        className="bag-item-img" 
                      />

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F172A' }}>{item.product_name}</div>
                          {Boolean(item.was_recommended) && (
                            <span 
                              style={{ 
                                fontSize: '0.68rem', 
                                padding: '2px 8px', 
                                borderRadius: '4px', 
                                background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)', 
                                color: '#FFFFFF', 
                                fontWeight: 800, 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '3px' 
                              }}
                            >
                              ✨ AI Recommended
                            </span>
                          )}
                        </div>
                        <div style={{ color: '#64748B', fontSize: '0.85rem', margin: '2px 0' }}>Category: {item.category || 'Apparel'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Sold by: URBAN RETAIL PVT LTD</div>

                        {/* Size & Qty Pickers */}
                        <div style={{ display: 'flex', gap: '12px', margin: '0.5rem 0', alignItems: 'center' }}>
                          <span style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '2px 8px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 700 }}>
                            Size: M
                          </span>
                          <span style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '2px 8px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Qty: 
                            <select 
                              value={item.quantity} 
                              onChange={(e) => handleUpdateQuantity(item.product_id, parseInt(e.target.value) || 1)}
                              style={{ border: 'none', background: 'transparent', fontWeight: 800, cursor: 'pointer' }}
                            >
                              {[1, 2, 3, 4, 5].map(q => <option key={q} value={q}>{q}</option>)}
                            </select>
                          </span>
                        </div>

                        {/* Pricing */}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '0.4rem' }}>
                          <span style={{ fontWeight: 900, fontSize: '1.1rem', color: '#0F172A' }}>₹{item.price.toLocaleString('en-IN')}</span>
                          <span style={{ fontSize: '0.85rem', color: '#94A3B8', textDecoration: 'line-through' }}>₹{mrpItem.toLocaleString('en-IN')}</span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FF6F43' }}>₹{itemDiscount.toLocaleString('en-IN')} OFF</span>
                        </div>

                        <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600, marginTop: '4px' }}>
                          ✓ 7 days return available
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <button 
                          onClick={() => handleRemoveItem(item.product_id)} 
                          style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                          title="Remove Item"
                        >
                          <Trash2 size={18} />
                        </button>

                        <button 
                          onClick={() => handleMoveToWishlist(item)}
                          style={{ background: 'transparent', border: 'none', color: '#FF3E6C', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Heart size={14} /> MOVE TO WISHLIST
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Price Details Summary */}
            <div className="bag-right-col">
              {/* Coupons Box */}
              <div className="bag-summary-box">
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>COUPONS</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Tag size={18} style={{ color: '#FF3E6C' }} />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0F172A' }}>1 Coupon applied</div>
                      <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>You saved additional ₹120</div>
                    </div>
                  </div>
                  <button style={{ border: '1px solid #FF3E6C', background: 'transparent', color: '#FF3E6C', fontWeight: 800, padding: '4px 12px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>
                    EDIT
                  </button>
                </div>
              </div>

              {/* Donation Box */}
              <div className="bag-summary-box" style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
                  SUPPORT TRANSFORMATIVE SOCIAL WORK IN INDIA
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '0.6rem' }}>Donate and make a difference</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[10, 20, 50, 100].map(val => (
                    <button
                      key={val}
                      onClick={() => setSelectedDonation(selectedDonation === val ? 0 : val)}
                      style={{
                        flex: 1,
                        padding: '6px',
                        borderRadius: '9999px',
                        border: selectedDonation === val ? '2px solid #FF3E6C' : '1px solid #CBD5E1',
                        background: selectedDonation === val ? 'rgba(255, 62, 108, 0.1)' : '#FFFFFF',
                        color: selectedDonation === val ? '#FF3E6C' : '#0F172A',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Details */}
              <div className="bag-summary-box" style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.85rem', letterSpacing: '0.5px' }}>
                  PRICE DETAILS ({totalItems} {totalItems === 1 ? 'Item' : 'Items'})
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>
                  <span>Total MRP</span>
                  <span>₹{totalMRP.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#10B981', fontWeight: 700 }}>
                  <span>Discount on MRP</span>
                  <span>-₹{discountOnMRP.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#10B981', fontWeight: 700 }}>
                  <span>Coupon Discount</span>
                  <span>-₹{couponDiscount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>
                  <span>Platform Fee</span>
                  <span>₹{platformFee}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#10B981', fontWeight: 700 }}>
                  <span>Shipping Fee</span>
                  <span>FREE</span>
                </div>
                <div style={{ height: '1px', background: '#E2E8F0', margin: '0.75rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 900, color: '#0F172A', marginBottom: '1.25rem' }}>
                  <span>Total Amount</span>
                  <span style={{ color: '#FF3E6C' }}>₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>

                {/* Primary Action Button */}
                <button
                  className="btn btn-coral-large"
                  style={{ padding: '0.9rem', fontSize: '1.05rem', letterSpacing: '0.5px' }}
                  onClick={handlePlaceOrder}
                >
                  <CreditCard size={20} /> PLACE ORDER
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <RazorpayCheckoutModal 
        order={checkoutOrder}
        onClose={() => setCheckoutOrder(null)}
        onVerifyPayment={handleVerifyPayment}
      />
    </div>
  );
}
