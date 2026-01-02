/**
 * API Client - Axios Instance
 * Cấu hình axios với interceptors để xử lý authentication và error handling
 */

import axios from 'axios';
import { API_BASE_URL, RESPONSE_CODES, HTTP_STATUS } from '@/utils/constants';
import { TokenStorage } from '@/services/storage/localStorage';
import { API_ENDPOINTS } from './endpoints';

// Tạo axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request Interceptor - Tự động thêm access token vào header
apiClient.interceptors.request.use(
  (config) => {
    const token = TokenStorage.getAccessToken();
    
    // Thêm Bearer token nếu có
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request (chỉ trong development)
    if (import.meta.env.DEV) {
      console.log('🚀 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
      });
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor - Xử lý response và auto-refresh token
apiClient.interceptors.response.use(
  (response) => {
    // Log response (chỉ trong development)
    if (import.meta.env.DEV) {
      console.log('✅ API Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data,
      });
    }

    // Kiểm tra BaseResponse format từ backend
    const { code, data, message } = response.data;

    if (code === RESPONSE_CODES.SUCCESS) {
      // Trả về data nếu success
      return response;
    } else {
      // Throw error nếu code !== 1
      const error = new Error(message || 'API Error');
      error.response = response;
      return Promise.reject(error);
    }
  },
  async (error) => {
    const originalRequest = error.config;

    // Log error (chỉ trong development)
    if (import.meta.env.DEV) {
      console.error('❌ API Error:', {
        url: originalRequest?.url,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
    }

    // Xử lý 401 Unauthorized - Auto refresh token
    if (
      error.response?.status === HTTP_STATUS.UNAUTHORIZED &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/api/auth/login') &&
      !originalRequest.url?.includes('/api/auth/refresh-token')
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = TokenStorage.getRefreshToken();

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Gọi API refresh token
        const response = await axios.post(
          `${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`,
          { refreshToken }
        );

        const { accessToken } = response.data.data;

        // Lưu token mới
        TokenStorage.setAccessToken(accessToken);

        // Retry request với token mới
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh token thất bại -> logout
        console.error('❌ Refresh Token Failed:', refreshError);
        TokenStorage.clearAll();

        // Redirect về login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    // Xử lý các lỗi khác
    return Promise.reject(error);
  }
);

/**
 * Helper function để xử lý response data
 * Extract data từ BaseResponse format
 */
export const handleResponse = (response) => {
  return response.data.data;
};

/**
 * Helper function để xử lý error
 * Extract error message từ response
 */
export const handleError = (error) => {
  if (error.response) {
    // Server responded with error
    const message = error.response.data?.message || error.message;
    return {
      status: error.response.status,
      message,
      data: error.response.data,
    };
  } else if (error.request) {
    // Request was made but no response
    return {
      status: 0,
      message: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối.',
      data: null,
    };
  } else {
    // Something else happened
    return {
      status: 0,
      message: error.message || 'Có lỗi xảy ra',
      data: null,
    };
  }
};

export default apiClient;
