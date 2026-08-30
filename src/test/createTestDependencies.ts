import { vi } from 'vitest';
import {
  productionDependencies,
  type AppDependencies,
  type AuthServicePort,
  type AdminServicePort,
  type FlashSaleAdminServicePort,
  type MenuServicePort,
  type OrderServicePort,
  type PromotionServicePort,
  type RestaurantServicePort,
  type AddressServicePort,
  type SessionStorePort,
  type NotificationPort,
  type LivestreamHostServicePort,
} from '@/app/dependencies';
import { buildMenuItem, buildOrder, buildRestaurant, buildUser } from './builders';

export function createAuthFake(
  overrides: Partial<AuthServicePort> = {},
): AuthServicePort {
  const user = buildUser();
  const getProfile = overrides.getProfile ?? vi.fn(async () => user);
  return {
    getCurrentUser: vi.fn(() => null),
    getProfile,
    hasRole: vi.fn(() => false),
    hasStoredSession: vi.fn(() => false),
    isAuthenticated: vi.fn(() => false),
    login: vi.fn(async () => ({
      accessToken: 'access.test.token',
      refreshToken: 'refresh.test.token',
      user,
    })),
    registerCustomer: vi.fn(async () => ({
      principalId: user.id,
      profileCreated: true,
      lifecycleStatus: 'PENDING_EMAIL_VERIFICATION',
    })),
    getRegistrationStatus: vi.fn(async () => ({
      principalId: user.id,
      status: 'PENDING_EMAIL_VERIFICATION',
      nextAction: 'VERIFY_EMAIL',
      profileLinked: true,
    })),
    requestEmailVerification: vi.fn(async () => undefined),
    confirmEmailVerification: vi.fn(async () => undefined),
    logout: vi.fn(async () => undefined),
    restoreSession: vi.fn(async () => getProfile()),
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
    getAllRestaurants: vi.fn(async () => [restaurant]),
    searchRestaurants: vi.fn(async () => [restaurant]),
    getRestaurantById: vi.fn(async () => restaurant),
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
    getMenuItemsByRestaurant: vi.fn(async () => [menuItem]),
    updateMenuItem: vi.fn(async () => menuItem),
    ...overrides,
  };
}

export function createOrderFake(
  overrides: Partial<OrderServicePort> = {},
): OrderServicePort {
  const order = buildOrder();
  return {
    confirmOrder: vi.fn(async () => 'CONFIRMED' as const),
    checkoutPreview: vi.fn(async () => ({
      quoteId: '00000000-0000-4000-8000-000000000001',
      expiresAt: '2026-07-29T08:05:00Z',
      restaurantId: 201,
      restaurantName: 'Bếp test',
      items: [{ menuItemId: 301, menuItemName: 'Cơm test', unitPrice: 50_000, quantity: 1, lineTotal: 50_000 }],
      subtotal: 50_000,
      shippingFee: 15_000,
      discountAmount: 0,
      totalPrice: 65_000,
      priceChanges: [],
      unavailableItemIds: [],
    })),
    createCustomerOrder: vi.fn(async () => ({ order, idempotencyKey: '00000000-0000-4000-8000-000000000002' })),
    cancelOrder: vi.fn(async () => ({ ...order, status: 'CANCELLED' as const })),
    getCustomerOrders: vi.fn(async () => ({
      items: [order],
      page: 0,
      size: 10,
      totalItems: 1,
      totalPages: 1,
      hasNext: false,
    })),
    getMyOrders: vi.fn(async () => ({
      items: [order],
      page: 0,
      size: 10,
      totalItems: 1,
      totalPages: 1,
      hasNext: false,
    })),
    getOrderById: vi.fn(async () => order),
    rejectOrder: vi.fn(async () => 'REJECTED' as const),
    ...overrides,
  };
}

export function createPromotionFake(
  overrides: Partial<PromotionServicePort> = {},
): PromotionServicePort {
  return {
    getMyVouchers: vi.fn(async () => []),
    getVoucherCapability: vi.fn(async () => ({
      enabled: false,
      maxVouchers: 3,
      layers: ['SHOP_DISCOUNT', 'PLATFORM_DISCOUNT', 'FREESHIP'],
      selectionModes: ['AUTO', 'MANUAL'],
      conflictsWithFlashSale: true,
    })),
    collectVoucher: vi.fn(async () => undefined),
    createShopVoucher: vi.fn(async (data) => ({
      id: 802,
      code: data.code,
      name: data.name,
      description: data.description ?? '',
      creatorType: 'SHOP' as const,
      rewardType: data.rewardType,
      discountValue: data.discountValue,
      maxDiscountValue: data.maxDiscountValue ?? null,
      minOrderValue: data.minOrderValue,
      scopeType: 'SHOP' as const,
      scopeRefId: data.restaurantId,
      active: false,
      layer: 'SHOP_DISCOUNT' as const,
      fundingSource: 'SHOP' as const,
      approvalStatus: 'PENDING',
    })),
    listShopVouchers: vi.fn(async () => []),
    ...overrides,
  };
}

