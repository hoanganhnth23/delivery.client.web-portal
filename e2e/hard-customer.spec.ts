import { expect, test } from '@playwright/test';
import { gotoRole, MockGateway } from './fixtures';

const cartFixture = {
  userId: 501,
  restaurantId: 201,
  restaurantName: 'Bếp E2E',
  items: [{ menuItemId: 301, restaurantId: 201, restaurantName: 'Bếp E2E', menuItemName: 'Cơm E2E', price: 50_000, quantity: 1, notes: '' }],
};

async function installCart(page: import('@playwright/test').Page, backend: MockGateway, path = '/customer/checkout') {
  await backend.install(page);
  await page.addInitScript((cart) => {
    localStorage.setItem('delivery.customer-cart.v1', JSON.stringify(cart));
  }, cartFixture);
  await page.goto(path);
  return backend;
}

async function fillAddressForm(page: import('@playwright/test').Page, latitude = '10.78', longitude = '106.71') {
  const addButton = page.getByRole('button', { name: 'Thêm địa chỉ mới' });
  await addButton.waitFor({ state: 'visible' });
  await addButton.click();
  await page.getByRole('button', { name: 'Nhà riêng', exact: true }).click();
  await page.getByLabel('Họ và tên người nhận').fill('Customer E2E');
  await page.getByLabel('Số điện thoại').fill('0900000002');
  await page.getByLabel('Số nhà, tên đường, toà nhà').fill('2 Đường Khách');
  await page.getByLabel('Phường / Xã').fill('Bến Nghé');
  await page.getByLabel('Quận / Huyện').fill('Quận 1');
  await page.getByLabel('Tỉnh / Thành phố').fill('TP.HCM');
  const coordinateInputs = page.locator('input[type="number"]');
  await coordinateInputs.nth(0).fill(latitude);
  await coordinateInputs.nth(1).fill(longitude);
  await expect(coordinateInputs.nth(0)).toHaveValue(latitude);
  await expect(coordinateInputs.nth(1)).toHaveValue(longitude);
}

