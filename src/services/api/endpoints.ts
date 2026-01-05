/**
 * API Endpoints
 * Định nghĩa tất cả các API endpoints từ backend
 */

export const API_ENDPOINTS = {
  // ==================== AUTH SERVICE (port 8081) ====================
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    REFRESH_TOKEN: '/api/auth/refresh-token',
    LOGOUT: '/api/auth/logout',
    GET_SESSIONS: '/api/auth/sessions',
    GET_ACCOUNT_BY_ID: (id: number) => `/api/auth/accounts/${id}`,
    GET_ACCOUNT_BY_EMAIL: (email: string) => `/api/auth/accounts/email/${email}`,
  },

  // ==================== USER SERVICE (port 8082) ====================
  USER: {
    GET_PROFILE: '/api/users/profile',
    UPDATE_PROFILE: '/api/users/profile',
    GET_BY_ID: (id: number) => `/api/users/${id}`,
    CREATE: '/api/users',
  },

  // ==================== RESTAURANT SERVICE (port 8083) ====================
  RESTAURANT: {
    CREATE: '/api/restaurants',
    UPDATE: (id: number) => `/api/restaurants/${id}`,
    DELETE: (id: number) => `/api/restaurants/${id}`,
    GET_BY_ID: (id: number) => `/api/restaurants/${id}`,
    GET_ALL: '/api/restaurants',
    SEARCH: '/api/restaurants/search', // ?keyword=xxx
  },

  // Menu Items (Restaurant Service)
  MENU: {
    CREATE: '/api/menu-items',
    UPDATE: (id: number) => `/api/menu-items/${id}`,
    DELETE: (id: number) => `/api/menu-items/${id}`,
    GET_BY_ID: (id: number) => `/api/menu-items/${id}`,
    GET_BY_RESTAURANT: (restaurantId: number) => `/api/menu-items/restaurant/${restaurantId}`,
    GET_ALL: '/api/menu-items',
    SEARCH: '/api/menu-items/search',
  },

  // ==================== ORDER SERVICE (port 8084) ====================
  ORDER: {
    CREATE: '/api/orders',
    GET_BY_ID: (id: number) => `/api/orders/${id}`,
    GET_ALL: '/api/orders',
    GET_BY_USER: (userId: number) => `/api/orders/user/${userId}`,
    UPDATE_STATUS: (id: number) => `/api/orders/${id}/status`,
    CANCEL: (id: number) => `/api/orders/${id}/cancel`,
  },

  // ==================== DELIVERY SERVICE (port 8085) ====================
  DELIVERY: {
    GET_BY_ID: (id: number) => `/api/deliveries/${id}`,
    GET_BY_ORDER: (orderId: number) => `/api/deliveries/order/${orderId}`,
    UPDATE_STATUS: (id: number) => `/api/deliveries/${id}/status`,
  },

  // ==================== SHIPPER SERVICE (port 8086) ====================
  SHIPPER: {
    CREATE: '/api/shippers',
    GET_BY_ID: (id: number) => `/api/shippers/${id}`,
    GET_ALL: '/api/shippers',
    UPDATE: (id: number) => `/api/shippers/${id}`,
    UPDATE_BALANCE: (id: number) => `/api/shippers/${id}/balance`,
  },

  // ==================== NOTIFICATION SERVICE (port 8087) ====================
  NOTIFICATION: {
    GET_ALL: '/api/notifications',
    GET_UNREAD: '/api/notifications/unread',
    MARK_AS_READ: (id: number) => `/api/notifications/${id}/read`,
    MARK_ALL_AS_READ: '/api/notifications/read-all',
  },

  // ==================== SEARCH SERVICE (port 8088) ====================
  SEARCH: {
    RESTAURANTS: '/api/search/restaurants',
    MENU_ITEMS: '/api/search/menu-items',
  },

  // ==================== TRACKING SERVICE (port 8090) ====================
  TRACKING: {
    WS_URL: 'ws://localhost:8090/ws/shipper-locations',
  },
} as const;

export default API_ENDPOINTS;
