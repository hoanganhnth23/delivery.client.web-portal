import { expect, test, type APIRequestContext, type Browser, type BrowserContext, type Page } from '@playwright/test';

type StorageState = Awaited<ReturnType<BrowserContext['storageState']>>;

// Branches of the order journey through the real portals against the local E2E
// stack (delivery.devops.gitops/local/e2e): the owner rejects, the customer
// cancels, the owner reprices a dish, and the admin lists see seeded data.
test.describe('live portal branches', () => {
  test.skip(process.env.E2E_LIVE !== 'true', 'Live specs run only through scripts/run-live-e2e.sh');
  test.setTimeout(4 * 60_000);

  const password = process.env.E2E_LIVE_PASSWORD ?? 'Password123!';
  const gateway = process.env.E2E_LIVE_GATEWAY_URL;
  const customerEmail = process.env.E2E_LIVE_CUSTOMER_EMAIL;
  const ownerEmail = process.env.E2E_LIVE_OWNER_EMAIL;
  const adminEmail = process.env.E2E_LIVE_ADMIN_EMAIL;
  const restaurantId = process.env.E2E_LIVE_RESTAURANT_ID;
  const dish = 'Cơm gà sốt nấm';
  const restaurantName = 'Quán Test HÀ ĐÔNG';

  test.beforeEach(() => {
    test.skip(!gateway || !customerEmail || !ownerEmail || !adminEmail || !restaurantId,
      'Fixture from local/e2e/scripts/prepare-web.sh is missing');
  });

  // Public auth is limited to 10 logins/min per client and every BFF login
  // reaches the Gateway from one address, so each role signs in once for the
  // file and the tests reuse its session cookie.
  const loginThroughBff = async (page: Page, path: string, email: string, button: string) => {
    for (let attempt = 1; ; attempt++) {
      await page.goto(path);
      await page.getByLabel('Email').fill(email);
      await page.locator('input[type="password"]').fill(password);
      const login = page.waitForResponse((r) => new URL(r.url()).pathname === '/bff/session/login',
        { timeout: 120_000 });
      await page.getByRole('button', { name: button }).click();
      const status = (await login).status();
      if (status === 200) return;
      expect(attempt, `login ${email} returned ${status}`).toBeLessThan(3);
      await page.waitForTimeout(30_000);
    }
  };

  const sessions: Record<'customer' | 'owner' | 'admin', StorageState | undefined> =
    { customer: undefined, owner: undefined, admin: undefined };
  test.beforeAll(async ({ browser }) => {
    test.setTimeout(6 * 60_000);
    if (!gateway || !customerEmail || !ownerEmail || !adminEmail || !restaurantId) return;
    const signIn = async (path: string, email: string, button: string) => {
      const context = await browser.newContext();
      await loginThroughBff(await context.newPage(), path, email, button);
      const state = await context.storageState();
      await context.close();
      return state;
    };
    sessions.customer = await signIn(`/customer/login?returnTo=${encodeURIComponent('/')}`, customerEmail, 'Đăng nhập');
    sessions.owner = await signIn('/login', ownerEmail, 'Đăng nhập');
    sessions.admin = await signIn('/admin/login', adminEmail, 'Đăng nhập admin');
  });

  const as = async (browser: Browser, role: keyof typeof sessions) =>
    (await browser.newContext({ storageState: sessions[role] })).newPage();

  const placeCodOrder = async (page: Page) => {
    await page.goto(`/restaurants/${restaurantId}`);
    await expect(page.getByText(dish).first()).toBeVisible();
    await page.getByRole('button', { name: /Thêm vào giỏ|Thêm món/ }).first().click();
    await page.getByRole('link', { name: 'Giỏ hàng', exact: true }).click();
    await page.getByRole('link', { name: 'Tiếp tục checkout' }).click();
    await page.getByRole('button', { name: 'Đặt đơn COD' }).click();
    await expect(page).toHaveURL(/\/customer\/orders\/\d+$/, { timeout: 30_000 });
    return page.url().match(/\/customer\/orders\/(\d+)$/)![1];
  };

  const dishPrice = async (request: APIRequestContext) => {
    const menu = await (await request.get(`${gateway}/api/menu-items/restaurant/${restaurantId}`)).json();
    const item = (menu.data as Array<{ name: string; price: number }>).find((i) => i.name === dish);
    expect(item, `${dish} is on the public menu`).toBeTruthy();
    return item!.price;
  };
  const vnd = (value: number) => new RegExp(`${value.toLocaleString('de-DE')}\\s*₫`);

  test('W1 owner rejects on the dashboard, the customer sees the order cancelled with the reason', async ({ browser }) => {
    const page = await as(browser, 'customer');
    const orderId = await placeCodOrder(page);
    const owner = await as(browser, 'owner');
    await owner.goto('/restaurant/orders');
    owner.once('dialog', (dialog) => void dialog.accept('Hết nguyên liệu (e2e)'));
    await owner.getByRole('button', { name: `Từ chối đơn #${orderId}` }).click();
    await expect(owner.getByRole('button', { name: `Từ chối đơn #${orderId}` })).toHaveCount(0, { timeout: 30_000 });

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Đã hủy' })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/Lý do hủy:.*Hết nguyên liệu/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hủy đơn hàng' })).toHaveCount(0);
  });

  test('W2 customer cancels on the order page, the owner can no longer confirm it', async ({ browser }) => {
    const page = await as(browser, 'customer');
    const orderId = await placeCodOrder(page);
    await page.getByRole('button', { name: 'Hủy đơn hàng' }).click();
    await page.getByPlaceholder(/Vui lòng nhập lý do hủy đơn/).fill('Đặt nhầm (e2e)');
    await page.getByRole('button', { name: 'Xác nhận hủy' }).click();
    await expect(page.getByRole('heading', { name: 'Đã hủy' })).toBeVisible({ timeout: 30_000 });

    const owner = await as(browser, 'owner');
    await owner.goto('/restaurant/orders');
    await expect(owner.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(owner.getByRole('button', { name: `Xác nhận đơn #${orderId}` })).toHaveCount(0);
  });

  test('W3 owner reprices a dish on the menu page, the customer sees and pays the new price', async ({ browser, request }) => {
    const before = await dishPrice(request);
    const after = before + 5_000;
    const owner = await as(browser, 'owner');
    const setPrice = async (price: number) => {
      await owner.goto('/restaurant/menu');
      await owner.getByRole('button', { name: `Sửa ${dish}` }).click();
      await owner.locator('#menu-price').fill(String(price));
      await owner.getByRole('button', { name: 'Cập nhật' }).click();
      await expect.poll(() => dishPrice(request), { timeout: 30_000 }).toBe(price);
    };
    const page = await as(browser, 'customer');
    try {
      await setPrice(after);
      await page.goto(`/restaurants/${restaurantId}`);
      await expect(page.getByText(vnd(after)).first()).toBeVisible({ timeout: 30_000 });
      await page.getByRole('button', { name: /Thêm vào giỏ|Thêm món/ }).first().click();
      await page.getByRole('link', { name: 'Giỏ hàng', exact: true }).click();
      await expect(page.getByText(vnd(after)).first()).toBeVisible();
    } finally {
      await setPrice(before);
    }
  });

  test('W4 admin lists show the seeded restaurant, shippers and a searched order', async ({ browser }) => {
    const page = await as(browser, 'customer');
    const orderId = await placeCodOrder(page);
    const admin = await as(browser, 'admin');

    await admin.goto('/admin/restaurants');
    await expect(admin.getByRole('heading', { level: 1, name: 'Quản lý nhà hàng' })).toBeVisible();
    await expect(admin.getByRole('heading', { name: restaurantName }).first()).toBeVisible({ timeout: 30_000 });

    await admin.goto('/admin/shippers');
    await expect(admin.getByRole('heading', { name: 'Quản lý Shipper' })).toBeVisible();
    await expect(admin.getByText(/Shipper Test/).first()).toBeVisible({ timeout: 30_000 });

    await admin.goto('/admin/orders');
    await admin.getByLabel('Tìm kiếm đơn hàng').fill(orderId);
    await expect(admin.getByRole('cell', { name: `#${orderId}`, exact: true })).toBeVisible({ timeout: 30_000 });

    // Leave nothing pending for later specs.
    await page.getByRole('button', { name: 'Hủy đơn hàng' }).click();
    await page.getByPlaceholder(/Vui lòng nhập lý do hủy đơn/).fill('Dọn dẹp (e2e)');
    await page.getByRole('button', { name: 'Xác nhận hủy' }).click();
    await expect(page.getByRole('heading', { name: 'Đã hủy' })).toBeVisible({ timeout: 30_000 });
  });
});
