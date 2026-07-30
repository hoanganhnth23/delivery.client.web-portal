import {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { describe, expect, it, vi } from 'vitest';
import {
  createApiClient,
  type ApiSessionStore,
  type RefreshRequest,
} from '../apiClient';

function createSessionStore({
  accessToken = 'old-access-token',
  refreshToken = 'refresh-token',
}: {
  accessToken?: string | null;
  refreshToken?: string | null;
} = {}) {
  let access = accessToken;
  let refresh = refreshToken;
  const store: ApiSessionStore = {
    clearAll: vi.fn(() => {
      access = null;
      refresh = null;
    }),
    getAccessToken: vi.fn(() => access),
    getRefreshToken: vi.fn(() => refresh),
    setAccessToken: vi.fn((token: string) => {
      access = token;
    }),
    setRefreshToken: vi.fn((token: string) => {
      refresh = token;
    }),
  };
  return store;
}

function response(
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown,
): AxiosResponse {
  return {
    config,
    data,
    headers: {},
    status,
    statusText: String(status),
  };
}

function unauthorized(config: InternalAxiosRequestConfig): AxiosError {
  return new AxiosError(
    'Unauthorized',
    AxiosError.ERR_BAD_REQUEST,
    config,
    undefined,
    response(config, 401, { status: 0, message: 'Unauthorized', data: null }),
  );
}

function refreshResponse(accessToken = 'new-access-token'): AxiosResponse {
  const config = {
    headers: new AxiosHeaders(),
  } as InternalAxiosRequestConfig;
  return response(config, 200, {
    status: 1,
    message: 'Success',
    data: {
      accessToken,
      refreshToken: 'rotated-refresh-token',
    },
  });
}

describe('createApiClient session boundary', () => {
  it('refreshes once, rotates both tokens and retries with the new bearer', async () => {
    const sessionStore = createSessionStore();
    const refreshRequest = vi.fn<RefreshRequest>(async () => refreshResponse());
    const client = createApiClient({
      baseUrl: 'http://gateway.test',
      sessionStore,
      refreshRequest,
    });
    const authorizationHeaders: string[] = [];
    client.defaults.adapter = async (config) => {
      const authorization = config.headers.get('Authorization')?.toString() ?? '';
      authorizationHeaders.push(authorization);
      if (authorization === 'Bearer old-access-token') throw unauthorized(config);
      return response(config, 200, {
        status: 1,
        message: 'Success',
        data: { id: 101 },
      });
    };

    const result = await client.get('/api/users');

    expect(result.data.data).toEqual({ id: 101 });
    expect(refreshRequest).toHaveBeenCalledWith(
      'http://gateway.test/api/auth/refresh-token',
      'refresh-token',
    );
    expect(sessionStore.setAccessToken).toHaveBeenCalledWith('new-access-token');
    expect(sessionStore.setRefreshToken).toHaveBeenCalledWith('rotated-refresh-token');
    expect(authorizationHeaders).toEqual([
      'Bearer old-access-token',
      'Bearer new-access-token',
    ]);
  });

  it('shares one refresh request across concurrent 401 responses', async () => {
    const sessionStore = createSessionStore();
    let releaseRefresh!: (value: AxiosResponse) => void;
    const refreshRequest = vi.fn<RefreshRequest>(() => new Promise((resolve) => {
      releaseRefresh = resolve;
    }));
    const client = createApiClient({
      baseUrl: 'http://gateway.test',
      sessionStore,
      refreshRequest,
    });
    client.defaults.adapter = async (config) => {
      if (config.headers.get('Authorization') === 'Bearer old-access-token') {
        throw unauthorized(config);
      }
      return response(config, 200, {
        status: 1,
        message: 'Success',
        data: config.url,
      });
    };

    const userRequest = client.get('/api/users');
    const orderRequest = client.get('/api/orders/all');
    await vi.waitFor(() => expect(refreshRequest).toHaveBeenCalledOnce());
    releaseRefresh(refreshResponse());

    const [userResponse, orderResponse] = await Promise.all([
      userRequest,
      orderRequest,
    ]);
    expect(userResponse.data.data).toBe('/api/users');
    expect(orderResponse.data.data).toBe('/api/orders/all');
    expect(refreshRequest).toHaveBeenCalledOnce();
  });

  it('clears and reports an expired session when refresh cannot start', async () => {
    const sessionStore = createSessionStore({ refreshToken: null });
    const onSessionExpired = vi.fn();
    const refreshRequest = vi.fn<RefreshRequest>();
    const client = createApiClient({
      baseUrl: 'http://gateway.test',
      sessionStore,
      refreshRequest,
      onSessionExpired,
    });
    client.defaults.adapter = async (config) => {
      throw unauthorized(config);
    };

    await expect(client.get('/api/users')).rejects.toThrow('No refresh token available');
    expect(refreshRequest).not.toHaveBeenCalled();
    expect(sessionStore.clearAll).toHaveBeenCalledOnce();
    expect(onSessionExpired).toHaveBeenCalledOnce();
  });

  it('never refreshes bootstrap authentication requests', async () => {
    const sessionStore = createSessionStore();
    const refreshRequest = vi.fn<RefreshRequest>();
    const client = createApiClient({
      baseUrl: 'http://gateway.test',
      sessionStore,
      refreshRequest,
    });
    client.defaults.adapter = async (config) => {
      throw unauthorized(config);
    };

    await expect(client.post('/api/auth/login')).rejects.toBeInstanceOf(AxiosError);
    expect(refreshRequest).not.toHaveBeenCalled();
    expect(sessionStore.clearAll).not.toHaveBeenCalled();
  });
});
