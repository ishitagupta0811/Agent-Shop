import React from 'react';
import { ShoppingBag, ShoppingCart, LayoutDashboard, Store } from 'lucide-react';

export default function Navbar({ activeView, setActiveView, selectedCategory, setSelectedCategory, cartCount, cartTotal, setIsCartOpen }) {
  const categories = ['All', 'tshirts', 'hoodies', 'bottoms', 'jackets', 'shoes'];

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <div className="brand-logo">
          <ShoppingBag size={28} style={{ color: '#38BDF8' }} />
          <span>UrbanDrop</span>
        </div>

        <div className="view-switcher">
          <button
            className={`view-btn ${activeView === 'buyer' ? 'active' : ''}`}
            onClick={() => setActiveView('buyer')}
          >
            <Store size={16} /> Buyer Storefront
          </button>
          <button
            className={`view-btn ${activeView === 'merchant' ? 'active' : ''}`}
            onClick={() => setActiveView('merchant')}
          >
            <LayoutDashboard size={16} /> Merchant Dashboard
          </button>
        </div>

        {activeView === 'buyer' && (
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

      {activeView === 'buyer' && (
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
