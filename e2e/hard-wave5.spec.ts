import { expect, test } from '@playwright/test';
import { gotoRole, MockGateway } from './fixtures';

const address = {
  id: 1001,
  userId: 501,
  label: 'Nhà',
  recipientName: 'Customer E2E',
  phoneNumber: '0900000002',
  addressLine: '2 Đường Khách',
  ward: 'Bến Nghé',
  district: 'Quận 1',
  city: 'TP.HCM',
  latitude: 10.78,
  longitude: 106.71,
  isDefault: true,
};

const secondAddress = { ...address, id: 1002, label: 'Văn phòng', isDefault: false };

const importSource = JSON.stringify({
  restaurants: [{
    restaurantKey: 'wave5-shop',
    name: 'Nhà hàng Wave 5',
    address: '5 Đường Test, TP.HCM',
    phone: '0900000055',
    addressLat: 10.78,
    addressLng: 106.71,
  }],
  menuItems: [{ restaurantKey: 'wave5-shop', name: 'Món Wave 5', price: 45_000 }],
});

const existingImportSource = JSON.stringify({
  restaurants: [{
    id: 201,
    restaurantKey: 'existing-shop',
    name: 'Bếp cập nhật',
    address: '1 Đường Test, TP.HCM',
    phone: '0900000001',
    addressLat: 10.78,
    addressLng: 106.71,
  }],
  menuItems: [{
    id: 301,
    restaurantKey: 'existing-shop',
    name: 'Cơm cập nhật',
    price: 55_000,
  }],
});

const coupon = {
  id: 910,
  code: 'DELETE-ME',
  name: 'Coupon để xóa',
  description: 'Wave 5 coupon',
  creatorType: 'PLATFORM',
  rewardType: 'FIXED',
  discountValue: 5_000,
  maxDiscountValue: null,
  totalQuantity: 10,
  usedQuantity: 0,
  startTime: '2026-08-23T08:00:00Z',
  endTime: '2026-08-30T08:00:00Z',
  minOrderValue: 0,
  scopeType: 'ALL',
  scopeRefId: null,
  active: true,
};

const campaign = {
  id: 1001,
  name: 'Wave 5 Flash Sale',
  isRecurring: false,
  startTime: '10:00:00',
  endTime: '12:00:00',
  status: 'UPCOMING',
};

const flashItem = {
  id: 6001,
  campaignId: 1001,
  restaurantId: 201,
  menuItemId: 301,
  originalPrice: 50_000,
  flashSalePrice: 40_000,
  stockQuantity: 10,
  soldQuantity: 0,
  status: 'PENDING',
};

