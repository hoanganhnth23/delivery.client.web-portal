/**
 * Menu Service
 * Xử lý tất cả API calls liên quan đến món ăn
 */

import apiClient from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/services/api/endpoints';
import type {
  MenuItemResponse,
  MenuItemListResponse,
  DeleteResponse,
} from '@/types/api.types';

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

/**
 * Tạo món ăn mới
 */
export const createMenuItem = async (data: CreateMenuItemRequest): Promise<MenuItemResponse> => {
  const response = await apiClient.post(API_ENDPOINTS.MENU.CREATE, data);
  return response.data;
};

/**
 * Cập nhật thông tin món ăn
 */
export const updateMenuItem = async (id: number, data: CreateMenuItemRequest): Promise<MenuItemResponse> => {
  const response = await apiClient.put(API_ENDPOINTS.MENU.UPDATE(id), data);
  return response.data;
};

/**
 * Xóa món ăn
 */
export const deleteMenuItem = async (id: number): Promise<DeleteResponse> => {
  const response = await apiClient.delete(API_ENDPOINTS.MENU.DELETE(id));
  return response.data;
};

/**
 * Lấy thông tin chi tiết món ăn
 */
export const getMenuItemById = async (id: number): Promise<MenuItemResponse> => {
  const response = await apiClient.get(API_ENDPOINTS.MENU.GET_BY_ID(id));
  return response.data;
};

/**
 * Lấy danh sách món ăn theo nhà hàng
 */
export const getMenuItemsByRestaurant = async (restaurantId: number): Promise<MenuItemListResponse> => {
  const response = await apiClient.get(API_ENDPOINTS.MENU.GET_BY_RESTAURANT(restaurantId));
  return response.data;
};

/**
 * Lấy tất cả món ăn
 */
export const getAllMenuItems = async (): Promise<MenuItemListResponse> => {
  const response = await apiClient.get(API_ENDPOINTS.MENU.GET_ALL);
  return response.data;
};

/**
 * Tìm kiếm món ăn
 */
export const searchMenuItems = async (params: Record<string, unknown>): Promise<MenuItemListResponse> => {
  const response = await apiClient.get(API_ENDPOINTS.MENU.SEARCH, { params });
  return response.data;
};
