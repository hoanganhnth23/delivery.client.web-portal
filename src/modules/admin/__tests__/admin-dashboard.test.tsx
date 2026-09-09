import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { USER_ROLES } from '@/utils/constants';
import { buildUser } from '@/test/builders';
import { createAuthFake, createTestDependencies } from '@/test/createTestDependencies';
import { renderApp } from '@/test/renderApp';

describe('admin dashboard routes', () => {
  it('exposes every supported MVP console destination', async () => {
    const admin = buildUser({ role: USER_ROLES.ADMIN, name: 'Admin Test' });
    renderApp({
      route: '/admin/dashboard',
      dependencies: createTestDependencies({
        auth: createAuthFake({
          isAuthenticated: vi.fn(() => true),
          getCurrentUser: vi.fn(() => admin),
          getProfile: vi.fn(async () => admin),
        }),
      }),
    });

    expect(await screen.findByRole('heading', { name: 'Quản trị hệ thống' }))
      .toBeInTheDocument();
    const destinations = [
      ['Đơn hàng', '/admin/orders'],
      ['Chat CSKH', '/admin/chat'],
      ['Shipper', '/admin/shippers'],
      ['Đánh giá', '/admin/ratings'],
      ['Coupon', '/admin/coupons'],
      ['Flash Sale', '/admin/flash-sales'],
    ];
    for (const [name, href] of destinations) {
      expect(screen.getAllByRole('link', { name: new RegExp(name) }).some(
        (link) => link.getAttribute('href') === href,
      )).toBe(true);
    }
  });
});
