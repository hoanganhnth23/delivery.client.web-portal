import type {
  AddressServicePort,
  AdminServicePort,
  AppDependencies,
  AuthServicePort,
  ClockPort,
  DelayPort,
  FlashSaleAdminServicePort,
  LivestreamHostServicePort,
  MenuServicePort,
  NotificationPort,
  OrderServicePort,
  PromotionServicePort,
  RestaurantServicePort,
  SessionStorePort,
  SupportChatServicePort,
} from '@/app/dependencies';
import type {
  MenuItem,
  Order,
  PageData,
  Restaurant,
  User,
  UserAddress,
} from '@/types/api.types';
import type {
  AdminCoupon,
  AdminDashboard,
  AdminOrder,
  AdminRating,
  AdminShipper,
  CreateAdminCouponRequest,
} from '@/services/api/adminService';
import type {
  CreateFlashSaleCampaignRequest,
  FlashSaleCampaign,
  FlashSaleItem,
} from '@/services/api/flashSaleService';
import type {
  CreateShopVoucherRequest,
  CustomerVoucher,
  VoucherCapability,
} from '@/services/api/promotionService';
import type {
  CreateLivestreamRequest,
  Livestream,
  LivestreamProduct,
  JoinLivestreamResponse,
  PinLivestreamProductRequest,
  StartLivestreamResponse,
} from '@/services/api/livestreamService';
import { USER_ROLES } from '@/utils/constants';
import customerCatalog from '../customer-preview/catalog.json';
import { ADMIN_PREVIEW_DATA, RESTAURANT_PREVIEW_DATA } from './portalPreviewData';
import { createPreviewSupportChatService } from '../support-preview/previewSupportChat';

const PREVIEW_RESTAURANT_ID = 35;
const PREVIEW_USER_IDS = { admin: 9001, owner: 9002 } as const;
const PREVIEW_DATE = '2026-09-08T10:00:00.000Z';
const PREVIEW_RESTAURANT_COORDINATES = { latitude: 20.9711, longitude: 105.7782 };

const clone = <T,>(value: T): T => structuredClone(value);

const toIsoTime = (time: string, minutesAgo = 0): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date(PREVIEW_DATE);
  date.setUTCHours(hours, minutes - minutesAgo, 0, 0);
  return date.toISOString();
};

const asPage = <T,>(items: T[], page: number, size: number): PageData<T> => {
  const start = page * size;
  const pagedItems = items.slice(start, start + size);
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  return {
    items: clone(pagedItems),
    page,
    size,
    totalItems: items.length,
    totalPages,
    hasNext: page + 1 < totalPages,
  };
};

const previewUser = (kind: 'admin' | 'restaurant'): User => kind === 'admin'
  ? {
      id: PREVIEW_USER_IDS.admin,
      email: ADMIN_PREVIEW_DATA.email,
      name: ADMIN_PREVIEW_DATA.identity,
      role: USER_ROLES.ADMIN,
    }
  : {
      id: PREVIEW_USER_IDS.owner,
      email: RESTAURANT_PREVIEW_DATA.email,
      name: RESTAURANT_PREVIEW_DATA.owner,
      role: USER_ROLES.RESTAURANT_OWNER,
    };

const previewRestaurant = (): Restaurant => ({
  id: PREVIEW_RESTAURANT_ID,
  name: RESTAURANT_PREVIEW_DATA.identity,
  address: RESTAURANT_PREVIEW_DATA.address,
  phone: RESTAURANT_PREVIEW_DATA.phone.replace(/\s/g, ''),
  openingHour: '08:00:00',
  closingHour: '22:00:00',
  image: RESTAURANT_PREVIEW_DATA.image,
  addressLat: PREVIEW_RESTAURANT_COORDINATES.latitude,
  addressLng: PREVIEW_RESTAURANT_COORDINATES.longitude,
  description: 'Món Hoa và món nước chuẩn vị, chế biến khi nhận đơn.',
  open: RESTAURANT_PREVIEW_DATA.open,
  createdAt: '2026-08-01T08:00:00.000Z',
  updatedAt: PREVIEW_DATE,
  rating: RESTAURANT_PREVIEW_DATA.rating,
  ratingCount: RESTAURANT_PREVIEW_DATA.reviewCount,
});

