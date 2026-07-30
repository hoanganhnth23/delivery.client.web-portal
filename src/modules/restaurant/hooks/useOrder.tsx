/**
 * useOrder Hook
 * Custom hook để quản lý state và actions cho Orders
 * Theo pattern: Context API + Custom Hook với useMemo & useCallback
 */

import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import { useAppDependencies } from '@/app/dependencies';
import type {
  Order,
  OrderActionResult,
  OrderListActionResult,
} from '@/types/api.types';

// ============================================
// LOCAL TYPES
// ============================================

interface OrderContextValue {
  // States
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
  
  // Pagination
  totalPages: number;
  totalItems: number;
  currentPage: number;
  
  // Actions
  getMyOrders: (page?: number, size?: number) => Promise<OrderListActionResult>;
  getOrderById: (id: number) => Promise<OrderActionResult>;
  confirmOrder: (orderId: number, restaurantId: number, estimatedPrepTime?: number) => Promise<OrderActionResult>;
  rejectOrder: (orderId: number, restaurantId: number, reason: string) => Promise<OrderActionResult>;
  
  // Setters
  setCurrentOrder: (order: Order | null) => void;
  setError: (error: string | null) => void;
}

interface OrderProviderProps {
  children: ReactNode;
}

const OrderContext = createContext<OrderContextValue | null>(null);

export const OrderProvider = ({ children }: OrderProviderProps) => {
  const { order: orderService } = useAppDependencies();
  // States
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  /**
   * Lấy danh sách orders của nhà hàng hiện tại
   */
  const getMyOrders = useCallback(async (page = 0, size = 10): Promise<OrderListActionResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const ordersPage = await orderService.getMyOrders(page, size);
      setOrders(ordersPage.items);
      setTotalPages(ordersPage.totalPages);
      setTotalItems(ordersPage.totalItems);
      setCurrentPage(ordersPage.page);
      return { success: true, data: ordersPage };
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể tải danh sách đơn hàng';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [orderService]);

  /**
   * Lấy chi tiết order theo ID
   */
  const getOrderById = useCallback(async (id: number): Promise<OrderActionResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const order = await orderService.getOrderById(id);
      setCurrentOrder(order);
      return { success: true, data: order };
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể tải thông tin đơn hàng';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [orderService]);

  const confirmOrder = useCallback(async (
    orderId: number,
    restaurantId: number,
    estimatedPrepTime = 30,
  ): Promise<OrderActionResult> => {
    try {
      setLoading(true);
      setError(null);

      await orderService.confirmOrder(
        orderId,
        restaurantId,
        estimatedPrepTime,
      );
      return { success: true, message: 'Đã xác nhận đơn hàng' };
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể xác nhận đơn hàng';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [orderService]);

  const rejectOrder = useCallback(async (
    orderId: number,
    restaurantId: number,
    reason: string,
  ): Promise<OrderActionResult> => {
    try {
      setLoading(true);
      setError(null);

      await orderService.rejectOrder(orderId, restaurantId, reason);
      return { success: true, message: 'Đã từ chối đơn hàng' };
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể từ chối đơn hàng';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [orderService]);

  // Context Value wrapped in useMemo (CRITICAL for performance)
  const value = useMemo<OrderContextValue>(() => ({
    // States
    orders,
    currentOrder,
    loading,
    error,
    totalPages,
    totalItems,
    currentPage,
    // Actions
    getMyOrders,
    getOrderById,
    confirmOrder,
    rejectOrder,
    // Setters
    setCurrentOrder,
    setError
  }), [
    orders,
    currentOrder,
    loading,
    error,
    totalPages,
    totalItems,
    currentPage,
    getMyOrders,
    getOrderById,
    confirmOrder,
    rejectOrder
  ]);

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

/**
 * Custom hook để sử dụng Order Context
 * @throws {Error} Nếu sử dụng ngoài OrderProvider
 */
export const useOrder = (): OrderContextValue => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within OrderProvider');
  }
  return context;
};
