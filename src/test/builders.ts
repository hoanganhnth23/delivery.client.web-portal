import type { MenuItem, Order, Restaurant, User } from '@/types/api.types';
import type {
  AdminCoupon,
  AdminOrder,
  AdminRating,
  AdminShipper,
} from '@/services/api/adminService';
import type {
  FlashSaleCampaign,
  FlashSaleItem,
} from '@/services/api/flashSaleService';
import { USER_ROLES } from '@/utils/constants';

export const buildUser = (overrides: Partial<User> = {}): User => ({
  id: 101,
  email: 'owner@test.dev',
  name: 'Owner Test',
  role: USER_ROLES.RESTAURANT_OWNER,
  ...overrides,
});

export const buildRestaurant = (
  overrides: Partial<Restaurant> = {},
): Restaurant => ({
  id: 201,
  name: 'Bếp test',
  address: '1 Đường Test, TP.HCM',
  phone: '0900000001',
  openingHour: '08:00:00',
  closingHour: '22:00:00',
  image: 'https://images.test/restaurant.jpg',
  addressLat: 10.7769,
  addressLng: 106.7009,
  description: 'Canonical restaurant fixture',
  open: true,
  rating: 4.5,
  ratingCount: 10,
  ...overrides,
});

export const buildMenuItem = (overrides: Partial<MenuItem> = {}): MenuItem => ({
  id: 301,
  restaurantId: 201,
  name: 'Cơm test',
  description: 'Canonical menu fixture',
  price: 50_000,
  image: 'https://images.test/menu.jpg',
  status: 'AVAILABLE',
  createdAt: '2026-07-29T08:00:00Z',
  updatedAt: '2026-07-29T08:00:00Z',
  ...overrides,
});

export const buildOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 401,
  userId: 501,
  restaurantId: 201,
  restaurantName: 'Bếp test',
  restaurantAddress: '1 Đường Test, TP.HCM',
  restaurantPhone: '0900000001',
  restaurantLat: 10.7769,
  restaurantLng: 106.7009,
  subtotalPrice: 50_000,
  discountAmount: 0,
  shippingFee: 15_000,
  totalPrice: 65_000,
  status: 'PENDING',
  paymentMethod: 'COD',
  deliveryAddress: '2 Đường Khách, TP.HCM',
  deliveryLat: 10.78,
  deliveryLng: 106.71,
  pickupLat: 10.7769,
  pickupLng: 106.7009,
  customerName: 'Customer Test',
  customerPhone: '0900000002',
  createdAt: '2026-07-29T08:00:00Z',
  updatedAt: '2026-07-29T08:00:00Z',
  items: [
    {
      id: 601,
      menuItemId: 301,
      menuItemName: 'Cơm test',
      quantity: 1,
      price: 50_000,
    },
  ],
  ...overrides,
});

export const buildAdminOrder = (
  overrides: Partial<AdminOrder> = {},
): AdminOrder => ({
  id: 401,
  userId: 501,
  restaurantId: 201,
  totalPrice: 65_000,
  status: 'PENDING',
  createdAt: '2026-07-29T08:00:00Z',
  updatedAt: '2026-07-29T08:00:00Z',
  paymentMethod: 'COD',
  deliveryAddress: '2 Đường Khách, TP.HCM',
  shipperId: null,
  ...overrides,
});

export const buildAdminShipper = (
  overrides: Partial<AdminShipper> = {},
): AdminShipper => ({
  id: 701,
  userId: 702,
  fullName: 'Shipper Test',
  phone: '0900000003',
  vehicleType: 'MOTORBIKE',
  licensePlate: '59-A1 123.45',
  isOnline: true,
  rating: 4.8,
  completedDeliveries: 20,
  createdAt: '2026-07-29T08:00:00Z',
  ...overrides,
});

export const buildAdminRating = (
  overrides: Partial<AdminRating> = {},
): AdminRating => ({
  id: 801,
  restaurantId: 201,
  customerId: 501,
  orderId: 401,
  rating: 5,
  comment: 'Đồ ăn ngon',
  status: 'PENDING',
  createdAt: '2026-07-29T08:00:00Z',
  ...overrides,
});

export const buildAdminCoupon = (
  overrides: Partial<AdminCoupon> = {},
): AdminCoupon => ({
  id: 901,
  code: 'TEST50',
  name: 'Coupon test',
  description: 'Canonical coupon fixture',
  creatorType: 'PLATFORM',
  rewardType: 'FIXED',
  discountValue: 50_000,
  maxDiscountValue: 50_000,
  totalQuantity: 100,
  usedQuantity: 2,
  startTime: '2026-07-29T08:00:00Z',
  endTime: '2026-08-05T08:00:00Z',
  minOrderValue: 100_000,
  scopeType: 'ALL',
  scopeRefId: null,
  active: true,
  ...overrides,
});

export const buildFlashSaleCampaign = (
  overrides: Partial<FlashSaleCampaign> = {},
): FlashSaleCampaign => ({
  id: 1001,
  name: 'Flash test',
  isRecurring: true,
  startTime: '10:00:00',
  endTime: '12:00:00',
  status: 'UPCOMING',
  ...overrides,
});

export const buildFlashSaleItem = (
  overrides: Partial<FlashSaleItem> = {},
): FlashSaleItem => ({
  id: 1101,
  campaignId: 1001,
  restaurantId: 201,
  menuItemId: 301,
  originalPrice: 50_000,
  flashSalePrice: 39_000,
  stockQuantity: 20,
  soldQuantity: 0,
  status: 'PENDING',
  ...overrides,
});
