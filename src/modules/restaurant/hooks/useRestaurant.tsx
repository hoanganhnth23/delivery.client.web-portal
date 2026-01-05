/**
 * useRestaurant Hook
 * Custom hook để quản lý state và actions cho Restaurant
 * Theo pattern: Context API + Custom Hook với useMemo & useCallback
 */

import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import * as restaurantService from '../services/restaurantService';
import type { CreateRestaurantRequest } from '../services/restaurantService';
import type {
  Restaurant,
  RestaurantActionResult,
  RestaurantListActionResult,
  DeleteActionResult,
} from '@/types/api.types';

// ============================================
// LOCAL TYPES
// ============================================

interface RestaurantContextValue {
  // States
  restaurants: Restaurant[];
  currentRestaurant: Restaurant | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  createRestaurant: (data: CreateRestaurantRequest, options?: ActionOptions) => Promise<RestaurantActionResult>;
  updateRestaurant: (id: number, data: CreateRestaurantRequest, options?: ActionOptions) => Promise<RestaurantActionResult>;
  deleteRestaurant: (id: number, options?: ActionOptions) => Promise<DeleteActionResult>;
  getRestaurantById: (id: number) => Promise<RestaurantActionResult>;
  getAllRestaurants: () => Promise<RestaurantListActionResult>;
  searchRestaurants: (params: Record<string, unknown>) => Promise<RestaurantListActionResult>;
  
  // Setters
  setCurrentRestaurant: (restaurant: Restaurant | null) => void;
  setError: (error: string | null) => void;
}

interface ActionOptions {
  skipRedirect?: boolean;
}

interface RestaurantProviderProps {
  children: ReactNode;
}

const RestaurantContext = createContext<RestaurantContextValue | null>(null);

export const RestaurantProvider = ({ children }: RestaurantProviderProps) => {
  const navigate = useNavigate();
  
  // States
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Tạo nhà hàng mới
   */
  const createRestaurant = useCallback(async (
    data: CreateRestaurantRequest,
    options: ActionOptions = {}
  ): Promise<RestaurantActionResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await restaurantService.createRestaurant(data);
      
      if (response.status === 1) {
        // Thêm vào danh sách
        setRestaurants(prev => [response.data, ...prev]);
        setCurrentRestaurant(response.data);
        
        // Navigation logic (Hybrid)
        if (!options.skipRedirect) {
          navigate('/restaurant/dashboard');
        }
        
        return { success: true, data: response.data };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Tạo nhà hàng thất bại';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  /**
   * Cập nhật thông tin nhà hàng
   */
  const updateRestaurant = useCallback(async (
    id: number,
    data: CreateRestaurantRequest,
    options: ActionOptions = {}
  ): Promise<RestaurantActionResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await restaurantService.updateRestaurant(id, data);
      
      if (response.status === 1) {
        // Cập nhật trong danh sách
        setRestaurants(prev => 
          prev.map(r => r.id === id ? response.data : r)
        );
        setCurrentRestaurant(response.data);
        
        if (!options.skipRedirect) {
          navigate('/restaurant/dashboard');
        }
        
        return { success: true, data: response.data };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Cập nhật nhà hàng thất bại';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  /**
   * Xóa nhà hàng
   */
  const deleteRestaurant = useCallback(async (
    id: number,
    options: ActionOptions = {}
  ): Promise<DeleteActionResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await restaurantService.deleteRestaurant(id);
      
      if (response.status === 1) {
        // Xóa khỏi danh sách
        setRestaurants(prev => prev.filter(r => r.id !== id));
        if (currentRestaurant?.id === id) {
          setCurrentRestaurant(null);
        }
        
        if (!options.skipRedirect) {
          navigate('/restaurant/dashboard');
        }
        
        return { success: true };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Xóa nhà hàng thất bại';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [currentRestaurant, navigate]);

  /**
   * Lấy thông tin chi tiết nhà hàng
   */
  const getRestaurantById = useCallback(async (id: number): Promise<RestaurantActionResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await restaurantService.getRestaurantById(id);
      
      if (response.status === 1) {
        setCurrentRestaurant(response.data);
        return { success: true, data: response.data };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Lấy thông tin nhà hàng thất bại';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Lấy danh sách tất cả nhà hàng
   */
  const getAllRestaurants = useCallback(async (): Promise<RestaurantListActionResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await restaurantService.getAllRestaurants();
      
      if (response.status === 1) {
        setRestaurants(response.data);
        return { success: true, data: response.data };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Lấy danh sách nhà hàng thất bại';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Tìm kiếm nhà hàng
   */
  const searchRestaurants = useCallback(async (params: Record<string, unknown>): Promise<RestaurantListActionResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await restaurantService.searchRestaurants(params);
      
      if (response.status === 1) {
        setRestaurants(response.data);
        return { success: true, data: response.data };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Tìm kiếm thất bại';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Context Value wrapped in useMemo (CRITICAL for performance)
  const value = useMemo<RestaurantContextValue>(() => ({
    // States
    restaurants,
    currentRestaurant,
    loading,
    error,
    // Actions
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    getRestaurantById,
    getAllRestaurants,
    searchRestaurants,
    // Setters
    setCurrentRestaurant,
    setError
  }), [
    restaurants,
    currentRestaurant,
    loading,
    error,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    getRestaurantById,
    getAllRestaurants,
    searchRestaurants
  ]);

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
};

/**
 * Custom hook để sử dụng Restaurant Context
 * @throws {Error} Nếu sử dụng ngoài RestaurantProvider
 */
export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within RestaurantProvider');
  }
  return context;
};
