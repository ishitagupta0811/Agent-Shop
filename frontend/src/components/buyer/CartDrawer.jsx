import React from 'react';
import { ShoppingBag, X, Trash2, CreditCard, Sparkles } from 'lucide-react';

export default function CartDrawer({ isOpen, onClose, cart, onUpdateQuantity, onRemoveItem, onProceedCheckout }) {
  if (!isOpen) return null;

  const items = cart.items || [];
  const totalAmount = cart.total_amount || 0;
  const totalItems = cart.total_items || 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '500px', height: '100vh', borderRadius: 0, position: 'fixed', right: 0, top: 0, margin: 0, display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={20} style={{ color: '#38BDF8' }} /> Your Shopping Cart ({totalItems})
          </h2>
          <button className="close-btn" onClick={onClose} style={{ position: 'static' }}><X size={20} /></button>
        </div>

        {items.length === 0 ? (
          <div style={{ textAlignment: 'center', padding: '4rem 0', color: '#94A3B8', flex: 1 }}>
            Your cart is currently empty.
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
                  padding: '0.75rem 0', 
                  borderBottom: '1px solid #1E293B' 
                }}
              >
                <img 
                  src={item.image_url || 'https://via.placeholder.com/70'} 
                  alt={item.product_name} 
                  style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}
                />
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.product_name}</div>
                  {item.was_recommended && (
                    <span className="badge badge-premium" style={{ fontSize: '0.65rem', margin: '2px 0' }}>
                      ✨ AI Recommended
                    </span>
                  )}
                  <div style={{ color: '#38BDF8', fontSize: '0.85rem', fontWeight: 700 }}>
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
                      backgroundColor: '#0F172A',
                      border: '1px solid #334155',
                      color: '#FFFFFF',
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
          </div>
        )}

        {items.length > 0 && (
          <div style={{ borderTop: '1px solid #334155', paddingTop: '1rem', marginTop: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#94A3B8', fontSize: '0.9rem' }}>
              <span>Subtotal:</span>
              <span>₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#94A3B8', fontSize: '0.9rem' }}>
              <span>Shipping:</span>
              <span style={{ color: '#10B981' }}>FREE</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 800 }}>
              <span>Total:</span>
              <span style={{ color: '#38BDF8' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}
              onClick={onProceedCheckout}
            >
              <CreditCard size={18} /> Proceed to Razorpay Test Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
