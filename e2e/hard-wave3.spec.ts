import { expect, test } from '@playwright/test';
import { gotoRole, MockGateway } from './fixtures';

const address = {
  id: 1001, userId: 501, label: 'Nhà', recipientName: 'Customer E2E', phoneNumber: '0900000002',
  addressLine: '2 Đường Khách', ward: 'Bến Nghé', district: 'Quận 1', city: 'TP.HCM',
  latitude: 10.78, longitude: 106.71, isDefault: true,
};

const order = {
  id: 401, userId: 501, restaurantId: 201, restaurantName: 'Bếp E2E', restaurantAddress: '1 Đường Test, TP.HCM', restaurantPhone: '0900000001',
  restaurantLat: 10.7769, restaurantLng: 106.7009, subtotalPrice: 50_000, discountAmount: 0, shippingFee: 15_000, totalPrice: 65_000,
  status: 'PENDING', paymentMethod: 'COD', deliveryAddress: '2 Đường Khách, TP.HCM', deliveryLat: 10.78, deliveryLng: 106.71,
  pickupLat: 10.7769, pickupLng: 106.7009, customerName: 'Customer E2E', customerPhone: '0900000002',
  createdAt: '2026-08-23T08:00:00Z', updatedAt: '2026-08-23T08:00:00Z',
  items: [{ id: 601, menuItemId: 301, menuItemName: 'Cơm E2E', quantity: 1, price: 50_000 }],
};

const cart = {
  userId: 501, restaurantId: 201, restaurantName: 'Bếp E2E',
  items: [{ menuItemId: 301, restaurantId: 201, restaurantName: 'Bếp E2E', menuItemName: 'Cơm E2E', price: 50_000, quantity: 1, notes: '' }],
};

const pageData = <T>(items: T[], page = 0, totalPages = 1, hasNext = false) => ({
  items, page, size: 10, totalItems: items.length, totalPages, hasNext,
});

const malformed = (data: unknown = {}) => ({ status: 200, raw: { status: 1, message: null, data } });

async function installCart(page: import('@playwright/test').Page, backend: MockGateway) {
  await backend.install(page);
  await page.addInitScript((value) => localStorage.setItem('delivery.customer-cart.v1', JSON.stringify(value)), cart);
  await page.goto('/customer/checkout');
  return backend;
}

