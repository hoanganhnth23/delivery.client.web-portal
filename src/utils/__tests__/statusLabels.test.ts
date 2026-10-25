import { describe, expect, it } from 'vitest';
import { approvalLabel, campaignLabel, livestreamLabel, voucherLayerLabel } from '../statusLabels';

describe('status labels', () => {
  it('translates known codes and passes unknown ones through', () => {
    expect(approvalLabel('PENDING')).toBe('Chờ duyệt');
    expect(campaignLabel('UPCOMING')).toBe('Sắp diễn ra');
    expect(livestreamLabel('LIVE')).toBe('Đang phát');
    expect(voucherLayerLabel('SHOP_DISCOUNT')).toBe('Giảm quán ăn');
    expect(approvalLabel('NEW_CODE')).toBe('NEW_CODE');
  });
});
