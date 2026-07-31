import { describe, expect, it } from 'vitest';
import { API_ENDPOINTS } from '../endpoints';
import { ROUTES } from '@/utils/constants';

describe('portal checkout capability boundary', () => {
  it('keeps customer checkout and internal reservation contracts out of Web', () => {
    expect(Object.values(ROUTES)).not.toContain('/checkout');
    expect(JSON.stringify(API_ENDPOINTS)).not.toContain('/reserve');
    expect(JSON.stringify(API_ENDPOINTS.FLASHSALE)).not.toContain('/merchant/items');
  });
});
