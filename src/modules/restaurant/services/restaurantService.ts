/**
 * Restaurant Service
 * Xử lý tất cả API calls liên quan đến nhà hàng
 */

import apiClient from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/services/api/endpoints';
import type {
  RestaurantResponse,
  RestaurantListResponse,
  DeleteResponse,
} from '@/types/api.types';

// ============================================
// LOCAL TYPES (chỉ dùng trong restaurant module)
// ============================================

export interface CreateRestaurantRequest {
  name: string;
  address: string;
  phone: string;
  openingHour: string;
  closingHour: string;
  image: string;
  addressLat: number;
  addressLng: number;
  description: string;
}

/**
 * Tạo nhà hàng mới
 */
export const createRestaurant = async (data: CreateRestaurantRequest): Promise<RestaurantResponse> => {
  const response = await apiClient.post(API_ENDPOINTS.RESTAURANT.CREATE, data);
  return response.data;
};

/**
 * Cập nhật thông tin nhà hàng
 */
export const updateRestaurant = async (id: number, data: CreateRestaurantRequest): Promise<RestaurantResponse> => {
  const response = await apiClient.put(API_ENDPOINTS.RESTAURANT.UPDATE(id), data);
  return response.data;
};

/**
 * Xóa nhà hàng
 */
export const deleteRestaurant = async (id: number): Promise<DeleteResponse> => {
  const response = await apiClient.delete(API_ENDPOINTS.RESTAURANT.DELETE(id));
  return response.data;
};

/**
 * Lấy thông tin chi tiết nhà hàng
 */
export const getRestaurantById = async (id: number): Promise<RestaurantResponse> => {
  const response = await apiClient.get(API_ENDPOINTS.RESTAURANT.GET_BY_ID(id));
  return response.data;
};

/**
 * Lấy tất cả nhà hàng
 */
export const getAllRestaurants = async (): Promise<RestaurantListResponse> => {
  const response = await apiClient.get(API_ENDPOINTS.RESTAURANT.GET_ALL);
  return response.data;
};

/**
 * Tìm kiếm nhà hàng
 */
export const searchRestaurants = async (params: Record<string, unknown>): Promise<RestaurantListResponse> => {
  const response = await apiClient.get(API_ENDPOINTS.RESTAURANT.SEARCH, { params });
  return response.data;
};
