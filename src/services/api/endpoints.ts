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
    GET_PROFILE: '/api/users',
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
    GET_MY_RESTAURANTS: '/api/restaurants/my-restaurants', // Lấy nhà hàng của user hiện tại
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
    GET_MY_MENU_ITEMS: '/api/menu-items/my-menu-items', // Lấy menu items của nhà hàng hiện tại
  },

  // ==================== ORDER SERVICE (port 8084) ====================
  ORDER: {
    CREATE: '/api/orders',
    GET_BY_ID: (id: number) => `/api/orders/${id}`,
    GET_ALL: '/api/orders',
    GET_ALL_ADMIN: '/api/orders/all',
    GET_BY_STATUS: (status: string) => `/api/orders/status/${status}`,
    GET_BY_USER: (userId: number) => `/api/orders/user/${userId}`,
    GET_MY_ORDERS: '/api/orders/my-restaurant-orders',
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
    GET_ONLINE: '/api/shippers/online',
    UPDATE: (id: number) => `/api/shippers/${id}`,
    UPDATE_BALANCE: (id: number) => `/api/shippers/${id}/balance`,
  },

  // ==================== AUTH ADMIN ====================
  AUTH_ADMIN: {
    GET_ALL_ACCOUNTS: '/api/auth/admin/accounts',
    BLOCK_ACCOUNT: (id: number) => `/api/auth/admin/accounts/${id}/block`,
    UNBLOCK_ACCOUNT: (id: number) => `/api/auth/admin/accounts/${id}/unblock`,
  },

  // ==================== USER ADMIN ====================
  USER_ADMIN: {
    GET_STATISTICS: '/api/users/admin/statistics',
    GET_ALL_USERS: '/api/users/admin/all',
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

  // ==================== LIVESTREAM SERVICE ====================
  LIVESTREAM: {
    CREATE: '/api/livestreams',
    START: (id: String) => `/api/livestreams/${id}/start`,
    JOINT : (id: String) => `/api/livestreams/${id}/join`,
    END: (id: String) => `/api/livestreams/${id}/end`,
    GET_BY_ID: (id: String) => `/api/livestreams/${id}`,
    GET_ALL: '/api/livestreams',
    GET_BY_SELLER: (sellerId: number) => `/api/livestreams/seller/${sellerId}`,
    // Product endpoints
    PIN_PRODUCT: (id: string) => `/api/livestreams/${id}/products/pin`,
    UNPIN_PRODUCT: (id: string, productId: number) => `/api/livestreams/${id}/products/${productId}/pin`,
    GET_PRODUCTS: (id: string) => `/api/livestreams/${id}/products`,
    GET_PINNED_PRODUCTS: (id: string) => `/api/livestreams/${id}/products/pinned`,
  },

  // ==================== SETTLEMENT SERVICE (port 8095) ====================
  SETTLEMENT: {
    GET_RESTAURANT_BALANCE: (entityId: number) => `/api/settlement/balances/restaurant/${entityId}`,
    GET_SHIPPER_BALANCE: (entityId: number) => `/api/settlement/balances/shipper/${entityId}`,
    GET_RESTAURANT_EARNINGS: (entityId: number) => `/api/settlement/balances/restaurant/${entityId}/earnings`,
    GET_SHIPPER_EARNINGS: (entityId: number) => `/api/settlement/balances/shipper/${entityId}/earnings`,
    REQUEST_RESTAURANT_WITHDRAWAL: (entityId: number) => `/api/settlement/balances/restaurant/${entityId}/withdraw`,
    REQUEST_SHIPPER_WITHDRAWAL: (entityId: number) => `/api/settlement/balances/shipper/${entityId}/withdraw`,
    GET_RESTAURANT_TRANSACTIONS: (entityId: number) => `/api/settlement/transactions/restaurant/${entityId}`,
    GET_SHIPPER_TRANSACTIONS: (entityId: number) => `/api/settlement/transactions/shipper/${entityId}`,
    GET_TRANSACTION_BY_ID: (id: number) => `/api/settlement/transactions/${id}`,
    // Admin endpoints
    ADMIN: {
      GET_ALL_BALANCES: '/api/settlement/admin/balances',
      GET_ALL_TRANSACTIONS: '/api/settlement/admin/transactions',
      GET_PENDING_WITHDRAWALS: '/api/settlement/admin/transactions/pending',
      APPROVE_WITHDRAWAL: (id: number) => `/api/settlement/admin/transactions/${id}/approve`,
      REJECT_WITHDRAWAL: (id: number) => `/api/settlement/admin/transactions/${id}/reject`,
      GET_REVENUE: '/api/settlement/admin/revenue',
      REVERSE_TRANSACTION: (id: number) => `/api/settlement/admin/transactions/${id}/reverse`,
    },
  },
} as const;

export default API_ENDPOINTS;
