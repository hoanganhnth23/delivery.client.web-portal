/**
 * API Client - Axios Instance
 * Cấu hình axios với interceptors để xử lý authentication và error handling
 */

import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, RESPONSE_CODES, HTTP_STATUS, ROUTES } from '@/utils/constants';
import { TokenStorage } from '@/services/storage/localStorage';
import { API_ENDPOINTS } from './endpoints';

// Extended config type for retry logic
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface BaseResponseEnvelope<T = unknown> {
  status: 0 | 1;
  message: string | null;
  data: T;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseBaseResponse = <T>(payload: unknown): BaseResponseEnvelope<T> => {
  if (
    !isRecord(payload) ||
    (payload.status !== RESPONSE_CODES.SUCCESS && payload.status !== RESPONSE_CODES.ERROR) ||
    !Object.prototype.hasOwnProperty.call(payload, 'data') ||
    !Object.prototype.hasOwnProperty.call(payload, 'message') ||
    (payload.message !== null && typeof payload.message !== 'string')
  ) {
    throw new Error('Backend response does not match the canonical BaseResponse contract');
  }

  return payload as unknown as BaseResponseEnvelope<T>;
};

const getAuthorizationHeader = (config: ExtendedAxiosRequestConfig): string | undefined => {
  const value = config.headers?.get?.('Authorization') ?? config.headers?.Authorization;
  return typeof value === 'string' ? value : undefined;
};

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

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - Xử lý response và auto-refresh token
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    try {
      const envelope = parseBaseResponse(response.data);
      if (envelope.status === RESPONSE_CODES.SUCCESS) {
        return response;
      }

      const error = new Error(envelope.message || 'API Error') as Error & { response: AxiosResponse };
      error.response = response;
      return Promise.reject(error);
    } catch (contractError) {
      if (contractError instanceof Error && 'response' in contractError) {
        return Promise.reject(contractError);
      }

      const error = new Error(
        contractError instanceof Error ? contractError.message : 'Invalid backend response',
      ) as Error & { response: AxiosResponse };
      error.response = response;
      return Promise.reject(error);
    }
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;

    // Xử lý 401 Unauthorized - Auto refresh token
    if (
      error.response?.status === HTTP_STATUS.UNAUTHORIZED &&
      originalRequest &&
      !originalRequest._retry &&
      getAuthorizationHeader(originalRequest)?.startsWith('Bearer ') &&
      !originalRequest.url?.includes('/api/auth/login') &&
      !originalRequest.url?.includes('/api/auth/refresh-token') &&
      !originalRequest.url?.includes('/api/auth/logout')
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
          { refreshToken },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000,
          },
        );

        const refreshData = handleResponse<Record<string, unknown>>(response);
        const accessToken = refreshData.accessToken;
        const rotatedRefreshToken = refreshData.refreshToken;
        if (typeof accessToken !== 'string' || accessToken.trim() === '') {
          throw new Error('Refresh response is missing a valid access token');
        }
        if (typeof rotatedRefreshToken !== 'string' || rotatedRefreshToken.trim() === '') {
          throw new Error('Refresh response is missing a valid refresh token');
        }

        // Lưu token mới
        TokenStorage.setAccessToken(accessToken);
        TokenStorage.setRefreshToken(rotatedRefreshToken);


        // Process queue - retry tất cả requests đang chờ
        processQueue(null, accessToken);

        // Retry request hiện tại với token mới
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh token thất bại -> logout
        // Process queue với error - reject tất cả requests
        processQueue(refreshError, null);

        TokenStorage.clearAll();

        // Redirect về login page
        if (typeof window !== 'undefined') {
          window.location.href = ROUTES.LOGIN;
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
  const envelope = parseBaseResponse<T>(response.data);
  if (envelope.status !== RESPONSE_CODES.SUCCESS) {
    throw new Error(envelope.message || 'API Error');
  }
  return envelope.data;
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

    } else if (error.request) {
      // Request was made but no response
      errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối.';
    } else {
      // Something else happened
      errorMessage = error.message || errorMessage;
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
