import React from 'react';
import { Eye, ShoppingCart, Package } from 'lucide-react';

export default function ProductCard({ product, onViewDetails, onQuickAdd }) {
  const isPremium = Boolean(product.is_premium);
  const isDeadStock = Boolean(product.is_dead_stock);
  const stockQty = product.stock_quantity ?? product.stock ?? 0;

  return (
    <div className="product-card">
      <div className="product-image-wrap">
        <img 
          src={product.image_url || 'https://via.placeholder.com/300x240'} 
          alt={product.name} 
          className="product-image"
        />
      </div>

      <div className="product-card-body">
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
          {isPremium ? <span className="badge badge-premium">✨ PREMIUM</span> : null}
          {isDeadStock ? <span className="badge badge-deadstock">🔥 SPECIAL DEAL</span> : null}
          <span className="badge badge-category">{product.category}</span>
        </div>

        <h3 className="product-title">{product.name}</h3>
        <p className="product-desc">{product.description}</p>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div className="product-price" style={{ marginBottom: 0 }}>
            ₹{product.price.toLocaleString('en-IN')}
          </div>
          
          <div style={{ fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Package size={14} style={{ color: stockQty > 10 ? '#10B981' : stockQty > 0 ? '#F59E0B' : '#EF4444' }} />
            {stockQty > 10 ? (
              <span style={{ color: '#10B981' }}>Stock: {stockQty}</span>
            ) : stockQty > 0 ? (
              <span style={{ color: '#F59E0B' }}>Low: {stockQty} left</span>
            ) : (
              <span style={{ color: '#EF4444' }}>Out of Stock</span>
            )}
          </div>
        </div>

        <div className="btn-group">
          <button 
            className="btn btn-secondary"
            onClick={() => onViewDetails(product)}
          >
            <Eye size={16} /> Details
          </button>
          <button 
            className="btn btn-primary"
            disabled={stockQty <= 0}
            onClick={() => onQuickAdd(product)}
          >
            <ShoppingCart size={16} /> Quick Add
          </button>
        </div>
      </div>
    </div>
  );
}
