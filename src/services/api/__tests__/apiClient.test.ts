import { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import {
  createApiClient, getSessionLoginPath, handleError, isPublicBrowserRequest,
  type ApiClientError, type RefreshRequest,
} from '../apiClient';

const response = (config: InternalAxiosRequestConfig, status: number, data: unknown): AxiosResponse => ({
  config, data, headers: {}, status, statusText: String(status),
});

const unauthorized = (config: InternalAxiosRequestConfig): AxiosError => new AxiosError(
  'Unauthorized', AxiosError.ERR_BAD_REQUEST, config, undefined,
  response(config, 401, { status: 0, message: 'Unauthorized', data: null }),
);

describe('BFF API client boundary', () => {
  it('preserves typed backend errors', () => {
    const original = { response: response({ headers: new AxiosHeaders() } as InternalAxiosRequestConfig, 404, {
      status: 0, message: 'Không tìm thấy', data: null,
      error: { code: 'ROOM_NOT_FOUND', details: { id: 'room' } },
    }) };
    try {
      handleError(original);
      throw new Error('must throw');
    } catch (error) {
      const apiError = error as ApiClientError;
      expect(apiError.status).toBe(404);
      expect(apiError.code).toBe('ROOM_NOT_FOUND');
      expect(apiError.details).toEqual({ id: 'room' });
    }
  });

  it('keeps redirects in the active portal and classifies only explicit public routes', () => {
    expect(getSessionLoginPath('/admin/orders')).toBe('/admin/login');
    expect(getSessionLoginPath('/restaurant/menu')).toBe('/login');
    expect(isPublicBrowserRequest('post', '/api/auth/register')).toBe(true);
    expect(isPublicBrowserRequest('get', '/api/restaurants/42')).toBe(true);
    expect(isPublicBrowserRequest('post', '/api/orders')).toBe(false);
  });

  it('rewrites protected traffic, strips browser bearer, sends cookies and adds CSRF to mutations', async () => {
    document.cookie = 'XSRF-TOKEN=csrf-value; Path=/';
    const client = createApiClient({ baseUrl: 'http://gateway.test' });
    expect(client.defaults.withCredentials).toBe(true);
    client.defaults.adapter = async (config) => {
      expect(config.url).toBe('/bff/api/orders');
      expect(config.headers.get('Authorization')).toBeUndefined();
      expect(config.headers.get('X-CSRF-Token')).toBe('csrf-value');
      return response(config, 200, { status: 1, message: 'ok', data: { id: 1 } });
    };
    const result = await client.post('/api/orders', {}, { headers: { Authorization: 'Bearer attacker' } });
    expect(result.data.data.id).toBe(1);
  });

  it('does not route public catalog or registration through the authenticated BFF', async () => {
    const client = createApiClient({ baseUrl: 'http://gateway.test' });
    const seen: string[] = [];
    client.defaults.adapter = async (config) => {
      seen.push(config.url ?? '');
      return response(config, 200, { status: 1, message: 'ok', data: [] });
    };
    await client.get('/api/restaurants');
    await client.post('/api/auth/register', {});
    expect(seen).toEqual(['/api/restaurants', '/api/auth/register']);
  });

  it('shares one cookie-session refresh and retries all concurrent protected requests', async () => {
    let release!: (value: AxiosResponse) => void;
    const refreshRequest = vi.fn<RefreshRequest>(() => new Promise(resolve => { release = resolve; }));
    const client = createApiClient({ baseUrl: 'http://gateway.test', refreshRequest });
    client.defaults.adapter = async (config) => {
      if (!(config as InternalAxiosRequestConfig & { _retry?: boolean })._retry) throw unauthorized(config);
      return response(config, 200, { status: 1, message: 'ok', data: config.url });
    };
    const first = client.get('/api/users');
    const second = client.get('/api/orders/all');
    await vi.waitFor(() => expect(refreshRequest).toHaveBeenCalledOnce());
    release(response({ headers: new AxiosHeaders() } as InternalAxiosRequestConfig, 200, {}));
    const values = await Promise.all([first, second]);
    expect(values.map(value => value.data.data)).toEqual(['/bff/api/users', '/bff/api/orders/all']);
    expect(refreshRequest).toHaveBeenCalledOnce();
  });

  it('never refreshes public 401 and expires a repeatedly rejected BFF session once', async () => {
    const refreshRequest = vi.fn<RefreshRequest>(async () => response(
      { headers: new AxiosHeaders() } as InternalAxiosRequestConfig, 200, {},
    ));
    const onSessionExpired = vi.fn();
    const client = createApiClient({ baseUrl: 'http://gateway.test', refreshRequest, onSessionExpired });
    client.defaults.adapter = async config => { throw unauthorized(config); };
    await expect(client.post('/api/auth/register')).rejects.toBeInstanceOf(AxiosError);
    expect(refreshRequest).not.toHaveBeenCalled();
    await expect(client.get('/api/users')).rejects.toBeInstanceOf(AxiosError);
    expect(refreshRequest).toHaveBeenCalledOnce();
    expect(onSessionExpired).toHaveBeenCalledOnce();
  });
});