test.describe('hard customer catalog, address and order cases', () => {
  test('CASE-CROSS-001 [P1] CUSTOMER-01 catalog 503 recovers through retry', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    backend.failNext('/api/restaurants', { status: 503, message: 'Catalog unavailable' });
    await page.goto('/');
    await expect(page.getByText('Catalog unavailable')).toBeVisible();
    await page.getByRole('button', { name: 'Thử lại' }).click();
    await expect(page.getByText('Bếp E2E')).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CROSS-002 [P1] CUSTOMER-01 renders an empty catalog without fake rows', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    backend.queue('/api/restaurants', { data: [] });
    await page.goto('/');
    await expect(page.getByText('Không tìm thấy nhà hàng phù hợp.')).toBeVisible();
    await expect(page.getByText('Bếp E2E')).toHaveCount(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-001 [P1] CUSTOMER-02 search shows retryable failure', async ({ page }) => {
    const backend = await gotoRole(page, 'USER', '/', { strict: true });
    backend.failNext('/api/restaurants/search', { status: 500, message: 'Search unavailable' });
    await page.getByLabel('Tìm nhà hàng').fill('Bếp');
    await page.getByRole('button', { name: 'Tìm', exact: true }).click();
    await expect(page.getByText('Search unavailable')).toBeVisible();
    await page.getByRole('button', { name: 'Thử lại' }).click();
    await expect(page.getByText('Bếp E2E')).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-002 [P1] CUSTOMER-08 renders empty addresses', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    backend.queue('/api/addresses/users/501/addresses', { data: [] });
    await page.goto('/customer/addresses');
    await expect(page.getByText('Chưa có địa chỉ nào')).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-003 [P1] CUSTOMER-08 keeps address API failure visible', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    backend.failNext('/api/addresses/users/501/addresses', { status: 500, message: 'Address service unavailable' });
    await page.goto('/customer/addresses');
    await expect(page.getByRole('alert')).toHaveText(/Address service unavailable/);
    await expect(page.locator('article')).toHaveCount(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-004 [P0] CUSTOMER-09 blocks coordinates outside Vietnam', async ({ page }) => {
    const backend = await gotoRole(page, 'USER', '/customer/addresses', { strict: true });
    await fillAddressForm(page, '1', '101');
    await page.getByRole('button', { name: 'Hoàn tất & Thêm mới' }).click();
    await expect(page.getByRole('alert')).toHaveText(/tọa độ giao hàng hợp lệ tại Việt Nam/);
    expect(backend.requestsFor('/api/addresses/users/501/addresses').filter((request) => request.method === 'POST')).toHaveLength(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-005 [P1] CUSTOMER-09 shows manual recovery after geolocation denial', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: { getCurrentPosition: (_success: unknown, failure: (error: Error) => void) => failure(new Error('denied')) },
      });
    });
    await page.goto('/customer/addresses');
    await page.getByRole('button', { name: 'Thêm địa chỉ mới' }).click();
    await page.getByRole('button', { name: 'Lấy vị trí GPS của tôi' }).click();
    await expect(page.getByRole('alert')).toHaveText(/Không thể lấy tọa độ hiện tại/);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-006 [P1] CUSTOMER-09 keeps address form after POST 500', async ({ page }) => {
    const backend = await gotoRole(page, 'USER', '/customer/addresses', { strict: true });
    await expect.poll(() => backend.requestsFor('/api/addresses/users/501/addresses').length).toBe(1);
    backend.failNext('/api/addresses/users/501/addresses', { status: 500, message: 'Cannot save address' });
    await fillAddressForm(page);
    await page.getByRole('button', { name: 'Hoàn tất & Thêm mới' }).click();
    await expect(page.getByRole('alert')).toHaveText(/Không thể lưu địa chỉ|Cannot save address/);
    await expect(page.getByLabel('Họ và tên người nhận')).toHaveValue('Customer E2E');
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-007 [P1] CUSTOMER-10 does not delete after confirmation cancel', async ({ page }) => {
    const backend = await gotoRole(page, 'USER', '/customer/addresses', { strict: true });
    page.on('dialog', (dialog) => void dialog.dismiss());
    await page.getByRole('button', { name: 'Xóa' }).click();
    expect(backend.requestsFor('/api/addresses/1001').filter((request) => request.method === 'DELETE')).toHaveLength(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-008 [P1] CUSTOMER-10 keeps row after delete 500', async ({ page }) => {
    const backend = await gotoRole(page, 'USER', '/customer/addresses', { strict: true });
    backend.failNext('/api/addresses/1001', { status: 500, message: 'Cannot delete address' });
    page.on('dialog', (dialog) => void dialog.accept());
    await page.getByRole('button', { name: 'Xóa' }).click();
    await expect(page.getByRole('alert')).toHaveText(/Cannot delete address/);
    await expect(page.getByText('Nhà', { exact: true })).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-009 [P1] CUSTOMER-10 keeps existing default after set-default 500', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    const defaultAddress = {
      id: 1001, userId: 501, label: 'Nhà', recipientName: 'Customer E2E', phoneNumber: '0900000002',
      addressLine: '2 Đường Khách', ward: 'Bến Nghé', district: 'Quận 1', city: 'TP.HCM',
      latitude: 10.78, longitude: 106.71, isDefault: true,
    };
    const secondaryAddress = { ...defaultAddress, id: 1002, label: 'Công ty', isDefault: false };
    await backend.install(page);
    backend.queue('/api/addresses/users/501/addresses', { data: [defaultAddress, secondaryAddress] });
    await page.goto('/customer/addresses');
    await expect.poll(() => backend.requestsFor('/api/addresses/users/501/addresses').length).toBe(1);
    backend.failNext('/api/addresses/1002/default', { status: 500, message: 'Cannot set default address' });
    const secondary = page.getByRole('article').filter({ hasText: 'Công ty' });
    await secondary.getByRole('button', { name: 'Đặt làm mặc định' }).click();
    await expect(page.getByRole('alert')).toHaveText(/Cannot set default address/);
    await expect(page.getByRole('article').filter({ hasText: 'Nhà' }).getByText('Mặc định', { exact: true })).toBeVisible();
    await expect(secondary.getByText('Mặc định', { exact: true })).toHaveCount(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-010 [P1] CUSTOMER-11 shows empty-cart recovery', async ({ page }) => {
    const backend = await gotoRole(page, 'USER', '/customer/checkout', { strict: true });
    await expect(page.getByText('Chưa có món trong giỏ')).toBeVisible();
    expect(backend.requestsFor('/api/orders/checkout-preview')).toHaveLength(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-011 [P1] CUSTOMER-11 cannot quote without addresses', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    // Queue the empty address response before the first navigation.  Waiting
    // until after the initial checkout load makes the default fixture address
    // race with the reload in Firefox/WebKit, which can trigger a quote before
    // the empty-state response is consumed.
    await backend.install(page);
    await page.addInitScript((cart) => {
      localStorage.setItem('delivery.customer-cart.v1', JSON.stringify(cart));
    }, cartFixture);
    backend.queue('/api/addresses/users/501/addresses', { data: [] });
    await page.goto('/customer/checkout');
    await expect(page.getByText('Thêm địa chỉ giao hàng')).toBeVisible();
    expect(backend.requestsFor('/api/orders/checkout-preview')).toHaveLength(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-012 [P0] CUSTOMER-11 blocks COD create after preview 500', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    backend.failNext('/api/orders/checkout-preview', { status: 500, message: 'Quote unavailable' });
    await installCart(page, backend);
    await expect(page.getByRole('alert')).toHaveText(/Quote unavailable/);
    await expect(page.getByRole('button', { name: 'Đặt đơn COD' })).toBeDisabled();
    expect(backend.requestsFor('/api/orders').filter((request) => request.method === 'POST')).toHaveLength(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-013 [P0] CUSTOMER-11 disables COD create for unavailable item', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    backend.queue('/api/orders/checkout-preview', {
      data: { quoteId: 'quote-unavailable', expiresAt: '2026-08-24T08:00:00Z', restaurantId: 201, restaurantName: 'Bếp E2E', items: [], subtotal: 50_000, shippingFee: 15_000, discountAmount: 0, totalPrice: 65_000, priceChanges: [], unavailableItemIds: [301] },
    });
    await installCart(page, backend);
    await expect(page.getByRole('alert')).toHaveText(/Có món không còn khả dụng/);
    await expect(page.getByRole('button', { name: 'Đặt đơn COD' })).toBeDisabled();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-014 [P0] CUSTOMER-12 refreshes after PRICE_CHANGED', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await installCart(page, backend);
    await expect(page.getByRole('button', { name: 'Đặt đơn COD' })).toBeEnabled();
    backend.failNext('/api/orders', { status: 409, code: 'PRICE_CHANGED', message: 'Giá đã thay đổi' });
    await page.getByRole('button', { name: 'Đặt đơn COD' }).click();
    await expect(page.getByRole('status')).toHaveText(/Giá món đã thay đổi/);
    expect(backend.requestsFor('/api/orders/checkout-preview').length).toBeGreaterThanOrEqual(2);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-015 [P0] CUSTOMER-12 refreshes after QUOTE_EXPIRED', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await installCart(page, backend);
    await expect(page.getByRole('button', { name: 'Đặt đơn COD' })).toBeEnabled();
    backend.failNext('/api/orders', { status: 409, code: 'QUOTE_EXPIRED', message: 'Báo giá đã hết hạn' });
    await page.getByRole('button', { name: 'Đặt đơn COD' }).click();
    await expect(page.getByRole('status')).toHaveText(/Báo giá đã thay đổi/);
    expect(backend.requestsFor('/api/orders/checkout-preview').length).toBeGreaterThanOrEqual(2);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-016 [P0] CUSTOMER-12 keeps idempotency key during in-progress retry', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    backend.queue('/api/orders', { status: 409, code: 'IDEMPOTENCY_IN_PROGRESS', message: 'Đang xử lý' }, { data: { id: 401, ...cartFixture, status: 'PENDING', totalPrice: 65_000, subtotalPrice: 50_000, discountAmount: 0, shippingFee: 15_000, paymentMethod: 'COD', deliveryAddress: '2 Đường Khách, TP.HCM', deliveryLat: 10.78, deliveryLng: 106.71, pickupLat: 10.7769, pickupLng: 106.7009, customerName: 'Customer E2E', customerPhone: '0900000002', restaurantAddress: '1 Đường Test', restaurantPhone: '0900000001', restaurantLat: 10.7769, restaurantLng: 106.7009, createdAt: '2026-08-23T08:00:00Z', updatedAt: '2026-08-23T08:00:00Z', items: [{ id: 601, menuItemId: 301, menuItemName: 'Cơm E2E', quantity: 1, price: 50_000 }] } });
    await installCart(page, backend);
    const button = page.getByRole('button', { name: 'Đặt đơn COD' });
    await expect(button).toBeEnabled();
    await button.click();
    await expect(page.getByRole('alert')).toHaveText(/vẫn đang được xử lý/);
    await button.click();
    await expect(page).toHaveURL(/\/customer\/orders\/401$/);
    const keys = backend.requestsFor('/api/orders').map((request) => request.headers['idempotency-key']);
    expect(keys).toHaveLength(2);
    expect(keys[0]).toBeTruthy();
    expect(keys[0]).toBe(keys[1]);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-017 [P0] CUSTOMER-12 retries an aborted create with the same key', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    backend.queue('/api/orders', { abort: true }, { data: { id: 401, userId: 501, restaurantId: 201, restaurantName: 'Bếp E2E', restaurantAddress: '1 Đường Test', restaurantPhone: '0900000001', restaurantLat: 10.7769, restaurantLng: 106.7009, subtotalPrice: 50_000, discountAmount: 0, shippingFee: 15_000, totalPrice: 65_000, status: 'PENDING', paymentMethod: 'COD', deliveryAddress: '2 Đường Khách, TP.HCM', deliveryLat: 10.78, deliveryLng: 10.71, pickupLat: 10.7769, pickupLng: 106.7009, customerName: 'Customer E2E', customerPhone: '0900000002', createdAt: '2026-08-23T08:00:00Z', updatedAt: '2026-08-23T08:00:00Z', items: [{ id: 601, menuItemId: 301, menuItemName: 'Cơm E2E', quantity: 1, price: 50_000 }] } });
    await installCart(page, backend);
    const button = page.getByRole('button', { name: 'Đặt đơn COD' });
    await expect(button).toBeEnabled();
    await button.click();
    await expect(page.getByRole('alert')).toBeVisible();
    await button.click();
    await expect(page).toHaveURL(/\/customer\/orders\/401$/);
    const keys = backend.requestsFor('/api/orders').map((request) => request.headers['idempotency-key']);
    expect(keys[0]).toBe(keys[1]);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-CUSTOMER-018 [P1] CUSTOMER-12 keeps voucher code after collect failure', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', voucherEnabled: true, strict: true });
    await installCart(page, backend);
    backend.failNext('/api/promotions/collect/BADCODE', { status: 409, message: 'Voucher không hợp lệ' });
    await page.getByPlaceholder('Nhập mã để lưu vào ví').fill('BADCODE');
    await page.getByRole('button', { name: 'Lưu mã' }).click();
    await expect(page.getByRole('alert')).toHaveText(/Voucher không hợp lệ/);
    await expect(page.getByPlaceholder('Nhập mã để lưu vào ví')).toHaveValue('BADCODE');
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ORDER-001 [P1] CUSTOMER-13 history recovers after 500', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    backend.queue('/api/orders/my-orders', { status: 500, message: 'Order history unavailable' });
    await page.goto('/customer/orders');
    await expect(page.getByRole('alert')).toHaveText(/Order history unavailable/);
    await page.getByText('Thử lại').click();
    await expect(page.getByText(/Đơn #401|Bếp E2E/).first()).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ORDER-002 [P1] CUSTOMER-13 renders empty history', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    backend.queue('/api/orders/my-orders', { data: { items: [], page: 0, size: 10, totalItems: 0, totalPages: 0, hasNext: false } });
    await page.goto('/customer/orders');
    await expect(page.getByText('Bạn chưa có đơn hàng nào.')).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ORDER-003 [P1] CUSTOMER-14 shows retryable detail 404', async ({ page }) => {
    const backend = new MockGateway({ role: 'USER', strict: true });
    await backend.install(page);
    backend.failNext('/api/orders/401', { status: 404, message: 'Order not found' });
    await page.goto('/customer/orders/401');
    await expect(page.getByRole('alert')).toHaveText(/Order not found/);
    await page.getByText('Thử lại').click();
    await expect(page.getByText('Cơm E2E')).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ORDER-004 [P1] CUSTOMER-15 hides cancellation for delivered order', async ({ page }) => {
    const backend = await gotoRole(page, 'USER', '/customer/orders/401', { role: 'USER', orderStatus: 'DELIVERED', strict: true });
    await expect(page.getByText('Cơm E2E')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hủy đơn hàng' })).toHaveCount(0);
    backend.assertNoUnexpectedRequests();
  });

  test('CASE-ORDER-005 [P1] CUSTOMER-15 keeps cancel dialog after 409', async ({ page }) => {
    const backend = await gotoRole(page, 'USER', '/customer/orders/401', { strict: true });
    backend.failNext('/api/orders/401/cancel', { status: 409, message: 'Order already decided' });
    await page.getByRole('button', { name: 'Hủy đơn hàng' }).click();
    await page.getByRole('button', { name: 'Xác nhận hủy' }).click();
    await expect(page.getByRole('alert')).toHaveText(/Order already decided/);
    await expect(page.getByText('Order already decided')).toBeVisible();
    backend.assertNoUnexpectedRequests();
  });
});
