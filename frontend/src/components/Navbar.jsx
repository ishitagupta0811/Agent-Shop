import React from 'react';
import { ShoppingBag, ShoppingCart } from 'lucide-react';

export default function Navbar({ isMerchant = false, selectedCategory, setSelectedCategory, cartCount = 0, cartTotal = 0, setIsCartOpen }) {
  const categories = ['All', 'tshirts', 'hoodies', 'bottoms', 'jackets', 'shoes'];

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <div className="brand-logo">
          <ShoppingBag size={28} style={{ color: '#38BDF8' }} />
          <span>
            {isMerchant ? 'UrbanDrop — Merchant Portal' : 'UrbanDrop'}
          </span>
        </div>

        {!isMerchant && setIsCartOpen && (
          <button 
            className="btn btn-primary"
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingCart size={18} />
            <span>Cart ({cartCount})</span>
            <span style={{ opacity: 0.85, fontSize: '0.8rem' }}>• ₹{cartTotal.toLocaleString('en-IN')}</span>
          </button>
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
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
