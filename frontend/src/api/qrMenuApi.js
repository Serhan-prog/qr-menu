import api from './client.js';

export const qrMenuApi = {
  login: (payload) => api.post('/api/auth/login', payload).then((res) => res.data),
  logout: () => api.post('/api/auth/logout'),
  refreshCsrfToken: () => api.get('/api/csrf'),
  getWebSocketTicket: () => api.get('/api/auth/ws-ticket').then((res) => res.data),

  getRestaurants: () => api.get('/api/restaurants').then((res) => res.data),
  getCurrentRestaurant: () => api.get('/api/restaurants/current').then((res) => res.data),
  createRestaurant: (payload) => api.post('/api/restaurants', payload).then((res) => res.data),
  updateRestaurant: (id, payload) => api.put(`/api/restaurants/${id}`, payload).then((res) => res.data),
  deleteRestaurant: (id) => api.delete(`/api/restaurants/${id}`),

  getUsers: () => api.get('/api/users').then((res) => res.data),
  createUser: (payload) => api.post('/api/users', payload).then((res) => res.data),
  updateUser: (id, payload) => api.put(`/api/users/${id}`, payload).then((res) => res.data),
  deleteUser: (id) => api.delete(`/api/users/${id}`),

  getTables: (restaurantId) =>
    api.get('/api/tables', { params: restaurantId ? { restaurantId } : {} }).then((res) => res.data),
  createTable: (payload) => api.post('/api/tables', payload).then((res) => res.data),
  updateTable: (id, payload) => api.put(`/api/tables/${id}`, payload).then((res) => res.data),
  deleteTable: (id) => api.delete(`/api/tables/${id}`),

  getCategories: (restaurantId) =>
    api.get('/api/categories', { params: restaurantId ? { restaurantId } : {} }).then((res) => res.data),
  createCategory: (payload) => api.post('/api/categories', payload).then((res) => res.data),
  updateCategory: (id, payload) => api.put(`/api/categories/${id}`, payload).then((res) => res.data),
  deleteCategory: (id) => api.delete(`/api/categories/${id}`),

  getProducts: (params = {}) => api.get('/api/products', { params }).then((res) => res.data),
  createProduct: (payload) => api.post('/api/products', payload).then((res) => res.data),
  updateProduct: (id, payload) => api.put(`/api/products/${id}`, payload).then((res) => res.data),
  deleteProduct: (id) => api.delete(`/api/products/${id}`),

  getMenu: (tableCode) => api.get(`/api/menu/table/${tableCode}`).then((res) => res.data),
  createOrder: (payload) => api.post('/api/orders', payload).then((res) => res.data),
  getOrder: (id) => api.get(`/api/orders/${id}`).then((res) => res.data),
  getOrderByTrackingCode: (trackingCode) => api.get(`/api/orders/track/${trackingCode}`).then((res) => res.data),
  getOrders: (restaurantId) =>
    api.get('/api/orders', { params: restaurantId ? { restaurantId } : {} }).then((res) => res.data),
  updateOrderStatus: (id, status, cancellationReason) =>
    api.patch(`/api/orders/${id}/status`, { status, cancellationReason }).then((res) => res.data),

  createWaiterCall: (payload) => api.post('/api/waiter-calls', payload).then((res) => res.data),
  getWaiterCalls: (restaurantId) =>
    api.get('/api/waiter-calls', { params: restaurantId ? { restaurantId } : {} }).then((res) => res.data),
  updateWaiterCallStatus: (id, status) => api.patch(`/api/waiter-calls/${id}/status`, { status }).then((res) => res.data),

  createBillRequest: (payload) => api.post('/api/bill-requests', payload).then((res) => res.data),
  getBillRequests: (restaurantId) =>
    api.get('/api/bill-requests', { params: restaurantId ? { restaurantId } : {} }).then((res) => res.data),
  updateBillRequestStatus: (id, status) => api.patch(`/api/bill-requests/${id}/status`, { status }).then((res) => res.data),
};