test.describe('Wave 5 customer state and race boundaries', () => {
  test('CASE-CUSTOMER-045 [P1] valid JSON with an invalid cart schema is discarded before checkout', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    await page.addInitScript(() => {
      localStorage.setItem('delivery.customer-cart.v1', JSON.stringify({
        restaurantId: 201,
        restaurantName: 'Bếp E2E',
        items: [{ menuItemId: 301, restaurantId: 201, restaurantName: 'Bếp E2E', menuItemName: 'Cơm E2E', price: '50000', quantity: 1 }],
      }));
    });
    await page.goto('/customer/checkout');
    await expect(page.getByText('Giỏ hàng đang trống.')).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('delivery.customer-cart.v1'))).toBeNull();
    expect(backend.requestsFor('/api/orders/checkout-preview')).toHaveLength(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-046 [P1] address delete conflict keeps the address row and confirmation retryable', async ({ page }) => {
    const backend = await gotoRole(page, 'USER', '/customer/addresses', { strict: true });
    backend.failNext('/api/addresses/1001', { status: 409, message: 'Address changed by another session' });
    page.once('dialog', (dialog) => void dialog.accept());
    await page.getByRole('button', { name: 'Xóa', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText(/Address changed by another session/);
    await expect(page.getByText('Customer E2E')).toBeVisible();
    expect(backend.requestsFor('/api/addresses/1001').filter((request) => request.method === 'DELETE')).toHaveLength(1);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-047 [P1] default-address conflict preserves the current default and action', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    backend.queue('/api/addresses/users/501/addresses', { data: [address, secondAddress] });
    backend.failNext('/api/addresses/1002/default', { status: 409, message: 'Default address changed' });
    await backend.install(page);
    await page.goto('/customer/addresses');
    await expect(page.getByRole('button', { name: 'Đặt mặc định' })).toBeVisible();
    await page.getByRole('button', { name: 'Đặt mặc định' }).click();
    await expect(page.getByRole('alert')).toHaveText(/Default address changed/);
    await expect(page.getByText('Mặc định', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Đặt mặc định' })).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });
});

test.describe('Wave 5 owner import and duplicate-submit boundaries', () => {
  test('CASE-OWNER-028 [P1] catalog import reports partial failure without rolling back successful records', async ({ page }) => {
    const backend = new MockGateway({ role: 'SHOP_OWNER', strict: true });
    await backend.install(page);
    backend.failNext('/api/menu-items', { status: 503, message: 'Menu import unavailable' });
    await page.goto('/restaurant/catalog-import');
    await page.getByLabel('JSON catalog nhà hàng và món ăn').fill(importSource);
    await page.getByRole('button', { name: 'Kiểm tra dữ liệu' }).click();
    await expect(page.getByRole('status')).toContainText('1 nhà hàng · 1 món ăn');
    page.once('dialog', (dialog) => void dialog.accept());
    await page.getByRole('button', { name: 'Import dữ liệu vào backend' }).click();
    await expect(page.getByRole('alert')).toContainText('Có 1 lỗi; các request thành công không tự rollback');
    await expect(page.getByText('Nhà hàng Wave 5 (wave5-shop)', { exact: true })).toBeVisible();
    const restaurantPost = backend.requestsFor('/api/restaurants').find((request) => request.method === 'POST');
    const menuPost = backend.requestsFor('/api/menu-items').find((request) => request.method === 'POST');
    expect(restaurantPost).toBeTruthy();
    expect(menuPost?.body).toContain('"restaurantId":201');
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-OWNER-029 [P1] update-existing catalog mode uses PUT for IDs and never creates duplicates', async ({ page }) => {
    const backend = new MockGateway({ role: 'SHOP_OWNER', strict: true });
    await backend.install(page);
    await page.goto('/restaurant/catalog-import');
    await page.getByLabel('JSON catalog nhà hàng và món ăn').fill(existingImportSource);
    await page.getByRole('button', { name: 'Kiểm tra dữ liệu' }).click();
    await page.getByLabel('Cập nhật record có id').check();
    page.once('dialog', (dialog) => void dialog.accept());
    await page.getByRole('button', { name: 'Import dữ liệu vào backend' }).click();
    await expect(page.getByText('Import hoàn tất, không có lỗi.')).toBeVisible();
    expect(backend.requestsFor('/api/restaurants/201').filter((request) => request.method === 'PUT')).toHaveLength(1);
    expect(backend.requestsFor('/api/menu-items/301').filter((request) => request.method === 'PUT')).toHaveLength(1);
    expect(backend.requestsFor('/api/restaurants').filter((request) => request.method === 'POST')).toHaveLength(0);
    expect(backend.requestsFor('/api/menu-items').filter((request) => request.method === 'POST')).toHaveLength(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-OWNER-030 [P0] same-tick menu create clicks produce one POST', async ({ page }) => {
    const backend = await gotoRole(page, 'SHOP_OWNER', '/restaurant/menu', { strict: true });
    await page.getByRole('button', { name: 'Thêm món' }).click();
    await page.getByPlaceholder('VD: Phở Bò Tái').fill('Món chỉ tạo một lần');
    await page.getByPlaceholder('50000').fill('55000');
    backend.queue('/api/menu-items', { delayMs: 250, data: { id: 302, restaurantId: 201, name: 'Món chỉ tạo một lần', description: '', price: 55_000, image: '', status: 'AVAILABLE', createdAt: '2026-08-23T08:00:00Z', updatedAt: '2026-08-23T08:00:00Z' } });
    const submit = page.getByRole('button', { name: 'Tạo mới', exact: true });
    await submit.evaluate((element) => {
      (element as HTMLButtonElement).click();
      (element as HTMLButtonElement).click();
    });
    await expect.poll(() => backend.requestsFor('/api/menu-items').filter((request) => request.method === 'POST').length).toBe(1);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-OWNER-031 [P1] catalog import rejects an unresolved restaurant key before any API write', async ({ page }) => {
    const backend = await gotoRole(page, 'SHOP_OWNER', '/restaurant/catalog-import', { strict: true });
    const source = JSON.stringify({ menuItems: [{ restaurantKey: 'missing-shop', name: 'Món mồ côi', price: 25_000 }] });
    await page.getByLabel('JSON catalog nhà hàng và món ăn').fill(source);
    await page.getByRole('button', { name: 'Kiểm tra dữ liệu' }).click();
    await expect(page.getByRole('alert')).toHaveText(/restaurantKey không có trong file/);
    expect(backend.requestsFor('/api/restaurants').filter((request) => request.method === 'POST')).toHaveLength(0);
    expect(backend.requestsFor('/api/menu-items').filter((request) => request.method === 'POST')).toHaveLength(0);
    backend.assertNoUnexpectedRequests();
  });
});

test.describe('Wave 5 admin mutation and moderation boundaries', () => {
  test('CASE-ADMIN-028 [P1] coupon delete confirmation cancel is side-effect free', async ({ page }) => {
    const backend = new MockGateway({ role: 'ADMIN', strict: true });
    backend.queue('/api/promotions/admin', { data: [coupon] });
    backend.queue('/api/promotions/admin/pending-shop', { data: [] });
    await backend.install(page);
    await page.goto('/admin/coupons');
    await expect(page.getByText('DELETE-ME')).toBeVisible();
    page.once('dialog', (dialog) => void dialog.dismiss());
    await page.getByRole('button', { name: 'Xóa coupon DELETE-ME' }).click();
    expect(backend.requestsFor('/api/promotions/910').filter((request) => request.method === 'DELETE')).toHaveLength(0);
    await expect(page.getByText('DELETE-ME')).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ADMIN-029 [P1] pending shop rejection removes the row after the canonical mutation', async ({ page }) => {
    const backend = new MockGateway({ role: 'ADMIN', strict: true });
    backend.queue('/api/promotions/admin/pending-shop', { data: [{ ...coupon, id: 902, code: 'SHOPWAIT', name: 'Shop pending', creatorType: 'SHOP', scopeType: 'SHOP', scopeRefId: 201, active: false, approvalStatus: 'PENDING' }] }, { data: [] });
    await backend.install(page);
    await page.goto('/admin/coupons');
    await expect(page.getByText('SHOPWAIT')).toBeVisible();
    await page.getByRole('button', { name: 'Từ chối' }).click();
    await expect.poll(() => backend.requestsFor('/api/promotions/admin/902/reject').length).toBe(1);
    await expect(page.getByText('SHOPWAIT')).toHaveCount(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ADMIN-030 [P1] coupon SHOP scope without a restaurant ID never submits', async ({ page }) => {
    const backend = await gotoRole(page, 'ADMIN', '/admin/coupons', { strict: true });
    await page.getByRole('button', { name: /Tạo Coupon Mới/ }).click();
    await page.getByPlaceholder('E.g. HELLO2024').fill('SHOP-NO-ID');
    await page.getByPlaceholder('Giảm giá chào mừng').fill('Thiếu nhà hàng');
    await page.getByLabel('Phạm vi').selectOption('SHOP');
    await page.getByRole('button', { name: 'Tạo Coupon', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(backend.requestsFor('/api/promotions/platform').filter((request) => request.method === 'POST')).toHaveLength(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ADMIN-031 [P0] same-tick Flash Sale status clicks produce one PUT', async ({ page }) => {
    const backend = new MockGateway({ role: 'ADMIN', strict: true });
    backend.queue('/api/flashsales/admin/campaigns', { data: [campaign] }, { data: [{ ...campaign, status: 'ACTIVE' }] });
    await backend.install(page);
    await page.goto('/admin/flash-sales');
    await expect(page.getByText('Wave 5 Flash Sale')).toBeVisible();
    const activate = page.getByTitle('Kích hoạt');
    await activate.evaluate((element) => {
      (element as HTMLButtonElement).click();
      (element as HTMLButtonElement).click();
    });
    await expect.poll(() => backend.requestsFor('/api/flashsales/admin/campaigns/1001/status').filter((request) => request.method === 'PUT').length).toBe(1);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ADMIN-032 [P1] Flash Sale item approval conflict keeps the review row actionable', async ({ page }) => {
    const backend = new MockGateway({ role: 'ADMIN', strict: true });
    backend.queue('/api/flashsales/admin/campaigns', { data: [campaign] });
    backend.queue('/api/flashsales/admin/campaigns/1001/items', { data: [flashItem] });
    backend.failNext('/api/flashsales/admin/items/6001/approve', { status: 409, message: 'Item was already reviewed' });
    await backend.install(page);
    await page.goto('/admin/flash-sales');
    await page.getByTitle('Xem món ăn').click();
    await expect(page.getByText('Món #301')).toBeVisible();
    await page.getByRole('button', { name: 'Duyệt' }).click();
    await expect(page.getByText('Món #301')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Duyệt' })).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });
});
