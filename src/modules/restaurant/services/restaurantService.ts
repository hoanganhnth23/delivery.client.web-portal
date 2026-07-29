/**
 * Restaurant Service
 * Xử lý tất cả API calls liên quan đến nhà hàng
 */

import apiClient, { handleResponse } from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/services/api/endpoints';
import {
  optionalText,
  requireArray,
  requireBoolean,
  requireEnum,
  requireInteger,
  requireNumberRange,
  requireRecord,
  requireString,
  requireTimestamp,
} from '@/services/api/contract';
import type { Restaurant } from '@/types/api.types';

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

export interface RestaurantRating {
  id: number;
  restaurantId: number;
  customerId: number;
  orderId: number;
  rating: number;
  comment: string;
  status: 'APPROVED';
  createdAt: string;
}

const parseTime = (value: unknown, label: string): string => {
  if (value === null || value === undefined) return '';
  const time = requireString(value, label);
  if (!/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(time)) {
    throw new Error(`${label} must use HH:mm:ss`);
  }
  return time;
};

const parseRestaurant = (value: unknown, label: string): Restaurant => {
  const restaurant = requireRecord(value, label);
  return {
    id: requireInteger(restaurant.id, `${label}.id`, 1),
    name: requireString(restaurant.name, `${label}.name`),
    address: optionalText(restaurant.address, `${label}.address`) ?? '',
    phone: optionalText(restaurant.phone, `${label}.phone`) ?? '',
    openingHour: parseTime(restaurant.openingHour, `${label}.openingHour`),
    closingHour: parseTime(restaurant.closingHour, `${label}.closingHour`),
    image: optionalText(restaurant.image, `${label}.image`) ?? '',
    addressLat: requireNumberRange(restaurant.latitude, `${label}.latitude`, 8, 24),
    addressLng: requireNumberRange(restaurant.longitude, `${label}.longitude`, 102, 110),
    description: optionalText(restaurant.description, `${label}.description`) ?? '',
    open: requireBoolean(restaurant.open, `${label}.open`),
    rating: requireNumberRange(restaurant.rating, `${label}.rating`, 0, 5),
    ratingCount: requireInteger(restaurant.ratingCount, `${label}.ratingCount`),
  };
};

const parseRestaurantRating = (value: unknown, label: string): RestaurantRating => {
  const rating = requireRecord(value, label);
  const score = requireInteger(rating.rating, `${label}.rating`, 1);
  if (score > 5) {
    throw new Error(`${label}.rating must be less than or equal to 5`);
  }
  return {
    id: requireInteger(rating.id, `${label}.id`, 1),
    restaurantId: requireInteger(rating.restaurantId, `${label}.restaurantId`, 1),
    customerId: requireInteger(rating.customerId, `${label}.customerId`, 1),
    orderId: requireInteger(rating.orderId, `${label}.orderId`, 1),
    rating: score,
    comment: optionalText(rating.comment, `${label}.comment`) ?? '',
    status: requireEnum(rating.status, ['APPROVED'] as const, `${label}.status`),
    createdAt: requireTimestamp(rating.createdAt, `${label}.createdAt`),
  };
};

/**
 * Tạo nhà hàng mới
 */
export const createRestaurant = async (data: CreateRestaurantRequest): Promise<Restaurant> => {
  const response = await apiClient.post(API_ENDPOINTS.RESTAURANT.CREATE, data);
  return parseRestaurant(handleResponse(response), 'restaurant');
};

/**
 * Cập nhật thông tin nhà hàng
 */
export const updateRestaurant = async (id: number, data: CreateRestaurantRequest): Promise<Restaurant> => {
  const response = await apiClient.put(API_ENDPOINTS.RESTAURANT.UPDATE(id), data);
  return parseRestaurant(handleResponse(response), 'restaurant');
};

/**
 * Lấy danh sách nhà hàng của user hiện tại
 * Sử dụng X_USER_ID từ header (được set tự động bởi apiClient)
 */
export const getMyRestaurants = async (): Promise<Restaurant[]> => {
  const response = await apiClient.get(API_ENDPOINTS.RESTAURANT.GET_MY_RESTAURANTS);
  return requireArray(handleResponse(response), 'restaurants', parseRestaurant);
};

/**
 * Lấy danh sách đánh giá của nhà hàng
 */
export const getRestaurantRatings = async (
  restaurantId: number,
): Promise<RestaurantRating[]> => {
  const response = await apiClient.get(API_ENDPOINTS.RESTAURANT.GET_RATINGS(restaurantId));
  return requireArray(handleResponse(response), 'ratings', parseRestaurantRating);
};
