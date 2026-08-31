const API_BASE_URL = 'http://localhost:8000/api';

export const getSessionId = () => {
  let sessionId = localStorage.getItem('agentshop_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('agentshop_session_id', sessionId);
  }
  return sessionId;
};

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Session-Id': getSessionId(),
});

export const api = {
  // Products API
  async getProducts(category) {
    let url = API_BASE_URL + '/products';
    if (category && category !== 'All') {
      url += '?category=' + encodeURIComponent(category);
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  async getProductDetail(id) {
    const res = await fetch(API_BASE_URL + '/products/' + id);
    if (!res.ok) throw new Error('Failed to fetch product details');
    return res.json();
  },

  // Cart API
  async getCart() {
    const res = await fetch(API_BASE_URL + '/cart', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch cart');
    return res.json();
  },

  async addToCart(productId, quantity = 1, wasRecommended = false, recType = null) {
    const res = await fetch(API_BASE_URL + '/cart/add', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        product_id: productId,
        quantity: quantity,
        was_recommended: wasRecommended,
        recommendation_type: recType,
      }),
    });
    if (!res.ok) throw new Error('Failed to add item to cart');
    return res.json();
  },

  async updateCartQuantity(productId, quantity) {
    const res = await fetch(API_BASE_URL + '/cart/item/' + productId, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ quantity: quantity }),
    });
    if (!res.ok) throw new Error('Failed to update quantity');
    return res.json();
  },

  async removeFromCart(productId) {
    const res = await fetch(API_BASE_URL + '/cart/item/' + productId, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to remove item from cart');
    return res.json();
  },

  // Agent Recommendations API
  async getRecommendation(buyerAction = 'VIEW_PRODUCT', productId = null) {
    const res = await fetch(API_BASE_URL + '/agent/recommend', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        session_id: getSessionId(),
        buyer_action: buyerAction,
        product_id: productId,
      }),
    });
    if (!res.ok) throw new Error('Failed to trigger agent recommendation');
    return res.json();
  },

  async acceptRecommendation(recId) {
    const res = await fetch(API_BASE_URL + '/agent/recommend/' + recId + '/accept', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ session_id: getSessionId() }),
    });
    if (!res.ok) throw new Error('Failed to accept recommendation');
    return res.json();
  },

  async rejectRecommendation(recId) {
    const res = await fetch(API_BASE_URL + '/agent/recommend/' + recId + '/reject', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ session_id: getSessionId() }),
    });
    if (!res.ok) throw new Error('Failed to reject recommendation');
    return res.json();
  },

  // Order & Razorpay Payments API
  async createOrder(discountAmount = 0, isAiDriven = false) {
    const res = await fetch(API_BASE_URL + '/orders/create', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        session_id: getSessionId(),
        discount_amount: discountAmount,
        is_ai_driven: isAiDriven,
      }),
    });
    if (!res.ok) throw new Error('Failed to create order');
    return res.json();
  },

  async verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
    const res = await fetch(API_BASE_URL + '/payments/verify', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
      }),
    });
    if (!res.ok) throw new Error('Failed to verify payment');
    return res.json();
  },

  // Merchant Portal API
  async getMerchantConfig() {
    const res = await fetch(API_BASE_URL + '/merchant/config');
    if (!res.ok) throw new Error('Failed to fetch merchant config');
    return res.json();
  },

  async updateMerchantConfig(configData) {
    const res = await fetch(API_BASE_URL + '/merchant/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configData),
    });
    if (!res.ok) throw new Error('Failed to update merchant config');
    return res.json();
  },

  async getMerchantMetrics() {
    const res = await fetch(API_BASE_URL + '/merchant/metrics');
    if (!res.ok) throw new Error('Failed to fetch merchant metrics');
    return res.json();
  },

  async getAuditLogs(limit = 50) {
    const res = await fetch(API_BASE_URL + '/merchant/audit-logs?limit=' + limit);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },
};