const previewRestaurantFromSummary = (summary: (typeof ADMIN_PREVIEW_DATA.restaurants)[number], index: number): Restaurant => ({
  id: summary.id,
  name: summary.name,
  address: summary.address,
  phone: summary.phone.replace(/\s/g, ''),
  openingHour: '08:00:00',
  closingHour: '22:00:00',
  image: summary.image,
  addressLat: PREVIEW_RESTAURANT_COORDINATES.latitude + index * 0.006,
  addressLng: PREVIEW_RESTAURANT_COORDINATES.longitude + index * 0.008,
  description: 'Nhà hàng đang hoạt động trên nền tảng Delivery.',
  open: summary.status === 'OPEN',
  createdAt: '2026-08-01T08:00:00.000Z',
  updatedAt: PREVIEW_DATE,
  rating: summary.rating,
  ratingCount: Math.max(summary.orders, 24),
});

const previewRestaurantList = (): Restaurant[] => ADMIN_PREVIEW_DATA.restaurants.map((summary, index) => (
  summary.id === PREVIEW_RESTAURANT_ID ? previewRestaurant() : previewRestaurantFromSummary(summary, index)
));

const previewRestaurantForId = (restaurantId: number): Restaurant =>
  previewRestaurantList().find((restaurant) => restaurant.id === restaurantId) ?? previewRestaurant();

const previewMenuItems = (restaurantId = PREVIEW_RESTAURANT_ID): MenuItem[] => {
  const summary = ADMIN_PREVIEW_DATA.restaurants.find((restaurant) => restaurant.id === restaurantId);
  const catalogRestaurant = summary
    ? customerCatalog.find((restaurant) => restaurant.name === summary.name)
    : undefined;
  const sourceItems = restaurantId === PREVIEW_RESTAURANT_ID
    ? RESTAURANT_PREVIEW_DATA.menuItems
    : catalogRestaurant?.items.map((item) => ({
      id: `MENU-${restaurantId}-${item.id}`,
      name: item.name,
      price: item.price,
      image: item.image,
    })) ?? [];

  return sourceItems.map((item, index) => ({
    id: restaurantId === PREVIEW_RESTAURANT_ID
      ? Number(item.id.replace(/\D/g, '')) || index + 10
      : restaurantId * 100 + index + 1,
    restaurantId,
    name: item.name,
    description: index === 0
      ? 'Món bán chạy, chuẩn bị nóng sau khi nhận đơn.'
      : 'Món được phục vụ trong ngày tại cửa hàng.',
    price: item.price,
    image: item.image,
    status: 'AVAILABLE',
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: PREVIEW_DATE,
  }));
};

const statusForOrder = (status: (typeof RESTAURANT_PREVIEW_DATA.orders)[number]['status']): Order['status'] => {
  if (status === 'PREPARING') return 'CONFIRMED';
  return status;
};

const previewOrder = (
  source: (typeof RESTAURANT_PREVIEW_DATA.orders)[number],
  index: number,
): Order => {
  const names = source.items.split(',').map((item) => item.trim()).filter(Boolean);
  const restaurantId = ADMIN_PREVIEW_DATA.restaurants.find((restaurant) => restaurant.name === source.restaurant)?.id
    ?? (source.restaurant === RESTAURANT_PREVIEW_DATA.identity ? PREVIEW_RESTAURANT_ID : 100 + index);
  const restaurant = previewRestaurantForId(restaurantId);
  const restaurantMenuItems = previewMenuItems(restaurantId);
  const itemRecords = names.map((name, itemIndex) => ({
    id: Number(source.id.replace(/\D/g, '')) * 10 + itemIndex + 1,
    menuItemId: restaurantMenuItems[itemIndex % Math.max(restaurantMenuItems.length, 1)]?.id ?? 10,
    menuItemName: name,
    quantity: 1,
    price: Math.round(source.total / Math.max(names.length, 1)),
  }));

  return {
    id: Number(source.id.replace(/\D/g, '')),
    userId: 500 + index,
    restaurantId,
    restaurantName: restaurant.name,
    restaurantAddress: restaurant.address,
    restaurantPhone: restaurant.phone,
    restaurantLat: restaurant.addressLat,
    restaurantLng: restaurant.addressLng,
    ...(source.status === 'DELIVERING' || source.status === 'DELIVERED' ? { shipperId: 700 + index } : {}),
    subtotalPrice: Math.max(source.total - 15000, 0),
    discountAmount: 0,
    shippingFee: 15000,
    totalPrice: source.total,
    status: statusForOrder(source.status),
    paymentMethod: 'COD',
    deliveryAddress: source.address,
    deliveryLat: 20.99 + index * 0.001,
    deliveryLng: 105.80 + index * 0.001,
    pickupLat: PREVIEW_RESTAURANT_COORDINATES.latitude,
    pickupLng: PREVIEW_RESTAURANT_COORDINATES.longitude,
    customerName: source.customer,
    customerPhone: `090${String(1200000 + index * 1731).slice(-7)}`,
    notes: index === 0 ? 'Gọi khách trước khi giao đến sảnh.' : undefined,
    createdAt: toIsoTime(source.createdAt, index * 3),
    updatedAt: toIsoTime(source.createdAt, index * 3),
    items: itemRecords,
  };
};

