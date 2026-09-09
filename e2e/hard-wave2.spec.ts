import { expect, test } from '@playwright/test';
import { gotoRole, MockGateway } from './fixtures';

const cartFixture = {
  userId: 501,
  restaurantId: 201,
  restaurantName: 'Bếp E2E',
  items: [{ menuItemId: 301, restaurantId: 201, restaurantName: 'Bếp E2E', menuItemName: 'Cơm E2E', price: 50_000, quantity: 1, notes: '' }],
};

const addressFixture = {
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

const orderFixture = {
  id: 401,
  userId: 501,
  restaurantId: 201,
  restaurantName: 'Bếp E2E',
  restaurantAddress: '1 Đường Test, TP.HCM',
  restaurantPhone: '0900000001',
  restaurantLat: 10.7769,
  restaurantLng: 106.7009,
  subtotalPrice: 50_000,
  discountAmount: 0,
  shippingFee: 15_000,
  totalPrice: 65_000,
  status: 'PENDING',
  paymentMethod: 'COD',
  deliveryAddress: '2 Đường Khách, TP.HCM',
  deliveryLat: 10.78,
  deliveryLng: 106.71,
  pickupLat: 10.7769,
  pickupLng: 106.7009,
  customerName: 'Customer E2E',
  customerPhone: '0900000002',
  createdAt: '2026-08-23T08:00:00Z',
  updatedAt: '2026-08-23T08:00:00Z',
  items: [{ id: 601, menuItemId: 301, menuItemName: 'Cơm E2E', quantity: 1, price: 50_000 }],
};

const restaurantFixture = {
  id: 201,
  name: 'Bếp E2E',
  address: '1 Đường Test, TP.HCM',
  phone: '0900000001',
  openingHour: '08:00:00',
  closingHour: '22:00:00',
  image: '',
  latitude: 10.7769,
  longitude: 106.7009,
  description: 'Restaurant fixture',
  open: true,
  rating: 4.5,
  ratingCount: 10,
};

async function installCart(page: import('@playwright/test').Page, backend: MockGateway) {
  await backend.install(page);
  await page.addInitScript((cart) => {
    localStorage.setItem('delivery.customer-cart.v1', JSON.stringify(cart));
  }, cartFixture);
  await page.goto('/customer/checkout');
  return backend;
}

async function fillAddress(page: import('@playwright/test').Page) {
  await page.getByLabel('Nhãn').fill('Nhà mới');
  await page.getByLabel('Tên người nhận').fill('Customer E2E');
  await page.getByLabel('Số điện thoại').fill('0900000002');
  await page.getByLabel('Số nhà, tên đường').fill('2 Đường Khách');
  await page.getByLabel('Phường/Xã').fill('Bến Nghé');
  await page.getByLabel('Quận/Huyện').fill('Quận 1');
  await page.getByLabel('Tỉnh/Thành phố').fill('TP.HCM');
  const coordinates = page.locator('input[type="number"]');
  await coordinates.nth(0).fill('10.78');
  await coordinates.nth(1).fill('106.71');
}

const malformedEnvelope = (data: unknown = {}) => ({
  status: 200,
  raw: { status: 1, message: null, data },
});

test.describe('Wave 2 auth and cross-portal contract cases', () => {
  test('CASE-AUTH-011 [P0] admin empty credentials never call login', async ({ page }) => {
    const backend = await gotoRole(page, 'ADMIN', '/admin/login', { strict: true });
    await page.getByRole('button', { name: 'Đăng nhập admin' }).click();
    await expect(page.getByText('Email admin là bắt buộc')).toBeVisible();
    await expect(page.getByText('Mật khẩu là bắt buộc')).toBeVisible();
    expect(backend.requestsFor('/api/auth/login')).toHaveLength(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-AUTH-012 [P0] admin login 401 keeps credentials page', async ({ page }) => {
    const backend = new MockGateway({ role: 'ADMIN', strict: true });
    await backend.install(page);
    backend.failNext('/api/auth/login', { status: 401, message: 'Admin credentials rejected' });
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill('admin@e2e.test');
    await page.locator('input[type="password"]').fill('wrong');
    await page.getByRole('button', { name: 'Đăng nhập admin' }).click();
    await expect(page.getByText('Admin credentials rejected')).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login$/);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-AUTH-013 [P1] owner password visibility toggle is reversible', async ({ page }) => {
    const backend = await gotoRole(page, 'SHOP_OWNER', '/login', { strict: true });
    const password = page.locator('input[type="password"]');
    await expect(password).toBeVisible();
    await page.getByRole('button', { name: 'Hiện mật khẩu' }).click();
    await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Ẩn mật khẩu' }).click();
    await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'password');
    expect(backend.requestsFor('/api/auth/login')).toHaveLength(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-AUTH-014 [P0] malformed bootstrap profile exposes recovery retry', async ({ page }) => {
    const backend = new MockGateway({ role: 'ADMIN', strict: true });
    await backend.install(page);
    backend.malformedNext('/api/users');
    await page.goto('/admin/dashboard');
    await expect(page.getByRole('heading', { name: 'Không thể khôi phục phiên' })).toBeVisible();
    await expect(page.getByText('Admin E2E')).toHaveCount(0);
    await page.getByRole('button', { name: 'Thử lại' }).click();
    await expect(page.getByRole('heading', { name: 'Quản trị hệ thống' })).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-AUTH-015 [P0] malformed owner restaurant list keeps retry after login', async ({ page }) => {
    const backend = new MockGateway({ role: 'SHOP_OWNER', strict: true });
    await backend.install(page);
    await page.addInitScript(() => localStorage.removeItem('currentRestaurantId'));
    backend.malformedNext('/api/restaurants/my-restaurants');
    await page.goto('/login');
    await page.getByLabel('Email').fill('owner@e2e.test');
    await page.locator('input[type="password"]').fill('Password123!');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page.getByText(/Lấy danh sách nhà hàng thất bại|Backend response/)).toBeVisible();
    await page.getByRole('button', { name: 'Thử tải lại nhà hàng' }).click();
    await expect(page).toHaveURL(/\/restaurant\/dashboard$/);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-AUTH-016 [P1] admin logout navigates even when transport aborts', async ({ page }) => {
    const backend = await gotoRole(page, 'ADMIN', '/admin/dashboard', { strict: true });
    backend.abortNext('/api/auth/logout');
    await page.getByRole('button', { name: 'Đăng xuất' }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CROSS-004 [P1] malformed catalog never fabricates restaurants', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    backend.malformedNext('/api/restaurants', malformedEnvelope({ invalid: true }));
    await page.goto('/');
    await expect(page.getByText(/Backend response does not match the canonical BaseResponse contract|Không thể tải danh sách nhà hàng/)).toBeVisible();
    await expect(page.getByText('Bếp E2E')).toHaveCount(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CROSS-005 [P1] invalid restaurant route blocks all catalog reads', async ({ page }) => {
    const backend = await gotoRole(page, 'USER', '/restaurants/not-a-number', { strict: true });
    await expect(page.getByText('Nhà hàng không hợp lệ')).toBeVisible();
    expect(backend.requestsFor('/api/restaurants/201')).toHaveLength(0);
    expect(backend.requestsFor('/api/menu-items/restaurant/201/available')).toHaveLength(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CROSS-006 [P1] restaurant detail 503 keeps catalog error visible', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    backend.failNext('/api/restaurants/201', { status: 503, message: 'Restaurant unavailable' });
    await page.goto('/restaurants/201');
    await expect(page.getByText('Restaurant unavailable')).toBeVisible();
    await expect(page.getByText('Cơm E2E')).toHaveCount(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CROSS-007 [P1] malformed public menu response has no fake menu item', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    backend.malformedNext('/api/menu-items/restaurant/201/available', malformedEnvelope({ invalid: true }));
    await page.goto('/restaurants/201');
    await expect(page.getByText(/Backend response does not match the canonical BaseResponse contract|Không thể tải thông tin nhà hàng/)).toBeVisible();
    await expect(page.getByText('Cơm E2E')).toHaveCount(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CROSS-008 [P1] search transport abort exposes retry state', async ({ page }) => {
    const backend = await gotoRole(page, 'USER', '/', { strict: true });
    backend.abortNext('/api/restaurants/search');
    await page.getByLabel('Tìm nhà hàng').fill('Bếp');
    await page.getByRole('button', { name: 'Tìm', exact: true }).click();
    await expect(page.getByText(/Không thể kết nối đến server|Network Error|Failed to fetch/)).toBeVisible();
    await page.getByRole('button', { name: 'Thử lại' }).click();
    await expect(page.getByText('Bếp E2E')).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CROSS-009 [P1] order history abort does not fabricate an empty success', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    backend.abortNext('/api/orders/my-orders');
    await page.goto('/customer/orders');
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText('Đơn #401')).toHaveCount(0);
    backend.assertNoUnexpectedRequests();
  });
});

test.describe('Wave 2 customer and order cases', () => {
  test('CASE-CUSTOMER-019 [P1] malformed address POST keeps entered form', async ({ page }) => {
    const backend = await gotoRole(page, 'USER', '/customer/addresses', { strict: true });
    await expect.poll(() => backend.requestsFor('/api/addresses/users/501/addresses').length).toBe(1);
    backend.malformedNext('/api/addresses/users/501/addresses', malformedEnvelope({ invalid: true }));
    await fillAddress(page);
    await page.getByRole('button', { name: 'Lưu địa chỉ' }).click();
    await expect(page.getByRole('alert')).toHaveText(/address\.id|Backend response/);
    await expect(page.getByLabel('Tên người nhận')).toHaveValue('Customer E2E');
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-020 [P1] address PUT 500 preserves edit mode', async ({ page }) => {
    const backend = await gotoRole(page, 'USER', '/customer/addresses', { strict: true });
    await page.getByRole('button', { name: 'Sửa' }).click();
    await page.getByLabel('Tên người nhận').fill('Updated after failure');
    backend.failNext('/api/addresses/1001', { status: 500, message: 'Address update unavailable' });
    await page.getByRole('button', { name: 'Lưu địa chỉ' }).click();
    await expect(page.getByRole('alert')).toHaveText(/Address update unavailable/);
    await expect(page.getByRole('heading', { name: 'Sửa địa chỉ' })).toBeVisible();
    await expect(page.getByLabel('Tên người nhận')).toHaveValue('Updated after failure');
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-021 [P1] unavailable geolocation offers manual fallback', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    await page.addInitScript(() => Object.defineProperty(navigator, 'geolocation', { configurable: true, value: undefined }));
    await page.goto('/customer/addresses');
    await page.getByRole('button', { name: 'Dùng vị trí hiện tại' }).click();
    await expect(page.getByRole('alert')).toHaveText(/Trình duyệt không hỗ trợ/);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-022 [P1] malformed restaurant detail response remains recoverable', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    backend.malformedNext('/api/restaurants/201', malformedEnvelope({ invalid: true }));
    await page.goto('/restaurants/201');
    await expect(page.getByText(/Backend response does not match the canonical BaseResponse contract|Không thể tải thông tin nhà hàng/)).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-023 [P1] malformed menu response keeps restaurant shell hidden', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    backend.malformedNext('/api/menu-items/restaurant/201/available', malformedEnvelope({ invalid: true }));
    await page.goto('/restaurants/201');
    await expect(page.getByText(/Backend response does not match the canonical BaseResponse contract|Không thể tải thông tin nhà hàng/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bếp E2E' })).toHaveCount(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-024 [P1] cross-restaurant cart replacement cancellation is side-effect free', async ({ page }) => {
    const backend = await gotoRole(page, 'USER', '/restaurants/201', { strict: true });
    await page.evaluate(() => localStorage.setItem('delivery.customer-cart.v1', JSON.stringify({ restaurantId: 999, restaurantName: 'Nhà cũ', items: [{ menuItemId: 999, restaurantId: 999, restaurantName: 'Nhà cũ', menuItemName: 'Món cũ', price: 10, quantity: 1, notes: '' }] })));
    await page.reload();
    page.on('dialog', (dialog) => void dialog.dismiss());
    await page.getByRole('button', { name: 'Thêm món' }).click();
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('delivery.customer-cart.v1') ?? '{}').restaurantId)).toBe(999);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-025 [P1] malformed checkout address response blocks quote', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    backend.malformedNext('/api/addresses/users/501/addresses', malformedEnvelope({ invalid: true }));
    await installCart(page, backend);
    await expect(page.getByRole('alert')).toHaveText(/addresses must be an array|Backend response/);
    expect(backend.requestsFor('/api/orders/checkout-preview')).toHaveLength(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-026 [P0] address without coordinates disables COD quote', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    backend.queue('/api/addresses/users/501/addresses', { data: [{ ...addressFixture, latitude: null, longitude: null }] });
    await installCart(page, backend);
    await expect(page.getByText('Thiếu tọa độ')).toBeVisible();
    expect(backend.requestsFor('/api/orders/checkout-preview')).toHaveLength(0);
    await expect(page.getByRole('button', { name: 'Đặt đơn COD' })).toBeDisabled();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-027 [P1] malformed voucher capability fails closed without breaking checkout', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    backend.malformedNext('/api/promotions/capability');
    await installCart(page, backend);
    await expect(page.getByRole('button', { name: 'Đặt đơn COD' })).toBeEnabled();
    await expect(page.getByRole('heading', { name: 'Voucher' })).toHaveCount(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-028 [P0] duplicate COD clicks produce one POST', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await installCart(page, backend);
    const button = page.getByRole('button', { name: 'Đặt đơn COD' });
    await expect(button).toBeEnabled();
    backend.queue('/api/orders', { delayMs: 300, data: orderFixture });
    await button.evaluate((element) => {
      (element as HTMLButtonElement).click();
      (element as HTMLButtonElement).click();
    });
    await expect.poll(() => backend.requestsFor('/api/orders').filter((request) => request.method === 'POST').length).toBe(1);
    expect(backend.requestsFor('/api/orders').filter((request) => request.method === 'POST')).toHaveLength(1);
    await expect(page).toHaveURL(/\/customer\/orders\/401$/);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-029 [P1] generic order 500 keeps safe retry surface', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await installCart(page, backend);
    await expect(page.getByRole('button', { name: 'Đặt đơn COD' })).toBeEnabled();
    backend.failNext('/api/orders', { status: 500, message: 'Order write unavailable' });
    await page.getByRole('button', { name: 'Đặt đơn COD' }).click();
    await expect(page.getByRole('alert')).toHaveText(/Order write unavailable/);
    await expect(page.getByRole('button', { name: 'Đặt đơn COD' })).toBeEnabled();
    expect(backend.lastRequest('/api/orders')?.headers['idempotency-key']).toBeTruthy();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-030 [P1] malformed order history has no fake rows', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    backend.malformedNext('/api/orders/my-orders', malformedEnvelope({ invalid: true }));
    await page.goto('/customer/orders');
    await expect(page.getByRole('alert')).toHaveText(/items must be an array|Backend response/);
    await expect(page.getByText('Đơn #401')).toHaveCount(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-031 [P1] invalid order id is rejected before API', async ({ page }) => {
    const backend = await gotoRole(page, 'USER', '/customer/orders/nope', { strict: true });
    await expect(page.getByRole('alert')).toHaveText(/Đơn hàng không hợp lệ/);
    expect(backend.requestsFor('/api/orders/nope')).toHaveLength(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-032 [P1] cancel transport abort keeps confirmation open', async ({ page }) => {
    const backend = await gotoRole(page, 'USER', '/customer/orders/401', { strict: true });
    await page.getByRole('button', { name: 'Hủy đơn hàng' }).click();
    backend.abortNext('/api/orders/401/cancel');
    await page.getByRole('button', { name: 'Xác nhận hủy' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Xác nhận hủy' })).toBeVisible();
    await expect(page.getByText('Bếp E2E')).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-033 [P1] order detail 404 retries into a valid detail', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    backend.queue('/api/orders/401', { status: 404, message: 'Order temporarily missing' }, { data: { id: 401, userId: 501, restaurantId: 201, restaurantName: 'Bếp E2E', restaurantAddress: '1 Đường Test, TP.HCM', restaurantPhone: '0900000001', restaurantLat: 10.7769, restaurantLng: 106.7009, subtotalPrice: 50_000, discountAmount: 0, shippingFee: 15_000, totalPrice: 65_000, status: 'PENDING', paymentMethod: 'COD', deliveryAddress: '2 Đường Khách, TP.HCM', deliveryLat: 10.78, deliveryLng: 106.71, pickupLat: 10.7769, pickupLng: 106.7009, customerName: 'Customer E2E', customerPhone: '0900000002', createdAt: '2026-08-23T08:00:00Z', updatedAt: '2026-08-23T08:00:00Z', items: [{ id: 601, menuItemId: 301, menuItemName: 'Cơm E2E', quantity: 1, price: 50_000 }] } });
    await page.goto('/customer/orders/401');
    await expect(page.getByRole('alert')).toHaveText(/Order temporarily missing/);
    await page.getByRole('button', { name: 'Thử lại' }).click();
    await expect(page.getByText('Cơm E2E')).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });
});

test.describe('Wave 2 owner and admin mutation cases', () => {
  test('CASE-ORDER-006 [P1] malformed order detail is rejected without shell', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    backend.malformedNext('/api/orders/401', malformedEnvelope({ invalid: true }));
    await page.goto('/customer/orders/401');
    await expect(page.getByRole('alert')).toHaveText(/order\.id|Backend response/);
    await expect(page.getByText('Cơm E2E')).toHaveCount(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ORDER-007 [P1] aborted order history remains retryable', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    backend.abortNext('/api/orders/my-orders');
    await page.goto('/customer/orders');
    await expect(page.getByRole('alert')).toBeVisible();
    await page.getByRole('button', { name: 'Thử lại' }).click();
    await expect(page.getByText('Đơn #401')).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ORDER-008 [P1] delayed detail keeps loading before valid response', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    backend.queue('/api/orders/401', { delayMs: 300, data: orderFixture });
    const startedAt = Date.now();
    await page.goto('/customer/orders/401');
    await expect(page.getByText('Cơm E2E')).toBeVisible();
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(250);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ORDER-009 [P1] history response with empty page shows explicit empty state', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    backend.queue('/api/orders/my-orders', { data: { items: [], page: 0, size: 10, totalItems: 0, totalPages: 0, hasNext: false } });
    await page.goto('/customer/orders');
    await expect(page.getByText('Bạn chưa có đơn hàng nào')).toBeVisible();
    await expect(page.getByText('Đơn #401')).toHaveCount(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ORDER-010 [P1] order detail 500 exposes retry without fabricated items', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    backend.queue('/api/orders/401', { status: 500, message: 'Order detail unavailable' }, { data: { id: 401, userId: 501, restaurantId: 201, restaurantName: 'Bếp E2E', restaurantAddress: '1 Đường Test, TP.HCM', restaurantPhone: '0900000001', restaurantLat: 10.7769, restaurantLng: 106.7009, subtotalPrice: 50_000, discountAmount: 0, shippingFee: 15_000, totalPrice: 65_000, status: 'PENDING', paymentMethod: 'COD', deliveryAddress: '2 Đường Khách, TP.HCM', deliveryLat: 10.78, deliveryLng: 106.71, pickupLat: 10.7769, pickupLng: 106.7009, customerName: 'Customer E2E', customerPhone: '0900000002', createdAt: '2026-08-23T08:00:00Z', updatedAt: '2026-08-23T08:00:00Z', items: [{ id: 601, menuItemId: 301, menuItemName: 'Cơm E2E', quantity: 1, price: 50_000 }] } });
    await page.goto('/customer/orders/401');
    await expect(page.getByRole('alert')).toHaveText(/Order detail unavailable/);
    await page.getByRole('button', { name: 'Thử lại' }).click();
    await expect(page.getByText('Cơm E2E')).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-OWNER-009 [P1] malformed owner menu list has no fake rows', async ({ page }) => {
    const backend = new MockGateway({ role: 'SHOP_OWNER', strict: true });
    await backend.install(page);
    backend.malformedNext('/api/menu-items/my-menu-items', malformedEnvelope({ invalid: true }));
    await page.goto('/restaurant/menu');
    await expect(page.getByRole('alert')).toHaveText(/Lấy danh sách món ăn thất bại|Backend response/);
    await expect(page.getByText('Cơm E2E')).toHaveCount(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-OWNER-010 [P1] profile GET 500 keeps stale form with error', async ({ page }) => {
    const backend = new MockGateway({ role: 'SHOP_OWNER', strict: true });
    await backend.install(page);
    backend.queue('/api/restaurants/my-restaurants', { data: [restaurantFixture] }, { status: 500, message: 'Profile unavailable' });
    await page.goto('/restaurant/profile');
    await expect(page.getByRole('alert')).toHaveText(/Profile unavailable/);
    await expect(page.getByLabel('Tên nhà hàng')).toHaveValue('Bếp E2E');
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-OWNER-011 [P1] profile PUT 500 keeps edited values and error', async ({ page }) => {
    const backend = await gotoRole(page, 'SHOP_OWNER', '/restaurant/profile', { strict: true });
    await page.getByLabel('Tên nhà hàng').fill('Bếp đổi tên');
    backend.failNext('/api/restaurants/201', { status: 500, message: 'Profile update unavailable' });
    await page.getByRole('button', { name: 'Cập nhật' }).click();
    await expect(page.getByRole('alert')).toHaveText(/Profile update unavailable/);
    await expect(page.getByLabel('Tên nhà hàng')).toHaveValue('Bếp đổi tên');
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-OWNER-012 [P1] owner order list 503 recovers through retry', async ({ page }) => {
    const backend = new MockGateway({ role: 'SHOP_OWNER', strict: true });
    await backend.install(page);
    backend.failNext('/api/orders/my-restaurant-orders', { status: 503, message: 'Owner orders unavailable' });
    await page.goto('/restaurant/orders');
    await expect(page.getByRole('alert')).toHaveText(/Owner orders unavailable/);
    await page.getByRole('button', { name: 'Thử lại' }).click();
    await expect(page.getByText('Đơn hàng #401')).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-OWNER-013 confirm abort keeps pending order actionable', async ({ page }) => {
    const backend = await gotoRole(page, 'SHOP_OWNER', '/restaurant/orders', { strict: true });
    backend.abortNext('/api/restaurants/orders/401/confirm');
    await page.getByRole('button', { name: 'Xác nhận đơn #401' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText('Đơn hàng #401')).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-OWNER-014 reject 409 keeps prompt decision unresolved', async ({ page }) => {
    const backend = await gotoRole(page, 'SHOP_OWNER', '/restaurant/orders', { strict: true });
    backend.failNext('/api/restaurants/orders/401/reject', { status: 409, message: 'Reject conflict' });
    page.on('dialog', (dialog) => void dialog.accept('Inventory changed'));
    await page.getByRole('button', { name: 'Từ chối đơn #401' }).click();
    await expect(page.getByRole('alert')).toHaveText(/Reject conflict/);
    await expect(page.getByText('Đơn hàng #401')).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-OWNER-015 voucher POST 500 keeps entered code', async ({ page }) => {
    const backend = await gotoRole(page, 'SHOP_OWNER', '/restaurant/vouchers', { strict: true });
    await page.getByLabel('Mã voucher').fill('FAIL50');
    await page.getByLabel('Tên chiến dịch').fill('Voucher lỗi');
    backend.failNext('/api/promotions/shop', { status: 500, message: 'Voucher write unavailable' });
    await page.getByRole('button', { name: 'Tạo voucher' }).click();
    await expect(page.getByLabel('Mã voucher')).toHaveValue('FAIL50');
    expect(backend.requestsFor('/api/promotions/shop').filter((request) => request.method === 'POST')).toHaveLength(1);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ADMIN-009 malformed shipper page has no fake rows', async ({ page }) => {
    const backend = new MockGateway({ role: 'ADMIN', strict: true });
    await backend.install(page);
    backend.malformedNext('/api/shippers', malformedEnvelope({ invalid: true }));
    await page.goto('/admin/shippers');
    await expect(page.getByRole('alert')).toHaveText(/Không thể tải danh sách shipper|Backend response/);
    await expect(page.getByText('Shipper E2E')).toHaveCount(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ADMIN-010 rating approve 500 keeps pending row', async ({ page }) => {
    const backend = await gotoRole(page, 'ADMIN', '/admin/ratings', { strict: true });
    backend.failNext('/api/restaurants/admin/ratings/801/status', { status: 500, message: 'Rating write unavailable' });
    await page.getByTitle('Duyệt').click();
    await expect(page.getByText('Rất ngon')).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ADMIN-011 coupons GET 500 exposes retry without rows', async ({ page }) => {
    const backend = new MockGateway({ role: 'ADMIN', strict: true });
    await backend.install(page);
    backend.failNext('/api/promotions/admin', { status: 500, message: 'Coupons unavailable' });
    await page.goto('/admin/coupons');
    await expect(page.getByRole('alert')).toHaveText(/Không thể tải danh sách coupon/);
    await expect(page.getByText('E2E50')).toHaveCount(0);
    await page.getByRole('button', { name: 'Thử lại' }).click();
    await expect(page.getByText('Chưa có mã giảm giá nào')).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ADMIN-012 coupon DELETE 500 keeps coupon row', async ({ page }) => {
    const backend = await gotoRole(page, 'ADMIN', '/admin/coupons', { strict: true });
    backend.queue('/api/promotions/admin', { data: [{ id: 901, code: 'DELETE50', name: 'Delete candidate', description: 'fixture', creatorType: 'PLATFORM', rewardType: 'FIXED', discountValue: 5000, maxDiscountValue: null, totalQuantity: 10, usedQuantity: 0, startTime: '2026-08-23T08:00:00Z', endTime: '2026-08-30T08:00:00Z', minOrderValue: 0, scopeType: 'ALL', scopeRefId: null, active: true }] });
    await page.reload();
    await expect(page.getByText('DELETE50')).toBeVisible();
    backend.failNext('/api/promotions/901', { status: 500, message: 'Coupon delete unavailable' });
    page.once('dialog', (dialog) => void dialog.accept());
    await page.getByRole('button', { name: 'Xóa coupon DELETE50' }).click();
    await expect(page.getByText('DELETE50')).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ADMIN-013 flash-sale items 500 keeps review modal retryable', async ({ page }) => {
    const backend = new MockGateway({ role: 'ADMIN', strict: true });
    await backend.install(page);
    backend.queue('/api/flashsales/admin/campaigns', { data: [{ id: 1001, name: 'Campaign E2E', isRecurring: false, startTime: '10:00:00', endTime: '12:00:00', status: 'UPCOMING' }] });
    await page.goto('/admin/flash-sales');
    await expect(page.getByText('Campaign E2E')).toBeVisible();
    backend.failNext('/api/flashsales/admin/campaigns/1001/items', { status: 500, message: 'Flash-sale items unavailable' });
    await page.getByTitle('Xem món ăn').click();
    await expect(page.getByText('Không thể tải danh sách món ăn')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Thử lại' })).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });
});
