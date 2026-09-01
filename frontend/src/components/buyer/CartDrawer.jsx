import React from 'react';
import { ShoppingBag, X, Trash2, CreditCard, Tag } from 'lucide-react';

export default function CartDrawer({ isOpen, onClose, cart, onUpdateQuantity, onRemoveItem, onProceedCheckout }) {
  if (!isOpen) return null;

  const items = cart.items || [];
  const subtotal = cart.total_amount || 0;
  const totalItems = cart.total_items || 0;
  const platformFee = items.length > 0 ? 23 : 0;
  const totalMRP = Math.round(subtotal * 1.5);
  const discountOnMRP = totalMRP - subtotal;
  const finalTotal = subtotal + platformFee;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content cart-drawer-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', height: '100vh', borderRadius: 0, position: 'fixed', right: 0, top: 0, margin: 0, display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #F1E5DE', paddingBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
            <ShoppingBag size={22} style={{ color: '#FF3E6C' }} /> Shopping Bag ({totalItems} items)
          </h2>
          <button className="close-btn" onClick={onClose} style={{ position: 'static' }}><X size={20} /></button>
        </div>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748B', flex: 1, fontWeight: 600 }}>
            <ShoppingBag size={48} style={{ color: '#FFC4A4', marginBottom: '1rem' }} />
            <div>Your Shopping Bag is empty.</div>
            <div style={{ fontSize: '0.82rem', color: '#94A3B8', marginTop: '0.4rem' }}>Add items to your bag to proceed with purchase!</div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
            {items.map((item) => (
              <div 
                key={item.product_id}
                style={{ 
                  display: 'flex', 
                  gap: '0.75rem', 
                  alignItems: 'center', 
                  padding: '0.85rem 0', 
                  borderBottom: '1px solid #F1E5DE' 
                }}
              >
                <img 
                  src={item.image_url || 'https://via.placeholder.com/70'} 
                  alt={item.product_name} 
                  style={{ width: '65px', height: '65px', borderRadius: '8px', objectFit: 'cover' }}
                />
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>{item.product_name}</div>
                  {item.was_recommended && (
                    <span className="badge badge-premium" style={{ fontSize: '0.65rem', margin: '2px 0' }}>
                      ✨ AI Recommended
                    </span>
                  )}
                  <div style={{ color: '#FF6F43', fontSize: '0.85rem', fontWeight: 800, marginTop: '2px' }}>
                    ₹{item.price.toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={item.quantity}
                    onChange={(e) => onUpdateQuantity(item.product_id, parseInt(e.target.value) || 1)}
                    style={{
                      width: '50px',
                      padding: '0.3rem',
                      borderRadius: '4px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      color: '#0F172A',
                      textAlign: 'center',
                    }}
                  />
                  <button
                    onClick={() => onRemoveItem(item.product_id)}
                    style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {/* Myntra Price Details Summary */}
            <div style={{ marginTop: '1.25rem', background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.75rem', letterSpacing: '0.5px' }}>
                PRICE DETAILS ({totalItems} {totalItems === 1 ? 'Item' : 'Items'})
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.82rem', color: '#475569' }}>
                <span>Total MRP</span>
                <span>₹{totalMRP.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.82rem', color: '#10B981', fontWeight: 600 }}>
                <span>Discount on MRP</span>
                <span>-₹{discountOnMRP.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.82rem', color: '#475569' }}>
                <span>Platform Fee</span>
                <span>₹{platformFee}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.82rem', color: '#10B981', fontWeight: 600 }}>
                <span>Shipping Fee</span>
                <span>FREE</span>
              </div>
              <div style={{ height: '1px', background: '#CBD5E1', margin: '0.5rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 900, color: '#0F172A' }}>
                <span>Total Amount</span>
                <span style={{ color: '#FF3E6C' }}>₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}

        {items.length > 0 && (
          <div style={{ borderTop: '1px solid #F1E5DE', paddingTop: '1rem', marginTop: 'auto' }}>
            <button
              className="btn btn-coral-large"
              style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}
              onClick={onProceedCheckout}
            >
              <CreditCard size={18} /> PLACE ORDER (₹{finalTotal.toLocaleString('en-IN')})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
