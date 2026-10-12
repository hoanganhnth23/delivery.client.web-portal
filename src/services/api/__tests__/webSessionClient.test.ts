import { describe, expect, it, vi } from 'vitest';

const http = { post: vi.fn(), get: vi.fn() };
vi.mock('axios', () => ({ default: { create: vi.fn(() => http) } }));

const { csrfToken, loginWebSession, readWebSession, refreshWebSession, logoutWebSession } = await import('../webSessionClient');

describe('web session transport', () => {
  it('reads encoded csrf cookies and builds session requests', async () => {
    document.cookie = 'XSRF-TOKEN=csrf%2Bvalue';
    expect(csrfToken()).toBe('csrf+value');
    http.post.mockResolvedValue({ data: { authenticated: true } });
    http.get.mockResolvedValue({ data: { authenticated: true } });
    await loginWebSession('a@test', 'pw', 'ADMIN');
    await readWebSession();
    await refreshWebSession();
    await logoutWebSession();
    expect(http.post).toHaveBeenNthCalledWith(1, '/bff/session/login', { email: 'a@test', password: 'pw', role: 'ADMIN', deviceName: 'Delivery Web' });
    expect(http.post).toHaveBeenCalledWith('/bff/session/logout', null, { headers: { 'X-CSRF-Token': 'csrf+value' } });
  });
});
