import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProductGrid from '../components/buyer/ProductGrid';
import ProductDetailModal from '../components/buyer/ProductDetailModal';
import { api } from '../api';

export default function BuyerStorefront() {
  const navigate = useNavigate();
  const broadcastSync = () => {
    try {
      const channel = new BroadcastChannel('agentshop_sync');
      channel.postMessage('sync');
      channel.close();
    } catch (e) {}
  };

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Shopping Bag State & Wishlist State
  const [cart, setCart] = useState({ items: [], total_items: 0, total_amount: 0 });
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('agentshop_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [recommendation, setRecommendation] = useState(null);

  // Save wishlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('agentshop_wishlist', JSON.stringify(wishlist));
    } catch (e) {}
  }, [wishlist]);

  // Load products & cart on mount / category change
  useEffect(() => {
    loadProducts(selectedCategory);
    loadCart();
  }, [selectedCategory]);

  const loadProducts = async (cat) => {
    try {
      const data = await api.getProducts(cat);
      setProducts(data.products || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const loadCart = async () => {
    try {
      const data = await api.getCart();
      setCart(data || { items: [], total_items: 0, total_amount: 0 });
    } catch (err) {
      console.error('Failed to load cart:', err);
    }
  };

  // Toggle wishlist item
  const handleToggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const handleViewDetails = async (product) => {
    setSelectedProduct(product);
    setRecommendation(null);
    try {
      const rec = await api.getRecommendation('VIEW_PRODUCT', product.id);
      if (rec && rec.recommendation_id) {
        setRecommendation(rec);
      }
    } catch (err) {
      console.warn('Agent rec call failed:', err);
    }
  };

  const handleQuickAdd = async (product) => {
    try {
      await api.addToCart(product.id, 1);
      await loadCart();
      await loadProducts(selectedCategory);
      broadcastSync();
      // Stay on page so buyer continues shopping!
    } catch (err) {
      console.error('Failed to quick add:', err);
    }
  };

  const handleAddToCartModal = async (productId, quantity) => {
    try {
      await api.addToCart(productId, quantity);
      await loadCart();
      await loadProducts(selectedCategory);
      broadcastSync();
      setSelectedProduct(null);
      // Stay on page so buyer continues shopping!
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
      await loadCart();
      await loadProducts(selectedCategory);
      broadcastSync();
      // Stay on page so buyer continues shopping!
    } catch (err) {
      console.error('Failed to accept recommendation:', err);
    }
  };

  const handleRejectRecommendation = async (recId) => {
    try {
      await api.rejectRecommendation(recId);
      setRecommendation(null);
      broadcastSync();
    } catch (err) {
      console.error('Failed to reject recommendation:', err);
    }
  };

  const wishlistIds = wishlist.map((p) => p.id);

  return (
    <div>
      <Navbar 
        isMerchant={false}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        wishlistCount={wishlist.length}
        cartCount={cart.total_items}
        cartTotal={cart.total_amount}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <main className="container" style={{ paddingTop: '1rem', paddingBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>
          Explore UrbanDrop Collection
        </h2>
        <ProductGrid 
          products={products.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
          )}
          onViewDetails={handleViewDetails}
          onQuickAdd={handleQuickAdd}
          wishlistIds={wishlistIds}
          onToggleWishlist={handleToggleWishlist}
        />
      </main>

      <ProductDetailModal 
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCartModal}
        recommendation={recommendation}
        onAcceptRecommendation={handleAcceptRecommendation}
        onRejectRecommendation={handleRejectRecommendation}
        onSelectProduct={(item) => handleViewDetails(item)}
      />
    </div>
  );
}
