/**
 * useOrder Hook
 * Custom hook để quản lý state và actions cho Orders
 * Theo pattern: Context API + Custom Hook với useMemo & useCallback
 */

import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import * as orderService from '../services/orderService';
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
  
  // Actions
  getMyOrders: () => Promise<OrderListActionResult>;
  getOrderById: (id: number) => Promise<OrderActionResult>;
  updateOrderStatus: (id: number, status: string) => Promise<OrderActionResult>;
  cancelOrder: (id: number) => Promise<OrderActionResult>;
  
  // Setters
  setCurrentOrder: (order: Order | null) => void;
  setError: (error: string | null) => void;
}

interface OrderProviderProps {
  children: ReactNode;
}

const OrderContext = createContext<OrderContextValue | null>(null);

export const OrderProvider = ({ children }: OrderProviderProps) => {
  // States
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Lấy danh sách orders của nhà hàng hiện tại
   */
  const getMyOrders = useCallback(async (): Promise<OrderListActionResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await orderService.getMyOrders();
      
      if (response.status === 1) {
        setOrders(response.data);
        return { success: true, data: response.data };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể tải danh sách đơn hàng';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Lấy chi tiết order theo ID
   */
  const getOrderById = useCallback(async (id: number): Promise<OrderActionResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await orderService.getOrderById(id);
      
      if (response.status === 1) {
        setCurrentOrder(response.data);
        return { success: true, data: response.data };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể tải thông tin đơn hàng';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cập nhật trạng thái order
   */
  const updateOrderStatus = useCallback(async (
    id: number,
    status: string
  ): Promise<OrderActionResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await orderService.updateOrderStatus(id, status);
      
      if (response.status === 1) {
        // Cập nhật lại danh sách orders
        setOrders(prev => prev.map(order => 
          order.id === id ? response.data : order
        ));
        
        if (currentOrder?.id === id) {
          setCurrentOrder(response.data);
        }
        
        return { success: true, data: response.data };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [currentOrder]);

  /**
   * Hủy order
   */
  const cancelOrder = useCallback(async (id: number): Promise<OrderActionResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await orderService.cancelOrder(id);
      
      if (response.status === 1) {
        // Cập nhật lại danh sách orders
        setOrders(prev => prev.map(order => 
          order.id === id ? response.data : order
        ));
        
        if (currentOrder?.id === id) {
          setCurrentOrder(response.data);
        }
        
        return { success: true, data: response.data };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể hủy đơn hàng';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [currentOrder]);

  // Context Value wrapped in useMemo (CRITICAL for performance)
  const value = useMemo<OrderContextValue>(() => ({
    // States
    orders,
    currentOrder,
    loading,
    error,
    // Actions
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
    // Setters
    setCurrentOrder,
    setError
  }), [
    orders,
    currentOrder,
    loading,
    error,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder
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
