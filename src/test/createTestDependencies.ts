import { vi } from 'vitest';
import {
  productionDependencies,
  type AppDependencies,
  type AuthServicePort,
  type AdminServicePort,
  type FlashSaleAdminServicePort,
  type MenuServicePort,
  type OrderServicePort,
  type RestaurantServicePort,
  type SessionStorePort,
  type NotificationPort,
} from '@/app/dependencies';
import { buildMenuItem, buildOrder, buildRestaurant, buildUser } from './builders';

export function createAuthFake(
  overrides: Partial<AuthServicePort> = {},
): AuthServicePort {
  const user = buildUser();
  return {
    getCurrentUser: vi.fn(() => null),
    getProfile: vi.fn(async () => user),
    hasRole: vi.fn(() => false),
    isAuthenticated: vi.fn(() => false),
    login: vi.fn(async () => ({
      accessToken: 'access.test.token',
      refreshToken: 'refresh.test.token',
      user,
    })),
    logout: vi.fn(async () => undefined),
    ...overrides,
  };
}

export function createRestaurantFake(
  overrides: Partial<RestaurantServicePort> = {},
): RestaurantServicePort {
  const restaurant = buildRestaurant();
  return {
    createRestaurant: vi.fn(async () => restaurant),
    getMyRestaurants: vi.fn(async () => [restaurant]),
    getRestaurantRatings: vi.fn(async () => []),
    updateRestaurant: vi.fn(async () => restaurant),
    ...overrides,
  };
}

export function createMenuFake(
  overrides: Partial<MenuServicePort> = {},
): MenuServicePort {
  const menuItem = buildMenuItem();
  return {
    createMenuItem: vi.fn(async () => menuItem),
    deleteMenuItem: vi.fn(async () => undefined),
    getMyMenuItems: vi.fn(async () => [menuItem]),
    updateMenuItem: vi.fn(async () => menuItem),
    ...overrides,
  };
}

export function createOrderFake(
  overrides: Partial<OrderServicePort> = {},
): OrderServicePort {
  const order = buildOrder();
  return {
    confirmOrder: vi.fn(async () => 'CONFIRMED'),
    getMyOrders: vi.fn(async () => ({
      items: [order],
      page: 0,
      size: 10,
      totalItems: 1,
      totalPages: 1,
      hasNext: false,
    })),
    getOrderById: vi.fn(async () => order),
    rejectOrder: vi.fn(async () => 'REJECTED'),
    ...overrides,
  };
}

export function createAdminFake(
  overrides: Partial<AdminServicePort> = {},
): AdminServicePort {
  return {
    createCoupon: vi.fn(async (data) => ({
      id: 801,
      code: data.code,
      name: data.name,
      description: data.description,
      rewardType: data.rewardType,
      discountValue: data.discountValue,
      maxDiscountValue: data.maxDiscountValue,
      totalQuantity: data.totalQuantity,
      usedQuantity: 0,
      startTime: data.startTime,
      endTime: data.endTime,
      minOrderValue: data.minOrderValue,
      active: true,
    })),
    deleteCoupon: vi.fn(async () => undefined),
    fetchAllCoupons: vi.fn(async () => []),
    fetchAllOrders: vi.fn(async () => ({
      items: [], page: 0, size: 20, totalItems: 0, totalPages: 0, hasNext: false,
    })),
    fetchAllRatings: vi.fn(async () => []),
    fetchAllShippers: vi.fn(async () => ({
      items: [], page: 0, size: 100, totalItems: 0, totalPages: 0, hasNext: false,
    })),
    fetchOnlineShippers: vi.fn(async () => []),
    fetchOrdersByStatus: vi.fn(async () => ({
      items: [], page: 0, size: 20, totalItems: 0, totalPages: 0, hasNext: false,
    })),
    updateRatingStatus: vi.fn(async (ratingId, status) => ({
      id: ratingId,
      restaurantId: 201,
      customerId: 501,
      orderId: 401,
      rating: 5,
      comment: 'Canonical rating fixture',
      status,
      createdAt: '2026-07-29T08:00:00Z',
    })),
    ...overrides,
  };
}

export function createFlashSaleAdminFake(
  overrides: Partial<FlashSaleAdminServicePort> = {},
): FlashSaleAdminServicePort {
  return {
    approveItem: vi.fn(async () => undefined),
    createCampaign: vi.fn(async (data) => ({
      id: 901,
      ...data,
      status: 'UPCOMING' as const,
    })),
    getAllCampaigns: vi.fn(async () => []),
    getCampaignItems: vi.fn(async () => []),
    updateCampaignStatus: vi.fn(async () => undefined),
    ...overrides,
  };
}

export function createNotificationFake(
  overrides: Partial<NotificationPort> = {},
): NotificationPort {
  return {
    success: vi.fn(),
    error: vi.fn(),
    ...overrides,
  };
}

export function createSessionStoreFake(
  overrides: Partial<SessionStorePort> = {},
): SessionStorePort {
  let currentRestaurantId: number | null = null;
  return {
    clearRestaurantId: vi.fn(() => {
      currentRestaurantId = null;
    }),
    getCurrentRestaurantId: vi.fn(() => currentRestaurantId),
    hasToken: vi.fn(() => false),
    setCurrentRestaurantId: vi.fn((restaurantId: number) => {
      currentRestaurantId = restaurantId;
    }),
    ...overrides,
  };
}

export function createTestDependencies(
  overrides: Partial<AppDependencies> = {},
): AppDependencies {
  return {
    ...productionDependencies,
    auth: createAuthFake(),
    restaurant: createRestaurantFake(),
    menu: createMenuFake(),
    order: createOrderFake(),
    admin: createAdminFake(),
    flashSaleAdmin: createFlashSaleAdminFake(),
    notifications: createNotificationFake(),
    clock: { now: vi.fn(() => new Date('2026-07-29T08:00:00Z')) },
    delay: { wait: vi.fn(async () => undefined) },
    sessionStore: createSessionStoreFake(),
    ...overrides,
  };
}
