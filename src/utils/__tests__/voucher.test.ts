import { describe, expect, it } from 'vitest';
import { voucherLifecycle, voucherDate, voucherLocalToUtc } from '../voucher';

describe('voucher UTC-naive contract', () => {
  it('converts local input to UTC without a zone suffix', () => {
    const local = '2026-09-09T09:30';
    expect(voucherLocalToUtc(local)).toBe(new Date(local).toISOString().slice(0, -1));
  });
  it('interprets naive responses as UTC and preserves explicit offsets', () => {
    expect(voucherDate('2026-09-09T02:30:00').toISOString()).toBe('2026-09-09T02:30:00.000Z');
    expect(voucherDate('2026-09-09T09:30:00+07:00').toISOString()).toBe('2026-09-09T02:30:00.000Z');
  });
});

describe('voucher lifecycle', () => {
  const now = new Date('2026-09-09T12:00:00Z');
  const base = { approvalStatus: 'APPROVED', active: true, startTime: '2026-09-09T11:00:00', endTime: '2026-09-09T13:00:00', totalQuantity: 10, usedQuantity: 0 };
  it.each([
    [{}, 'ĐANG CHẠY'],
    [{ approvalStatus: 'PENDING' }, 'CHỜ DUYỆT'],
    [{ approvalStatus: 'REJECTED' }, 'ĐÃ TỪ CHỐI'],
    [{ active: false }, 'TẠM DỪNG'],
    [{ startTime: '2026-09-09T12:00:01' }, 'CHƯA BẮT ĐẦU'],
    [{ endTime: '2026-09-09T11:59:59' }, 'HẾT HẠN'],
    [{ usedQuantity: 10 }, 'HẾT LƯỢT'],
    [{ endTime: 'invalid' }, 'KHÔNG HỢP LỆ'],
    [{ endTime: '2026-09-09T12:00:00' }, 'HẾT HẠN'],
  ])('derives %j', (patch, expected) => {
    expect(voucherLifecycle({ ...base, ...patch }, now)).toBe(expected);
  });
});