const adminOrders = (): AdminOrder[] => ADMIN_PREVIEW_DATA.orders.map((source, index) => ({
  id: Number(source.id.replace(/\D/g, '')),
  userId: 500 + index,
  restaurantId: ADMIN_PREVIEW_DATA.restaurants.find((restaurant) => restaurant.name === source.restaurant)?.id
    ?? (source.restaurant === RESTAURANT_PREVIEW_DATA.identity ? PREVIEW_RESTAURANT_ID : 100 + index),
  totalPrice: source.total,
  status: statusForOrder(source.status),
  createdAt: toIsoTime(source.createdAt, index * 2),
  updatedAt: toIsoTime(source.createdAt, index * 2),
  paymentMethod: 'COD',
  deliveryAddress: source.address,
  shipperId: source.status === 'DELIVERING' || source.status === 'DELIVERED' ? 700 + index : null,
}));

const adminDashboard = (): AdminDashboard => ({
  overview: {
    totalOrders: ADMIN_PREVIEW_DATA.metrics.orders,
    totalRevenue: ADMIN_PREVIEW_DATA.metrics.gmv,
    deliveredOrders: 1094,
    cancelledOrders: 28,
    pendingOrders: 24,
    processingOrders: 102,
    avgOrderValue: 54800,
    deliveryRate: 87.7,
  },
  revenueTimeSeries: [
    { label: '01/09', orderCount: 162, revenue: 8700000 },
    { label: '02/09', orderCount: 188, revenue: 10100000 },
    { label: '03/09', orderCount: 176, revenue: 9800000 },
    { label: '04/09', orderCount: 214, revenue: 11800000 },
    { label: '05/09', orderCount: 196, revenue: 10900000 },
    { label: '06/09', orderCount: 151, revenue: 8200000 },
    { label: '07/09', orderCount: 161, revenue: 9400000 },
  ],
  orderTimeSeries: [
    { label: '01/09', orderCount: 162, revenue: 8700000 },
    { label: '02/09', orderCount: 188, revenue: 10100000 },
    { label: '03/09', orderCount: 176, revenue: 9800000 },
    { label: '04/09', orderCount: 214, revenue: 11800000 },
    { label: '05/09', orderCount: 196, revenue: 10900000 },
    { label: '06/09', orderCount: 151, revenue: 8200000 },
    { label: '07/09', orderCount: 161, revenue: 9400000 },
  ],
  statusBreakdown: [
    { status: 'DELIVERED', count: 1094 },
    { status: 'PROCESSING', count: 102 },
    { status: 'PENDING', count: 24 },
    { status: 'CANCELLED', count: 28 },
  ],
  topRestaurants: ADMIN_PREVIEW_DATA.restaurants.map((restaurant) => ({
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    orderCount: restaurant.orders,
    revenue: restaurant.orders * 54800,
  })),
});

const adminShippers = (): AdminShipper[] => ADMIN_PREVIEW_DATA.shippers.map((shipper, index) => ({
  id: 700 + index,
  userId: 800 + index,
  fullName: shipper.name,
  phone: shipper.phone.replace(/\s/g, ''),
  vehicleType: index % 2 === 0 ? 'Xe máy' : 'Xe máy điện',
  licensePlate: `29-${String.fromCharCode(1 + index + 64)}${String(12345 + index * 111).slice(-5)}`,
  isOnline: shipper.status === 'ONLINE',
  rating: shipper.rating,
  completedDeliveries: shipper.deliveries,
  createdAt: '2026-07-15T08:00:00.000Z',
}));

const adminRatings = (): AdminRating[] => ADMIN_PREVIEW_DATA.ratings.map((rating, index) => ({
  id: 1000 + index,
  restaurantId: ADMIN_PREVIEW_DATA.restaurants.find((restaurant) => restaurant.name === rating.restaurant)?.id
    ?? (rating.restaurant === RESTAURANT_PREVIEW_DATA.identity ? PREVIEW_RESTAURANT_ID : 100 + index),
  customerId: 500 + index,
  orderId: 2400 - index,
  rating: rating.score,
  comment: rating.comment,
  status: rating.status,
  createdAt: toIsoTime('09:42', index * 60),
}));

