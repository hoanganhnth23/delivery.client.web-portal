import { expect, test } from '@playwright/test';

test.describe('real Gateway disposable sandbox smoke', () => {
  test.skip(process.env.E2E_LIVE !== 'true', 'Live smoke runs only through scripts/run-live-e2e.sh');

  const password = process.env.E2E_LIVE_PASSWORD ?? 'Password123!';
  const customerEmail = process.env.E2E_LIVE_CUSTOMER_EMAIL;
  const ownerEmail = process.env.E2E_LIVE_OWNER_EMAIL;
  const adminEmail = process.env.E2E_LIVE_ADMIN_EMAIL;
  const restaurantId = process.env.E2E_LIVE_RESTAURANT_ID;

  const apiResponse = (page: import('@playwright/test').Page, path: string, method = 'GET') =>
    page.waitForResponse((response) => {
      const url = new URL(response.url());
      return url.pathname === path && response.request().method() === method;
    });

  test('customer can authenticate and open the seeded restaurant', async ({ page }) => {
    test.skip(!customerEmail || !restaurantId, 'Seed credentials are missing');
    await page.goto(`/customer/login?returnTo=${encodeURIComponent(`/restaurants/${restaurantId}`)}`);
    await page.getByLabel('Email').fill(customerEmail!);
    await page.locator('input[type="password"]').fill(password);
    const loginResponse = apiResponse(page, '/bff/session/login', 'POST');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect((await loginResponse).status()).toBe(200);
    await expect(page).toHaveURL(new RegExp(`/restaurants/${restaurantId}$`));
    await expect(page.getByText('Cơm gà')).toBeVisible();
  });

  test('invalid customer credentials stay on login with an unauthorized response', async ({ page }) => {
    test.skip(!customerEmail, 'Seed credentials are missing');
    await page.goto('/customer/login');
    await page.getByLabel('Email').fill(customerEmail!);
    await page.locator('input[type="password"]').fill(`${password}-invalid`);
    const loginResponse = apiResponse(page, '/bff/session/login', 'POST');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect((await loginResponse).status()).toBe(401);
    await expect(page).toHaveURL(/\/customer\/login$/);
    await expect(page.getByRole('alert')).toHaveText('Invalid email or password');
  });

  test('restaurant owner can authenticate and reach the owner portal', async ({ page }) => {
    test.skip(!ownerEmail, 'Seed credentials are missing');
    await page.goto('/login');
    await page.getByLabel('Email').fill(ownerEmail!);
    await page.locator('input[type="password"]').fill(password);
    const loginResponse = apiResponse(page, '/bff/session/login', 'POST');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect((await loginResponse).status()).toBe(200);
    await expect(page).toHaveURL(/\/restaurant\/dashboard$/);
    await expect(page.getByRole('heading', { name: /Quản lý nhà hàng|Tổng quan/ })).toBeVisible();
  });

  test('operator-provisioned admin can authenticate and reach the admin portal', async ({ page }) => {
    test.skip(!adminEmail, 'Admin provisioning credentials are missing');
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(adminEmail!);
    await page.locator('input[type="password"]').fill(password);
    const loginResponse = apiResponse(page, '/bff/session/login', 'POST');
    await page.getByRole('button', { name: 'Đăng nhập admin' }).click();
    await expect((await loginResponse).status()).toBe(200);
    await expect(page).toHaveURL(/\/admin\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Quản trị hệ thống' })).toBeVisible();
  });
});
