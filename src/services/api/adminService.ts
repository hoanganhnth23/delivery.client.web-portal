import apiClient, { handleResponse, handleError } from './apiClient';
import { API_ENDPOINTS } from './endpoints';
import {
  optionalPositiveInteger,
  optionalString,
  requireArray,
  requireBoolean,
  requireEnum,
  requireInteger,
  requireNumber,
  requirePage,
  requireRecord,
  requireString,
  requireTimestamp,
} from './contract';

const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'FINDING_SHIPPER',
  'WAIT_SHIPPER_CONFIRM',
  'ASSIGNED',
  'PICKED_UP',
  'DELIVERING',
  'DELIVERED',
  'CANCELLED',
  'SHIPPER_NOT_FOUND',
] as const;
const RATING_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
const REWARD_TYPES = ['FIXED', 'PERCENTAGE', 'FREESHIP'] as const;
// Read contracts retain legacy rows for admin recovery/audit. Creation
// requests remain narrowed to the modern PLATFORM/SHOP + ALL/SHOP policy.
const VOUCHER_SCOPE_TYPES = ['ALL', 'SHOP', 'CATEGORY'] as const;
const VOUCHER_CREATOR_TYPES = ['PLATFORM', 'SHOP', 'MERCHANT'] as const;
const DASHBOARD_STATUS_TYPES = [
  'DELIVERED',
  'CANCELLED',
  'PENDING',
  'PROCESSING',
  'SHIPPER_NOT_FOUND',
] as const;

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
}

export interface AdminOrder {
  id: number;
  userId: number;
  restaurantId: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  paymentMethod: string;
  deliveryAddress: string;
  shipperId: number | null;
}

export interface AdminShipper {
  id: number;
  userId: number;
  fullName: string | null;
  phone: string | null;
  vehicleType: string | null;
  licensePlate: string | null;
  isOnline: boolean;
  rating: number | null;
  completedDeliveries: number;
  createdAt: string;
}

export interface AdminDashboardOverview {
  totalOrders: number;
  totalRevenue: number;
  deliveredOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  processingOrders: number;
  avgOrderValue: number;
  deliveryRate: number;
}

export interface AdminDashboardTimeSeriesPoint {
  label: string;
  orderCount: number;
  revenue: number;
}

export interface AdminDashboardStatusBreakdown {
  status: string;
  count: number;
}

export interface AdminDashboardTopRestaurant {
  restaurantId: number;
  restaurantName: string;
  orderCount: number;
  revenue: number;
}

export interface AdminDashboard {
  overview: AdminDashboardOverview;
  revenueTimeSeries: AdminDashboardTimeSeriesPoint[];
  orderTimeSeries: AdminDashboardTimeSeriesPoint[];
  statusBreakdown: AdminDashboardStatusBreakdown[];
  topRestaurants: AdminDashboardTopRestaurant[];
}

const parseAdminOrder = (value: unknown, label: string): AdminOrder => {
  const order = requireRecord(value, label);
  return {
    id: requireInteger(order.id, `${label}.id`, 1),
    userId: requireInteger(order.userId, `${label}.userId`, 1),
    restaurantId: requireInteger(order.restaurantId, `${label}.restaurantId`, 1),
    totalPrice: requireNumber(order.totalPrice, `${label}.totalPrice`),
    status: requireEnum(order.status, ORDER_STATUSES, `${label}.status`),
    createdAt: requireTimestamp(order.createdAt, `${label}.createdAt`),
    updatedAt: requireTimestamp(order.updatedAt, `${label}.updatedAt`),
    paymentMethod: requireEnum(order.paymentMethod, ['COD'] as const, `${label}.paymentMethod`),
    deliveryAddress: requireString(order.deliveryAddress, `${label}.deliveryAddress`),
    shipperId: optionalPositiveInteger(order.shipperId, `${label}.shipperId`),
  };
};

const parseAdminShipper = (value: unknown, label: string): AdminShipper => {
  const shipper = requireRecord(value, label);
  const rating = shipper.rating === null
    ? null
    : requireNumber(shipper.rating, `${label}.rating`);
  return {
    id: requireInteger(shipper.id, `${label}.id`, 1),
    userId: requireInteger(shipper.userId, `${label}.userId`, 1),
    fullName: optionalString(shipper.fullName, `${label}.fullName`),
    phone: optionalString(shipper.phone, `${label}.phone`),
    vehicleType: optionalString(shipper.vehicleType, `${label}.vehicleType`),
    licensePlate: optionalString(shipper.licensePlate, `${label}.licensePlate`),
    isOnline: requireBoolean(shipper.isOnline, `${label}.isOnline`),
    rating,
    completedDeliveries: requireInteger(
      shipper.completedDeliveries,
      `${label}.completedDeliveries`,
    ),
    createdAt: requireTimestamp(shipper.createdAt, `${label}.createdAt`),
  };
};

