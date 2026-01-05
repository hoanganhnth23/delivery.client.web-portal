/**
 * useRestaurant Hook
 * Custom hook để quản lý state và actions cho Restaurant
 * Theo pattern: Context API + Custom Hook với useMemo & useCallback
 */

import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as restaurantService from '../services/restaurantService';

// Import types for JSDoc
/** @typedef {import('@/types/api.types').Restaurant} Restaurant */
/** @typedef {import('@/types/api.types').CreateRestaurantRequest} CreateRestaurantRequest */
/** @typedef {import('@/types/api.types').RestaurantActionResult} RestaurantActionResult */
/** @typedef {import('@/types/api.types').RestaurantListActionResult} RestaurantListActionResult */
/** @typedef {import('@/types/api.types').DeleteActionResult} DeleteActionResult */

const RestaurantContext = createContext(null);

export const RestaurantProvider = ({ children }) => {
  const navigate = useNavigate();
  
  // States
  /** @type {[Restaurant[], Function]} */
  const [restaurants, setRestaurants] = useState([]);
  /** @type {[Restaurant | null, Function]} */
  const [currentRestaurant, setCurrentRestaurant] = useState(null);
  const [loading, setLoading] = useState(false);
  /** @type {[string | null, Function]} */
  const [error, setError] = useState(null);

  /**
   * Tạo nhà hàng mới
   * @param {CreateRestaurantRequest} data - Thông tin nhà hàng
   * @param {Object} options - { skipRedirect: boolean }
   * @returns {Promise<RestaurantActionResult>}
   */
  const createRestaurant = useCallback(async (data, options = {}) => {
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
      const message = err.response?.data?.message || 'Tạo nhà hàng thất bại';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  /**
   * Cập nhật thông tin nhà hàng
   * @param {number} id - Restaurant ID
   * @param {CreateRestaurantRequest} data - Thông tin cập nhật
   * @param {Object} options - { skipRedirect: boolean }
   * @returns {Promise<RestaurantActionResult>}
   */
  const updateRestaurant = useCallback(async (id, data, options = {}) => {
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
      const message = err.response?.data?.message || 'Cập nhật nhà hàng thất bại';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  /**
   * Xóa nhà hàng
   * @param {number} id - Restaurant ID
   * @param {Object} options - { skipRedirect: boolean }
   * @returns {Promise<DeleteActionResult>}
   */
  const deleteRestaurant = useCallback(async (id, options = {}) => {
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
      const message = err.response?.data?.message || 'Xóa nhà hàng thất bại';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [currentRestaurant, navigate]);

  /**
   * Lấy thông tin chi tiết nhà hàng
   * @param {number} id - Restaurant ID
   * @returns {Promise<RestaurantActionResult>}
   */
  const getRestaurantById = useCallback(async (id) => {
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
      const message = err.response?.data?.message || 'Lấy thông tin nhà hàng thất bại';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Lấy danh sách tất cả nhà hàng
   * @returns {Promise<RestaurantListActionResult>}
   */
  const getAllRestaurants = useCallback(async () => {
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
      const message = err.response?.data?.message || 'Lấy danh sách nhà hàng thất bại';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Tìm kiếm nhà hàng
   * @param {string} keyword - Từ khóa tìm kiếm
   * @returns {Promise<RestaurantListActionResult>}
   */
  const searchRestaurants = useCallback(async (keyword) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await restaurantService.searchRestaurants(keyword);
      
      if (response.status === 1) {
        setRestaurants(response.data);
        return { success: true, data: response.data };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Tìm kiếm thất bại';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Context Value wrapped in useMemo (CRITICAL for performance)
  const value = useMemo(() => ({
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
