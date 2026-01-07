/**
 * API Client - Axios Instance
 * Cấu hình axios với interceptors để xử lý authentication và error handling
 */

import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, RESPONSE_CODES, HTTP_STATUS } from '@/utils/constants';
import { TokenStorage } from '@/services/storage/localStorage';
import { API_ENDPOINTS } from './endpoints';

// Extended config type for retry logic
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Request queue để chặn các API calls khi đang refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });

  failedQueue = [];
};

// Tạo axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request Interceptor - Tự động thêm access token vào header
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
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
  (error: AxiosError) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor - Xử lý response và auto-refresh token
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response (chỉ trong development)
    if (import.meta.env.DEV) {
      console.log('✅ API Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data,
      });
    }

    // Kiểm tra BaseResponse format từ backend
    // Backend trả về: { status: 1, message: "...", data: {...} }
    const { status, code, message } = response.data;

    // Backend dùng "status" thay vì "code"
    const successCode = status || code;

    if (successCode === RESPONSE_CODES.SUCCESS) {
      // Trả về response nếu success
      return response;
    } else {
      // Throw error nếu status !== 1
      const error = new Error(message || 'API Error') as Error & { response: AxiosResponse };
      error.response = response;
      return Promise.reject(error);
    }
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;

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
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/api/auth/login') &&
      !originalRequest.url?.includes('/api/auth/refresh-token')
    ) {
      // Nếu đang refresh token, thêm request vào queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

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

        const { accessToken, refreshToken: refreshToken1 } = response.data.data;

        // Lưu token mới
        TokenStorage.setAccessToken(accessToken);
        if (refreshToken1) {
          TokenStorage.setRefreshToken(refreshToken1);
        }


        // Process queue - retry tất cả requests đang chờ
        processQueue(null, accessToken);

        // Retry request hiện tại với token mới
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh token thất bại -> logout
        console.error('❌ Refresh Token Failed:', refreshError);

        // Process queue với error - reject tất cả requests
        processQueue(refreshError, null);

        TokenStorage.clearAll();

        // Redirect về login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Xử lý các lỗi khác
    return Promise.reject(error);
  }
);

/**
 * Helper function để xử lý response data
 * Extract data từ BaseResponse format
 * Backend format: { status: 1, message: "Success", data: {...} }
 */
export const handleResponse = <T = unknown>(response: AxiosResponse): T => {
  // Backend trả về format: { status: 1, data: {...}, message: "Success" }
  if (response.data && response.data.data !== undefined) {
    return response.data.data;
  }
  // Fallback: trả về toàn bộ response.data nếu không có nested data
  return response.data;
};

/**
 * Helper function để xử lý error
 * Extract error message từ response
 */
export const handleError = (error: unknown): never => {
  let errorMessage = 'Có lỗi xảy ra';
  let errorStatus = 0;

  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Server responded with error
      errorStatus = error.response.status;
      errorMessage = (error.response.data as { message?: string })?.message || error.message;

      // Log chi tiết error để debug
      console.error('API Error Details:', {
        status: errorStatus,
        message: errorMessage,
        data: error.response.data,
      });
    } else if (error.request) {
      // Request was made but no response
      errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối.';
      console.error('Network Error:', error.message);
    } else {
      // Something else happened
      errorMessage = error.message || errorMessage;
      console.error('Error:', error.message);
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  // Throw Error object thay vì return
  const err = new Error(errorMessage) as Error & { status: number; originalError: unknown };
  err.status = errorStatus;
  err.originalError = error;
  throw err;
};

export default apiClient;
