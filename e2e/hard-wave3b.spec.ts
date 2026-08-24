import { expect, test } from '@playwright/test';
import { gotoRole, MockGateway } from './fixtures';

const cart = {
  userId: 501, restaurantId: 201, restaurantName: 'Bếp E2E',
  items: [{ menuItemId: 301, restaurantId: 201, restaurantName: 'Bếp E2E', menuItemName: 'Cơm E2E', price: 50_000, quantity: 1, notes: '' }],
};

const statuses = [
  { suffix: 'A', status: 400, label: 'Bad request' },
  { suffix: 'B', status: 403, label: 'Forbidden' },
  { suffix: 'C', status: 409, label: 'Conflict' },
  { suffix: 'D', status: 422, label: 'Validation failed' },
  { suffix: 'E', status: 503, label: 'Service unavailable' },
] as const;

const addressFields = async (page: import('@playwright/test').Page) => {
  await page.getByLabel('Tên người nhận').fill('Matrix customer');
  await page.getByLabel('Số điện thoại').fill('0900000002');
  await page.getByLabel('Số nhà, tên đường').fill('2 Đường Khách');
  await page.getByLabel('Phường/Xã').fill('Bến Nghé');
  await page.getByLabel('Quận/Huyện').fill('Quận 1');
  await page.getByLabel('Tỉnh/Thành phố').fill('TP.HCM');
  const coordinates = page.locator('input[type="number"]');
  await coordinates.nth(0).fill('10.78');
  await coordinates.nth(1).fill('106.71');
};

const installCart = async (page: import('@playwright/test').Page, backend: MockGateway) => {
  await backend.install(page);
  await page.addInitScript((value) => localStorage.setItem('delivery.customer-cart.v1', JSON.stringify(value)), cart);
  await page.goto('/customer/checkout');
};

