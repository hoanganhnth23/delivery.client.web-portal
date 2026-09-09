import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USER_ROLES } from '@/utils/constants';
import { TokenStorage } from '@/services/storage/localStorage';

const apiClient = {
  post: vi.fn(),
  get: vi.fn(),
};

vi.mock('@/services/api/apiClient', () => ({
  default: apiClient,
  handleResponse: <T>(response: { data: { data: T } }): T => response.data.data,
  handleError: (error: unknown): never => {
    throw error;
  },
}));

const { authService } = await import('@/modules/auth/services/authService');

describe('auth service identity handoff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('preserves the stable auth id when profile id is refreshed', async () => {
    apiClient.post.mockResolvedValueOnce({
      data: {
        status: 1,
        message: 'ok',
        data: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          authId: 7001,
          email: 'admin@example.test',
          role: USER_ROLES.ADMIN,
        },
      },
    });
    apiClient.get.mockResolvedValueOnce({
      data: {
        status: 1,
        message: 'ok',
        data: {
          id: 42,
          authId: 7001,
          email: 'admin@example.test',
          role: USER_ROLES.ADMIN,
          fullName: 'Admin Test',
        },
      },
    });

    await authService.login({
      email: 'admin@example.test',
      password: 'secret',
      role: USER_ROLES.ADMIN,
    });
    const profile = await authService.getProfile();

    expect(profile.id).toBe(42);
    expect(profile.authId).toBe(7001);
    expect(TokenStorage.getUserInfo()?.authId).toBe(7001);
  });
});
