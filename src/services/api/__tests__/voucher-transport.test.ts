import { afterEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../apiClient';
import adminService from '../adminService';
import { createShopVoucher } from '../promotionService';
import { buildAdminCoupon } from '@/test/builders';

afterEach(() => vi.restoreAllMocks());
describe('voucher creation transport', () => {
  it('reads coupons with an empty optional description', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { status: 1, message: null,
      data: [buildAdminCoupon({ description: '' })] } });
    await expect(adminService.fetchAllCoupons()).resolves.toEqual([
      expect.objectContaining({ description: '' }),
    ]);
  });
  it.each(['admin', 'shop'])('converts %s local dates and reads UTC responses', async (kind) => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { status: 1, message: null, data: buildAdminCoupon({ endTime: '2026-09-10T02:30:00' }) } });
    const request = { code: 'TEST', name: 'Test', description: '', rewardType: 'FIXED' as const, discountValue: 10, maxDiscountValue: null, totalQuantity: 10, usageLimitPerUser: 1, startTime: '2026-09-09T09:30', endTime: '2026-09-10T09:30', minOrderValue: 0, scopeType: 'ALL' as const, scopeRefId: null, restaurantId: 1 };
    const result = await (kind === 'admin' ? adminService.createCoupon(request) : createShopVoucher(request));
    expect(post.mock.calls[0][1]).toMatchObject({ startTime: new Date(request.startTime).toISOString().slice(0, -1), endTime: new Date(request.endTime).toISOString().slice(0, -1) });
    expect(result.endTime).toBe('2026-09-10T02:30:00.000Z');
  });
});
