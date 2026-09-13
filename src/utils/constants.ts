/**
 * Application Constants
 * Định nghĩa các hằng số sử dụng trong toàn bộ ứng dụng
 */

// Gateway origin. API endpoints below already include the `/api` prefix.
export const normalizeApiBaseUrl = (value?: string): string =>
  (value?.trim() || 'http://localhost:8079')
    .replace(/\/api\/?$/, '')
    .replace(/\/+$/, '');

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

// User Roles (mapping từ backend AuthAccount.Role)
export const USER_ROLES = {
  USER: 'USER',           // Khách hàng (không dùng cho web admin)
  ADMIN: 'ADMIN',         // Quản trị viên hệ thống
  SHIPPER: 'SHIPPER',     // Shipper (không dùng cho web admin)
  RESTAURANT_OWNER: 'SHOP_OWNER', // Chủ nhà hàng
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Device Types (cho login request)
export const DEVICE_TYPES = {
  WEB: 'WEB',
  MOBILE: 'MOBILE',
  TABLET: 'TABLET',
} as const;

export type DeviceType = typeof DEVICE_TYPES[keyof typeof DEVICE_TYPES];

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Response Codes (từ BaseResponse)
export const RESPONSE_CODES = {
  SUCCESS: 1,
  ERROR: 0,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_INFO: 'userInfo',
  CURRENT_RESTAURANT_ID: 'currentRestaurantId',
} as const;

// Routes
export const ROUTES = {
  // Public routes
  HOME: '/',
  SYSTEM_OVERVIEW: '/system-overview',
  SYSTEM_OVERVIEW_SECTION: (section: string) => `/system-overview/${section}`,
  SYSTEM_OVERVIEW_SERVICE: (serviceId: string) => `/system-overview/services/${serviceId}`,
  SYSTEM_OVERVIEW_WORKFLOW: (workflowId: string) => `/system-overview/workflows/${workflowId}`,
  LOGIN: '/login',
  ADMIN_LOGIN: '/admin/login',
  CUSTOMER_LOGIN: '/customer/login',
  CUSTOMER_REGISTER: '/customer/register',
  VERIFY_EMAIL: '/verify-email',
  CUSTOMER_RESTAURANTS: '/restaurants',
  CUSTOMER_CART: '/cart',
  CUSTOMER_CHECKOUT: '/customer/checkout',
  CUSTOMER_ADDRESSES: '/customer/addresses',
  CUSTOMER_ACCOUNT: '/customer/account',
  CUSTOMER_ORDERS: '/customer/orders',
  CUSTOMER_LIVESTREAMS: '/customer/livestreams',
  CUSTOMER_ORDER: (id: number | string) => `/customer/orders/${id}`,
  
  // Admin routes
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_CHAT: '/admin/chat',
  ADMIN_RESTAURANTS: '/admin/restaurants',
  ADMIN_SHIPPERS: '/admin/shippers',
  ADMIN_RATINGS: '/admin/ratings',
  ADMIN_COUPONS: '/admin/coupons',
  ADMIN_FLASH_SALES: '/admin/flash-sales',
  ADMIN_CATALOG_IMPORT: '/admin/catalog-import',
  ADMIN_LIVESTREAMS: '/admin/livestreams',
  RESTAURANT_DASHBOARD: '/restaurant/dashboard', // Shop Owner dashboard
  RESTAURANT_PROFILE: '/restaurant/profile',
  RESTAURANT_MENU: '/restaurant/menu',
  RESTAURANT_ORDERS: '/restaurant/orders',
  RESTAURANT_REVIEWS: '/restaurant/reviews',
  RESTAURANT_VOUCHERS: '/restaurant/vouchers',
  RESTAURANT_CATALOG_IMPORT: '/restaurant/catalog-import',
  RESTAURANT_LIVESTREAM: '/restaurant/livestream',
  
  // Error pages
  UNAUTHORIZED: '/unauthorized',
} as const;

export const isCustomerRoute = (pathname: string): boolean =>
  pathname.startsWith('/customer/') ||
  pathname === ROUTES.CUSTOMER_CART ||
  pathname === ROUTES.CUSTOMER_RESTAURANTS ||
  pathname.startsWith(`${ROUTES.CUSTOMER_RESTAURANTS}/`);

// Validation Rules
export const VALIDATION = {
  EMAIL: {
    PATTERN: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    MESSAGE: 'Email không hợp lệ',
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MESSAGE: 'Mật khẩu phải có ít nhất 6 ký tự',
  },
} as const;

// Toast Messages
export const TOAST_MESSAGES = {
  // Auth
  LOGIN_SUCCESS: 'Đăng nhập thành công!',
  LOGIN_ERROR: 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.',
  LOGOUT_SUCCESS: 'Đăng xuất thành công!',
  
  // Restaurant
  RESTAURANT_CREATED: 'Tạo nhà hàng thành công!',
  RESTAURANT_UPDATED: 'Cập nhật nhà hàng thành công!',
  RESTAURANT_DELETED: 'Xóa nhà hàng thành công!',
  
  // Menu
  MENU_CREATED: 'Tạo món ăn thành công!',
  MENU_UPDATED: 'Cập nhật món ăn thành công!',
  MENU_DELETED: 'Xóa món ăn thành công!',
  
  // Errors
  NETWORK_ERROR: 'Lỗi kết nối mạng. Vui lòng thử lại.',
  UNKNOWN_ERROR: 'Có lỗi xảy ra. Vui lòng thử lại.',
} as const;
