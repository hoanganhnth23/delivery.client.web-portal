/**
 * Order Service
 * Xử lý các API calls liên quan đến Orders
 */

import apiClient, { handleError, handleResponse } from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/services/api/endpoints';
import {
  optionalPositiveInteger,
  optionalText,
  requireArray,
  requireEnum,
  requireInteger,
  requireNumber,
  requirePage,
  requireRecord,
  requireString,
  requireTimestamp,
} from '@/services/api/contract';
import type {
  CheckoutPreview,
  CheckoutPreviewRequest,
  CreateCustomerOrderRequest,
  Order,
  OrderItem,
  PageData,
} from '@/types/api.types';

export interface CustomerOrderCreateResult {
  order: Order;
  idempotencyKey: string;
}

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

const parseOrderItem = (value: unknown, label: string): OrderItem => {
  const item = requireRecord(value, label);
  const notes = optionalText(item.notes, `${label}.notes`);
  return {
    id: requireInteger(item.id, `${label}.id`, 1),
    menuItemId: requireInteger(item.menuItemId, `${label}.menuItemId`, 1),
    menuItemName: requireString(item.menuItemName, `${label}.menuItemName`),
    quantity: requireInteger(item.quantity, `${label}.quantity`, 1),
    price: requireNumber(item.price, `${label}.price`),
    ...(notes === null ? {} : { notes }),
  };
};

const parseOrder = (value: unknown, label: string): Order => {
  const order = requireRecord(value, label);
  const shipperId = optionalPositiveInteger(order.shipperId, `${label}.shipperId`);
  const notes = optionalText(order.notes, `${label}.notes`);
  return {
    id: requireInteger(order.id, `${label}.id`, 1),
    userId: requireInteger(order.userId, `${label}.userId`, 1),
    restaurantId: requireInteger(order.restaurantId, `${label}.restaurantId`, 1),
    restaurantName: requireString(order.restaurantName, `${label}.restaurantName`),
    restaurantAddress: requireString(order.restaurantAddress, `${label}.restaurantAddress`),
    restaurantPhone: requireString(order.restaurantPhone, `${label}.restaurantPhone`),
    restaurantLat: requireNumber(
      order.restaurantLat ?? order.pickupLat,
      `${label}.restaurantLat`,
    ),
    restaurantLng: requireNumber(
      order.restaurantLng ?? order.pickupLng,
      `${label}.restaurantLng`,
    ),
    ...(shipperId === null ? {} : { shipperId }),
    subtotalPrice: requireNumber(order.subtotalPrice, `${label}.subtotalPrice`),
    discountAmount: requireNumber(order.discountAmount, `${label}.discountAmount`),
    shippingFee: requireNumber(order.shippingFee, `${label}.shippingFee`),
    totalPrice: requireNumber(order.totalPrice, `${label}.totalPrice`),
    status: requireEnum(order.status, ORDER_STATUSES, `${label}.status`),
    paymentMethod: requireEnum(order.paymentMethod, ['COD'] as const, `${label}.paymentMethod`),
    deliveryAddress: requireString(order.deliveryAddress, `${label}.deliveryAddress`),
    deliveryLat: requireNumber(order.deliveryLat, `${label}.deliveryLat`),
    deliveryLng: requireNumber(order.deliveryLng, `${label}.deliveryLng`),
    pickupLat: requireNumber(
      order.pickupLat ?? order.restaurantLat,
      `${label}.pickupLat`,
    ),
    pickupLng: requireNumber(
      order.pickupLng ?? order.restaurantLng,
      `${label}.pickupLng`,
    ),
    customerName: requireString(order.customerName, `${label}.customerName`),
    customerPhone: requireString(order.customerPhone, `${label}.customerPhone`),
    ...(notes === null ? {} : { notes }),
    createdAt: requireTimestamp(order.createdAt, `${label}.createdAt`),
    updatedAt: requireTimestamp(order.updatedAt, `${label}.updatedAt`),
    items: requireArray(order.items ?? [], `${label}.items`, parseOrderItem),
  };
};

const optionalNumber = (value: unknown, label: string): number | undefined => {
  if (value === null || value === undefined) return undefined;
  return requireNumber(value, label);
};

