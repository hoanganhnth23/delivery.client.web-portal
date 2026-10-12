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

  it('registers a customer through auth then profile linkage without persisting provisioning secrets', async () => {
    apiClient.post
      .mockResolvedValueOnce({ data: { status: 1, message: 'ok', data: {
        authId: 9, principalId: 10, email: 'user@example.test', role: USER_ROLES.USER,
        provisioningToken: 'one-use', registrationHandle: 'handle', lifecycleStatus: 'PENDING',
      } } })
      .mockResolvedValueOnce({ data: { status: 1, message: 'ok', data: {
        id: 12, authId: 10, email: 'user@example.test', role: USER_ROLES.USER,
      } } });
    const result = await authService.registerCustomer({ email: 'user@example.test', password: 'secret', fullName: '  User  ', phone: ' 123 ' });
    expect(result).toMatchObject({ principalId: 10, profileCreated: true, registrationHandle: 'handle' });
    expect(apiClient.post).toHaveBeenNthCalledWith(2, '/api/users/registrations', {
      provisioningToken: 'one-use', fullName: 'User', phone: '123',
    });
    expect(localStorage.getItem('provisioningToken')).toBeNull();
  });

  it('covers verification, registration status, logout cleanup and role helpers', async () => {
    apiClient.get.mockResolvedValue({ data: { status: 1, message: 'ok', data: { principalId: 10, status: 'PENDING', nextAction: 'VERIFY', profileLinked: false } } });
    await expect(authService.getRegistrationStatus('h/1')).resolves.toMatchObject({ principalId: 10 });
    apiClient.post.mockResolvedValue({ data: { status: 1, message: 'ok', data: null } });
    await authService.requestEmailVerification('u@example.test');
    await authService.confirmEmailVerification('token');
    session.logoutWebSession.mockRejectedValue(new Error('offline'));
    await authService.logout();
    expect(TokenStorage.getUserInfo()).toBeNull();
    expect(authService.isAuthenticated()).toBe(false);
    expect(authService.hasStoredSession()).toBe(false);
    expect(authService.hasRole(USER_ROLES.ADMIN)).toBe(false);
    const id = authService.getOrCreateDeviceId();
    expect(id).toBe(authService.getOrCreateDeviceId());
    expect(authService.hashCode('abc')).toBe(96354);
  });

  it('rejects invalid BFF sessions and accepts a valid role-specific login', async () => {
    session.loginWebSession.mockResolvedValueOnce({ authenticated: true, principalId: 1, email: 'x@test', role: USER_ROLES.ADMIN });
    await expect(authService.login({ email: 'x@test', password: 'x', role: USER_ROLES.USER })).rejects.toThrow('invalid authenticated session');
    session.loginWebSession.mockResolvedValueOnce({ authenticated: true, principalId: 2, email: 'u@test', role: USER_ROLES.USER });
    await expect(authService.login({ email: 'u@test', password: 'x', role: USER_ROLES.USER })).resolves.toMatchObject({ user: { id: 2 } });
    expect(authService.hasRole(USER_ROLES.USER)).toBe(true);
    expect(authService.hasRole([USER_ROLES.ADMIN, USER_ROLES.USER])).toBe(true);
    session.readWebSession.mockResolvedValue({ authenticated: false, principalId: null, email: null, role: null });
    await expect(authService.restoreSession()).rejects.toThrow('Web session is not active');
  });
});
