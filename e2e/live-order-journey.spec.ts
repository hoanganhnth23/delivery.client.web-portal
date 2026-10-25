import { expect, test, type APIRequestContext, type Browser, type Page } from '@playwright/test';

// One real COD order through the browser against the local E2E stack
// (delivery.devops.gitops/local/e2e). Customer orders on the web, the owner
// confirms on the dashboard, the shipper (no web UI) acts through the Gateway
// API, the admin finds the order, and the customer sees it delivered.
test.describe('live COD order journey', () => {
  test.skip(process.env.E2E_LIVE !== 'true', 'Live journey runs only through scripts/run-live-e2e.sh');
  test.setTimeout(6 * 60_000);

  const password = process.env.E2E_LIVE_PASSWORD ?? 'Password123!';
  const gateway = process.env.E2E_LIVE_GATEWAY_URL;
  const customerEmail = process.env.E2E_LIVE_CUSTOMER_EMAIL;
  const ownerEmail = process.env.E2E_LIVE_OWNER_EMAIL;
  const adminEmail = process.env.E2E_LIVE_ADMIN_EMAIL;
  const shipperEmail = process.env.E2E_LIVE_SHIPPER_EMAIL;
  const restaurantId = process.env.E2E_LIVE_RESTAURANT_ID;

  const loginThroughBff = async (page: Page, path: string, email: string, button: string) => {
    await page.goto(path);
    await page.getByLabel('Email').fill(email);
    await page.locator('input[type="password"]').fill(password);
    const login = page.waitForResponse((r) => new URL(r.url()).pathname === '/bff/session/login');
    await page.getByRole('button', { name: button }).click();
    expect((await login).status()).toBe(200);
  };

  const asRole = async (browser: Browser) => (await browser.newContext()).newPage();

  const shipperApi = async (request: APIRequestContext) => {
    const login = await request.post(`${gateway}/api/auth/login`, {
      data: { email: shipperEmail, password, deviceId: 'web-live-shipper', deviceName: 'E2E', deviceType: 'WEB' },
    });
    expect(login.status()).toBe(200);
    const body = await login.json();
    const token: string = body.accessToken ?? body.data?.accessToken;
    return { Authorization: `Bearer ${token}` };
  };

  test('customer orders on web, owner confirms, shipper delivers, admin and customer see it', async ({ page, browser, request }) => {
    test.skip(!gateway || !customerEmail || !ownerEmail || !adminEmail || !shipperEmail || !restaurantId,
      'Fixture from local/e2e/scripts/prepare-web.sh is missing');

    // 1. Customer: restaurant -> cart -> checkout -> COD order.
    await loginThroughBff(page, `/customer/login?returnTo=${encodeURIComponent(`/restaurants/${restaurantId}`)}`,
      customerEmail!, 'Đăng nhập');
    await expect(page).toHaveURL(new RegExp(`/restaurants/${restaurantId}$`));
    await expect(page.getByText('Cơm gà').first()).toBeVisible();
    await page.getByRole('button', { name: /Thêm vào giỏ|Thêm món/ }).first().click();
    await page.getByRole('link', { name: 'Giỏ hàng', exact: true }).click();
    await page.getByRole('link', { name: 'Tiếp tục checkout' }).click();
    await expect(page.getByText('Tổng COD')).toBeVisible();
    await page.getByRole('button', { name: 'Đặt đơn COD' }).click();
    await expect(page).toHaveURL(/\/customer\/orders\/\d+$/, { timeout: 30_000 });
    const orderId = page.url().match(/\/customer\/orders\/(\d+)$/)![1];
    await expect(page.getByText('Chờ nhà hàng xác nhận').first()).toBeVisible();

    // 2. Owner confirms on the restaurant dashboard.
    const owner = await asRole(browser);
    await loginThroughBff(owner, '/login', ownerEmail!, 'Đăng nhập');
    await owner.goto('/restaurant/orders');
    await owner.getByRole('button', { name: `Xác nhận đơn #${orderId}` }).click();
    await expect(owner.getByRole('button', { name: `Xác nhận đơn #${orderId}` })).toHaveCount(0, { timeout: 30_000 });

    // 3. Shipper receives the offer, accepts and delivers (Gateway API, as the app would).
    const headers = await shipperApi(request);
    let deliveryId: number | undefined;
    await expect.poll(async () => {
      const offer = await (await request.get(`${gateway}/api/deliveries/offers/current`, { headers })).json().catch(() => ({}));
      if (String(offer?.data?.orderId) === orderId && offer?.data?.status === 'WAIT_SHIPPER_CONFIRM') {
        deliveryId = offer.data.deliveryId;
      }
      return deliveryId;
    }, { timeout: 120_000, intervals: [2_000] }).toBeTruthy();
    const accept = await request.post(`${gateway}/api/deliveries/accept`, {
      headers, data: { orderId: Number(orderId), action: 'ACCEPT', currentLat: 20.9717, currentLng: 105.777 },
    });
    expect(accept.status()).toBe(200);
    for (const status of ['PICKED_UP', 'DELIVERING', 'DELIVERED']) {
      const update = await request.put(`${gateway}/api/deliveries/${deliveryId}/status?status=${status}`, { headers });
      expect(update.status(), `shipper marks ${status}`).toBe(200);
    }

    // 4. Admin finds the order in the system-wide list.
    const admin = await asRole(browser);
    await loginThroughBff(admin, '/admin/login', adminEmail!, 'Đăng nhập admin');
    await admin.goto('/admin/orders');
    await admin.getByLabel('Tìm kiếm đơn hàng').fill(orderId);
    await expect(admin.getByRole('cell', { name: `#${orderId}`, exact: true })).toBeVisible({ timeout: 30_000 });

    // 5. The customer's open order page converges to delivered (it polls every 10 s).
    await expect(page.getByRole('heading', { name: 'Giao hàng thành công' })).toBeVisible({ timeout: 90_000 });
  });
});
