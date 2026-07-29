/**
 * API Endpoints
 * Định nghĩa tất cả các API endpoints từ backend
 */

export const API_ENDPOINTS = {
  // ==================== AUTH SERVICE (port 8081) ====================
  AUTH: {
    LOGIN: '/api/auth/login',
    REFRESH_TOKEN: '/api/auth/refresh-token',
    LOGOUT: '/api/auth/logout',
  },

  // ==================== USER SERVICE (port 8082) ====================
  USER: {
    GET_PROFILE: '/api/users',
  },

  // ==================== RESTAURANT SERVICE (port 8083) ====================
  RESTAURANT: {
    CREATE: '/api/restaurants',
    UPDATE: (id: number) => `/api/restaurants/${id}`,
    GET_MY_RESTAURANTS: '/api/restaurants/my-restaurants', // Lấy nhà hàng của user hiện tại
    CONFIRM_ORDER: (orderId: number) => `/api/restaurants/orders/${orderId}/confirm`,
    REJECT_ORDER: (orderId: number) => `/api/restaurants/orders/${orderId}/reject`,
    // Ratings
    GET_RATINGS: (restaurantId: number) => `/api/restaurants/${restaurantId}/ratings`,
    ADMIN_GET_ALL_RATINGS: '/api/restaurants/admin/ratings',
    ADMIN_UPDATE_RATING_STATUS: (id: number) => `/api/restaurants/admin/ratings/${id}/status`,
  },

  // Menu Items (Restaurant Service)
  MENU: {
    CREATE: '/api/menu-items',
    UPDATE: (id: number) => `/api/menu-items/${id}`,
    DELETE: (id: number) => `/api/menu-items/${id}`,
    GET_MY_MENU_ITEMS: '/api/menu-items/my-menu-items', // Lấy menu items của nhà hàng hiện tại
  },

  // ==================== ORDER SERVICE (port 8084) ====================
  ORDER: {
    GET_BY_ID: (id: number) => `/api/orders/${id}`,
    GET_ALL_ADMIN: '/api/orders/all',
    GET_BY_STATUS: (status: string) => `/api/orders/status/${status}`,
    GET_MY_ORDERS: '/api/orders/my-restaurant-orders',
  },

  // ==================== SHIPPER SERVICE (port 8086) ====================
  SHIPPER: {
    GET_ALL: '/api/shippers',
    GET_ONLINE: '/api/shippers/online',
  },

  // ==================== PROMOTION SERVICE ====================
  PROMOTION: {
    CREATE_PLATFORM: '/api/promotions/platform',
    ADMIN_GET_ALL: '/api/promotions/admin',
    DELETE: (id: number) => `/api/promotions/${id}`,
  },

  // ==================== FLASH SALE SERVICE ====================
  FLASHSALE: {
    ADMIN: {
      CREATE_CAMPAIGN: '/api/flashsales/admin/campaigns',
      GET_ALL_CAMPAIGNS: '/api/flashsales/admin/campaigns',
      GET_CAMPAIGN_ITEMS: (id: number) => `/api/flashsales/admin/campaigns/${id}/items`,
      UPDATE_CAMPAIGN_STATUS: (id: number) => `/api/flashsales/admin/campaigns/${id}/status`,
      APPROVE_ITEM: (id: number) => `/api/flashsales/admin/items/${id}/approve`,
    }
  },

} as const;

export default API_ENDPOINTS;