const parseCheckoutPreview = (value: unknown, label = 'checkout preview'): CheckoutPreview => {
  const preview = requireRecord(value, label);
  const parsePreviewItem = (itemValue: unknown, itemLabel: string) => {
    const item = requireRecord(itemValue, itemLabel);
    return {
      menuItemId: requireInteger(item.menuItemId, `${itemLabel}.menuItemId`, 1),
      menuItemName: requireString(item.menuItemName, `${itemLabel}.menuItemName`),
      ...(optionalText(item.imageUrl, `${itemLabel}.imageUrl`) === null
        ? {}
        : { imageUrl: optionalText(item.imageUrl, `${itemLabel}.imageUrl`) ?? undefined }),
      unitPrice: requireNumber(item.unitPrice, `${itemLabel}.unitPrice`),
      quantity: requireInteger(item.quantity, `${itemLabel}.quantity`, 1),
      lineTotal: requireNumber(item.lineTotal, `${itemLabel}.lineTotal`),
    };
  };
  const parsePriceChange = (itemValue: unknown, itemLabel: string) => {
    const item = requireRecord(itemValue, itemLabel);
    const oldPrice = optionalNumber(item.oldPrice, `${itemLabel}.oldPrice`);
    return {
      menuItemId: requireInteger(item.menuItemId, `${itemLabel}.menuItemId`, 1),
      menuItemName: requireString(item.menuItemName, `${itemLabel}.menuItemName`),
      ...(oldPrice === undefined ? {} : { oldPrice }),
      newPrice: requireNumber(item.newPrice, `${itemLabel}.newPrice`),
    };
  };
  const priceChanges = requireArray(
    preview.priceChanges ?? [],
    `${label}.priceChanges`,
    parsePriceChange,
  );
  const unavailableItemIds = requireArray(
    preview.unavailableItemIds ?? [],
    `${label}.unavailableItemIds`,
    (item, itemLabel) => requireInteger(item, itemLabel, 1),
  );

  return {
    quoteId: requireString(preview.quoteId, `${label}.quoteId`),
    expiresAt: requireTimestamp(preview.expiresAt, `${label}.expiresAt`),
    restaurantId: requireInteger(preview.restaurantId, `${label}.restaurantId`, 1),
    restaurantName: requireString(preview.restaurantName, `${label}.restaurantName`),
    items: requireArray(preview.items, `${label}.items`, parsePreviewItem),
    subtotal: requireNumber(preview.subtotal, `${label}.subtotal`),
    shippingFee: requireNumber(preview.shippingFee, `${label}.shippingFee`),
    discountAmount: requireNumber(preview.discountAmount, `${label}.discountAmount`),
    totalPrice: requireNumber(preview.totalPrice, `${label}.totalPrice`),
    ...(optionalText(preview.couponCode, `${label}.couponCode`) === null
      ? {}
      : { couponCode: optionalText(preview.couponCode, `${label}.couponCode`) ?? undefined }),
    ...(optionalText(preview.couponMessage, `${label}.couponMessage`) === null
      ? {}
      : { couponMessage: optionalText(preview.couponMessage, `${label}.couponMessage`) ?? undefined }),
    ...(preview.voucherId === null || preview.voucherId === undefined
      ? {}
      : { voucherId: requireInteger(preview.voucherId, `${label}.voucherId`, 1) }),
    selectedVoucherIds: Array.isArray(preview.selectedVoucherIds)
      ? preview.selectedVoucherIds.map((id, index) => requireInteger(id, `${label}.selectedVoucherIds[${index}]`, 1))
      : [],
    ...(typeof preview.selectionMode === 'string' ? { selectionMode: preview.selectionMode as 'AUTO' | 'MANUAL' } : {}),
    itemDiscount: requireNumber(preview.itemDiscount ?? preview.discountAmount, `${label}.itemDiscount`),
    shippingDiscount: requireNumber(preview.shippingDiscount ?? 0, `${label}.shippingDiscount`),
    customerShippingFee: requireNumber(preview.customerShippingFee ?? preview.shippingFee, `${label}.customerShippingFee`),
    grossShippingFee: requireNumber(preview.grossShippingFee ?? preview.shippingFee, `${label}.grossShippingFee`),
    platformSubsidy: requireNumber(preview.platformSubsidy ?? 0, `${label}.platformSubsidy`),
    shopDiscount: requireNumber(preview.shopDiscount ?? preview.discountAmount, `${label}.shopDiscount`),
    appliedVouchers: Array.isArray(preview.appliedVouchers) ? preview.appliedVouchers.map((entry, index) => {
      const item = requireRecord(entry, `${label}.appliedVouchers[${index}]`);
      return {
        voucherId: requireInteger(item.voucherId, `${label}.appliedVouchers[${index}].voucherId`, 1),
        code: requireString(item.code, `${label}.appliedVouchers[${index}].code`),
        layer: requireString(item.layer, `${label}.appliedVouchers[${index}].layer`),
        fundingSource: requireString(item.fundingSource, `${label}.appliedVouchers[${index}].fundingSource`),
        discountBase: requireNumber(item.discountBase, `${label}.appliedVouchers[${index}].discountBase`),
        discountAmount: requireNumber(item.discountAmount, `${label}.appliedVouchers[${index}].discountAmount`),
      };
    }) : [],
    priceChanges,
    unavailableItemIds,
  };
};

