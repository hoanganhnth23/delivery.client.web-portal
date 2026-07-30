import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AppDependencies } from '@/app/dependencies';
import { USER_ROLES } from '@/utils/constants';
import { buildRestaurant, buildUser } from '@/test/builders';
import {
  createAuthFake,
  createNotificationFake,
  createRestaurantFake,
  createSessionStoreFake,
  createTestDependencies,
} from '@/test/createTestDependencies';
import { renderApp } from '@/test/renderApp';

function ownerDependencies(overrides: Partial<AppDependencies> = {}) {
  const owner = buildUser({ role: USER_ROLES.RESTAURANT_OWNER });
  return createTestDependencies({
    auth: createAuthFake({
      isAuthenticated: vi.fn(() => true),
      getCurrentUser: vi.fn(() => owner),
      getProfile: vi.fn(async () => owner),
    }),
    restaurant: createRestaurantFake(),
    sessionStore: createSessionStoreFake({
      hasToken: vi.fn(() => true),
      getCurrentRestaurantId: vi.fn(() => 201),
    }),
    ...overrides,
  });
}

describe('restaurant secondary routes', () => {
  it('exposes every supported dashboard destination as a routed link', async () => {
    renderApp({
      route: '/restaurant/dashboard',
      dependencies: ownerDependencies(),
    });

    expect(await screen.findAllByRole('heading', { name: 'Bếp test' }))
      .not.toHaveLength(0);
    const destinations = [
      [/Đơn hàng/, '/restaurant/orders'],
      [/Thực đơn|Quản lý Menu/, '/restaurant/menu'],
      [/Hồ sơ cửa hàng/, '/restaurant/profile'],
      [/Đánh giá/, '/restaurant/reviews'],
    ] as const;
    for (const [name, href] of destinations) {
      expect(screen.getAllByRole('link', { name }).some(
        (link) => link.getAttribute('href') === href,
      )).toBe(true);
    }
  });

  it('renders approved reviews from the injected restaurant service', async () => {
    const getRestaurantRatings = vi.fn(async () => [{
      id: 801,
      restaurantId: 201,
      customerId: 501,
      orderId: 401,
      rating: 5,
      comment: 'Món ăn rất ngon',
      status: 'APPROVED' as const,
      createdAt: '2026-07-29T08:00:00Z',
    }]);

    renderApp({
      route: '/restaurant/reviews',
      dependencies: ownerDependencies({
        restaurant: createRestaurantFake({
          getMyRestaurants: vi.fn(async () => [buildRestaurant()]),
          getRestaurantRatings,
        }),
      }),
    });

    expect(await screen.findByText('Món ăn rất ngon')).toBeInTheDocument();
    expect(getRestaurantRatings).toHaveBeenCalledWith(201);
  });

  it('shows a truthful review-load error and retries through the same public action', async () => {
    const user = userEvent.setup();
    const notifications = createNotificationFake();
    const getRestaurantRatings = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([]);

    renderApp({
      route: '/restaurant/reviews',
      dependencies: ownerDependencies({
        restaurant: createRestaurantFake({ getRestaurantRatings }),
        notifications,
      }),
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không thể tải danh sách đánh giá.',
    );
    expect(notifications.error).toHaveBeenCalledWith(
      'Lỗi khi tải danh sách đánh giá',
    );

    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    await waitFor(() => expect(getRestaurantRatings).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Chưa có đánh giá nào được duyệt hiển thị.'))
      .toBeInTheDocument();
  });
});
