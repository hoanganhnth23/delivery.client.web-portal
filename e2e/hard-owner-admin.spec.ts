import { expect, test } from '@playwright/test';
import { gotoRole, MockGateway } from './fixtures';

test.describe('hard restaurant-owner cases', () => {
  test('CASE-OWNER-001 [P1] OWNER-04 menu read recovers after 503', async ({ page }) => {
    const backend = new MockGateway({ role: 'SHOP_OWNER', strict: true });
    await backend.install(page);
    backend.failNext('/api/menu-items/my-menu-items', { status: 503, message: 'Menu service unavailable' });
    await page.goto('/restaurant/menu');
    await expect(page.getByRole('alert')).toHaveText(/Menu service unavailable/);
    await page.getByRole('button', { name: 'Thử lại' }).click();
    await expect(page.getByText('Cơm E2E')).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-OWNER-002 [P1] OWNER-04 renders empty menu', async ({ page }) => {
    const backend = new MockGateway({ role: 'SHOP_OWNER', strict: true });
    await backend.install(page);
    backend.queue('/api/menu-items/my-menu-items', { data: [] });
    await page.goto('/restaurant/menu');
    await expect(page.getByText('Chưa có món ăn nào')).toBeVisible();
    await expect(page.getByText('Cơm E2E')).toHaveCount(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-OWNER-003 [P1] OWNER-05 blocks an empty menu form', async ({ page }) => {
    const backend = await gotoRole(page, 'SHOP_OWNER', '/restaurant/menu', { strict: true });
    await page.getByRole('button', { name: 'Thêm món' }).click();
    await page.getByRole('button', { name: 'Tạo mới', exact: true }).click();
    await expect(page.getByText('Tên món ăn không được để trống')).toBeVisible();
    await expect(page.getByText('Giá không được để trống')).toBeVisible();
    expect(backend.requestsFor('/api/menu-items').filter((request) => request.method === 'POST')).toHaveLength(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-OWNER-004 [P1] OWNER-05 keeps menu modal after POST 500', async ({ page }) => {
    const backend = await gotoRole(page, 'SHOP_OWNER', '/restaurant/menu', { strict: true });
    await page.getByRole('button', { name: 'Thêm món' }).click();
    await page.getByPlaceholder('VD: Phở Bò Tái').fill('Món lỗi E2E');
    await page.getByPlaceholder('50000').fill('55000');
    backend.failNext('/api/menu-items', { status: 500, message: 'Cannot create menu item' });
    await page.getByRole('button', { name: 'Tạo mới', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText(/Cannot create menu item/);
    await expect(page.getByRole('dialog', { name: 'Thêm món ăn mới' })).toBeVisible();
    await expect(page.getByPlaceholder('VD: Phở Bò Tái')).toHaveValue('Món lỗi E2E');
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-OWNER-005 [P1] OWNER-07 does not delete after confirmation cancel', async ({ page }) => {
    const backend = await gotoRole(page, 'SHOP_OWNER', '/restaurant/menu', { strict: true });
    page.on('dialog', (dialog) => void dialog.dismiss());
    await page.getByRole('button', { name: 'Xóa Cơm E2E' }).click();
    expect(backend.requestsFor('/api/menu-items/301').filter((request) => request.method === 'DELETE')).toHaveLength(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-OWNER-006 [P1] OWNER-02 blocks invalid restaurant update', async ({ page }) => {
    const backend = await gotoRole(page, 'SHOP_OWNER', '/restaurant/profile', { strict: true });
    await page.getByLabel('Số điện thoại').fill('123');
    await page.getByRole('button', { name: 'Cập nhật' }).click();
    await expect(page.getByText(/Số điện thoại không hợp lệ/)).toBeVisible();
    expect(backend.requestsFor('/api/restaurants/201').filter((request) => request.method === 'PUT')).toHaveLength(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-OWNER-007 [P0] OWNER-10 does not reject after prompt cancellation', async ({ page }) => {
    const backend = await gotoRole(page, 'SHOP_OWNER', '/restaurant/orders', { strict: true });
    page.on('dialog', (dialog) => void dialog.dismiss());
    await page.getByRole('button', { name: 'Từ chối đơn #401' }).click();
    expect(backend.requestsFor('/api/restaurants/orders/401/reject')).toHaveLength(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-OWNER-008 [P0] OWNER-09 keeps pending order after confirm 409', async ({ page }) => {
    const backend = await gotoRole(page, 'SHOP_OWNER', '/restaurant/orders', { strict: true });
    backend.failNext('/api/restaurants/orders/401/confirm', { status: 409, message: 'Order already decided' });
    await page.getByRole('button', { name: 'Xác nhận đơn #401' }).click();
    await expect(page.getByRole('alert')).toHaveText(/Order already decided/);
    await expect(page.getByText('Đơn hàng #401')).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });
});

test.describe('hard admin cases', () => {
  test('CASE-ADMIN-001 [P1] ADMIN-01 orders table recovers after 503', async ({ page }) => {
    const backend = new MockGateway({ role: 'ADMIN', strict: true });
    await backend.install(page);
    backend.failNext('/api/orders/all', { status: 503, message: 'Admin order service unavailable' });
    await page.goto('/admin/orders');
    await expect(page.getByRole('alert')).toHaveText(/Không thể tải danh sách đơn hàng/);
    await page.getByRole('button', { name: 'Thử lại' }).click();
    await expect(page.getByText('#401')).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ADMIN-002 [P1] ADMIN-05 ratings failure does not fabricate rows', async ({ page }) => {
    const backend = new MockGateway({ role: 'ADMIN', strict: true });
    await backend.install(page);
    backend.failNext('/api/restaurants/admin/ratings', { status: 500, message: 'Ratings unavailable' });
    await page.goto('/admin/ratings');
    await expect(page.getByRole('alert')).toHaveText(/Không thể tải danh sách đánh giá/);
    await expect(page.getByText('Rất ngon')).toHaveCount(0);
    await page.getByRole('button', { name: 'Thử lại' }).click();
    await expect(page.getByText('Rất ngon')).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ADMIN-003 [P1] ADMIN-09 keeps coupon modal on invalid submit', async ({ page }) => {
    const backend = await gotoRole(page, 'ADMIN', '/admin/coupons', { strict: true });
    await page.getByRole('button', { name: /Tạo Coupon Mới/ }).click();
    await page.getByRole('button', { name: 'Tạo Coupon', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(backend.requestsFor('/api/promotions/platform')).toHaveLength(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ADMIN-004 [P1] ADMIN-09 keeps coupon modal after 409', async ({ page }) => {
    const backend = await gotoRole(page, 'ADMIN', '/admin/coupons', { strict: true });
    await page.getByRole('button', { name: /Tạo Coupon Mới/ }).click();
    await page.getByPlaceholder('E.g. HELLO2024').fill('DUPLICATE');
    await page.getByPlaceholder('Giảm giá chào mừng').fill('Duplicate coupon');
    backend.failNext('/api/promotions/platform', { status: 409, message: 'Coupon code already exists' });
    await page.getByRole('button', { name: 'Tạo Coupon', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ADMIN-005 [P1] ADMIN-19 keeps pending voucher after approval 500', async ({ page }) => {
    const backend = await gotoRole(page, 'ADMIN', '/admin/coupons', { strict: true });
    backend.failNext('/api/promotions/admin/902/approve', { status: 500, message: 'Approval unavailable' });
    await page.getByRole('button', { name: 'Duyệt' }).click();
    await expect(page.getByText('SHOPWAIT')).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ADMIN-006 [P1] ADMIN-12 keeps flash-sale modal after 500', async ({ page }) => {
    const backend = await gotoRole(page, 'ADMIN', '/admin/flash-sales', { strict: true });
    await page.getByRole('button', { name: 'Tạo Chiến dịch' }).click();
    await page.getByPlaceholder('Flash Sale Khung Giờ Vàng').fill('Broken campaign');
    backend.failNext('/api/flashsales/admin/campaigns', { status: 500, message: 'Campaign unavailable' });
    await page.getByRole('button', { name: 'Tạo', exact: true }).click();
    await expect(page.getByText('Tạo Flash Sale')).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ADMIN-007 [P1] ADMIN-17 analytics recovers after 503', async ({ page }) => {
    const backend = new MockGateway({ role: 'ADMIN', strict: true });
    await backend.install(page);
    backend.failNext('/api/analytics/dashboard/admin', { status: 503, message: 'Analytics unavailable' });
    await page.goto('/admin/dashboard');
    await expect(page.getByRole('alert')).toHaveText(/Không thể tải số liệu dashboard/);
    await page.getByRole('button', { name: 'Thử lại' }).click();
    await expect(page.getByRole('heading', { name: 'Quản trị hệ thống' })).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ADMIN-008 [P0] AUTH-03 owner cannot enter admin portal', async ({ page }) => {
    const backend = await gotoRole(page, 'SHOP_OWNER', '/admin/dashboard', { strict: true });
    await expect(page.getByRole('heading', { name: 'Không có quyền truy cập' })).toBeVisible();
    expect(backend.requests.some((request) => request.path.startsWith('/api/orders') || request.path.startsWith('/api/analytics'))).toBeFalsy();
    backend.assertNoUnexpectedRequests();
  });
});
