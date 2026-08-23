import { describe, expect, it } from 'vitest';
import { API_ENDPOINTS } from '../endpoints';
import { ROUTES } from '@/utils/constants';

describe('customer checkout capability boundary', () => {
  it('exposes only the canonical COD customer checkout contracts', () => {
    expect(ROUTES.CUSTOMER_CHECKOUT).toBe('/customer/checkout');
    expect(API_ENDPOINTS.ORDER.CHECKOUT_PREVIEW).toBe('/api/orders/checkout-preview');
    expect(API_ENDPOINTS.ORDER.CREATE).toBe('/api/orders');
    expect(API_ENDPOINTS.PROMOTION.CAPABILITY).toBe('/api/promotions/capability');
    expect(API_ENDPOINTS.PROMOTION.MY_VOUCHERS).toBe('/api/promotions/my-vouchers');
    expect(JSON.stringify(API_ENDPOINTS)).not.toContain('/reserve');
    expect(JSON.stringify(API_ENDPOINTS.FLASHSALE)).not.toContain('/merchant/items');
  });
});