const adminCoupons = (): AdminCoupon[] => ADMIN_PREVIEW_DATA.coupons.map((coupon, index) => ({
  id: 800 + index,
  code: coupon.code,
  name: coupon.title,
  description: coupon.title,
  creatorType: 'PLATFORM',
  rewardType: coupon.discount.includes('%') ? 'PERCENTAGE' : 'FIXED',
  discountValue: coupon.discount.includes('%') ? 20 : Number(coupon.discount.replace(/\D/g, '')),
  maxDiscountValue: null,
  totalQuantity: Number(coupon.usage.split('/')[1]?.replace(/\D/g, '') ?? 500),
  usedQuantity: Number(coupon.usage.split('/')[0]?.replace(/\D/g, '') ?? 0),
  startTime: '2026-09-08T08:00:00.000Z',
  endTime: '2026-09-30T23:59:00.000Z',
  minOrderValue: 100000,
  scopeType: 'ALL',
  scopeRefId: null,
  active: coupon.status === 'ACTIVE',
  approvalStatus: 'APPROVED',
}));

const flashSaleCampaigns = (): FlashSaleCampaign[] => ADMIN_PREVIEW_DATA.flashSales.map((sale, index) => ({
  id: 900 + index,
  name: sale.title,
  isRecurring: index === 0,
  startTime: index === 0 ? '11:00:00' : '2026-09-12T18:00:00',
  endTime: index === 0 ? '13:00:00' : '2026-09-12T21:00:00',
  status: sale.status === 'LIVE' ? 'ACTIVE' : sale.status === 'UPCOMING' ? 'UPCOMING' : 'ENDED',
}));

const createShopVoucher = (
  request: CreateShopVoucherRequest,
  id: number,
): CustomerVoucher => ({
  id,
  code: request.code,
  name: request.name,
  description: request.description ?? '',
  creatorType: 'SHOP',
  rewardType: request.rewardType,
  discountValue: request.discountValue,
  maxDiscountValue: request.maxDiscountValue ?? null,
  minOrderValue: request.minOrderValue,
  scopeType: 'SHOP',
  scopeRefId: request.restaurantId,
  active: false,
  layer: 'SHOP_DISCOUNT',
  fundingSource: 'SHOP',
  approvalStatus: 'PENDING',
  endTime: request.endTime,
});

const asCanonicalRestaurantRequest = (data: {
  name: string;
  address: string;
  phone: string;
  openingHour: string;
  closingHour: string;
  image: string;
  addressLat: number;
  addressLng: number;
  description: string;
}) => ({
  ...data,
  openingHour: data.openingHour.length === 5 ? `${data.openingHour}:00` : data.openingHour,
  closingHour: data.closingHour.length === 5 ? `${data.closingHour}:00` : data.closingHour,
});

