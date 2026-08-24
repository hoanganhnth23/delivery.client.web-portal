import { expect, test } from '@playwright/test';
import { gotoRole, MockGateway } from './fixtures';

const fillAddress = async (page: import('@playwright/test').Page, latitude: string, longitude: string) => {
  await page.getByLabel('Nhãn').fill('Biên giới');
  await page.getByLabel('Tên người nhận').fill('Boundary Customer');
  await page.getByLabel('Số điện thoại').fill('0900000002');
  await page.getByLabel('Số nhà, tên đường').fill('2 Đường Biên');
  await page.getByLabel('Phường/Xã').fill('Bến Nghé');
  await page.getByLabel('Quận/Huyện').fill('Quận 1');
  await page.getByLabel('Tỉnh/Thành phố').fill('TP.HCM');
  const coordinates = page.locator('input[type="number"]');
  await coordinates.nth(0).fill(latitude);
  await coordinates.nth(1).fill(longitude);
};

test.describe('Wave 4 state and local-boundary cases', () => {
  test('CASE-CUSTOMER-042 [P1] corrupt cart storage fails closed without checkout reads', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    await page.addInitScript(() => {
      localStorage.setItem('delivery.customer-cart.v1', '{"items":[{"quantity":0}]}');
    });
    await page.goto('/customer/checkout');
    await expect(page.getByText('Giỏ hàng đang trống.')).toBeVisible();
    expect(backend.requestsFor('/api/orders/checkout-preview')).toHaveLength(0);
    expect(await page.evaluate(() => localStorage.getItem('delivery.customer-cart.v1'))).toBeNull();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-043 [P1] empty restaurant search renders an explicit no-results state', async ({ page }) => {
    const backend = await gotoRole(page, 'USER', '/', { strict: true });
    backend.queue('/api/restaurants/search', { data: [] });
    await expect(page.getByText('Bếp E2E')).toBeVisible();
    const search = page.getByLabel('Tìm nhà hàng');
    await search.fill('Không tồn tại');
    await search.press('Enter');
    await expect.poll(() => backend.requestsFor('/api/restaurants/search').length).toBe(1);
    await expect(page.getByText('Không tìm thấy nhà hàng phù hợp.')).toBeVisible();
    await expect(page.getByText('Bếp E2E')).toHaveCount(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-044 [P1] coordinate lower boundary is accepted and submitted', async ({ page }) => {
    const backend = await gotoRole(page, 'USER', '/customer/addresses', { strict: true });
    await fillAddress(page, '8', '102');
    await page.getByRole('button', { name: 'Lưu địa chỉ' }).click();
    await expect(page.getByRole('status')).toHaveText('Đã lưu địa chỉ');
    const createRequest = backend.requestsFor('/api/addresses/users/501/addresses')
      .find((request) => request.method === 'POST');
    expect(createRequest?.body).toContain('"latitude":8');
    expect(createRequest?.body).toContain('"longitude":102');
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-OWNER-026 [P1] menu edit conflict keeps the edited modal state', async ({ page }) => {
    const backend = await gotoRole(page, 'SHOP_OWNER', '/restaurant/menu', { strict: true });
    await page.getByRole('button', { name: 'Sửa Cơm E2E' }).click();
    await page.getByLabel('Tên món ăn').fill('Cơm sửa đồng thời');
    await page.getByLabel('Giá (VNĐ)').fill('55000');
    backend.failNext('/api/menu-items/301', { status: 409, message: 'Menu edit conflict' });
    await page.getByRole('button', { name: 'Cập nhật' }).click();
    await expect(page.getByRole('alert')).toHaveText(/Menu edit conflict/);
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel('Tên món ăn')).toHaveValue('Cơm sửa đồng thời');
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-OWNER-027 [P1] menu local search exposes a filtered-empty state', async ({ page }) => {
    const backend = await gotoRole(page, 'SHOP_OWNER', '/restaurant/menu', { strict: true });
    const search = page.getByPlaceholder('Tìm kiếm món ăn...');
    await search.fill('Món không tồn tại');
    await search.press('Enter');
    await expect(page.getByText('Không có món ăn khớp từ khóa.')).toBeVisible();
    await expect(page.getByText('Cơm E2E')).toHaveCount(0);
    expect(backend.requestsFor('/api/menu-items/my-menu-items')).toHaveLength(1);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ADMIN-026 [P1] rating rejection updates the visible moderation state', async ({ page }) => {
    const backend = await gotoRole(page, 'ADMIN', '/admin/ratings', { strict: true });
    const response = page.waitForResponse((item) => item.url().includes('/api/restaurants/admin/ratings/801/status?status=REJECTED'));
    await page.getByTitle('Từ chối').click();
    expect((await response).status()).toBe(200);
    await expect(page.getByRole('table').getByText('REJECTED', { exact: true })).toBeVisible();
    expect(backend.requestsFor('/api/restaurants/admin/ratings/801/status')).toHaveLength(1);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ADMIN-027 [P1] rating status filter exposes an explicit filtered-empty state', async ({ page }) => {
    const backend = await gotoRole(page, 'ADMIN', '/admin/ratings', { strict: true });
    await page.getByRole('button', { name: 'REJECTED', exact: true }).click();
    await expect(page.getByText('Không tìm thấy đánh giá nào.')).toBeVisible();
    await expect(page.getByText('Rất ngon')).toHaveCount(0);
    backend.assertNoUnexpectedRequests();
  });
});