const parseDashboard = (value: unknown, label: string): AdminDashboard => {
  const dashboard = requireRecord(value, label);
  const overview = requireRecord(dashboard.overview, `${label}.overview`);
  const parseOverview = (): AdminDashboardOverview => ({
    totalOrders: requireInteger(overview.totalOrders, `${label}.overview.totalOrders`),
    totalRevenue: requireNumber(overview.totalRevenue, `${label}.overview.totalRevenue`),
    deliveredOrders: requireInteger(overview.deliveredOrders, `${label}.overview.deliveredOrders`),
    cancelledOrders: requireInteger(overview.cancelledOrders, `${label}.overview.cancelledOrders`),
    pendingOrders: requireInteger(overview.pendingOrders, `${label}.overview.pendingOrders`),
    processingOrders: requireInteger(overview.processingOrders, `${label}.overview.processingOrders`),
    avgOrderValue: requireNumber(overview.avgOrderValue, `${label}.overview.avgOrderValue`),
    deliveryRate: requireNumber(overview.deliveryRate, `${label}.overview.deliveryRate`, 0),
  });
  const parseSeries = (raw: unknown, seriesLabel: string): AdminDashboardTimeSeriesPoint[] =>
    requireArray(raw, seriesLabel, (item, itemLabel) => {
      const point = requireRecord(item, itemLabel);
      return {
        label: requireString(point.label, `${itemLabel}.label`),
        orderCount: requireInteger(point.orderCount, `${itemLabel}.orderCount`),
        revenue: requireNumber(point.revenue, `${itemLabel}.revenue`),
      };
    });
  const statusBreakdown = requireArray(
    dashboard.statusBreakdown,
    `${label}.statusBreakdown`,
    (item, itemLabel) => {
      const status = requireRecord(item, itemLabel);
      return {
        status: requireEnum(status.status, DASHBOARD_STATUS_TYPES, `${itemLabel}.status`),
        count: requireInteger(status.count, `${itemLabel}.count`),
      };
    },
  );
  const topRestaurants = requireArray(
    dashboard.topRestaurants,
    `${label}.topRestaurants`,
    (item, itemLabel) => {
      const restaurant = requireRecord(item, itemLabel);
      return {
        restaurantId: requireInteger(restaurant.restaurantId, `${itemLabel}.restaurantId`, 1),
        restaurantName: requireString(restaurant.restaurantName, `${itemLabel}.restaurantName`),
        orderCount: requireInteger(restaurant.orderCount, `${itemLabel}.orderCount`),
        revenue: requireNumber(restaurant.revenue, `${itemLabel}.revenue`),
      };
    },
  );
  return {
    overview: parseOverview(),
    revenueTimeSeries: parseSeries(dashboard.revenueTimeSeries, `${label}.revenueTimeSeries`),
    orderTimeSeries: parseSeries(dashboard.orderTimeSeries, `${label}.orderTimeSeries`),
    statusBreakdown,
    topRestaurants,
  };
};

const parseAdminRating = (value: unknown, label: string): AdminRating => {
  const rating = requireRecord(value, label);
  return {
    id: requireInteger(rating.id, `${label}.id`, 1),
    restaurantId: requireInteger(rating.restaurantId, `${label}.restaurantId`, 1),
    customerId: requireInteger(rating.customerId, `${label}.customerId`, 1),
    orderId: requireInteger(rating.orderId, `${label}.orderId`, 1),
    rating: requireInteger(rating.rating, `${label}.rating`, 1),
    comment: optionalString(rating.comment, `${label}.comment`) ?? '',
    status: requireEnum(rating.status, RATING_STATUSES, `${label}.status`),
    createdAt: requireTimestamp(rating.createdAt, `${label}.createdAt`),
  };
};

