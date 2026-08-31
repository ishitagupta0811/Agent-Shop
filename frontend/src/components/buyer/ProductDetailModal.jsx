import React, { useState } from 'react';
import { ShoppingCart, X, CheckCircle } from 'lucide-react';

export default function ProductDetailModal({ product, onClose, onAddToCart }) {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const stockQty = product.stock_quantity || 0;

  const handleAdd = () => {
    onAddToCart(product.id, quantity);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}><X size={24} /></button>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          <div>
            <img 
              src={product.image_url || 'https://via.placeholder.com/400x300'} 
              alt={product.name}
              style={{ width: '100%', borderRadius: '12px', objectFit: 'cover' }}
            />
          </div>

          <div>
            <span className="badge badge-category">{product.category}</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.5rem 0' }}>{product.name}</h2>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38BDF8', marginBottom: '1rem' }}>
              ₹{product.price.toLocaleString('en-IN')}
            </div>
            
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              {product.description}
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              {stockQty > 10 ? (
                <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                  <CheckCircle size={16} /> In Stock ({stockQty} available)
                </span>
              ) : stockQty > 0 ? (
                <span style={{ color: '#F59E0B', fontSize: '0.85rem' }}>
                  Low Stock — Only {stockQty} left!
                </span>
              ) : (
                <span style={{ color: '#EF4444', fontSize: '0.85rem' }}>
                  Out of Stock
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Quantity:</label>
              <input
                type="number"
                min="1"
                max={Math.max(1, stockQty)}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                style={{
                  width: '70px',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  backgroundColor: '#0F172A',
                  border: '1px solid #334155',
                  color: '#FFFFFF',
                  textAlign: 'center',
                }}
              />
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.8rem' }}
              disabled={stockQty <= 0}
              onClick={handleAdd}
            >
              <ShoppingCart size={18} /> Add {quantity} to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
