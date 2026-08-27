/**
 * API Endpoints
 * Định nghĩa tất cả các API endpoints từ backend
 */

export const API_ENDPOINTS = {
  // ==================== AUTH ROUTES (Gateway) ====================
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REGISTRATION_STATUS: (handle: string) => `/api/auth/registrations/${encodeURIComponent(handle)}`,
    REQUEST_EMAIL_VERIFICATION: '/api/auth/email-verification/request',
    CONFIRM_EMAIL_VERIFICATION: '/api/auth/email-verification/confirm',
    REFRESH_TOKEN: '/api/auth/refresh-token',
    LOGOUT: '/api/auth/logout',
  },

  // ==================== USER ROUTES (Gateway) ====================
  USER: {
    GET_PROFILE: '/api/users',
    REGISTER_PROFILE: '/api/users/registrations',
  },

  // ==================== RESTAURANT ROUTES (Gateway) ====================
  RESTAURANT: {
    CREATE: '/api/restaurants',
    UPDATE: (id: number) => `/api/restaurants/${id}`,
    GET_MY_RESTAURANTS: '/api/restaurants/my-restaurants', // Lấy nhà hàng của user hiện tại
    GET_ALL: '/api/restaurants',
    GET_PAGE: '/api/restaurants/page',
    SEARCH: '/api/restaurants/search',
    GET_BY_ID: (id: number) => `/api/restaurants/${id}`,
    CONFIRM_ORDER: (orderId: number) => `/api/restaurants/orders/${orderId}/confirm`,
    REJECT_ORDER: (orderId: number) => `/api/restaurants/orders/${orderId}/reject`,
    // Ratings
    GET_RATINGS: (restaurantId: number) => `/api/restaurants/${restaurantId}/ratings`,
    GET_RATINGS_PAGE: (restaurantId: number) => `/api/restaurants/${restaurantId}/ratings/page`,
    ADMIN_GET_ALL_RATINGS: '/api/restaurants/admin/ratings',
    ADMIN_GET_RATINGS_PAGE: '/api/restaurants/admin/ratings/page',
    ADMIN_UPDATE_RATING_STATUS: (id: number) => `/api/restaurants/admin/ratings/${id}/status`,
  },

  // Menu Items (Restaurant Service)
  MENU: {
    CREATE: '/api/menu-items',
    UPDATE: (id: number) => `/api/menu-items/${id}`,
    DELETE: (id: number) => `/api/menu-items/${id}`,
    GET_MY_MENU_ITEMS: '/api/menu-items/my-menu-items', // Lấy menu items của nhà hàng hiện tại
    GET_MY_MENU_ITEMS_PAGE: '/api/menu-items/my-menu-items/page',
    GET_BY_RESTAURANT: (restaurantId: number) => `/api/menu-items/restaurant/${restaurantId}`,
    GET_BY_RESTAURANT_PAGE: (restaurantId: number) => `/api/menu-items/restaurant/${restaurantId}/page`,
    GET_AVAILABLE_BY_RESTAURANT: (restaurantId: number) => `/api/menu-items/restaurant/${restaurantId}/available`,
    GET_AVAILABLE_BY_RESTAURANT_PAGE: (restaurantId: number) => `/api/menu-items/restaurant/${restaurantId}/available/page`,
  },

  // ==================== ORDER ROUTES (Gateway) ====================
  ORDER: {
    GET_BY_ID: (id: number) => `/api/orders/${id}`,
    GET_ALL_ADMIN: '/api/orders/all',
    GET_BY_STATUS: (status: string) => `/api/orders/status/${status}`,
    GET_MY_ORDERS: '/api/orders/my-restaurant-orders',
    GET_CUSTOMER_ORDERS: '/api/orders/my-orders',
    CHECKOUT_PREVIEW: '/api/orders/checkout-preview',
    CREATE: '/api/orders',
    CANCEL: (id: number) => `/api/orders/${id}/cancel`,
  },

  ADDRESS: {
    LIST: (userId: number) => `/api/addresses/users/${userId}/addresses`,
    GET_BY_ID: (id: number) => `/api/addresses/${id}`,
    CREATE: (userId: number) => `/api/addresses/users/${userId}/addresses`,
    UPDATE: (id: number) => `/api/addresses/${id}`,
    DELETE: (id: number) => `/api/addresses/${id}`,
    SET_DEFAULT: (id: number) => `/api/addresses/${id}/default`,
  },

  // ==================== SHIPPER ROUTES (Gateway) ====================
  SHIPPER: {
    GET_ALL: '/api/shippers',
    GET_ONLINE: '/api/shippers/online',
  },

  // ==================== PROMOTION SERVICE ====================
  PROMOTION: {
    CREATE_PLATFORM: '/api/promotions/platform',
    CAPABILITY: '/api/promotions/capability',
    MY_VOUCHERS: '/api/promotions/my-vouchers',
    COLLECT: (code: string) => `/api/promotions/collect/${encodeURIComponent(code)}`,
    CREATE_SHOP: '/api/promotions/shop',
    SHOP_LIST: '/api/promotions/shop',
    ADMIN_GET_ALL: '/api/promotions/admin',
    ADMIN_PENDING_SHOP: '/api/promotions/admin/pending-shop',
    ADMIN_APPROVE: (id: number) => `/api/promotions/admin/${id}/approve`,
    ADMIN_REJECT: (id: number) => `/api/promotions/admin/${id}/reject`,
    ADMIN_PAUSE: (id: number) => `/api/promotions/admin/${id}/pause`,
    ADMIN_RESUME: (id: number) => `/api/promotions/admin/${id}/resume`,
    ADMIN_GET_PAGE: '/api/promotions/admin/page',
    DELETE: (id: number) => `/api/promotions/${id}`,
  },

  // ==================== FLASH SALE SERVICE ====================
  FLASHSALE: {
    ADMIN: {
      CREATE_CAMPAIGN: '/api/flashsales/admin/campaigns',
      GET_ALL_CAMPAIGNS: '/api/flashsales/admin/campaigns',
      GET_CAMPAIGNS_PAGE: '/api/flashsales/admin/campaigns/page',
      GET_CAMPAIGN_ITEMS: (id: number) => `/api/flashsales/admin/campaigns/${id}/items`,
      GET_CAMPAIGN_ITEMS_PAGE: (id: number) => `/api/flashsales/admin/campaigns/${id}/items/page`,
      UPDATE_CAMPAIGN_STATUS: (id: number) => `/api/flashsales/admin/campaigns/${id}/status`,
      APPROVE_ITEM: (id: number) => `/api/flashsales/admin/items/${id}/approve`,
    }
  },

  ANALYTICS: {
    ADMIN_DASHBOARD: '/api/analytics/dashboard/admin',
  },
  LIVESTREAM: {
    ACTIVE: '/api/livestreams/active',
    CREATE: '/api/livestreams',
    START: (id: string) => `/api/livestreams/${id}/start`,
    END: (id: string) => `/api/livestreams/${id}/end`,
    INSPECT_RESTAURANT: (restaurantId: number) => `/api/livestreams/restaurant/${restaurantId}`,
  },

} as const;

export default API_ENDPOINTS;