export function createPortalPreviewDependencies(
  kind: 'admin' | 'restaurant',
  _resetKey = 0,
  selectedRestaurantId = PREVIEW_RESTAURANT_ID,
): AppDependencies {
  const availableRestaurants = previewRestaurantList();
  let currentRestaurant = previewRestaurantForId(selectedRestaurantId);
  let restaurants = kind === 'admin' ? availableRestaurants : [currentRestaurant];
  let menuItems = previewMenuItems(currentRestaurant.id);
  let restaurantOrders = RESTAURANT_PREVIEW_DATA.orders.map(previewOrder);
  let allAdminOrders = adminOrders();
  let ratings = adminRatings();
  let coupons = adminCoupons();
  let pendingShopCoupons: AdminCoupon[] = [{
    ...adminCoupons()[0],
    id: 850,
    code: 'HADONG30',
    name: 'Giảm 30.000đ cho đơn Hà Đông',
    creatorType: 'SHOP',
    scopeType: 'SHOP',
    scopeRefId: PREVIEW_RESTAURANT_ID,
    active: false,
    approvalStatus: 'PENDING',
  }];
  let campaigns = flashSaleCampaigns();
  let shopVouchers: CustomerVoucher[] = [
    createShopVoucher({
      code: 'HADONG30',
      name: 'Giảm 30.000đ cho đơn từ 120.000đ',
      description: 'Voucher trải nghiệm của Quán Test HÀ ĐÔNG.',
      rewardType: 'FIXED',
      discountValue: 30000,
      maxDiscountValue: null,
      totalQuantity: 100,
      usageLimitPerUser: 1,
      startTime: '2026-09-08T08:00',
      endTime: '2026-09-30T23:59',
      minOrderValue: 120000,
      restaurantId: PREVIEW_RESTAURANT_ID,
    }, 860),
  ];
  let liveStreams: Livestream[] = [{
    id: '00000000-0000-4000-8000-000000000001',
    sellerId: PREVIEW_USER_IDS.owner,
    restaurantId: PREVIEW_RESTAURANT_ID,
    title: 'Bếp Hà Đông hôm nay',
    description: null,
    status: 'CREATED',
    streamProvider: 'AGORA',
    roomId: 'preview-room-1',
    channelName: 'preview-channel-1',
    startedAt: null,
    endedAt: null,
    viewCount: 0,
    createdAt: PREVIEW_DATE,
    updatedAt: PREVIEW_DATE,
    pinnedProducts: [],
  }];

  const user = previewUser(kind);

  const auth: AuthServicePort = {
    getCurrentUser: () => clone(user),
    getProfile: async () => clone(user),
    hasRole: (allowedRoles) => (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]).includes(user.role),
    hasStoredSession: () => true,
    isAuthenticated: () => true,
    login: async () => ({
      accessToken: '',
      refreshToken: '',
      user: clone(user),
    }),
    registerCustomer: async () => ({ principalId: user.id, profileCreated: true }),
    getRegistrationStatus: async () => ({
      principalId: user.id,
      status: 'VERIFIED',
      nextAction: 'NONE',
      profileLinked: true,
    }),
    requestEmailVerification: async () => undefined,
    confirmEmailVerification: async () => undefined,
    logout: async () => undefined,
    restoreSession: async () => clone(user),
  };

  const restaurant: RestaurantServicePort = {
    createRestaurant: async (data) => {
      currentRestaurant = {
        ...currentRestaurant,
        ...asCanonicalRestaurantRequest(data),
        id: Math.max(...restaurants.map((item) => item.id), PREVIEW_RESTAURANT_ID) + 1,
      };
      restaurants = [currentRestaurant, ...restaurants.filter((item) => item.id !== currentRestaurant.id)];
      return clone(currentRestaurant);
    },
    getMyRestaurants: async () => clone(restaurants),
    getRestaurantRatings: async () => clone(RESTAURANT_PREVIEW_DATA.reviews.map((review, index) => ({
      id: 1100 + index,
      restaurantId: PREVIEW_RESTAURANT_ID,
      customerId: 620 + index,
      orderId: 2401 - index,
      rating: review.score,
      comment: review.comment,
      status: 'APPROVED' as const,
      createdAt: toIsoTime('09:42', index * 90),
    }))),
    getAllRestaurants: async () => clone(restaurants),
    searchRestaurants: async (keyword) => clone(restaurants.filter((item) => item.name.toLowerCase().includes(keyword.toLowerCase()))),
    getRestaurantById: async (id) => clone(restaurants.find((item) => item.id === id) ?? currentRestaurant),
    updateRestaurant: async (id, data) => {
      const updated = { ...currentRestaurant, ...asCanonicalRestaurantRequest(data), id };
      currentRestaurant = updated;
      restaurants = restaurants.map((item) => item.id === id ? updated : item);
      return clone(updated);
    },
  };

  const menu: MenuServicePort = {
    createMenuItem: async (data) => {
      const item: MenuItem = {
        ...data,
        id: Math.max(...menuItems.map((entry) => entry.id), 0) + 1,
        status: 'AVAILABLE',
        createdAt: PREVIEW_DATE,
        updatedAt: PREVIEW_DATE,
      };
      menuItems = [item, ...menuItems];
      return clone(item);
    },
    deleteMenuItem: async (id) => {
      menuItems = menuItems.filter((item) => item.id !== id);
    },
    getMyMenuItems: async () => clone(menuItems),
    getMenuItemsByRestaurant: async (restaurantId, availableOnly = true) => clone(menuItems.filter((item) => item.restaurantId === restaurantId && (!availableOnly || item.status === 'AVAILABLE'))),
    updateMenuItem: async (id, data) => {
      const existing = menuItems.find((item) => item.id === id);
      const item: MenuItem = {
        ...(existing ?? {
          id,
          status: 'AVAILABLE' as const,
          createdAt: PREVIEW_DATE,
          updatedAt: PREVIEW_DATE,
        }),
        ...data,
        id,
        updatedAt: PREVIEW_DATE,
      };
      menuItems = menuItems.map((entry) => entry.id === id ? item : entry);
      return clone(item);
    },
  };

  const getOrder = (id: number): Order => clone(
    restaurantOrders.find((item) => item.id === id) ?? restaurantOrders[0],
  );
  const order: OrderServicePort = {
    confirmOrder: async (orderId) => {
      restaurantOrders = restaurantOrders.map((item) => item.id === orderId ? { ...item, status: 'CONFIRMED' } : item);
      return 'CONFIRMED';
    },
    checkoutPreview: async (request) => {
      const selectedItems = request.items.map((entry) => {
        const menuItem = menuItems.find((item) => item.id === entry.menuItemId) ?? menuItems[0];
        return {
          menuItemId: menuItem.id,
          menuItemName: menuItem.name,
          imageUrl: menuItem.image,
          unitPrice: menuItem.price,
          quantity: entry.quantity,
          lineTotal: menuItem.price * entry.quantity,
        };
      });
      const subtotal = selectedItems.reduce((sum, item) => sum + item.lineTotal, 0);
      return {
        quoteId: '00000000-0000-4000-8000-000000000001',
        expiresAt: '2026-09-08T10:15:00.000Z',
        restaurantId: request.restaurantId,
        restaurantName: currentRestaurant.name,
        items: selectedItems,
        subtotal,
        shippingFee: 15000,
        discountAmount: 0,
        totalPrice: subtotal + 15000,
        priceChanges: [],
        unavailableItemIds: [],
        itemDiscount: 0,
        shippingDiscount: 0,
        customerShippingFee: 15000,
        grossShippingFee: 15000,
        platformSubsidy: 0,
        shopDiscount: 0,
        appliedVouchers: [],
        selectedVoucherIds: [],
        selectionMode: 'AUTO' as const,
      };
    },
    createCustomerOrder: async (request, idempotencyKey) => {
      const source = RESTAURANT_PREVIEW_DATA.orders[0];
      const created = {
        ...previewOrder(source, 0),
        id: 2500,
        restaurantId: request.restaurantId,
        restaurantName: currentRestaurant.name,
        deliveryAddress: request.deliveryAddress,
        deliveryLat: request.deliveryLat,
        deliveryLng: request.deliveryLng,
        customerName: request.customerName,
        customerPhone: request.customerPhone,
        notes: request.notes,
      };
      restaurantOrders = [created, ...restaurantOrders];
      return { order: clone(created), idempotencyKey };
    },
    cancelOrder: async (id) => {
      restaurantOrders = restaurantOrders.map((item) => item.id === id ? { ...item, status: 'CANCELLED' } : item);
      return getOrder(id);
    },
    getCustomerOrders: async (page = 0, size = 10) => asPage(restaurantOrders, page, size),
    getMyOrders: async (page = 0, size = 10, restaurantId) => asPage(
      restaurantId === undefined ? restaurantOrders : restaurantOrders.filter((item) => item.restaurantId === restaurantId),
      page,
      size,
    ),
    getOrderById: async (id) => getOrder(id),
    rejectOrder: async (orderId) => {
      restaurantOrders = restaurantOrders.map((item) => item.id === orderId ? { ...item, status: 'CANCELLED' } : item);
      return 'REJECTED';
    },
  };

  const admin: AdminServicePort = {
    createCoupon: async (data: CreateAdminCouponRequest) => {
      const created: AdminCoupon = {
        id: Math.max(...coupons.map((coupon) => coupon.id), 0) + 1,
        code: data.code,
        name: data.name,
        description: data.description,
        creatorType: 'PLATFORM',
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
      };
      coupons = [created, ...coupons];
      return clone(created);
    },
    deleteCoupon: async (id) => {
      coupons = coupons.filter((coupon) => coupon.id !== id);
    },
    fetchPendingShopCoupons: async () => clone(pendingShopCoupons),
    approveShopCoupon: async (id) => {
      const found = pendingShopCoupons.find((coupon) => coupon.id === id) ?? pendingShopCoupons[0];
      const approved = { ...found, approvalStatus: 'APPROVED', active: true };
      pendingShopCoupons = pendingShopCoupons.filter((coupon) => coupon.id !== id);
      return clone(approved);
    },
    rejectShopCoupon: async (id) => {
      const found = pendingShopCoupons.find((coupon) => coupon.id === id) ?? pendingShopCoupons[0];
      pendingShopCoupons = pendingShopCoupons.filter((coupon) => coupon.id !== id);
      return clone({ ...found, approvalStatus: 'REJECTED', active: false });
    },
    pauseCoupon: async (id) => {
      const updated = coupons.find((coupon) => coupon.id === id) ?? coupons[0];
      const next = { ...updated, active: false };
      coupons = coupons.map((coupon) => coupon.id === next.id ? next : coupon);
      return clone(next);
    },
    resumeCoupon: async (id) => {
      const updated = coupons.find((coupon) => coupon.id === id) ?? coupons[0];
      const next = { ...updated, active: true };
      coupons = coupons.map((coupon) => coupon.id === next.id ? next : coupon);
      return clone(next);
    },
    fetchAllCoupons: async () => clone(coupons),
    fetchAdminDashboard: async () => clone(adminDashboard()),
    fetchAllOrders: async (page = 0, size = 20) => asPage(allAdminOrders, page, size),
    fetchAllRatings: async () => clone(ratings),
    fetchAllShippers: async (page = 0, size = 100) => asPage(adminShippers(), page, size),
    fetchOnlineShippers: async () => clone(adminShippers().filter((shipper) => shipper.isOnline)),
    fetchOrdersByStatus: async (status, page = 0, size = 20) => asPage(allAdminOrders.filter((item) => item.status === status), page, size),
    updateRatingStatus: async (ratingId, status) => {
      ratings = ratings.map((rating) => rating.id === ratingId ? { ...rating, status } : rating);
      return clone(ratings.find((rating) => rating.id === ratingId) ?? ratings[0]);
    },
    confirmOrder: async (orderId) => {
      allAdminOrders = allAdminOrders.map((item) => item.id === orderId ? { ...item, status: 'CONFIRMED' } : item);
      return 'CONFIRMED';
    },
    rejectOrder: async (orderId) => {
      allAdminOrders = allAdminOrders.map((item) => item.id === orderId ? { ...item, status: 'CANCELLED' } : item);
      return 'REJECTED';
    },
  };

  const promotion: PromotionServicePort = {
    getMyVouchers: async () => clone(shopVouchers),
    getVoucherCapability: async (): Promise<VoucherCapability> => ({
      enabled: false,
      maxVouchers: 3,
      layers: ['SHOP_DISCOUNT', 'PLATFORM_DISCOUNT', 'FREESHIP'],
      selectionModes: ['AUTO', 'MANUAL'],
      conflictsWithFlashSale: true,
    }),
    collectVoucher: async () => undefined,
    createShopVoucher: async (request) => {
      const voucher = createShopVoucher(request, Math.max(...shopVouchers.map((item) => item.id), 0) + 1);
      shopVouchers = [voucher, ...shopVouchers];
      return clone(voucher);
    },
    listShopVouchers: async () => clone(shopVouchers),
  };

  const flashSaleAdmin: FlashSaleAdminServicePort = {
    approveItem: async () => undefined,
    createCampaign: async (data: CreateFlashSaleCampaignRequest) => {
      const campaign: FlashSaleCampaign = {
        id: Math.max(...campaigns.map((item) => item.id), 0) + 1,
        ...data,
        status: 'UPCOMING',
      };
      campaigns = [campaign, ...campaigns];
      return clone(campaign);
    },
    getAllCampaigns: async () => clone(campaigns),
    getCampaignItems: async (campaignId): Promise<FlashSaleItem[]> => [{
      id: 950,
      campaignId,
      restaurantId: PREVIEW_RESTAURANT_ID,
      menuItemId: menuItems[0]?.id ?? 10,
      originalPrice: menuItems[0]?.price ?? 45000,
      flashSalePrice: Math.round((menuItems[0]?.price ?? 45000) * 0.8),
      stockQuantity: 100,
      soldQuantity: 42,
      status: 'APPROVED',
    }],
    updateCampaignStatus: async (id, status) => {
      campaigns = campaigns.map((campaign) => campaign.id === id ? { ...campaign, status } : campaign);
    },
  };

  const livestreamHost: LivestreamHostServicePort = {
    inspect: async (restaurantId) => clone(liveStreams.filter((stream) => stream.restaurantId === restaurantId)),
    getActive: async () => clone(liveStreams.filter((stream) => stream.status === 'LIVE')),
    getById: async (id) => clone(liveStreams.find((stream) => stream.id === id) ?? liveStreams[0]),
    create: async (request: CreateLivestreamRequest) => {
      const stream: Livestream = {
        id: `00000000-0000-4000-8000-${String(liveStreams.length + 2).padStart(12, '0')}`,
        sellerId: PREVIEW_USER_IDS.owner,
        restaurantId: request.restaurantId,
        title: request.title,
        description: request.description ?? null,
        status: 'CREATED',
        streamProvider: 'AGORA',
        roomId: `preview-room-${liveStreams.length + 2}`,
        channelName: `preview-channel-${liveStreams.length + 2}`,
        startedAt: null,
        endedAt: null,
        viewCount: 0,
        createdAt: PREVIEW_DATE,
        updatedAt: PREVIEW_DATE,
        pinnedProducts: [],
      };
      liveStreams = [stream, ...liveStreams];
      return clone(stream);
    },
    start: async (id) => {
      liveStreams = liveStreams.map((stream) => stream.id === id ? { ...stream, status: 'LIVE' } : stream);
      const stream = liveStreams.find((item) => item.id === id)!;
      const response: StartLivestreamResponse = {
        livestreamId: stream.id,
        channelName: stream.channelName,
        status: 'LIVE',
        token: 'preview-host-token',
        uid: PREVIEW_USER_IDS.owner,
        role: 'HOST',
        tokenExpiresAt: PREVIEW_DATE,
        title: stream.title,
        restaurantId: stream.restaurantId,
        startedAt: PREVIEW_DATE,
      };
      return clone(response);
    },
    join: async (id) => {
      const stream = liveStreams.find((item) => item.id === id) ?? liveStreams[0];
      const response: JoinLivestreamResponse = {
        livestreamId: stream.id,
        channelName: stream.channelName,
        title: stream.title,
        restaurantId: stream.restaurantId,
        token: 'preview-viewer-token',
        uid: PREVIEW_USER_IDS.owner + 1,
        tokenExpiresAt: PREVIEW_DATE,
        sellerId: stream.sellerId,
        startedAt: stream.startedAt ?? PREVIEW_DATE,
        currentViewers: null,
      };
      return clone(response);
    },
    end: async (id) => {
      liveStreams = liveStreams.map((stream) => stream.id === id ? { ...stream, status: 'ENDED' } : stream);
      return clone(liveStreams.find((stream) => stream.id === id)!);
    },
    pinProduct: async (id, request: PinLivestreamProductRequest) => {
      const stream = liveStreams.find((item) => item.id === id) ?? liveStreams[0];
      const pinnedProduct: LivestreamProduct = {
        id: request.productId,
        livestreamId: stream.id,
        productId: request.productId,
        productName: request.productName ?? 'Preview product',
        productImage: request.productImage ?? null,
        restaurantId: stream.restaurantId,
        restaurantName: request.restaurantName ?? 'Preview restaurant',
        priceAtLive: request.priceAtLive,
        isPinned: true,
        createdAt: PREVIEW_DATE,
        pinnedAt: PREVIEW_DATE,
      };
      liveStreams = liveStreams.map((item) => item.id === stream.id
        ? { ...item, pinnedProducts: [...item.pinnedProducts.filter((product) => product.productId !== request.productId), pinnedProduct] }
        : item);
      return clone(pinnedProduct);
    },
    unpinProduct: async (id, productId) => {
      liveStreams = liveStreams.map((stream) => stream.id === id
        ? { ...stream, pinnedProducts: stream.pinnedProducts.map((product) => product.productId === productId ? { ...product, isPinned: false, pinnedAt: null } : product) }
        : stream);
    },
    listProducts: async (id) => clone(liveStreams.find((stream) => stream.id === id)?.pinnedProducts ?? []),
    listPinnedProducts: async (id) => clone(liveStreams.find((stream) => stream.id === id)?.pinnedProducts.filter((product) => product.isPinned) ?? []),
  };

  const supportChat: SupportChatServicePort = createPreviewSupportChatService();

  const address: AddressServicePort = {
    getUserAddresses: async (): Promise<UserAddress[]> => [],
    createAddress: async (_userId, data) => ({ ...data, id: 1, userId: user.id }),
    updateAddress: async (id, data) => ({ ...data, id, userId: user.id }),
    deleteAddress: async () => undefined,
    setDefaultAddress: async (id) => ({ id, userId: user.id, label: 'Nhà', recipientName: user.name, phoneNumber: '0901234567', addressLine: '12 Trần Phú', ward: 'Mộ Lao', district: 'Hà Đông', city: 'Hà Nội', latitude: 20.9711, longitude: 105.7782, isDefault: true }),
  };

  const notifications: NotificationPort = { success: () => undefined, error: () => undefined };
  const clock: ClockPort = { now: () => new Date(PREVIEW_DATE) };
  const delay: DelayPort = { wait: async () => undefined };
  let currentRestaurantId: number | null = currentRestaurant.id;
  const sessionStore: SessionStorePort = {
    clearRestaurantId: () => { currentRestaurantId = null; },
    getCurrentRestaurantId: () => currentRestaurantId,
    hasToken: () => true,
    setCurrentRestaurantId: (id) => { currentRestaurantId = id; },
  };

  return {
    auth,
    restaurant,
    menu,
    order,
    promotion,
    address,
    admin,
    flashSaleAdmin,
    livestreamHost,
    supportChat,
    notifications,
    clock,
    delay,
    sessionStore,
  };
}
