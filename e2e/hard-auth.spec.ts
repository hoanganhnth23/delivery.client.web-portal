import { expect, test } from '@playwright/test';
import { gotoRole, MockGateway } from './fixtures';

test.describe('hard auth, session and role cases', () => {
  test('CASE-AUTH-001 [P0] AUTH-01 blocks empty owner credentials before API', async ({ page }) => {
    const backend = await gotoRole(page, 'SHOP_OWNER', '/login', { strict: true });
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
    expect(backend.requestsFor('/api/auth/login')).toHaveLength(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-AUTH-002 [P0] AUTH-01 keeps owner login visible after 401', async ({ page }) => {
    const backend = new MockGateway({ role: 'SHOP_OWNER', strict: true });
    await backend.install(page);
    backend.failNext('/api/auth/login', { status: 401, message: 'Sai tài khoản hoặc mật khẩu' });
    await page.goto('/login');
    await page.getByLabel('Email').fill('owner@e2e.test');
    await page.locator('input[type="password"]').fill('wrong-password');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page.getByText('Sai tài khoản hoặc mật khẩu')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
    expect(backend.requestsFor('/api/auth/login')).toHaveLength(1);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-AUTH-003 [P0] AUTH-02 keeps admin login visible after 500', async ({ page }) => {
    const backend = new MockGateway({ role: 'ADMIN', strict: true });
    await backend.install(page);
    backend.failNext('/api/auth/login', { status: 500, message: 'Auth service unavailable' });
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill('admin@e2e.test');
    await page.locator('input[type="password"]').fill('Password123!');
    await page.getByRole('button', { name: 'Đăng nhập admin' }).click();
    await expect(page.getByText('Auth service unavailable')).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login$/);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-AUTH-004 [P0] AUTH-01 exposes owner restaurant retry after failure', async ({ page }) => {
    const backend = new MockGateway({ role: 'SHOP_OWNER', strict: true });
    await backend.install(page);
    await page.addInitScript(() => localStorage.removeItem('currentRestaurantId'));
    backend.failNext('/api/restaurants/my-restaurants', { status: 503, message: 'Restaurant service unavailable' });
    await page.goto('/login');
    await page.getByLabel('Email').fill('owner@e2e.test');
    await page.locator('input[type="password"]').fill('Password123!');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page.getByText(/Restaurant service unavailable|Lấy danh sách nhà hàng thất bại|Không thể tải nhà hàng/)).toBeVisible();
    await page.getByRole('button', { name: 'Thử tải lại nhà hàng' }).click();
    await expect(page).toHaveURL(/\/restaurant\/dashboard$/);
    expect(backend.requestsFor('/api/restaurants/my-restaurants')).toHaveLength(2);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-AUTH-005 [P0] AUTH-02 bootstrap 503 can recover through retry', async ({ page }) => {
    const backend = new MockGateway({ role: 'ADMIN', strict: true });
    await backend.install(page);
    backend.queue(
      '/api/users',
      { status: 503, message: 'Profile temporarily unavailable' },
      { data: { id: 1, email: 'admin@e2e.test', name: 'Admin E2E', role: 'ADMIN' } },
    );
    await page.goto('/admin/dashboard');
    await expect(page.getByRole('heading', { name: 'Không thể khôi phục phiên' })).toBeVisible();
    await page.getByRole('button', { name: 'Thử lại' }).click();
    await expect(page.getByRole('heading', { name: 'Quản trị hệ thống' })).toBeVisible();
    expect(backend.requestsFor('/api/users')).toHaveLength(2);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CROSS-003 [P1] AUTH-02 rejects malformed profile envelope without identity', async ({ page }) => {
    const backend = new MockGateway({ role: 'ADMIN', strict: true });
    await backend.install(page);
    backend.malformedNext('/api/users', { invalid: true });
    await page.goto('/admin/dashboard');
    await expect(page.getByRole('heading', { name: 'Không thể khôi phục phiên' })).toBeVisible();
    await expect(page.getByText('Admin E2E')).toHaveCount(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-AUTH-006 [P0] AUTH-02 clears session when refresh is rejected', async ({ page }) => {
    const backend = new MockGateway({ role: 'ADMIN', strict: true });
    await backend.install(page);
    backend.failNext('/api/users', { status: 401, message: 'Access expired' });
    backend.failNext('/api/auth/refresh-token', { status: 401, message: 'Refresh expired' });
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/login$/);
    expect(backend.requestsFor('/api/auth/refresh-token')).toHaveLength(1);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-AUTH-007 [P0] AUTH-02 refreshes once and restores the original page', async ({ page }) => {
    const backend = new MockGateway({ role: 'ADMIN', strict: true });
    await backend.install(page);
    backend.queue(
      '/api/users',
      { status: 401, message: 'Access expired' },
      { data: { id: 1, email: 'admin@e2e.test', name: 'Admin E2E', role: 'ADMIN' } },
    );
    await page.goto('/admin/dashboard');
    await expect(page.getByRole('heading', { name: 'Quản trị hệ thống' })).toBeVisible();
    expect(backend.requestsFor('/api/auth/refresh-token')).toHaveLength(1);
    expect(backend.requestsFor('/api/users')).toHaveLength(2);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-AUTH-008 [P0] AUTH-03 sends owner to unauthorized admin route', async ({ page }) => {
    const backend = await gotoRole(page, 'SHOP_OWNER', '/admin/orders', { strict: true });
    await expect(page.getByRole('heading', { name: 'Không có quyền truy cập' })).toBeVisible();
    expect(backend.requestsFor('/api/orders/all')).toHaveLength(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-AUTH-009 [P0] AUTH-03 sends customer to unauthorized admin route', async ({ page }) => {
    const backend = await gotoRole(page, 'USER', '/admin/orders', { strict: true });
    await expect(page.getByRole('heading', { name: 'Không có quyền truy cập' })).toBeVisible();
    expect(backend.requestsFor('/api/orders/all')).toHaveLength(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-AUTH-010 [P1] AUTH-05 clears local session even when logout API fails', async ({ page }) => {
    const backend = await gotoRole(page, 'ADMIN', '/admin/dashboard', { strict: true });
    backend.failNext('/api/auth/logout', { status: 500, message: 'Logout unavailable' });
    await page.getByRole('button', { name: 'Đăng xuất' }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.getByRole('heading', { name: 'Đăng nhập quản trị' })).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });
});
