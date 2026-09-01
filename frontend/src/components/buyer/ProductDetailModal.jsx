import React, { useState } from 'react';
import { X, Sparkles, ShoppingBag, Heart, Truck, ShieldCheck, RotateCcw, Tag, ChevronRight, ChevronLeft } from 'lucide-react';

export default function ProductDetailModal({ 
  product, 
  onClose, 
  onAddToCart, 
  recommendation, 
  onAcceptRecommendation, 
  onRejectRecommendation,
  onSelectProduct 
}) {
  if (!product) return null;

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('M');
  const [pincode, setPincode] = useState('530045');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [pincodeMsg, setPincodeMsg] = useState('Get it by Wed, Sep 09');
  const [toastDismissed, setToastDismissed] = useState(false);

  const scrollToAiRec = () => {
    const el = document.getElementById('ai-recommendation-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const sizes = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];

  // Array of 3 pictures (main photo + angles)
  const productPhotos = [
    product.image_url,
    product.image_url,
    product.image_url
  ];

  const handleNextPhoto = (e) => {
    e.stopPropagation();
    setActivePhotoIndex((prev) => (prev + 1) % productPhotos.length);
  };

  const handlePrevPhoto = (e) => {
    e.stopPropagation();
    setActivePhotoIndex((prev) => (prev - 1 + productPhotos.length) % productPhotos.length);
  };

  const multipliers = [1.5, 1.28, 1.65, 1.42, 1.75, 1.3, 1.55, 1.8, 1.38, 1.6, 1.45, 1.7, 1.25, 1.52, 1.35];
  const mult = multipliers[(product.id || 0) % multipliers.length];
  const mrp = Math.round(product.price * mult);
  const discountPct = Math.round(((mrp - product.price) / mrp) * 100);

  const targetProduct = recommendation?.target_product;
  const upsellDelta = targetProduct ? Math.max(0, Math.round((targetProduct.price - product.price) * 100) / 100) : 0;

  const getDropGeniusBannerText = (rec) => {
    if (!rec) return '';
    switch (rec.strategy) {
      case 'UPSELL':
        return '✨ Upgraded Look: DropGenius found a premium upgrade for you';
      case 'CROSS_SELL':
        return '✨ Upgraded Look: DropGenius curated your complete outfit';
      case 'DEAD_STOCK_PUSH':
        return '✨ Trending Upgraded Pick curated by DropGenius AI';
      case 'SMART_BUNDLE':
        return `✨ Upgraded Outfit Bundle — Save ₹${(rec.savings_amount || 150).toLocaleString('en-IN')}`;
      default:
        return '✨ Upgraded Look Suggested by DropGenius AI';
    }
  };

  const handlePincodeCheck = (e) => {
    e.preventDefault();
    if (pincode.length >= 6) {
      setPincodeMsg(`✓ Serviceable at ${pincode}! Get it by Tomorrow, 5 PM.`);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content myntra-pdp-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-btn" onClick={onClose} aria-label="Close modal">
          <X size={22} />
        </button>

        {/* Main 2-Column Split View */}
        <div className="pdp-grid">
          {/* Left Column: Main Large Photo + 3 Smaller Thumbnails & Next/Prev Controls */}
          <div className="pdp-left-gallery-wrap">
            <div className="pdp-single-photo-wrap" style={{ position: 'relative' }}>
              <img 
                src={productPhotos[activePhotoIndex] || 'https://via.placeholder.com/400x500'} 
                alt={`${product.name} angle ${activePhotoIndex + 1}`} 
                className="pdp-single-photo-img"
              />

              {/* Prev / Next Carousel Navigation Arrows */}
              <button 
                className="gallery-nav-btn prev-btn" 
                onClick={handlePrevPhoto} 
                title="Previous Photo"
              >
                <ChevronLeft size={22} />
              </button>
              <button 
                className="gallery-nav-btn next-btn" 
                onClick={handleNextPhoto} 
                title="Next Photo"
              >
                <ChevronRight size={22} />
              </button>
            </div>

            {/* 3 Smaller Thumbnails Row Beneath Main Photo */}
            <div className="pdp-thumb-carousel-row">
              {productPhotos.map((photo, idx) => (
                <div 
                  key={idx}
                  className={`pdp-thumb-card ${activePhotoIndex === idx ? 'active' : ''}`}
                  onClick={() => setActivePhotoIndex(idx)}
                >
                  <img src={photo} alt={`Thumbnail ${idx + 1}`} className="pdp-thumb-img" />
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Product Details & Size Options */}
          <div className="pdp-details-col">
            <h1 className="pdp-brand-name">UrbanDrop</h1>
            <h2 className="pdp-product-title">{product.name}</h2>

            {/* Rating Bar */}
            <div className="pdp-rating-pill">
              <span style={{ fontWeight: 800 }}>4.2</span> <Sparkles size={12} fill="#10B981" stroke="none" style={{ color: '#10B981' }} />
              <span className="rating-divider">|</span>
              <span style={{ color: '#64748B' }}>234 Ratings</span>
            </div>

            <div className="pdp-divider" />

            {/* Price Row */}
            <div className="pdp-price-row">
              <span className="pdp-current-price">₹{product.price.toLocaleString('en-IN')}</span>
              <span className="pdp-mrp">MRP ₹{mrp.toLocaleString('en-IN')}</span>
              <span className="pdp-discount">({discountPct}% OFF)</span>
            </div>
            <div className="pdp-taxes-note">inclusive of all taxes</div>

            {/* Size Selector */}
            <div className="pdp-section-block">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="pdp-section-header">SELECT SIZE</div>
                <button className="pdp-size-chart-link">SIZE CHART &gt;</button>
              </div>

              <div className="pdp-sizes-row">
                {sizes.map((sz) => (
                  <button
                    key={sz}
                    className={`pdp-size-pill ${selectedSize === sz ? 'active' : ''}`}
                    onClick={() => setSelectedSize(sz)}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pdp-action-buttons">
              <button 
                className="btn btn-coral-large pdp-add-bag-btn"
                onClick={() => onAddToCart(product.id, 1)}
              >
                <ShoppingBag size={20} /> ADD TO BAG
              </button>

              <button 
                className={`btn pdp-wishlist-btn ${isWishlisted ? 'wishlisted' : ''}`}
                onClick={() => setIsWishlisted(!isWishlisted)}
              >
                <Heart size={20} fill={isWishlisted ? '#FF3E6C' : 'none'} style={{ color: isWishlisted ? '#FF3E6C' : '#475569' }} />
                {isWishlisted ? 'WISHLISTED' : 'WISHLIST'}
              </button>
            </div>

            <div className="pdp-divider" />

            {/* Delivery Options */}
            <div className="pdp-section-block">
              <div className="pdp-section-header" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Truck size={18} style={{ color: '#FF3E6C' }} /> DELIVERY OPTIONS
              </div>

              <form onSubmit={handlePincodeCheck} className="pdp-pincode-box">
                <input 
                  type="text" 
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="pdp-pincode-input"
                  maxLength={6}
                />
                <button type="submit" className="pdp-pincode-btn">CHANGE</button>
              </form>

              <div className="pdp-delivery-list">
                <div className="delivery-item">
                  <Truck size={16} style={{ color: '#64748B' }} />
                  <span>{pincodeMsg}</span>
                </div>
                <div className="delivery-item">
                  <ShieldCheck size={16} style={{ color: '#64748B' }} />
                  <span>Pay on delivery available</span>
                </div>
                <div className="delivery-item">
                  <RotateCcw size={16} style={{ color: '#64748B' }} />
                  <span>Easy 7 days return & exchange available</span>
                </div>
              </div>
              <div className="pdp-guarantee">100% Original Products</div>
            </div>

            {/* Best Offers */}
            <div className="pdp-offers-card">
              <div className="offers-card-title">
                <Tag size={16} style={{ color: '#FF3E6C' }} /> BEST OFFERS
              </div>
              <div className="offer-bullet">
                <strong>10% Instant Discount on BOBCARD Credit Card</strong>
                <div>• Min Spend ₹3,500 Max Discount ₹1,000</div>
              </div>
              <div className="offer-bullet">
                <strong>10% Instant Discount on Kotak Bank Credit Card</strong>
                <div>• Min Spend ₹3,500 Max Discount ₹1,000</div>
              </div>
              <div className="offer-bullet">
                <strong>Flat 7.5% Cashback on Flipkart Axis Bank & SBI Credit Cards</strong>
                <div>• Applicable on min spend of ₹100</div>
              </div>
            </div>
          </div>
        </div>

        {/* --- SCROLL DOWN: AI UPGRADED LOOK RECOMMENDATION SECTION --- */}
        {recommendation && (
          <div id="ai-recommendation-section" className="inline-ai-section" style={{ marginTop: '2.5rem' }}>
            <div className="pdp-divider" style={{ marginBottom: '1.5rem' }} />

            {/* DropGenius Banner */}
            <div className="dropgenius-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} style={{ color: '#38BDF8' }} />
                <span className="dropgenius-banner-text">
                  {getDropGeniusBannerText(recommendation)}
                </span>
              </div>
              <span className="dropgenius-pill">DropGenius AI</span>
            </div>

            {/* UPSELL RECOMMENDATION */}
            {recommendation.strategy === 'UPSELL' && targetProduct && (
              <div className="inline-upsell-box">
                <div className="upsell-compare-grid">
                  <div className="compare-card">
                    <span className="compare-tag">Current Choice</span>
                    <img src={product.image_url} alt={product.name} className="compare-img" />
                    <div className="compare-title">{product.name}</div>
                    <div className="compare-price">₹{product.price.toLocaleString('en-IN')}</div>
                  </div>

                  <div className="compare-arrow-wrap">
                    <ChevronRight size={24} style={{ color: '#FF6F43' }} />
                    <span className="delta-badge">+₹{upsellDelta.toLocaleString('en-IN')} for premium quality</span>
                  </div>

                  <div 
                    className="compare-card highlight-card clickable-card"
                    style={{ cursor: 'pointer' }}
                    onClick={() => onSelectProduct && onSelectProduct(targetProduct)}
                    title="Click to view full details"
                  >
                    <span className="compare-tag premium-tag">✨ Recommended Upgrade</span>
                    <img src={targetProduct.image_url || product.image_url} alt={targetProduct.name} className="compare-img" />
                    <div className="compare-title">{targetProduct.name}</div>
                    <div className="compare-price premium-price">₹{targetProduct.price.toLocaleString('en-IN')}</div>
                  </div>
                </div>

                <div className="explainability-box">
                  <div className="explainability-header">
                    <Sparkles size={14} style={{ color: '#FF3E6C' }} /> Why this suggestion
                  </div>
                  <p className="explainability-text">{recommendation.explanation}</p>
                </div>

                <div className="upsell-action-row">
                  <button 
                    className="btn btn-coral-large" 
                    style={{ flex: 2 }}
                    onClick={() => onAcceptRecommendation(recommendation.recommendation_id, null)}
                  >
                    Accept Upgrade (+₹{upsellDelta.toLocaleString('en-IN')})
                  </button>
                  <button 
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => onRejectRecommendation(recommendation.recommendation_id)}
                  >
                    Decline
                  </button>
                </div>
              </div>
            )}

            {/* CROSS_SELL / SMART_BUNDLE / DEAD_STOCK_PUSH */}
            {(recommendation.strategy === 'CROSS_SELL' || recommendation.strategy === 'SMART_BUNDLE' || recommendation.strategy === 'DEAD_STOCK_PUSH') && (
              <div className="inline-cross-sell-box">
                <div className="cross-sell-row">
                  {(recommendation.bundle_products?.length > 0 
                    ? recommendation.bundle_products 
                    : [targetProduct]
                  ).filter(Boolean).map((item) => (
                    <div 
                      key={item.id} 
                      className="cross-sell-card"
                      onClick={() => onSelectProduct && onSelectProduct(item)}
                    >
                      <div className="cross-sell-img-wrap">
                        <img src={item.image_url} alt={item.name} className="cross-sell-img" />
                        {recommendation.strategy === 'DEAD_STOCK_PUSH' ? (
                          <span className="trending-badge">🔥 Trending Pick</span>
                        ) : (
                          <span className="popular-badge">🌟 Popular Match</span>
                        )}
                      </div>
                      <div className="cross-sell-info">
                        <div className="cross-sell-title">{item.name}</div>
                        <div className="cross-sell-price">₹{item.price.toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="explainability-box">
                  <div className="explainability-header">
                    <Sparkles size={14} style={{ color: '#FF3E6C' }} /> Why this suggestion
                  </div>
                  <p className="explainability-text">{recommendation.explanation}</p>
                </div>

                <button 
                  className="btn btn-coral-large" 
                  style={{ width: '100%', marginTop: '0.85rem' }}
                  onClick={() => onAcceptRecommendation(recommendation.recommendation_id, product.id)}
                >
                  Add all to cart as outfit — Save ₹{(recommendation.savings_amount || 150).toLocaleString('en-IN')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Floating Right-Side AI Recommendation Toast Popup Notification */}
        {recommendation && !toastDismissed && (
          <div className="ai-rec-pop-toast" onClick={scrollToAiRec}>
            <div className="toast-sparkle-icon">
              <Sparkles size={18} />
            </div>
            <div className="toast-body">
              <div className="toast-title">DropGenius AI</div>
              <div className="toast-desc">AI has a better recommendation for you!</div>
            </div>
            <button className="toast-action-btn">
              View ↓
            </button>
            <button 
              className="toast-close-btn" 
              onClick={(e) => { e.stopPropagation(); setToastDismissed(true); }}
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
