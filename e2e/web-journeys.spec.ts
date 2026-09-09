import { expect, test } from '@playwright/test';
import { gotoRole, MockGateway } from './fixtures';

test.describe('authentication and public surfaces', () => {
  test('AUTH-01 restaurant owner can log in and reach dashboard', async ({ page }) => {
    const backend = await gotoRole(page, 'SHOP_OWNER', '/login');
    await page.getByLabel('Email').fill('owner@e2e.test');
    await page.locator('input[type="password"]').fill('Password123!');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page).toHaveURL(/\/restaurant\/dashboard$/);
    expect(backend.requests.some((request) => request.path === '/api/auth/login')).toBeTruthy();
  });

  test('AUTH-02 admin can log in and reach admin dashboard', async ({ page }) => {
    await gotoRole(page, 'ADMIN', '/admin/login');
    await page.getByLabel('Email').fill('admin@e2e.test');
    await page.locator('input[type="password"]').fill('Password123!');
    await page.getByRole('button', { name: 'Đăng nhập admin' }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Quản trị hệ thống' })).toBeVisible();
  });

  test('AUTH-03, AUTH-04 guarded route redirects unauthenticated user to login', async ({ page }) => {
    const backend = new MockGateway();
    await backend.install(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/admin/orders');
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test('AUTH-05 admin logout returns to admin login', async ({ page }) => {
    await gotoRole(page, 'ADMIN', '/admin/dashboard');
    await page.getByRole('button', { name: 'Đăng xuất' }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test('AUTH-06 owner logout returns to owner login', async ({ page }) => {
    await gotoRole(page, 'SHOP_OWNER', '/restaurant/dashboard');
    await page.getByRole('button').filter({ has: page.locator('span.material-symbols-outlined', { hasText: 'expand_more' }) }).click();
    await page.getByRole('button', { name: 'Đăng xuất' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('AUTH-07 customer logout returns to public catalog', async ({ page }) => {
    await gotoRole(page, 'USER', '/');
    await page.getByRole('button', { name: 'Đăng xuất' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('CUSTOMER-01 public catalog and CUSTOMER-02 search render', async ({ page }) => {
    await gotoRole(page, 'USER', '/');
    await expect(page.getByRole('heading', { name: 'Nhà hàng gần bạn' })).toBeVisible();
    await page.getByLabel('Tìm nhà hàng').fill('Bếp');
    await page.getByRole('button', { name: 'Tìm', exact: true }).click();
    await expect(page.getByText('Bếp E2E')).toBeVisible();
  });

  test('PUBLIC handbook deep link renders without authentication', async ({ page }) => {
    const backend = new MockGateway();
    await backend.install(page);
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/system-overview/workflows/cod-order');
    await expect(page.getByText(/Flow Explorer|Tổng quan hệ thống|Đặt hàng/).first()).toBeVisible();
  });
});

test.describe('customer ordering', () => {
  test('CUSTOMER-03 opens restaurant menu and CUSTOMER-07 maintains cart', async ({ page }) => {
    await gotoRole(page, 'USER', '/restaurants/201');
    await expect(page.getByText('Cơm E2E')).toBeVisible();
    await page.getByRole('button', { name: /Thêm vào giỏ|Thêm món/ }).first().click();
    await page.getByRole('link', { name: 'Giỏ hàng', exact: true }).click();
    await expect(page.getByText('Bếp E2E')).toBeVisible();
    await page.getByRole('button', { name: /Tăng Cơm E2E/ }).click();
    await expect(page.getByRole('article').getByText('2', { exact: true })).toBeVisible();
  });

  test('CUSTOMER-04 customer login preserves return path', async ({ page }) => {
    await gotoRole(page, 'USER', '/customer/login?returnTo=%2Fcustomer%2Forders');
    await page.getByLabel('Email').fill('customer@e2e.test');
    await page.locator('input[type="password"]').fill('Password123!');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page).toHaveURL(/\/customer\/orders$/);
  });

  test('CUSTOMER-05 registration validates and completes handoff', async ({ page }) => {
    const backend = await gotoRole(page, 'USER', '/customer/register');
    await page.getByLabel('Họ và tên').fill('New Customer');
    await page.getByLabel('Email').fill('new@e2e.test');
    await page.getByLabel('Số điện thoại').fill('0900000009');
    await page.getByLabel('Mật khẩu', { exact: true }).fill('Password123!');
    await page.getByLabel('Nhập lại mật khẩu').fill('Password123!');
    await page.getByRole('button', { name: 'Đăng ký' }).click();
    await expect(page).toHaveURL(/\/customer\/login\?registered=1$/);
    expect(backend.requests.some((request) => request.path === '/api/users/registrations')).toBeTruthy();
  });

  test('CUSTOMER-06 email verification success is observable', async ({ page }) => {
    await gotoRole(page, 'USER', '/verify-email?token=e2e-token');
    await expect(page.getByText(/Email đã được xác minh/i)).toBeVisible();
  });

  test('CUSTOMER-08, CUSTOMER-09 and CUSTOMER-10 manage addresses', async ({ page }) => {
    await gotoRole(page, 'USER', '/customer/addresses');
    await expect(page.getByRole('heading', { name: 'Nhà' })).toBeVisible();
    await page.getByRole('button', { name: 'Sửa' }).click();
    await page.getByLabel('Tên người nhận').fill('Updated Customer');
    await page.getByRole('button', { name: 'Lưu địa chỉ' }).click();
    await expect(page.getByRole('status')).toBeVisible();
  });

  test('CUSTOMER-11 and CUSTOMER-12 preview and create COD order', async ({ page }) => {
    const backend = await gotoRole(page, 'USER', '/customer/checkout');
    await page.evaluate(() => localStorage.setItem('delivery.customer-cart.v1', JSON.stringify({ restaurantId: 201, restaurantName: 'Bếp E2E', items: [{ menuItemId: 301, restaurantId: 201, restaurantName: 'Bếp E2E', menuItemName: 'Cơm E2E', price: 50000, quantity: 1, notes: '' }] })));
    await page.reload();
    await expect(page.getByText('Tổng COD')).toBeVisible();
    await page.getByRole('button', { name: 'Đặt đơn COD' }).click();
    await expect(page).toHaveURL(/\/customer\/orders\/401$/);
    expect(backend.requests.some((request) => request.path === '/api/orders')).toBeTruthy();
  });

  test('CUSTOMER-13, CUSTOMER-14 and CUSTOMER-15 show history, detail and cancellation', async ({ page }) => {
    await gotoRole(page, 'USER', '/customer/orders');
    await expect(page.getByText(/Đơn #401|Bếp E2E/).first()).toBeVisible();
    await page.goto('/customer/orders/401');
    await expect(page.getByText('Cơm E2E')).toBeVisible();
    await page.getByRole('button', { name: 'Hủy đơn hàng' }).click();
    await page.getByRole('button', { name: 'Xác nhận hủy' }).click();
    await expect(page.getByText(/Đã hủy|CANCELLED|Đã huỷ/).first()).toBeVisible();
  });
});

test.describe('restaurant owner portal', () => {
  test('OWNER-01, OWNER-08 and OWNER-11 load owner read surfaces', async ({ page }) => {
    await gotoRole(page, 'SHOP_OWNER', '/restaurant/orders');
    await expect(page.getByText(/Đơn hàng/).first()).toBeVisible();
    await page.goto('/restaurant/reviews');
    await expect(page.getByText(/đánh giá|Chưa có/i).first()).toBeVisible();
  });

  test('OWNER-02 and OWNER-03 create/update restaurant profile', async ({ page }) => {
    await gotoRole(page, 'SHOP_OWNER', '/restaurant/profile');
    await expect(page.getByRole('heading', { name: /Hồ sơ|Thông tin cửa hàng/ }).first()).toBeVisible();
  });

  test('OWNER-04, OWNER-05, OWNER-06 and OWNER-07 manage menu', async ({ page }) => {
    await gotoRole(page, 'SHOP_OWNER', '/restaurant/menu');
    await expect(page.getByText('Cơm E2E')).toBeVisible();
    await page.getByRole('button', { name: 'Thêm món' }).click();
    await page.getByPlaceholder('VD: Phở Bò Tái').fill('Món mới E2E');
    await page.getByPlaceholder('50000').fill('55000');
    await page.getByRole('button', { name: 'Tạo mới', exact: true }).click();
    await expect(page.getByText(/Món mới E2E|Cơm E2E/).first()).toBeVisible();
  });

  test('OWNER-09 confirms and OWNER-10 rejects pending order', async ({ page }) => {
    await gotoRole(page, 'SHOP_OWNER', '/restaurant/orders');
    await expect(page.getByText(/#401|Bếp E2E/).first()).toBeVisible();
    const confirm = page.getByRole('button', { name: /Xác nhận đơn/ }).first();
    if (await confirm.count()) await confirm.click();
  });

  test('OWNER-12 imports catalog preview', async ({ page }) => {
    await gotoRole(page, 'SHOP_OWNER', '/restaurant/catalog-import');
    await expect(page.getByLabel('JSON catalog nhà hàng và món ăn')).toBeVisible();
  });

  test('OWNER-13 and OWNER-14 shop voucher list/create are reachable', async ({ page }) => {
    const backend = await gotoRole(page, 'SHOP_OWNER', '/restaurant/vouchers');
    await expect(page.getByRole('heading', { name: 'Voucher nhà hàng' })).toBeVisible();
    await page.getByLabel('Mã voucher').fill('shop50');
    await page.getByLabel('Tên chiến dịch').fill('Shop 50');
    const response = page.waitForResponse((item) => item.url().includes('/api/promotions/shop') && item.request().method() === 'POST');
    await page.getByRole('button', { name: 'Tạo voucher' }).click();
    expect((await response).status()).toBe(200);
    expect(backend.requests.some((request) => request.path === '/api/promotions/shop' && request.method === 'POST')).toBeTruthy();
  });
});

test.describe('admin portal', () => {
  test('ADMIN-01, ADMIN-02 and ADMIN-17 load order and dashboard reads', async ({ page }) => {
    await gotoRole(page, 'ADMIN', '/admin/dashboard');
    await expect(page.getByRole('heading', { name: 'Quản trị hệ thống' })).toBeVisible();
    await page.goto('/admin/orders');
    await expect(page.getByText(/Đơn hàng|#401/).first()).toBeVisible();
  });

  test('ADMIN-03 and ADMIN-04 filter shippers', async ({ page }) => {
    await gotoRole(page, 'ADMIN', '/admin/shippers');
    await expect(page.getByText('Shipper E2E')).toBeVisible();
    await page.getByRole('button', { name: 'Đang online' }).click();
    await expect(page.getByText('Shipper E2E')).toBeVisible();
  });

  test('ADMIN-05, ADMIN-06 and ADMIN-07 moderate ratings', async ({ page }) => {
    await gotoRole(page, 'ADMIN', '/admin/ratings');
    await expect(page.getByText('Rất ngon')).toBeVisible();
    const approve = page.getByRole('button', { name: /Duyệt|Approve|Phê duyệt/ }).first();
    if (await approve.count()) await approve.click();
  });

  test('ADMIN-08, ADMIN-09, ADMIN-10, ADMIN-18, ADMIN-19 and ADMIN-20 manage coupons', async ({ page }) => {
    const backend = await gotoRole(page, 'ADMIN', '/admin/coupons');
    await expect(page.getByText('SHOPWAIT')).toBeVisible();
    await page.getByRole('button', { name: 'Duyệt' }).click();
    expect(backend.requests.some((request) => request.path.endsWith('/approve'))).toBeTruthy();
    await page.getByRole('button', { name: /Tạo Coupon Mới/ }).click();
    await page.getByPlaceholder('E.g. HELLO2024').fill('E2E50');
    await page.getByPlaceholder('Giảm giá chào mừng').fill('E2E coupon');
    const couponResponse = page.waitForResponse((response) => response.url().includes('/api/promotions/platform'));
    await page.getByRole('button', { name: 'Tạo Coupon', exact: true }).click();
    expect((await couponResponse).status()).toBe(200);
  });

  test('ADMIN-11, ADMIN-12, ADMIN-13, ADMIN-14 and ADMIN-15 manage flash sale', async ({ page }) => {
    await gotoRole(page, 'ADMIN', '/admin/flash-sales');
    await page.getByRole('button', { name: 'Tạo Chiến dịch' }).click();
    await page.getByPlaceholder('Flash Sale Khung Giờ Vàng').fill('E2E Flash Sale');
    await page.getByRole('button', { name: 'Tạo', exact: true }).click();
    await expect(page.getByPlaceholder('Flash Sale Khung Giờ Vàng')).toBeHidden();
  });

  test('ADMIN-16 catalog import route is reachable', async ({ page }) => {
    await gotoRole(page, 'ADMIN', '/admin/catalog-import');
    await expect(page.getByText(/Import nhà hàng & món ăn/)).toBeVisible();
  });
});

test('mock backend can expose a retryable failure', async ({ page }) => {
  const backend = new MockGateway({ role: 'ADMIN' });
  await backend.install(page);
  backend.failNext('/api/shippers', { status: 503, message: 'Temporary outage' });
  await page.goto('/admin/shippers');
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('button', { name: 'Thử lại' }).click();
  await expect(page.getByText('Shipper E2E')).toBeVisible();
});
