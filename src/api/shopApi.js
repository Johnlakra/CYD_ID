import apiClient from './apiClient';

// Thin wrappers around the shop module endpoints. Every call returns response.data
// ({ success, message, data }) or throws the axios error for the caller to show.
export const shopApi = {
  // Config + categories
  getConfig: () => apiClient.get('/shop/config').then((r) => r.data),
  getCategories: () => apiClient.get('/shop/categories').then((r) => r.data),

  // My shop / applications
  applyForShop: (payload) => apiClient.post('/shop/shops/apply', payload).then((r) => r.data),
  getMyShop: () => apiClient.get('/shop/shops/mine').then((r) => r.data),
  updateMyShop: (payload) => apiClient.put('/shop/shops/mine', payload).then((r) => r.data),

  // Marketplace browsing
  getShops: (params) => apiClient.get('/shop/shops', { params }).then((r) => r.data),
  getShopById: (id) => apiClient.get(`/shop/shops/${id}`).then((r) => r.data),

  // Admin moderation
  adminGetShops: (params) => apiClient.get('/shop/admin/shops', { params }).then((r) => r.data),
  adminReviewShop: (id, payload) => apiClient.put(`/shop/admin/shops/${id}/review`, payload).then((r) => r.data),
  adminGetDisputes: (params) => apiClient.get('/shop/admin/disputes', { params }).then((r) => r.data),
  adminResolveDispute: (id, payload) => apiClient.post(`/shop/admin/disputes/${id}/resolve`, payload).then((r) => r.data),

  // Products
  getProducts: (params) => apiClient.get('/shop/products', { params }).then((r) => r.data),
  getProductById: (id) => apiClient.get(`/shop/products/${id}`).then((r) => r.data),
  lookupProducts: (ids) => apiClient.post('/shop/products/lookup', { ids }).then((r) => r.data),
  getMyProducts: () => apiClient.get('/shop/products/mine').then((r) => r.data),
  createProduct: (payload) => apiClient.post('/shop/products', payload).then((r) => r.data),
  updateProduct: (id, payload) => apiClient.put(`/shop/products/${id}`, payload).then((r) => r.data),
  archiveProduct: (id) => apiClient.delete(`/shop/products/${id}`).then((r) => r.data),

  // Addresses
  getAddresses: () => apiClient.get('/shop/addresses').then((r) => r.data),
  createAddress: (payload) => apiClient.post('/shop/addresses', payload).then((r) => r.data),
  updateAddress: (id, payload) => apiClient.put(`/shop/addresses/${id}`, payload).then((r) => r.data),
  deleteAddress: (id) => apiClient.delete(`/shop/addresses/${id}`).then((r) => r.data),

  // Checkout (one order per shop, all in one request). The Idempotency-Key makes a retry or a
  // double click return the same orders instead of creating new ones.
  checkout: (payload, idempotencyKey) =>
    apiClient.post('/shop/checkout', payload, { headers: { 'Idempotency-Key': idempotencyKey } }).then((r) => r.data),
  getCheckout: (id) => apiClient.get(`/shop/checkouts/${id}`).then((r) => r.data),

  // Orders
  getMyOrders: () => apiClient.get('/shop/orders').then((r) => r.data),
  getShopOrders: () => apiClient.get('/shop/orders/shop').then((r) => r.data),
  getActionCount: () => apiClient.get('/shop/orders/action-count').then((r) => r.data),
  getOrderById: (id) => apiClient.get(`/shop/orders/${id}`).then((r) => r.data),
  updateOrderStatus: (id, status, reason) => apiClient.put(`/shop/orders/${id}/status`, { status, reason }).then((r) => r.data),
  cancelOrder: (id, reason) => apiClient.put(`/shop/orders/${id}/cancel`, { reason }).then((r) => r.data),

  // Peer-to-peer payment: buyer pays the seller's UPI ID directly, then reports the UTR.
  claimPayment: (id, payload) => apiClient.post(`/shop/orders/${id}/payment-claim`, payload).then((r) => r.data),
  editClaim: (id, utr) => apiClient.patch(`/shop/orders/${id}/payment-claim`, { utr }).then((r) => r.data),
  confirmPayment: (id, utr) => apiClient.post(`/shop/orders/${id}/payment-confirm`, { utr }).then((r) => r.data),
  reportNotReceived: (id, description) =>
    apiClient.post(`/shop/orders/${id}/payment-not-received`, { description }).then((r) => r.data),
  markRefunded: (id, refundUtr) => apiClient.post(`/shop/orders/${id}/refund`, { refund_utr: refundUtr }).then((r) => r.data),
  openDispute: (id, payload) => apiClient.post(`/shop/orders/${id}/dispute`, payload).then((r) => r.data),

  // Order chat + evidence
  getMessages: (id, after) => apiClient.get(`/shop/orders/${id}/messages`, { params: after ? { after } : {} }).then((r) => r.data),
  sendMessage: (id, body) => apiClient.post(`/shop/orders/${id}/messages`, { body }).then((r) => r.data),
  getEvidence: (id) => apiClient.get(`/shop/orders/${id}/evidence`).then((r) => r.data),
  addEvidence: (id, image, kind) => apiClient.post(`/shop/orders/${id}/evidence`, { image, kind }).then((r) => r.data),
};

export default shopApi;
