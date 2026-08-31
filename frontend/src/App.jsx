import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ProductGrid from './components/buyer/ProductGrid';
import ProductDetailModal from './components/buyer/ProductDetailModal';
import AIAssistantDrawer from './components/buyer/AIAssistantDrawer';
import CartDrawer from './components/buyer/CartDrawer';
import RazorpayCheckoutModal from './components/buyer/RazorpayCheckoutModal';
import MerchantDashboard from './components/merchant/MerchantDashboard';
import { api } from './api';

export default function App() {
  const [activeView, setActiveView] = useState('buyer'); // 'buyer' | 'merchant'
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState({ items: [], total_items: 0, total_amount: 0 });
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [checkoutOrder, setCheckoutOrder] = useState(null);

  // Load products & cart on mount
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

  const handleViewDetails = async (product) => {
    setSelectedProduct(product);
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
      const rec = await api.getRecommendation('ADD_TO_CART', product.id);
      if (rec && rec.recommendation_id) {
        setRecommendation(rec);
      }
    } catch (err) {
      console.error('Failed to quick add:', err);
    }
  };

  const handleAddToCartModal = async (productId, quantity) => {
    try {
      await api.addToCart(productId, quantity);
      await loadCart();
      const rec = await api.getRecommendation('ADD_TO_CART', productId);
      if (rec && rec.recommendation_id) {
        setRecommendation(rec);
      }
    } catch (err) {
      console.error('Failed to add from modal:', err);
    }
  };

  const handleAcceptRecommendation = async (recId) => {
    try {
      await api.acceptRecommendation(recId);
      setRecommendation(null);
      await loadCart();
      setIsCartOpen(true);
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

  const handleProceedCheckout = async () => {
    try {
      const isAiDriven = cart.items.some(i => i.was_recommended);
      const res = await api.createOrder(0, isAiDriven);
      if (res && res.razorpay_order_id) {
        setCheckoutOrder(res);
        setIsCartOpen(false);
      }
    } catch (err) {
      console.error('Failed to create order:', err);
    }
  };

  const handleVerifyPayment = async (orderId, paymentId, signature) => {
    const res = await api.verifyPayment(orderId, paymentId, signature);
    await loadCart();
    return res;
  };

  return (
    <div>
      <Navbar 
        activeView={activeView}
        setActiveView={setActiveView}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        cartCount={cart.total_items}
        cartTotal={cart.total_amount}
        setIsCartOpen={setIsCartOpen}
      />

      {activeView === 'buyer' ? (
        <main className="container" style={{ paddingTop: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>
            Explore UrbanDrop Collection
          </h2>
          <ProductGrid 
            products={products}
            onViewDetails={handleViewDetails}
            onQuickAdd={handleQuickAdd}
          />
        </main>
      ) : (
        <MerchantDashboard />
      )}

      {/* Buyer Modals & Drawers */}
      <ProductDetailModal 
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCartModal}
      />

      <AIAssistantDrawer 
        recommendation={recommendation}
        currentProduct={selectedProduct}
        onAccept={handleAcceptRecommendation}
        onReject={handleRejectRecommendation}
      />

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={async (pid, q) => { await api.updateCartQuantity(pid, q); loadCart(); }}
        onRemoveItem={async (pid) => { await api.removeFromCart(pid); loadCart(); }}
        onProceedCheckout={handleProceedCheckout}
      />

      <RazorpayCheckoutModal 
        order={checkoutOrder}
        onClose={() => setCheckoutOrder(null)}
        onVerifyPayment={handleVerifyPayment}
      />
    </div>
  );
}
