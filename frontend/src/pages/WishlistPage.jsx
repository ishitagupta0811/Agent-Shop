import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, ArrowLeft, Trash2, ShoppingBag } from 'lucide-react';
import { api } from '../api';
import ProductDetailModal from '../components/buyer/ProductDetailModal';

export default function WishlistPage() {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [recommendation, setRecommendation] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('agentshop_wishlist');
      if (saved) setWishlist(JSON.parse(saved));
    } catch (e) {}
  }, []);

  const handleRemove = (id, e) => {
    if (e) e.stopPropagation();
    const updated = wishlist.filter(item => item.id !== id);
    setWishlist(updated);
    try {
      localStorage.setItem('agentshop_wishlist', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleMoveToBag = async (product, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.addToCart(product.id, 1, true, 'WISHLIST_CONVERSION');
      handleRemove(product.id);
      if (res) setCart(res);
      await loadCart();
      broadcastSync();
    } catch (err) {
      console.error('Failed to move to bag:', err);
    }
  };

  const handleSelectProduct = async (product) => {
    setSelectedProduct(product);
    setRecommendation(null);
    try {
      const rec = await api.getRecommendation('VIEW_PRODUCT', product.id);
      setRecommendation(rec);
    } catch (err) {
      console.error('Failed to fetch AI recommendation for wishlist product:', err);
    }
  };

  const handleAddToCartModal = async (productId, quantity) => {
    try {
      await api.addToCart(productId, quantity);
      setSelectedProduct(null);
    } catch (err) {
      console.error('Failed to add from modal:', err);
    }
  };

  const handleAcceptRecommendation = async (recId, currentProductId) => {
    try {
      if (currentProductId) {
        await api.addToCart(currentProductId, 1);
      }
      await api.acceptRecommendation(recId);
      setRecommendation(null);
      setSelectedProduct(null);
    } catch (err) {
      console.error('Failed to accept recommendation:', err);
    }
  };

  const handleRejectRecommendation = async (recId) => {
    try {
      await api.rejectRecommendation(recId);
      setRecommendation(null);
    } catch (err) {
      console.error('Failed to reject recommendation:', err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6F2', color: '#0F172A' }}>
      {/* Header */}
      <header style={{ background: '#FFFFFF', borderBottom: '1px solid #F1E5DE', padding: '1rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={() => navigate('/')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B', fontWeight: 700 }}
            >
              <ArrowLeft size={20} /> Back to Store
            </button>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Heart size={26} style={{ color: '#FF3E6C' }} fill="#FF3E6C" /> My Wishlist ({wishlist.length})
            </div>
          </div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {wishlist.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 1rem', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #F1E5DE' }}>
            <Heart size={64} style={{ color: '#FFC4A4', marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>Your Wishlist is empty</h2>
            <p style={{ color: '#64748B', marginBottom: '1.5rem' }}>Explore items and tap the heart icon to save your favorites!</p>
            <Link to="/" className="btn btn-coral-large" style={{ display: 'inline-flex', width: 'auto', padding: '0.8rem 2rem' }}>
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className="product-grid">
            {wishlist.map((item) => (
              <div 
                key={item.id} 
                className="product-card" 
                style={{ padding: '1rem', background: '#FFFFFF', cursor: 'pointer' }}
                onClick={() => handleSelectProduct(item)}
              >
                <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '8px' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0.6rem 0 0.2rem 0', color: '#0F172A' }}>{item.name}</h3>
                <div style={{ color: '#FF6F43', fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.8rem' }}>₹{item.price?.toLocaleString('en-IN')}</div>
                
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <button 
                    className="btn btn-coral" 
                    style={{ flex: 1, justifyContent: 'center' }} 
                    onClick={(e) => handleMoveToBag(item, e)}
                  >
                    <ShoppingBag size={16} /> Move to Bag
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={(e) => handleRemove(item.id, e)}
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Product Detail Modal with DropGenius AI Recommendations */}
      {selectedProduct && (
        <ProductDetailModal
          activeRecId={activeRecId}
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCartModal}
          recommendation={recommendation}
          onAcceptRecommendation={handleAcceptRecommendation}
          onRejectRecommendation={handleRejectRecommendation}
          onSelectProduct={handleSelectProduct}
        />
      )}
    </div>
  );
}
