import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ShoppingBag, Heart, Search } from 'lucide-react';

export default function Navbar({
  isMerchant = false,
  selectedCategory,
  setSelectedCategory,
  wishlistCount = 0,
  cartCount = 0,
  cartTotal = 0,
  searchQuery = '',
  setSearchQuery
}) {
  const navigate = useNavigate();
  const categories = ['All', 'tshirts', 'hoodies', 'bottoms', 'jackets', 'shoes'];

  const formatCatName = (cat) => {
    if (cat === 'tshirts') return 'T-Shirts';
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
          <div className="brand-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag size={28} style={{ color: '#FF3E6C' }} />
            <span className="brand-title">
              {isMerchant ? 'UrbanDrop - Merchant Portal' : 'UrbanDrop'}
            </span>
          </div>

          {!isMerchant && setSearchQuery && (
            <div className="search-bar-wrap">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search for products, brands and more..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="navbar-search-input"
              />
            </div>
          )}
        </div>

        {!isMerchant && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Wishlist Route Button */}
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/wishlist')}
              style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="View Wishlist"
            >
              <Heart size={18} style={{ color: '#FF3E6C' }} fill={wishlistCount > 0 ? '#FF3E6C' : 'none'} />
              <span>Wishlist</span>
              {wishlistCount > 0 && (
                <span className="count-badge">{wishlistCount}</span>
              )}
            </button>

            {/* Shopping Bag Route Button */}
            <button
              className="btn btn-primary"
              onClick={() => navigate('/bag')}
              style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="View Shopping Bag & Checkout"
            >
              <ShoppingBag size={18} />
              <span>Bag ({cartCount})</span>
              <span style={{ opacity: 0.85, fontSize: '0.8rem' }}>• ₹{cartTotal.toLocaleString('en-IN')}</span>
            </button>
          </div>
        )}
      </div>

      {!isMerchant && selectedCategory && (
        <div className="container">
          <div className="category-bar">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {formatCatName(cat)}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
