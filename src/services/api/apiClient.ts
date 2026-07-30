import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { TokenStorage } from '@/services/storage/localStorage';
import {
  API_BASE_URL,
  HTTP_STATUS,
  RESPONSE_CODES,
  ROUTES,
} from '@/utils/constants';
import { API_ENDPOINTS } from './endpoints';

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface BaseResponseEnvelope<T = unknown> {
  status: 0 | 1;
  message: string | null;
  data: T;
}

interface RefreshTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiSessionStore {
  clearAll(): void;
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  setAccessToken(token: string): void;
  setRefreshToken(token: string): void;
}

export type RefreshRequest = (
  url: string,
  refreshToken: string,
) => Promise<AxiosResponse>;

export interface CreateApiClientOptions {
  baseUrl: string;
  sessionStore: ApiSessionStore;
  refreshRequest?: RefreshRequest;
  onSessionExpired?: () => void;
  timeoutMs?: number;
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

const getAuthorizationHeader = (
  config: ExtendedAxiosRequestConfig,
): string | undefined => {
  const value = config.headers?.get?.('Authorization') ?? config.headers?.Authorization;
  return typeof value === 'string' ? value : undefined;
};

export function shouldAttemptWebTokenRefresh(
  status: number | undefined,
  request: ExtendedAxiosRequestConfig | undefined,
): request is ExtendedAxiosRequestConfig {
  return status === HTTP_STATUS.UNAUTHORIZED &&
    Boolean(request) &&
    !request?._retry &&
    getAuthorizationHeader(request as ExtendedAxiosRequestConfig)?.startsWith('Bearer ') === true &&
    !request?.url?.includes('/api/auth/login') &&
    !request?.url?.includes('/api/auth/refresh-token') &&
    !request?.url?.includes('/api/auth/logout');
}

export const handleResponse = <T = unknown>(response: AxiosResponse): T => {
  const envelope = parseBaseResponse<T>(response.data);
  if (envelope.status !== RESPONSE_CODES.SUCCESS) {
    throw new Error(envelope.message || 'API Error');
  }
  return envelope.data;
};

const defaultRefreshRequest = (
  timeoutMs: number,
): RefreshRequest => (url, refreshToken) => axios.post(
  url,
  { refreshToken },
  {
    headers: { 'Content-Type': 'application/json' },
    timeout: timeoutMs,
  },
);

export function createApiClient({
  baseUrl,
  sessionStore,
  refreshRequest,
  onSessionExpired,
  timeoutMs = 30_000,
}: CreateApiClientOptions): AxiosInstance {
  const client = axios.create({
    baseURL: baseUrl,
    headers: { 'Content-Type': 'application/json' },
    timeout: timeoutMs,
  });
  const requestRefresh = refreshRequest ?? defaultRefreshRequest(timeoutMs);
  let isRefreshing = false;
  let failedQueue: Array<{
    resolve: (value: string) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  const processQueue = (error: unknown, token: string | null = null) => {
    for (const pending of failedQueue) {
      if (error) pending.reject(error);
      else pending.resolve(token!);
    }
    failedQueue = [];
  };

  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = sessionStore.getAccessToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error: AxiosError) => Promise.reject(error),
  );

  client.interceptors.response.use(
    (response: AxiosResponse) => {
      try {
        const envelope = parseBaseResponse(response.data);
        if (envelope.status === RESPONSE_CODES.SUCCESS) return response;

        const error = new Error(envelope.message || 'API Error') as Error & {
          response: AxiosResponse;
        };
        error.response = response;
        return Promise.reject(error);
      } catch (contractError) {
        if (contractError instanceof Error && 'response' in contractError) {
          return Promise.reject(contractError);
        }

        const error = new Error(
          contractError instanceof Error
            ? contractError.message
            : 'Invalid backend response',
        ) as Error & { response: AxiosResponse };
        error.response = response;
        return Promise.reject(error);
      }
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as ExtendedAxiosRequestConfig | undefined;
      if (!shouldAttemptWebTokenRefresh(error.response?.status, originalRequest)) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return client(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = sessionStore.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token available');

        const response = await requestRefresh(
          `${baseUrl}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`,
          refreshToken,
        );
        const tokens = handleResponse<RefreshTokens>(response);
        if (typeof tokens.accessToken !== 'string' || tokens.accessToken.trim() === '') {
          throw new Error('Refresh response is missing a valid access token');
        }
        if (typeof tokens.refreshToken !== 'string' || tokens.refreshToken.trim() === '') {
          throw new Error('Refresh response is missing a valid refresh token');
        }

        sessionStore.setAccessToken(tokens.accessToken);
        sessionStore.setRefreshToken(tokens.refreshToken);
        processQueue(null, tokens.accessToken);

        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        sessionStore.clearAll();
        onSessionExpired?.();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    },
  );

  return client;
}

export const handleError = (error: unknown): never => {
  let errorMessage = 'Có lỗi xảy ra';
  let errorStatus = 0;

  if (axios.isAxiosError(error)) {
    if (error.response) {
      errorStatus = error.response.status;
      errorMessage = (error.response.data as { message?: string })?.message || error.message;
    } else if (error.request) {
      errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối.';
    } else {
      errorMessage = error.message || errorMessage;
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  const mapped = new Error(errorMessage) as Error & {
    status: number;
    originalError: unknown;
  };
  mapped.status = errorStatus;
  mapped.originalError = error;
  throw mapped;
};

const apiClient = createApiClient({
  baseUrl: API_BASE_URL,
  sessionStore: TokenStorage,
  onSessionExpired: () => {
    if (typeof window !== 'undefined') window.location.href = ROUTES.LOGIN;
  },
});

export default apiClient;
