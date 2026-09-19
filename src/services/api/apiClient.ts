import axios, { AxiosError, type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { TokenStorage } from '@/services/storage/localStorage';
import { csrfToken, refreshWebSession } from './webSessionClient';
import { API_BASE_URL, HTTP_STATUS, RESPONSE_CODES, ROUTES } from '@/utils/constants';

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _bffProtected?: boolean;
}

interface BaseResponseEnvelope<T = unknown> {
  status: 0 | 1;
  message: string | null;
  data: T;
  error?: { code?: string; details?: unknown } | null;
}

export interface ApiClientError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  originalError: unknown;
}

export type RefreshRequest = () => Promise<AxiosResponse>;

export interface CreateApiClientOptions {
  baseUrl: string;
  refreshRequest?: RefreshRequest;
  onSessionExpired?: () => void;
  timeoutMs?: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseBaseResponse = <T>(payload: unknown): BaseResponseEnvelope<T> => {
  if (!isRecord(payload) ||
      (payload.status !== RESPONSE_CODES.SUCCESS && payload.status !== RESPONSE_CODES.ERROR) ||
      !Object.prototype.hasOwnProperty.call(payload, 'data') ||
      !Object.prototype.hasOwnProperty.call(payload, 'message') ||
      (payload.message !== null && typeof payload.message !== 'string')) {
    throw new Error('Backend response does not match the canonical BaseResponse contract');
  }
  return payload as unknown as BaseResponseEnvelope<T>;
};

export const handleResponse = <T = unknown>(response: AxiosResponse): T => {
  const envelope = parseBaseResponse<T>(response.data);
  if (envelope.status !== RESPONSE_CODES.SUCCESS) throw new Error(envelope.message || 'API Error');
  return envelope.data;
};

const PUBLIC_AUTH_PATHS = [
  '/api/auth/register', '/api/auth/registrations/', '/api/auth/forgot-password',
  '/api/auth/reset-password', '/api/auth/email-verification/request',
  '/api/auth/email-verification/confirm', '/api/users/registrations',
];

export const isPublicBrowserRequest = (method: string | undefined, url: string): boolean => {
  const verb = (method ?? 'get').toLowerCase();
  if (PUBLIC_AUTH_PATHS.some(path => url === path || url.startsWith(path))) return true;
  if (verb !== 'get') return false;
  return url === '/api/restaurants' || /^\/api\/restaurants\/(?:[0-9]+|page|search)(?:[/?]|$)/.test(url)
    || /^\/api\/menu-items\/restaurant\/[0-9]+(?:\/available)?(?:\/page)?(?:[/?]|$)/.test(url)
    || url.startsWith('/api/search/');
};

export const shouldAttemptWebSessionRefresh = (
  status: number | undefined,
  request: ExtendedAxiosRequestConfig | undefined,
): request is ExtendedAxiosRequestConfig => status === HTTP_STATUS.UNAUTHORIZED
  && Boolean(request?._bffProtected) && !request?._retry;

export function createApiClient({ baseUrl, refreshRequest, onSessionExpired, timeoutMs = 30_000 }:
CreateApiClientOptions): AxiosInstance {
  const client = axios.create({
    baseURL: baseUrl, withCredentials: true,
    headers: { 'Content-Type': 'application/json' }, timeout: timeoutMs,
  });
  const requestRefresh = refreshRequest ?? (async () => {
    const data = await refreshWebSession();
    return { data } as AxiosResponse;
  });
  let refreshInFlight: Promise<AxiosResponse> | null = null;
  let expirationReported = false;

  const expireSession = () => {
    if (expirationReported) return;
    expirationReported = true;
    TokenStorage.clearAll();
    onSessionExpired?.();
  };

  client.interceptors.request.use((raw) => {
    const config = raw as ExtendedAxiosRequestConfig;
    const url = config.url ?? '';
    if (url.startsWith('/api/') && !isPublicBrowserRequest(config.method, url)) {
      config.url = `/bff${url}`;
      config._bffProtected = true;
      const method = (config.method ?? 'get').toLowerCase();
      if (!['get', 'head', 'options'].includes(method)) {
        config.headers.set('X-CSRF-Token', csrfToken() ?? '');
      }
    }
    config.headers.delete('Authorization');
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      const envelope = parseBaseResponse(response.data);
      if (envelope.status === RESPONSE_CODES.SUCCESS) return response;
      const error = new Error(envelope.message || 'API Error') as Error & { response: AxiosResponse };
      error.response = response;
      return Promise.reject(error);
    },
    async (error: AxiosError) => {
      const original = error.config as ExtendedAxiosRequestConfig | undefined;
      if (error.response?.status === HTTP_STATUS.UNAUTHORIZED && original?._retry) {
        expireSession();
        return Promise.reject(error);
      }
      if (!shouldAttemptWebSessionRefresh(error.response?.status, original)) return Promise.reject(error);
      original._retry = true;
      try {
        if (!refreshInFlight) refreshInFlight = requestRefresh().finally(() => { refreshInFlight = null; });
        await refreshInFlight;
        expirationReported = false;
        return client(original);
      } catch (refreshError) {
        expireSession();
        return Promise.reject(refreshError);
      }
    },
  );
  return client;
}

export const handleError = (error: unknown): never => {
  let errorMessage = 'Có lỗi xảy ra';
  let errorStatus = 0;
  let errorCode: string | undefined;
  let errorDetails: unknown;
  const response = axios.isAxiosError(error) ? error.response
    : (error as { response?: AxiosResponse } | null)?.response;
  if (response) {
    errorStatus = response.status;
    const payload = response.data as {
      message?: string | null;
      error?: { code?: string; message?: string; details?: unknown } | null;
    } | undefined;
    errorMessage = payload?.message || payload?.error?.message
      || (error instanceof Error ? error.message : errorMessage);
    errorCode = payload?.error?.code;
    errorDetails = payload?.error?.details;
  } else if (axios.isAxiosError(error)) {
    errorMessage = error.request ? 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối.'
      : error.message || errorMessage;
  } else if (error instanceof Error) errorMessage = error.message;
  const mapped = new Error(errorMessage) as ApiClientError;
  mapped.status = errorStatus;
  mapped.code = errorCode;
  mapped.details = errorDetails;
  mapped.originalError = error;
  throw mapped;
};

export const getSessionLoginPath = (pathname: string): string => pathname.startsWith('/admin')
  ? ROUTES.ADMIN_LOGIN
  : pathname.startsWith('/customer/') || pathname === ROUTES.CUSTOMER_CHECKOUT
    ? ROUTES.CUSTOMER_LOGIN : ROUTES.LOGIN;

TokenStorage.clearLegacyCredentials();

const apiClient = createApiClient({
  baseUrl: API_BASE_URL,
  onSessionExpired: () => {
    if (typeof window !== 'undefined') window.location.href = getSessionLoginPath(window.location.pathname);
  },
});

export default apiClient;