export function createAddressFake(
  overrides: Partial<AddressServicePort> = {},
): AddressServicePort {
  const address = {
    id: 1001,
    userId: 101,
    label: 'Nhà',
    recipientName: 'Customer Test',
    phoneNumber: '0900000002',
    addressLine: '2 Đường Khách',
    ward: 'Phường Bến Nghé',
    district: 'Quận 1',
    city: 'TP.HCM',
    latitude: 10.78,
    longitude: 106.71,
    isDefault: true,
  };
  return {
    getUserAddresses: vi.fn(async () => [address]),
    createAddress: vi.fn(async () => address),
    updateAddress: vi.fn(async () => address),
    deleteAddress: vi.fn(async () => undefined),
    setDefaultAddress: vi.fn(async () => address),
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
      creatorType: 'PLATFORM' as const,
      rewardType: data.rewardType,
      discountValue: data.discountValue,
      maxDiscountValue: data.maxDiscountValue,
      totalQuantity: data.totalQuantity,
      usedQuantity: 0,
      startTime: data.startTime,
      endTime: data.endTime,
      minOrderValue: data.minOrderValue,
      scopeType: data.scopeType,
      scopeRefId: data.scopeRefId,
      active: true,
    })),
    deleteCoupon: vi.fn(async () => undefined),
    fetchPendingShopCoupons: vi.fn(async () => []),
    approveShopCoupon: vi.fn(async (id) => ({
      id, code: 'SHOP', name: 'Shop', description: '', creatorType: 'SHOP' as const,
      rewardType: 'FIXED', discountValue: 0, maxDiscountValue: null, totalQuantity: 1,
      usedQuantity: 0, startTime: '2026-07-29T08:00:00Z', endTime: '2026-07-30T08:00:00Z',
      minOrderValue: 0, scopeType: 'SHOP' as const, scopeRefId: 201, active: true,
    })),
    rejectShopCoupon: vi.fn(async (id) => ({
      id, code: 'SHOP', name: 'Shop', description: '', creatorType: 'SHOP' as const,
      rewardType: 'FIXED', discountValue: 0, maxDiscountValue: null, totalQuantity: 1,
      usedQuantity: 0, startTime: '2026-07-29T08:00:00Z', endTime: '2026-07-30T08:00:00Z',
      minOrderValue: 0, scopeType: 'SHOP' as const, scopeRefId: 201, active: false,
    })),
    pauseCoupon: vi.fn(async (id) => ({
      id, code: 'SHOP', name: 'Shop', description: '', creatorType: 'SHOP' as const,
      rewardType: 'FIXED', discountValue: 0, maxDiscountValue: null, totalQuantity: 1,
      usedQuantity: 0, startTime: '2026-07-29T08:00:00Z', endTime: '2026-07-30T08:00:00Z',
      minOrderValue: 0, scopeType: 'ALL' as const, scopeRefId: null, active: false,
    })),
    resumeCoupon: vi.fn(async (id) => ({
      id, code: 'SHOP', name: 'Shop', description: '', creatorType: 'SHOP' as const,
      rewardType: 'FIXED', discountValue: 0, maxDiscountValue: null, totalQuantity: 1,
      usedQuantity: 0, startTime: '2026-07-29T08:00:00Z', endTime: '2026-07-30T08:00:00Z',
      minOrderValue: 0, scopeType: 'ALL' as const, scopeRefId: null, active: true,
    })),
    fetchAdminDashboard: vi.fn(async () => ({
      overview: {
        totalOrders: 0,
        totalRevenue: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        pendingOrders: 0,
        processingOrders: 0,
        avgOrderValue: 0,
        deliveryRate: 0,
      },
      revenueTimeSeries: [],
      orderTimeSeries: [],
      statusBreakdown: [],
      topRestaurants: [],
    })),
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

export function createLivestreamHostFake(
  overrides: Partial<LivestreamHostServicePort> = {},
): LivestreamHostServicePort {
  return {
    inspect: vi.fn(async () => []),
    create: vi.fn(async (request) => ({
      id: '00000000-0000-4000-8000-000000000001',
      restaurantId: request.restaurantId,
      title: request.title,
      status: 'CREATED' as const,
      streamProvider: 'AGORA' as const,
    })),
    start: vi.fn(async () => undefined),
    end: vi.fn(async () => undefined),
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
    promotion: createPromotionFake(),
    address: createAddressFake(),
    admin: createAdminFake(),
    flashSaleAdmin: createFlashSaleAdminFake(),
    livestreamHost: createLivestreamHostFake(),
    notifications: createNotificationFake(),
    clock: { now: vi.fn(() => new Date(2026, 6, 29, 8, 0, 0)) },
    delay: { wait: vi.fn(async () => undefined) },
    sessionStore: createSessionStoreFake(),
    ...overrides,
  };
}
