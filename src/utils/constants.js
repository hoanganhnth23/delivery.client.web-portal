/**
 * Application Constants
 * Định nghĩa các hằng số sử dụng trong toàn bộ ứng dụng
 */

// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// User Roles (mapping từ backend AuthAccount.Role)
export const USER_ROLES = {
  USER: 'USER',           // Khách hàng (không dùng cho web admin)
  ADMIN: 'ADMIN',         // Quản trị viên hệ thống
  SHIPPER: 'SHIPPER',     // Shipper (không dùng cho web admin)
  SHOP_OWNER: 'SHOP_OWNER', // Chủ nhà hàng
};

// Device Types (cho login request)
export const DEVICE_TYPES = {
  WEB: 'WEB',
  MOBILE: 'MOBILE',
  TABLET: 'TABLET',
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// Response Codes (từ BaseResponse)
export const RESPONSE_CODES = {
  SUCCESS: 1,
  ERROR: 0,
};

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_INFO: 'userInfo',
};

// Routes
export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  
  // Protected routes
  DASHBOARD: '/dashboard',
  ADMIN_DASHBOARD: '/admin',
  
  // Restaurant routes
  RESTAURANTS: '/restaurants',
  RESTAURANT_DETAIL: '/restaurants/:id',
  RESTAURANT_NEW: '/restaurants/new',
  RESTAURANT_EDIT: '/restaurants/:id/edit',
  
  // Menu routes
  MENU: '/restaurants/:restaurantId/menu',
  MENU_NEW: '/restaurants/:restaurantId/menu/new',
  MENU_EDIT: '/restaurants/:restaurantId/menu/:menuId/edit',
  
  // Error pages
  UNAUTHORIZED: '/unauthorized',
  NOT_FOUND: '/404',
};

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
};

// Toast Messages
export const TOAST_MESSAGES = {
  // Auth
  LOGIN_SUCCESS: 'Đăng nhập thành công!',
  LOGIN_ERROR: 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.',
  LOGOUT_SUCCESS: 'Đăng xuất thành công!',
  REGISTER_SUCCESS: 'Đăng ký thành công! Vui lòng đăng nhập.',
  REGISTER_ERROR: 'Đăng ký thất bại. Vui lòng thử lại.',
  
  // Restaurant
  RESTAURANT_CREATED: 'Tạo nhà hàng thành công!',
  RESTAURANT_UPDATED: 'Cập nhật nhà hàng thành công!',
  RESTAURANT_DELETED: 'Xóa nhà hàng thành công!',
  
  // Menu
  MENU_CREATED: 'Tạo món ăn thành công!',
  MENU_UPDATED: 'Cập nhật món ăn thành công!',
  MENU_DELETED: 'Xóa món ăn thành công!',
  
  // Generic
  GENERIC_ERROR: 'Có lỗi xảy ra. Vui lòng thử lại.',
  NETWORK_ERROR: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối.',
};