const parseAdminCoupon = (value: unknown, label: string): AdminCoupon => {
  const coupon = requireRecord(value, label);
  const creatorType = requireEnum(coupon.creatorType, VOUCHER_CREATOR_TYPES, `${label}.creatorType`);
  const scopeType = requireEnum(coupon.scopeType, VOUCHER_SCOPE_TYPES, `${label}.scopeType`);
  const scopeRefId = coupon.scopeRefId === null
    ? null
    : requireInteger(coupon.scopeRefId, `${label}.scopeRefId`, 1);
  if ((scopeType === 'ALL' && scopeRefId !== null)
    || ((scopeType === 'SHOP' || scopeType === 'CATEGORY') && scopeRefId === null)) {
    throw new TypeError(`${label} has an invalid voucher scope identity`);
  }
  return {
    id: requireInteger(coupon.id, `${label}.id`, 1),
    code: requireString(coupon.code, `${label}.code`),
    name: requireString(coupon.name, `${label}.name`),
    description: optionalString(coupon.description, `${label}.description`) ?? '',
    creatorType,
    rewardType: requireEnum(coupon.rewardType, REWARD_TYPES, `${label}.rewardType`),
    discountValue: requireNumber(coupon.discountValue, `${label}.discountValue`),
    maxDiscountValue: coupon.maxDiscountValue === null
      ? null
      : requireNumber(coupon.maxDiscountValue, `${label}.maxDiscountValue`),
    totalQuantity: requireInteger(coupon.totalQuantity, `${label}.totalQuantity`, 1),
    usedQuantity: requireInteger(coupon.usedQuantity, `${label}.usedQuantity`),
    startTime: requireTimestamp(coupon.startTime, `${label}.startTime`),
    endTime: requireTimestamp(coupon.endTime, `${label}.endTime`),
    minOrderValue: requireNumber(coupon.minOrderValue, `${label}.minOrderValue`),
    scopeType,
    scopeRefId,
    active: requireBoolean(coupon.active, `${label}.active`),
    ...(typeof coupon.layerCode === 'string'
      ? { layer: coupon.layerCode }
      : typeof coupon.layer === 'string' ? { layer: coupon.layer } : {}),
    ...(typeof coupon.fundingSource === 'string' ? { fundingSource: coupon.fundingSource } : {}),
    ...(typeof coupon.approvalStatus === 'string' ? { approvalStatus: coupon.approvalStatus } : {}),
  };
};

