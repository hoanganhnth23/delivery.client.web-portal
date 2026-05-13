/**
 * Order Service
 * Xử lý các API calls liên quan đến Orders
 */

import apiClient from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/services/api/endpoints';
import type { OrderResponse, OrderListResponse } from '@/types/api.types';

/**
 * Lấy danh sách orders của nhà hàng hiện tại
 */
export const getMyOrders = async (page = 0, size = 10): Promise<OrderListResponse> => {
  const response = await apiClient.get<OrderListResponse>(
    `${API_ENDPOINTS.ORDER.GET_MY_ORDERS}?page=${page}&size=${size}`
  );
  return response.data;
};

/**
 * Lấy chi tiết order theo ID
 */
export const getOrderById = async (id: number): Promise<OrderResponse> => {
  const response = await apiClient.get<OrderResponse>(
    API_ENDPOINTS.ORDER.GET_BY_ID(id)
  );
  return response.data;
};

/**
 * Cập nhật trạng thái order
 */
export const updateOrderStatus = async (
  id: number,
  status: string
): Promise<OrderResponse> => {
  const response = await apiClient.put<OrderResponse>(
    API_ENDPOINTS.ORDER.UPDATE_STATUS(id),
    { status }
  );
  return response.data;
};

/**
 * Hủy order
 */
export const cancelOrder = async (id: number): Promise<OrderResponse> => {
  const response = await apiClient.put<OrderResponse>(
    API_ENDPOINTS.ORDER.CANCEL(id)
  );
  return response.data;
};
