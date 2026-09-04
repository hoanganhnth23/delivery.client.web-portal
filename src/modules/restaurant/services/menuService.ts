/**
 * Menu Service
 * Xử lý tất cả API calls liên quan đến món ăn
 */

import apiClient, { handleError, handleResponse } from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/services/api/endpoints';
import {
  optionalText,
  optionalTimestamp,
  requireArray,
  requireEnum,
  requireInteger,
  requireNumber,
  requireRecord,
  requireString,
} from '@/services/api/contract';
import type { MenuItem } from '@/types/api.types';

// ============================================
// LOCAL TYPES (chỉ dùng trong menu service)
// ============================================

export interface CreateMenuItemRequest {
  restaurantId: number;
  name: string;
  description: string;
  price: number;
  image: string;
}

const parseMenuItem = (value: unknown, label: string): MenuItem => {
  const item = requireRecord(value, label);
  const rawStatus = typeof item.status === 'string'
    ? item.status.toUpperCase()
    : item.status;
  return {
    id: requireInteger(item.id, `${label}.id`, 1),
    restaurantId: requireInteger(item.restaurantId, `${label}.restaurantId`, 1),
    name: requireString(item.name, `${label}.name`),
    description: optionalText(item.description, `${label}.description`) ?? '',
    price: requireNumber(item.price, `${label}.price`, 0),
    image: optionalText(item.image, `${label}.image`) ?? '',
    status: requireEnum(
      rawStatus,
      ['AVAILABLE', 'SOLD_OUT', 'DISCONTINUED'] as const,
      `${label}.status`,
    ),
    // Timestamps are optional in the shared web type. Preserve null/missing
    // values instead of fabricating a current time for server data.
    createdAt: optionalTimestamp(item.createdAt, `${label}.createdAt`) ?? undefined,
    updatedAt: optionalTimestamp(item.updatedAt, `${label}.updatedAt`) ?? undefined,
  };
};

/**
 * Tạo món ăn mới
 */
export const createMenuItem = async (data: CreateMenuItemRequest): Promise<MenuItem> => {
  const response = await apiClient.post(API_ENDPOINTS.MENU.CREATE, data);
  return parseMenuItem(handleResponse(response), 'menu item');
};

/**
 * Cập nhật thông tin món ăn
 */
export const updateMenuItem = async (id: number, data: CreateMenuItemRequest): Promise<MenuItem> => {
  const response = await apiClient.put(API_ENDPOINTS.MENU.UPDATE(id), data);
  return parseMenuItem(handleResponse(response), 'menu item');
};

/**
 * Xóa món ăn
 */
export const deleteMenuItem = async (id: number): Promise<void> => {
  const response = await apiClient.delete(API_ENDPOINTS.MENU.DELETE(id));
  handleResponse<void>(response);
};

/**
 * Lấy danh sách món ăn của nhà hàng hiện tại
 * Identity/ownership được backend derive từ Bearer token qua Gateway.
 */
export const getMyMenuItems = async (): Promise<MenuItem[]> => {
  const response = await apiClient.get(API_ENDPOINTS.MENU.GET_MY_MENU_ITEMS);
  return requireArray(handleResponse(response), 'menu items', parseMenuItem);
};

/** Public menu read for the customer storefront. */
export const getMenuItemsByRestaurant = async (
  restaurantId: number,
  availableOnly = true,
): Promise<MenuItem[]> => {
  try {
    const endpoint = availableOnly
      ? API_ENDPOINTS.MENU.GET_AVAILABLE_BY_RESTAURANT(restaurantId)
      : API_ENDPOINTS.MENU.GET_BY_RESTAURANT(restaurantId);
    const response = await apiClient.get(endpoint);
    return requireArray(handleResponse(response), 'menu items', parseMenuItem);
  } catch (error) {
    throw handleError(error);
  }
};