class AdminService {
  async fetchAdminDashboard(period: 'month' | 'quarter' | 'year' = 'month', year?: number): Promise<AdminDashboard> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.ANALYTICS.ADMIN_DASHBOARD, {
        params: { period, ...(year ? { year } : {}) },
      });
      return parseDashboard(handleResponse(response), 'admin dashboard');
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * Fetch all orders
   */
  async fetchAllOrders(page: number = 0, size: number = 20): Promise<PageResponse<AdminOrder>> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.ORDER.GET_ALL_ADMIN, { params: { page, size } });
      return requirePage(handleResponse(response), 'orders page', parseAdminOrder);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * Fetch orders by status
   */
  async fetchOrdersByStatus(status: string, page: number = 0, size: number = 20): Promise<PageResponse<AdminOrder>> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.ORDER.GET_BY_STATUS(status), { params: { page, size } });
      return requirePage(handleResponse(response), 'orders page', parseAdminOrder);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * Confirm order (Admin authority)
   */
  async confirmOrder(
    orderId: number,
    restaurantId: number,
    estimatedPrepTime: number = 30,
    notes?: string,
  ): Promise<'CONFIRMED'> {
    const response = await apiClient.post(
      API_ENDPOINTS.RESTAURANT.CONFIRM_ORDER(orderId),
      { restaurantId, estimatedPrepTime, ...(notes ? { notes } : {}) },
    );
    return requireEnum(handleResponse(response), ['CONFIRMED'] as const, 'confirmation result');
  }

  /**
   * Reject order (Admin authority)
   */
  async rejectOrder(
    orderId: number,
    restaurantId: number,
    reason: string,
  ): Promise<'REJECTED'> {
    const response = await apiClient.post(
      API_ENDPOINTS.RESTAURANT.REJECT_ORDER(orderId),
      { restaurantId, reason },
    );
    return requireEnum(handleResponse(response), ['REJECTED'] as const, 'rejection result');
  }

  // ==================== SHIPPER MANAGEMENT ====================

  /**
   * Fetch all shippers
   */
  async fetchAllShippers(page: number = 0, size: number = 100): Promise<PageResponse<AdminShipper>> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.SHIPPER.GET_ALL, { params: { page, size } });
      return requirePage(handleResponse(response), 'shippers page', parseAdminShipper);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * Fetch online shippers
   */
  async fetchOnlineShippers(): Promise<AdminShipper[]> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.SHIPPER.GET_ONLINE);
      return requireArray(handleResponse(response), 'online shippers', parseAdminShipper);
    } catch (error) {
      return handleError(error);
    }
  }

  // ==================== RATING MANAGEMENT ====================

  /**
   * Fetch all ratings for admin moderation
   */
  async fetchAllRatings(): Promise<AdminRating[]> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.RESTAURANT.ADMIN_GET_ALL_RATINGS);
      return requireArray(handleResponse(response), 'ratings', parseAdminRating);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * Update rating status (Approve/Reject)
   */
  async updateRatingStatus(ratingId: number, status: 'APPROVED' | 'REJECTED'): Promise<AdminRating> {
    try {
      const response = await apiClient.put(API_ENDPOINTS.RESTAURANT.ADMIN_UPDATE_RATING_STATUS(ratingId), null, {
        params: { status }
      });
      return parseAdminRating(handleResponse(response), 'rating');
    } catch (error) {
      return handleError(error);
    }
  }
  /**
   * Fetch all system coupons
   */
  async fetchAllCoupons(): Promise<AdminCoupon[]> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PROMOTION.ADMIN_GET_ALL);
      return requireArray(handleResponse(response), 'coupons', parseAdminCoupon);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * Create a new platform coupon
   */
  async createCoupon(data: CreateAdminCouponRequest): Promise<AdminCoupon> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.PROMOTION.CREATE_PLATFORM, data);
      return parseAdminCoupon(handleResponse(response), 'coupon');
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * Delete a coupon
   */
  async deleteCoupon(id: number): Promise<void> {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.PROMOTION.DELETE(id));
      return handleResponse<void>(response);
    } catch (error) {
      return handleError(error);
    }
  }

  async fetchPendingShopCoupons(): Promise<AdminCoupon[]> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PROMOTION.ADMIN_PENDING_SHOP);
      return requireArray(handleResponse(response), 'pending shop coupons', parseAdminCoupon);
    } catch (error) { return handleError(error); }
  }

  async approveShopCoupon(id: number): Promise<AdminCoupon> {
    try { return parseAdminCoupon(handleResponse(await apiClient.post(API_ENDPOINTS.PROMOTION.ADMIN_APPROVE(id))), 'approved coupon'); }
    catch (error) { return handleError(error); }
  }

  async rejectShopCoupon(id: number, reason?: string): Promise<AdminCoupon> {
    try { return parseAdminCoupon(handleResponse(await apiClient.post(API_ENDPOINTS.PROMOTION.ADMIN_REJECT(id), null, { params: reason ? { reason } : undefined })), 'rejected coupon'); }
    catch (error) { return handleError(error); }
  }

  async pauseCoupon(id: number): Promise<AdminCoupon> {
    try { return parseAdminCoupon(handleResponse(await apiClient.post(API_ENDPOINTS.PROMOTION.ADMIN_PAUSE(id))), 'paused coupon'); }
    catch (error) { return handleError(error); }
  }

  async resumeCoupon(id: number): Promise<AdminCoupon> {
    try { return parseAdminCoupon(handleResponse(await apiClient.post(API_ENDPOINTS.PROMOTION.ADMIN_RESUME(id))), 'resumed coupon'); }
    catch (error) { return handleError(error); }
  }

}

export interface AdminCoupon {
  id: number;
  code: string;
  name: string;
  description: string;
  creatorType: 'PLATFORM' | 'SHOP' | 'MERCHANT';
  rewardType: string;
  discountValue: number;
  maxDiscountValue: number | null;
  totalQuantity: number;
  usedQuantity: number;
  startTime: string;
  endTime: string;
  minOrderValue: number;
  scopeType: 'ALL' | 'SHOP' | 'CATEGORY';
  scopeRefId: number | null;
  active: boolean;
  layer?: string;
  fundingSource?: string;
  approvalStatus?: string;
}

export interface CreateAdminCouponRequest {
  code: string;
  name: string;
  description: string;
  rewardType: string;
  discountValue: number;
  maxDiscountValue: number | null;
  totalQuantity: number;
  usageLimitPerUser: number;
  startTime: string;
  endTime: string;
  minOrderValue: number;
  scopeType: 'ALL' | 'SHOP';
  scopeRefId: number | null;
}

export interface AdminRating {
  id: number;
  restaurantId: number;
  customerId: number;
  orderId: number;
  rating: number;
  comment: string;
  status: string;
  createdAt: string;
}

export default new AdminService();
