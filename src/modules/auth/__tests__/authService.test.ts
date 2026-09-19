import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USER_ROLES } from '@/utils/constants';
import { TokenStorage } from '@/services/storage/localStorage';

const apiClient = { post: vi.fn(), get: vi.fn() };
const session = {
  loginWebSession: vi.fn(), logoutWebSession: vi.fn(), readWebSession: vi.fn(),
};
vi.mock('@/services/api/apiClient', () => ({
  default: apiClient,
  handleResponse: <T>(response: { data: { data: T } }): T => response.data.data,
  handleError: (error: unknown): never => { throw error; },
}));
vi.mock('@/services/api/webSessionClient', () => session);

const { authService } = await import('@/modules/auth/services/authService');

describe('BFF auth service identity handoff', () => {
  beforeEach(() => { vi.clearAllMocks(); window.localStorage.clear(); });

  it('creates no browser token and preserves principal id while loading profile', async () => {
    session.loginWebSession.mockResolvedValue({
      authenticated: true, principalId: 7001, email: 'admin@example.test',
      role: USER_ROLES.ADMIN, sessionVersion: 1, csrfToken: 'csrf',
    });
    apiClient.get.mockResolvedValue({ data: { status: 1, message: 'ok', data: {
      id: 42, authId: 7001, email: 'admin@example.test', role: USER_ROLES.ADMIN,
      fullName: 'Admin Test',
    } } });

    await authService.login({ email: 'admin@example.test', password: 'secret', role: USER_ROLES.ADMIN });
    const profile = await authService.getProfile();

    expect(profile.id).toBe(42);
    expect(profile.authId).toBe(7001);
    expect(TokenStorage.getUserInfo()?.authId).toBe(7001);
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('restores from the shared HttpOnly session instead of requiring local credentials', async () => {
    session.readWebSession.mockResolvedValue({
      authenticated: true, principalId: 7001, email: 'admin@example.test',
      role: USER_ROLES.ADMIN, sessionVersion: 2, csrfToken: null,
    });
    apiClient.get.mockResolvedValue({ data: { status: 1, message: 'ok', data: {
      id: 42, authId: 7001, email: 'admin@example.test', role: USER_ROLES.ADMIN,
    } } });
    const user = await authService.restoreSession();
    expect(user.authId).toBe(7001);
    expect(session.readWebSession).toHaveBeenCalledOnce();
  });
});
