import React from 'react';
import { Heart, X, Trash2, ShoppingBag } from 'lucide-react';

export default function WishlistDrawer({ isOpen, onClose, wishlist = [], onRemoveFromWishlist, onMoveToBag }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content wishlist-drawer-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px', height: '100vh', borderRadius: 0, position: 'fixed', right: 0, top: 0, margin: 0, display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #F1E5DE', paddingBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
            <Heart size={22} style={{ color: '#FF3E6C' }} fill="#FF3E6C" /> My Wishlist ({wishlist.length} items)
          </h2>
          <button className="close-btn" onClick={onClose} style={{ position: 'static' }}><X size={20} /></button>
        </div>

        {wishlist.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748B', flex: 1, fontWeight: 600 }}>
            <Heart size={48} style={{ color: '#FFC4A4', marginBottom: '1rem' }} />
            <div>Your Wishlist is currently empty.</div>
            <div style={{ fontSize: '0.82rem', color: '#94A3B8', marginTop: '0.4rem' }}>Save items you love to review them anytime!</div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
            {wishlist.map((item) => (
              <div 
                key={item.id}
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
                  alt={item.name} 
                  style={{ width: '65px', height: '65px', borderRadius: '8px', objectFit: 'cover' }}
                />
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>{item.name}</div>
                  <div style={{ color: '#FF6F43', fontSize: '0.85rem', fontWeight: 800, marginTop: '2px' }}>
                    ₹{item.price.toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                  <button
                    className="btn btn-coral"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                    onClick={() => onMoveToBag(item)}
                  >
                    <ShoppingBag size={14} /> Move to Bag
                  </button>
                  <button
                    onClick={() => onRemoveFromWishlist(item.id)}
                    style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
