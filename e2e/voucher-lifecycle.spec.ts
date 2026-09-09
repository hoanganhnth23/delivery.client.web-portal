import { expect, test } from '@playwright/test';
import { MockGateway } from './fixtures';

test('admin voucher lifecycle shows UTC dates, freeship and pause/resume', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const backend = new MockGateway({ role: 'ADMIN' });
  const coupon = {
    id: 951, code: 'SHIP15', name: 'Shipping discount', description: '',
    creatorType: 'PLATFORM', rewardType: 'FREESHIP', discountValue: 15000,
    maxDiscountValue: null, totalQuantity: 10, usedQuantity: 0,
    startTime: '2020-01-01T00:00:00', endTime: '2099-01-01T00:00:00',
    minOrderValue: 0, scopeType: 'ALL', scopeRefId: null,
    active: true, approvalStatus: 'APPROVED',
  };
  backend.queue('/api/promotions/admin', { data: [coupon] },
    { data: [{ ...coupon, active: false }] }, { data: [coupon] });
  backend.queue('/api/promotions/admin/pending-shop', { data: [] }, { data: [] }, { data: [] });
  backend.queue('/api/promotions/admin/951/pause', { data: { ...coupon, active: false } });
  backend.queue('/api/promotions/admin/951/resume', { data: coupon });
  await backend.install(page);
  await page.goto('/admin/coupons');
  await expect(page.getByText('Miễn phí vận chuyển', { exact: true })).toBeVisible();
  await expect(page.getByText('ĐANG CHẠY', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Tạm dừng coupon SHIP15' }).click();
  await expect(page.getByText('TẠM DỪNG', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Tiếp tục coupon SHIP15' }).click();
  await expect(page.getByText('ĐANG CHẠY', { exact: true })).toBeVisible();
  expect(backend.requests.filter((request) => request.path.endsWith('/pause'))).toHaveLength(1);
  expect(backend.requests.filter((request) => request.path.endsWith('/resume'))).toHaveLength(1);
  expect(errors).toEqual([]);
});