test.describe('Wave 3B auth and catalog status permutations', () => {
  for (const scenario of statuses) {
    test(`CASE-AUTH-02${scenario.suffix} [P1] admin login preserves form on ${scenario.status}`, async ({ page }) => {
      const backend = new MockGateway({ role: 'ADMIN', strict: true });
      await backend.install(page);
      backend.failNext('/api/auth/login', { status: scenario.status, message: `Auth ${scenario.label}` });
      await page.goto('/admin/login');
      await page.getByLabel('Email').fill('admin@e2e.test');
      await page.locator('input[type="password"]').fill('Password123!');
      await page.getByRole('button', { name: 'Đăng nhập admin' }).click();
      await expect(page.getByText(`Auth ${scenario.label}`)).toBeVisible();
      await expect(page).toHaveURL(/\/admin\/login$/);
      backend.assertNoUnexpectedRequests();
    });
  }

  for (const scenario of statuses) {
    test(`CASE-CROSS-01${scenario.suffix} [P1] catalog preserves retry on ${scenario.status}`, async ({ page }) => {
      const backend = new MockGateway({ role: 'USER', strict: true });
      await backend.install(page);
      backend.failNext('/api/restaurants', { status: scenario.status, message: `Catalog ${scenario.label}` });
      await page.goto('/');
      await expect(page.getByText(`Catalog ${scenario.label}`)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Thử lại' })).toBeVisible();
      await expect(page.getByText('Bếp E2E')).toHaveCount(0);
      backend.assertNoUnexpectedRequests();
    });
  }

  test('CASE-CROSS-020 [P1] mobile admin dashboard keeps primary heading visible', async ({ page }) => {
    const backend = await gotoRole(page, 'ADMIN', '/admin/dashboard', { strict: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('heading', { name: 'Quản trị hệ thống' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mở menu' })).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });
});

test.describe('Wave 3B address, quote and create status permutations', () => {
  for (const scenario of statuses) {
    test(`CASE-CUSTOMER-04${scenario.suffix} [P1] address create keeps form on ${scenario.status}`, async ({ page }) => {
      const backend = await gotoRole(page, 'USER', '/customer/addresses', { strict: true });
      await expect.poll(() => backend.requestsFor('/api/addresses/users/501/addresses').length).toBe(1);
      backend.failNext('/api/addresses/users/501/addresses', { status: scenario.status, message: `Address ${scenario.label}` });
      await addressFields(page);
      await page.getByRole('button', { name: 'Lưu địa chỉ' }).click();
      await expect(page.getByRole('alert')).toHaveText(new RegExp(`Address ${scenario.label}`));
      await expect(page.getByLabel('Tên người nhận')).toHaveValue('Matrix customer');
      backend.assertNoUnexpectedRequests();
    });
  }

  for (const scenario of statuses) {
    test(`CASE-CUSTOMER-05${scenario.suffix} [P0] preview blocks create on ${scenario.status}`, async ({ page }) => {
      const backend = new MockGateway({ role: 'USER', strict: true });
      backend.failNext('/api/orders/checkout-preview', { status: scenario.status, message: `Quote ${scenario.label}` });
      await installCart(page, backend);
      await expect(page.getByRole('alert')).toHaveText(new RegExp(`Quote ${scenario.label}`));
      await expect(page.getByRole('button', { name: 'Đặt đơn COD' })).toBeDisabled();
      expect(backend.requestsFor('/api/orders').filter((request) => request.method === 'POST')).toHaveLength(0);
      backend.assertNoUnexpectedRequests();
    });
  }

  for (const scenario of statuses) {
    test(`CASE-CUSTOMER-06${scenario.suffix} [P1] order create keeps retry on ${scenario.status}`, async ({ page }) => {
      const backend = new MockGateway({ role: 'USER', strict: true });
      await installCart(page, backend);
      await expect(page.getByRole('button', { name: 'Đặt đơn COD' })).toBeEnabled();
      backend.failNext('/api/orders', { status: scenario.status, message: `Order ${scenario.label}` });
      await page.getByRole('button', { name: 'Đặt đơn COD' }).click();
      await expect(page.getByRole('alert')).toHaveText(new RegExp(`Order ${scenario.label}`));
      await expect(page.getByRole('button', { name: 'Đặt đơn COD' })).toBeEnabled();
      expect(backend.lastRequest('/api/orders')?.headers['idempotency-key']).toBeTruthy();
      backend.assertNoUnexpectedRequests();
    });
  }
});

test.describe('Wave 3B order, owner and admin status permutations', () => {
  for (const scenario of statuses) {
    test(`CASE-ORDER-01${scenario.suffix} [P1] history keeps error state on ${scenario.status}`, async ({ page }) => {
      const backend = new MockGateway({ role: 'USER', strict: true });
      await backend.install(page);
      backend.failNext('/api/orders/my-orders', { status: scenario.status, message: `History ${scenario.label}` });
      await page.goto('/customer/orders');
      await expect(page.getByRole('alert')).toHaveText(new RegExp(`History ${scenario.label}`));
      await expect(page.getByText('Đơn #401')).toHaveCount(0);
      backend.assertNoUnexpectedRequests();
    });
  }

  for (const scenario of statuses) {
    test(`CASE-OWNER-02${scenario.suffix} [P1] menu create keeps modal on ${scenario.status}`, async ({ page }) => {
      const backend = await gotoRole(page, 'SHOP_OWNER', '/restaurant/menu', { strict: true });
      await page.getByRole('button', { name: 'Thêm món' }).click();
      await page.getByPlaceholder('VD: Phở Bò Tái').fill('Matrix menu');
      await page.getByPlaceholder('50000').fill('55000');
      backend.failNext('/api/menu-items', { status: scenario.status, message: `Menu ${scenario.label}` });
      await page.getByRole('button', { name: 'Tạo mới', exact: true }).click();
      await expect(page.getByRole('alert')).toHaveText(new RegExp(`Menu ${scenario.label}`));
      await expect(page.getByRole('dialog', { name: 'Thêm món ăn mới' })).toBeVisible();
      backend.assertNoUnexpectedRequests();
    });
  }

  for (const scenario of statuses) {
    test(`CASE-ADMIN-02${scenario.suffix} [P1] shipper list preserves error on ${scenario.status}`, async ({ page }) => {
      const backend = new MockGateway({ role: 'ADMIN', strict: true });
      await backend.install(page);
      backend.failNext('/api/shippers', { status: scenario.status, message: `Shippers ${scenario.label}` });
      await page.goto('/admin/shippers');
      await expect(page.getByRole('alert')).toHaveText(/Không thể tải danh sách shipper/);
      await expect(page.getByText('Shipper E2E')).toHaveCount(0);
      backend.assertNoUnexpectedRequests();
    });
  }

  test('CASE-ORDER-020 [P1] detail 403 keeps customer on error surface', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    backend.failNext('/api/orders/401', { status: 403, message: 'Order access denied' });
    await page.goto('/customer/orders/401');
    await expect(page.getByRole('alert')).toHaveText(/Order access denied/);
    await expect(page.getByText('Cơm E2E')).toHaveCount(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-OWNER-025 [P1] profile malformed list keeps stale profile guarded', async ({ page }) => {
    const backend = new MockGateway({ role: 'SHOP_OWNER', strict: true });
    await backend.install(page);
    backend.queue('/api/restaurants/my-restaurants', {
      data: [{ id: 201, name: 'Bếp E2E', address: '1 Đường Test, TP.HCM', phone: '0900000001', openingHour: '08:00:00', closingHour: '22:00:00', image: '', latitude: 10.7769, longitude: 106.7009, description: 'Restaurant fixture', open: true, rating: 4.5, ratingCount: 10 }],
    }, { raw: { status: 1, message: null, data: {} } });
    await page.goto('/restaurant/profile');
    await expect(page.getByText(/Lấy danh sách nhà hàng thất bại|Backend response/)).toBeVisible();
    await expect(page.getByLabel('Tên nhà hàng')).toHaveValue('Bếp E2E');
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ADMIN-025 [P1] flash list 429 keeps retry and no campaigns', async ({ page }) => {
    const backend = new MockGateway({ role: 'ADMIN', strict: true });
    await backend.install(page);
    backend.failNext('/api/flashsales/admin/campaigns', { status: 429, message: 'Flash list rate limited' });
    await page.goto('/admin/flash-sales');
    await expect(page.getByRole('alert')).toHaveText(/Không thể tải danh sách Flash Sale/);
    await expect(page.getByText('Chưa có chiến dịch Flash Sale nào')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Thử lại' })).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });
});