/**
 * Lấy danh sách orders của nhà hàng hiện tại
 */
export const getMyOrders = async (page = 0, size = 10, restaurantId?: number): Promise<PageData<Order>> => {
  const params: Record<string, unknown> = { page, size };
  if (restaurantId) {
    params.restaurantId = restaurantId;
  }
  const response = await apiClient.get(API_ENDPOINTS.ORDER.GET_MY_ORDERS, {
    params,
  });
  return requirePage(handleResponse(response), 'orders page', parseOrder);
};

/** Customer-owned order history. */
export const getCustomerOrders = async (page = 0, size = 10): Promise<PageData<Order>> => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.ORDER.GET_CUSTOMER_ORDERS, {
      params: { page, size },
    });
    return requirePage(handleResponse(response), 'customer orders page', parseOrder);
  } catch (error) {
    throw handleError(error);
  }
};

export const checkoutPreview = async (
  request: CheckoutPreviewRequest,
): Promise<CheckoutPreview> => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.ORDER.CHECKOUT_PREVIEW, request);
    return parseCheckoutPreview(handleResponse(response));
  } catch (error) {
    throw handleError(error);
  }
};

export const createCustomerOrder = async (
  request: CreateCustomerOrderRequest,
  idempotencyKey: string,
): Promise<CustomerOrderCreateResult> => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.ORDER.CREATE, request, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return {
      order: parseOrder(handleResponse(response), 'created order'),
      idempotencyKey,
    };
  } catch (error) {
    throw handleError(error);
  }
};

export const cancelOrder = async (id: number, reason?: string): Promise<Order> => {
  try {
    const response = await apiClient.put(
      API_ENDPOINTS.ORDER.CANCEL(id),
      reason?.trim() ? { reason: reason.trim() } : undefined,
    );
    return parseOrder(handleResponse(response), 'cancelled order');
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Lấy chi tiết order theo ID
 */
export const getOrderById = async (id: number): Promise<Order> => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.ORDER.GET_BY_ID(id));
    return parseOrder(handleResponse(response), 'order');
  } catch (error) {
    throw handleError(error);
  }
};

export const confirmOrder = async (
  orderId: number,
  restaurantId: number,
  estimatedPrepTime = 30,
): Promise<'CONFIRMED'> => {
  const response = await apiClient.post(
    API_ENDPOINTS.RESTAURANT.CONFIRM_ORDER(orderId),
    { restaurantId, estimatedPrepTime },
  );
  return requireEnum(handleResponse(response), ['CONFIRMED'] as const, 'confirmation result');
};

export const rejectOrder = async (
  orderId: number,
  restaurantId: number,
  reason: string,
): Promise<'REJECTED'> => {
  const response = await apiClient.post(
    API_ENDPOINTS.RESTAURANT.REJECT_ORDER(orderId),
    { restaurantId, reason },
  );
  return requireEnum(handleResponse(response), ['REJECTED'] as const, 'rejection result');
};