test.describe('Wave 3A auth, contract and responsive cases', () => {
  test('CASE-AUTH-017 [P0] customer orders recover after one access refresh', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    backend.queue('/api/orders/my-orders', { status: 401, message: 'Access expired' }, { data: pageData([order]) });
    await page.goto('/customer/orders');
    await expect(page.getByText('Đơn #401')).toBeVisible();
    expect(backend.requestsFor('/api/auth/refresh-token')).toHaveLength(1);
    expect(backend.requestsFor('/api/orders/my-orders')).toHaveLength(2);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-AUTH-018 [P0] owner access and refresh rejection clear session', async ({ page }) => {
    const backend = new MockGateway({ role: 'SHOP_OWNER', strict: true });
    await backend.install(page);
    backend.failNext('/api/users', { status: 401, message: 'Access expired' });
    backend.failNext('/api/auth/refresh-token', { status: 401, message: 'Refresh expired' });
    await page.goto('/restaurant/dashboard');
    await expect(page).toHaveURL(/\/login$/);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-AUTH-019 [P0] delayed refresh still restores admin dashboard', async ({ page }) => {
    const backend = new MockGateway({ role: 'ADMIN', strict: true });
    await backend.install(page);
    backend.queue('/api/users', { status: 401, message: 'Access expired' }, { data: { id: 1, email: 'admin@e2e.test', name: 'Admin E2E', role: 'ADMIN' } });
    backend.queue('/api/auth/refresh-token', { delayMs: 250, data: { accessToken: 'rotated', refreshToken: 'rotated-refresh' } });
    await page.goto('/admin/dashboard');
    await expect(page.getByRole('heading', { name: 'Quản trị hệ thống' })).toBeVisible();
    expect(backend.requestsFor('/api/auth/refresh-token')).toHaveLength(1);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-AUTH-020 [P0] malformed login profile clears partial session', async ({ page }) => {
    const backend = new MockGateway({ role: 'ADMIN', strict: true });
    await backend.install(page);
    backend.queue('/api/users', { data: { id: 1, email: 'admin@e2e.test', name: 'Admin E2E', role: 'ADMIN' } }, malformed());
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill('admin@e2e.test');
    await page.locator('input[type="password"]').fill('Password123!');
    await page.getByRole('button', { name: 'Đăng nhập admin' }).click();
    await expect(page.getByText(/Backend response does not match|Backend profile response is missing user id|Đăng nhập admin thất bại/)).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login$/);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-AUTH-021 [P0] spoofed customer cannot read admin data', async ({ page }) => {
    const backend = await gotoRole(page, 'USER', '/admin/dashboard', { strict: true });
    await expect(page.getByRole('heading', { name: 'Không có quyền truy cập' })).toBeVisible();
    expect(backend.requestsFor('/api/analytics/dashboard/admin')).toHaveLength(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CROSS-010 [P1] catalog 429 recovers with explicit retry', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    backend.failNext('/api/restaurants', { status: 429, message: 'Catalog rate limited' });
    await page.goto('/');
    await expect(page.getByText('Catalog rate limited')).toBeVisible();
    await page.getByRole('button', { name: 'Thử lại' }).click();
    await expect(page.getByText('Bếp E2E')).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CROSS-011 [P1] non-envelope catalog response fails closed', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    backend.malformedNext('/api/restaurants', { raw: 'not-an-envelope' });
    await page.goto('/');
    await expect(page.getByText('Backend response does not match the canonical BaseResponse contract')).toBeVisible();
    await expect(page.getByText('Bếp E2E')).toHaveCount(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CROSS-012 [P1] public menu abort exposes connection recovery', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    backend.abortNext('/api/menu-items/restaurant/201/available');
    await page.goto('/restaurants/201');
    await expect(page.getByText(/Không thể kết nối đến server|Không thể tải thông tin nhà hàng/)).toBeVisible();
    await expect(page.getByText('Cơm E2E')).toHaveCount(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CROSS-013 [P1] customer home remains usable on mobile viewport', async ({ page }) => {
    const backend = await gotoRole(page, 'USER', '/', { strict: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('heading', { name: 'Quán ngon dành cho bạn' })).toBeVisible();
    await expect(page.getByLabel('Tìm nhà hàng')).toBeVisible();
    await expect(page.getByText('Bếp E2E')).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CROSS-014 [P1] catalog retry after reload remains deterministic', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    backend.queue('/api/restaurants', { status: 503, message: 'First catalog failure' }, { data: [] });
    await page.goto('/');
    await expect(page.getByText('First catalog failure')).toBeVisible();
    await page.reload();
    await expect(page.getByText('Không tìm thấy nhà hàng phù hợp.')).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });
});

test.describe('Wave 3A customer, checkout and order boundaries', () => {
  test('CASE-CUSTOMER-034 [P1] address 422 keeps fields for correction', async ({ page }) => {
    const backend = await gotoRole(page, 'USER', '/customer/addresses', { strict: true });
    await page.getByRole('button', { name: 'Thêm địa chỉ mới' }).click();
    await expect.poll(() => backend.requestsFor('/api/addresses/users/501/addresses').length).toBe(1);
    backend.failNext('/api/addresses/users/501/addresses', { status: 422, message: 'Address validation failed' });
    await page.getByLabel('Họ và tên người nhận').fill('Needs correction');
    await page.getByLabel('Số điện thoại').fill('0900000002');
    await page.getByLabel('Số nhà, tên đường, toà nhà').fill('2 Đường Khách');
    await page.getByLabel('Phường / Xã').fill('Bến Nghé');
    await page.getByLabel('Quận / Huyện').fill('Quận 1');
    await page.getByLabel('Tỉnh / Thành phố').fill('TP.HCM');
    const coordinates = page.locator('input[type="number"]');
    await coordinates.nth(0).fill('10.78');
    await coordinates.nth(1).fill('106.71');
    await page.getByRole('button', { name: 'Hoàn tất & Thêm mới' }).click();
    await expect(page.getByRole('alert')).toHaveText(/Address validation failed/);
    await expect(page.getByLabel('Họ và tên người nhận')).toHaveValue('Needs correction');
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-035 [P1] address transport abort keeps form usable', async ({ page }) => {
    const backend = await gotoRole(page, 'USER', '/customer/addresses', { strict: true });
    await page.getByRole('button', { name: 'Thêm địa chỉ mới' }).click();
    await expect.poll(() => backend.requestsFor('/api/addresses/users/501/addresses').length).toBe(1);
    backend.abortNext('/api/addresses/users/501/addresses');
    await page.getByLabel('Họ và tên người nhận').fill('Abort recovery');
    await page.getByLabel('Số điện thoại').fill('0900000002');
    await page.getByLabel('Số nhà, tên đường, toà nhà').fill('2 Đường Khách');
    await page.getByLabel('Phường / Xã').fill('Bến Nghé');
    await page.getByLabel('Quận / Huyện').fill('Quận 1');
    await page.getByLabel('Tỉnh / Thành phố').fill('TP.HCM');
    const coordinates = page.locator('input[type="number"]');
    await coordinates.nth(0).fill('10.78');
    await coordinates.nth(1).fill('106.71');
    await page.getByRole('button', { name: 'Hoàn tất & Thêm mới' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByLabel('Họ và tên người nhận')).toHaveValue('Abort recovery');
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-036 [P0] preview 429 blocks COD create', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    backend.failNext('/api/orders/checkout-preview', { status: 429, message: 'Quote rate limited' });
    await installCart(page, backend);
    await expect(page.getByRole('alert')).toHaveText(/Quote rate limited/);
    await expect(page.getByRole('button', { name: 'Đặt đơn COD' })).toBeDisabled();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-037 [P1] selecting a second address re-quotes with new coordinates', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    const second = { ...address, id: 1002, label: 'Công ty', latitude: 21.0285, longitude: 105.8542, isDefault: false };
    backend.queue('/api/addresses/users/501/addresses', { data: [address, second] });
    await installCart(page, backend);
    await expect(page.getByRole('button', { name: 'Đặt đơn COD' })).toBeEnabled();
    await page.getByRole('button', { name: 'Chọn hoặc đổi địa chỉ giao hàng' }).click();
    // Click the address row containing 'Công ty' — div onClick selects the
    // address and closes the modal in one shot; using radio.check() races with
    // the parent onClick unmounting the radio before Playwright can verify it.
    await page.getByRole('dialog').getByText('Công ty').click();
    await expect.poll(() => backend.requestsFor('/api/orders/checkout-preview').length).toBe(2);
    expect(backend.lastRequest('/api/orders/checkout-preview')?.body).toContain('21.0285');
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-038 [P1] voucher collect 500 keeps code retryable', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true, voucherEnabled: true });
    backend.failNext('/api/promotions/collect/FAIL50', { status: 500, message: 'Voucher collect unavailable' });
    await installCart(page, backend);
    await page.getByPlaceholder('Nhập mã để lưu vào ví').fill('FAIL50');
    await page.getByRole('button', { name: 'Lưu mã' }).click();
    await expect(page.getByRole('alert')).toHaveText(/Voucher collect unavailable/);
    await expect(page.getByPlaceholder('Nhập mã để lưu vào ví')).toHaveValue('FAIL50');
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-039 [P1] malformed order-create success stays on checkout', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await installCart(page, backend);
    await expect(page.getByRole('button', { name: 'Đặt đơn COD' })).toBeEnabled();
    backend.malformedNext('/api/orders', malformed({ invalid: true }));
    await page.getByRole('button', { name: 'Đặt đơn COD' }).click();
    await expect(page.getByRole('alert')).toHaveText(/created order\.id|Backend response/);
    await expect(page.getByRole('button', { name: 'Đặt đơn COD' })).toBeEnabled();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-040 [P0] quote mismatch refreshes quote before retry', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await installCart(page, backend);
    await expect(page.getByRole('button', { name: 'Đặt đơn COD' })).toBeEnabled();
    backend.failNext('/api/orders', { status: 409, code: 'QUOTE_MISMATCH', message: 'Quote mismatch' });
    await page.getByRole('button', { name: 'Đặt đơn COD' }).click();
    await expect(page.getByRole('status')).toHaveText(/Báo giá đã thay đổi/);
    await expect.poll(() => backend.requestsFor('/api/orders/checkout-preview').length).toBe(2);
    await expect(page.getByRole('button', { name: 'Đặt đơn COD' })).toBeEnabled();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-041 [P1] order history malformed page never fabricates empty state', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    backend.malformedNext('/api/orders/my-orders', { raw: 'not-an-envelope' });
    await page.goto('/customer/orders');
    await expect(page.getByRole('alert')).toHaveText(/Backend response does not match/);
    await expect(page.getByText('Bạn chưa có đơn hàng nào')).toHaveCount(0);
    backend.assertNoUnexpectedRequests();
  });
});

test.describe('Wave 3A terminal order, owner and admin cases', () => {
  test('CASE-ORDER-011 [P1] shipper-not-found order shows recovery message without cancel', async ({ page }) => {
    const backend = await gotoRole(page, 'USER', '/customer/orders/401', { strict: true, orderStatus: 'SHIPPER_NOT_FOUND' });
    await expect(page.getByText('Chưa tìm được tài xế')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hủy đơn hàng' })).toHaveCount(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ORDER-012 [P1] cancelled order has no cancellation control', async ({ page }) => {
    const backend = await gotoRole(page, 'USER', '/customer/orders/401', { strict: true, orderStatus: 'CANCELLED' });
    await expect(page.getByText('Đã hủy đơn hàng')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hủy đơn hàng' })).toHaveCount(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ORDER-013 [P1] history pagination requests next page only once', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    backend.queue('/api/orders/my-orders', { data: pageData([order], 0, 2, true) }, { data: pageData([], 1, 2, false) });
    await page.goto('/customer/orders');
    await expect(page.getByText('Trang 1/2')).toBeVisible();
    await page.getByRole('button', { name: 'Sau' }).click();
    await expect(page.getByText('Trang 2/2')).toBeVisible();
    expect(backend.requestsFor('/api/orders/my-orders')).toHaveLength(2);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ORDER-014 [P0] cancel 422 keeps confirmation dialog', async ({ page }) => {
    const backend = await gotoRole(page, 'USER', '/customer/orders/401', { strict: true });
    backend.failNext('/api/orders/401/cancel', { status: 422, message: 'Cancellation no longer allowed' });
    await page.getByRole('button', { name: 'Hủy đơn hàng' }).click();
    await page.getByRole('button', { name: 'Xác nhận hủy' }).click();
    await expect(page.getByRole('alert')).toHaveText(/Cancellation no longer allowed/);
    await expect(page.getByRole('button', { name: 'Xác nhận hủy' })).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-OWNER-016 [P1] menu DELETE 500 keeps row visible', async ({ page }) => {
    const backend = await gotoRole(page, 'SHOP_OWNER', '/restaurant/menu', { strict: true });
    backend.failNext('/api/menu-items/301', { status: 500, message: 'Menu delete unavailable' });
    page.once('dialog', (dialog) => void dialog.accept());
    await page.getByRole('button', { name: 'Xóa Cơm E2E' }).click();
    await expect(page.getByRole('alert')).toHaveText(/Menu delete unavailable/);
    await expect(page.getByText('Cơm E2E')).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-OWNER-017 [P1] review GET 500 exposes retry', async ({ page }) => {
    const backend = new MockGateway({ role: 'SHOP_OWNER', strict: true });
    await backend.install(page);
    backend.failUntilCleared('/api/restaurants/201/ratings', { status: 500, message: 'Reviews unavailable' });
    await page.goto('/restaurant/reviews');
    await expect(page.getByRole('alert')).toHaveText(/Không thể tải danh sách đánh giá/);
    backend.clearFailure('/api/restaurants/201/ratings');
    await page.getByRole('button', { name: 'Thử lại' }).click();
    await expect(page.getByText(/Rất ngon|Chưa có/).first()).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-OWNER-018 [P1] invalid catalog JSON blocks import API', async ({ page }) => {
    const backend = await gotoRole(page, 'SHOP_OWNER', '/restaurant/catalog-import', { strict: true });
    await page.getByLabel('JSON catalog nhà hàng và món ăn').fill('{invalid json');
    await page.getByRole('button', { name: 'Kiểm tra dữ liệu' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    expect(backend.requests.some((request) => request.method === 'POST' && request.path.startsWith('/api/'))).toBeFalsy();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-OWNER-019 [P1] voucher list 500 keeps form available', async ({ page }) => {
    const backend = new MockGateway({ role: 'SHOP_OWNER', strict: true });
    await backend.install(page);
    backend.failNext('/api/promotions/shop', { status: 500, message: 'Voucher list unavailable' });
    await page.goto('/restaurant/vouchers');
    await expect(page.getByText('Không thể tải voucher nhà hàng')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tạo voucher' })).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ADMIN-014 malformed dashboard has no fabricated metrics', async ({ page }) => {
    const backend = new MockGateway({ role: 'ADMIN', strict: true });
    await backend.install(page);
    backend.malformedNext('/api/analytics/dashboard/admin', { raw: 'not-an-envelope' });
    await page.goto('/admin/dashboard');
    await expect(page.getByRole('alert')).toHaveText(/Không thể tải số liệu dashboard/);
    await expect(page.getByText('65.000')).toHaveCount(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ADMIN-015 dashboard 429 recovers with retry', async ({ page }) => {
    const backend = new MockGateway({ role: 'ADMIN', strict: true });
    await backend.install(page);
    backend.failNext('/api/analytics/dashboard/admin', { status: 429, message: 'Analytics rate limited' });
    await page.goto('/admin/dashboard');
    await expect(page.getByRole('alert')).toHaveText(/Không thể tải số liệu dashboard/);
    await page.getByRole('button', { name: 'Thử lại' }).click();
    await expect(page.getByRole('heading', { name: 'Quản trị hệ thống' })).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ADMIN-016 offline filter can render an explicit empty state', async ({ page }) => {
    const backend = new MockGateway({ role: 'ADMIN', strict: true });
    await backend.install(page);
    backend.queue('/api/shippers', { data: pageData([{ id: 702, userId: 703, fullName: 'Online E2E', phone: '0900000004', vehicleType: 'MOTORBIKE', licensePlate: '59-ON', isOnline: true, rating: 4, completedDeliveries: 4, createdAt: '2026-08-23T08:00:00Z' }], 0, 1, false) });
    await page.goto('/admin/shippers');
    await page.getByRole('button', { name: 'Offline' }).click();
    await expect(page.getByText('Không tìm thấy shipper nào.')).toBeVisible();
    await expect(page.getByText('Online E2E')).toHaveCount(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ADMIN-017 malformed coupon list has no fake rows', async ({ page }) => {
    const backend = new MockGateway({ role: 'ADMIN', strict: true });
    await backend.install(page);
    backend.malformedNext('/api/promotions/admin', { raw: 'not-an-envelope' });
    await page.goto('/admin/coupons');
    await expect(page.getByRole('alert')).toHaveText(/Không thể tải danh sách coupon/);
    await expect(page.getByText('E2E50')).toHaveCount(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ADMIN-018 flash campaign 503 exposes retry', async ({ page }) => {
    const backend = new MockGateway({ role: 'ADMIN', strict: true });
    await backend.install(page);
    backend.failNext('/api/flashsales/admin/campaigns', { status: 503, message: 'Campaign list unavailable' });
    await page.goto('/admin/flash-sales');
    await expect(page.getByRole('alert')).toHaveText(/Không thể tải danh sách Flash Sale/);
    await page.getByRole('button', { name: 'Thử lại' }).click();
    await expect(page.getByText('Chưa có chiến dịch Flash Sale nào')).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ADMIN-019 flash campaign status 409 keeps row', async ({ page }) => {
    const backend = new MockGateway({ role: 'ADMIN', strict: true });
    await backend.install(page);
    backend.queue('/api/flashsales/admin/campaigns', { data: [{ id: 1001, name: 'Conflict campaign', isRecurring: false, startTime: '10:00:00', endTime: '12:00:00', status: 'UPCOMING' }] });
    await page.goto('/admin/flash-sales');
    await expect(page.getByText('Conflict campaign')).toBeVisible();
    backend.failNext('/api/flashsales/admin/campaigns/1001/status', { status: 409, message: 'Campaign status conflict' });
    await page.getByTitle('Kích hoạt').click();
    await expect(page.getByText('Conflict campaign')).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });
});
