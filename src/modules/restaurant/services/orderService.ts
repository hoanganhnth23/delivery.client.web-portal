/**
 * Order Service
 * Xử lý các API calls liên quan đến Orders
 */

import apiClient, { handleResponse } from '@/services/api/apiClient';
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
import type { Order, OrderItem, PageData } from '@/types/api.types';

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
    restaurantLat: requireNumber(order.restaurantLat, `${label}.restaurantLat`),
    restaurantLng: requireNumber(order.restaurantLng, `${label}.restaurantLng`),
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
    pickupLat: requireNumber(order.pickupLat, `${label}.pickupLat`),
    pickupLng: requireNumber(order.pickupLng, `${label}.pickupLng`),
    customerName: requireString(order.customerName, `${label}.customerName`),
    customerPhone: requireString(order.customerPhone, `${label}.customerPhone`),
    ...(notes === null ? {} : { notes }),
    createdAt: requireTimestamp(order.createdAt, `${label}.createdAt`),
    updatedAt: requireTimestamp(order.updatedAt, `${label}.updatedAt`),
    items: requireArray(order.items, `${label}.items`, parseOrderItem),
  };
};

/**
 * Lấy danh sách orders của nhà hàng hiện tại
 */
export const getMyOrders = async (page = 0, size = 10): Promise<PageData<Order>> => {
  const response = await apiClient.get(API_ENDPOINTS.ORDER.GET_MY_ORDERS, {
    params: { page, size },
  });
  return requirePage(handleResponse(response), 'orders page', parseOrder);
};

/**
 * Lấy chi tiết order theo ID
 */
export const getOrderById = async (id: number): Promise<Order> => {
  const response = await apiClient.get(API_ENDPOINTS.ORDER.GET_BY_ID(id));
  return parseOrder(handleResponse(response), 'order');
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
