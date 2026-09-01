import React, { useState } from 'react';
import { Eye, ShoppingBag, Package, Star, Heart, Check } from 'lucide-react';

export default function ProductCard({ 
  product, 
  onViewDetails, 
  onQuickAdd, 
  isWishlisted = false, 
  onToggleWishlist 
}) {
  const [added, setAdded] = useState(false);
  const isPremium = Boolean(product.is_premium);
  const isDeadStock = Boolean(product.is_dead_stock);
  const stockQty = product.stock_quantity ?? product.stock ?? 0;
  
  // Variable discount percentage & MRP per product
  const multipliers = [1.5, 1.28, 1.65, 1.42, 1.75, 1.3, 1.55, 1.8, 1.38, 1.6, 1.45, 1.7, 1.25, 1.52, 1.35];
  const mult = multipliers[(product.id || 0) % multipliers.length];
  const mrp = Math.round(product.price * mult);
  const discountPct = Math.round(((mrp - product.price) / mrp) * 100);

  const handleQuickAddClick = (e) => {
    e.stopPropagation();
    onQuickAdd(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div 
      className="product-card clickable-card"
      onClick={() => onViewDetails(product)}
    >
      <div className="product-image-wrap">
        <img 
          src={product.image_url || 'https://via.placeholder.com/300x240'} 
          alt={product.name} 
          className="product-image"
        />
        <div className="rating-tag">
          4.2 <Star size={11} fill="#FFC4A4" stroke="none" /> | 232
        </div>

        {/* Heart Wishlist Button on Image */}
        <button
          className={`wishlist-heart-btn ${isWishlisted ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleWishlist) onToggleWishlist(product);
          }}
          title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart size={17} fill={isWishlisted ? "#FF3E6C" : "none"} style={{ color: isWishlisted ? "#FF3E6C" : "#64748B" }} />
        </button>
      </div>

      <div className="product-card-body">
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
          {isPremium ? <span className="badge badge-premium">✨ PREMIUM</span> : null}
          {isDeadStock ? <span className="badge badge-deadstock">🔥 SPECIAL DEAL</span> : null}
          <span className="badge badge-category">{product.category}</span>
        </div>

        <h3 className="product-title">{product.name}</h3>
        
        <div className="price-row" style={{ marginTop: '0.35rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span className="current-price">₹{product.price.toLocaleString('en-IN')}</span>
            <span className="mrp-price">₹{mrp.toLocaleString('en-IN')}</span>
            <span className="discount-tag">({discountPct}% OFF)</span>
          </div>
          
          <div style={{ fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Package size={13} style={{ color: stockQty > 10 ? '#10B981' : stockQty > 0 ? '#F59E0B' : '#EF4444' }} />
            {stockQty > 10 ? (
              <span style={{ color: '#10B981' }}>Stock: {stockQty}</span>
            ) : stockQty > 0 ? (
              <span style={{ color: '#F59E0B' }}>Low: {stockQty} left</span>
            ) : (
              <span style={{ color: '#EF4444' }}>Out of Stock</span>
            )}
          </div>
        </div>

        <div className="btn-group" style={{ marginTop: 'auto' }}>
          <button 
            className="btn btn-secondary"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(product);
            }}
          >
            <Eye size={15} /> Details
          </button>
          <button 
            className="btn btn-coral"
            disabled={stockQty <= 0}
            onClick={handleQuickAddClick}
            style={{ background: added ? '#10B981' : undefined, transition: 'all 0.2s ease' }}
          >
            {added ? <Check size={15} /> : <ShoppingBag size={15} />}
            {added ? 'Added!' : 'Quick Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
