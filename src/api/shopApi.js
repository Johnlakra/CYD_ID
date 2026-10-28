import apiClient from './apiClient';

// Thin wrappers around the shop module endpoints. Every call returns response.data
// ({ success, message, data }) or throws the axios error for the caller to toast.
export const shopApi = {
  // Categories
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

  // Products
  getProducts: (params) => apiClient.get('/shop/products', { params }).then((r) => r.data),
  getProductById: (id) => apiClient.get(`/shop/products/${id}`).then((r) => r.data),
  getMyProducts: () => apiClient.get('/shop/products/mine').then((r) => r.data),
  createProduct: (payload) => apiClient.post('/shop/products', payload).then((r) => r.data),
  updateProduct: (id, payload) => apiClient.put(`/shop/products/${id}`, payload).then((r) => r.data),
  archiveProduct: (id) => apiClient.delete(`/shop/products/${id}`).then((r) => r.data),

  // Addresses
  getAddresses: () => apiClient.get('/shop/addresses').then((r) => r.data),
  createAddress: (payload) => apiClient.post('/shop/addresses', payload).then((r) => r.data),
  updateAddress: (id, payload) => apiClient.put(`/shop/addresses/${id}`, payload).then((r) => r.data),
  deleteAddress: (id) => apiClient.delete(`/shop/addresses/${id}`).then((r) => r.data),

  // Orders
  placeOrder: (payload) => apiClient.post('/shop/orders', payload).then((r) => r.data),
  getMyOrders: () => apiClient.get('/shop/orders').then((r) => r.data),
  getShopOrders: () => apiClient.get('/shop/orders/shop').then((r) => r.data),
  getOrderById: (id) => apiClient.get(`/shop/orders/${id}`).then((r) => r.data),
  updateOrderStatus: (id, status) => apiClient.put(`/shop/orders/${id}/status`, { status }).then((r) => r.data),
  cancelOrder: (id) => apiClient.put(`/shop/orders/${id}/cancel`).then((r) => r.data),

  // Payments
  initiatePayment: (orderId) => apiClient.post('/shop/payments/initiate', { order_id: orderId }).then((r) => r.data),
  getPaymentStatus: (orderId) => apiClient.get(`/shop/payments/${orderId}/status`).then((r) => r.data),
};

export default shopApi;
