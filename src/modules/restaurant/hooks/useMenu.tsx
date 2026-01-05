/**
 * useMenu Hook
 * Custom hook để quản lý state và actions cho Menu Items
 * Theo pattern: Context API + Custom Hook với useMemo & useCallback
 */

import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import * as menuService from '../services/menuService';
import type {
  MenuItem,
  CreateMenuItemRequest,
  MenuItemActionResult,
  MenuItemListActionResult,
  DeleteActionResult,
} from '@/types/api.types';

interface MenuContextValue {
  // States
  menuItems: MenuItem[];
  currentMenuItem: MenuItem | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  createMenuItem: (data: CreateMenuItemRequest, options?: ActionOptions) => Promise<MenuItemActionResult>;
  updateMenuItem: (id: number, data: CreateMenuItemRequest, options?: ActionOptions) => Promise<MenuItemActionResult>;
  deleteMenuItem: (id: number, options?: ActionOptions) => Promise<DeleteActionResult>;
  getMenuItemById: (id: number) => Promise<MenuItemActionResult>;
  getMenuItemsByRestaurant: (restaurantId: number) => Promise<MenuItemListActionResult>;
  getAllMenuItems: () => Promise<MenuItemListActionResult>;
  searchMenuItems: (params: Record<string, unknown>) => Promise<MenuItemListActionResult>;
  
  // Setters
  setCurrentMenuItem: (menuItem: MenuItem | null) => void;
  setError: (error: string | null) => void;
}

interface ActionOptions {
  skipRedirect?: boolean;
}

interface MenuProviderProps {
  children: ReactNode;
}

const MenuContext = createContext<MenuContextValue | null>(null);

export const MenuProvider = ({ children }: MenuProviderProps) => {
  const navigate = useNavigate();
  
  // States
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [currentMenuItem, setCurrentMenuItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Tạo món ăn mới
   */
  const createMenuItem = useCallback(async (
    data: CreateMenuItemRequest, 
    options: ActionOptions = {}
  ): Promise<MenuItemActionResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await menuService.createMenuItem(data);
      
      if (response.status === 1) {
        // Thêm vào danh sách
        setMenuItems(prev => [response.data, ...prev]);
        setCurrentMenuItem(response.data);
        
        // Navigation logic (Hybrid)
        if (!options.skipRedirect) {
          navigate('/restaurant/menu');
        }
        
        return { success: true, data: response.data };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Tạo món ăn thất bại';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  /**
   * Cập nhật thông tin món ăn
   */
  const updateMenuItem = useCallback(async (
    id: number,
    data: CreateMenuItemRequest,
    options: ActionOptions = {}
  ): Promise<MenuItemActionResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await menuService.updateMenuItem(id, data);
      
      if (response.status === 1) {
        // Cập nhật trong danh sách
        setMenuItems(prev => 
          prev.map(item => item.id === id ? response.data : item)
        );
        setCurrentMenuItem(response.data);
        
        if (!options.skipRedirect) {
          navigate('/restaurant/menu');
        }
        
        return { success: true, data: response.data };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Cập nhật món ăn thất bại';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  /**
   * Xóa món ăn
   */
  const deleteMenuItem = useCallback(async (
    id: number,
    options: ActionOptions = {}
  ): Promise<DeleteActionResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await menuService.deleteMenuItem(id);
      
      if (response.status === 1) {
        // Xóa khỏi danh sách
        setMenuItems(prev => prev.filter(item => item.id !== id));
        if (currentMenuItem?.id === id) {
          setCurrentMenuItem(null);
        }
        
        if (!options.skipRedirect) {
          navigate('/restaurant/menu');
        }
        
        return { success: true };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Xóa món ăn thất bại';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [currentMenuItem, navigate]);

  /**
   * Lấy thông tin chi tiết món ăn
   */
  const getMenuItemById = useCallback(async (id: number): Promise<MenuItemActionResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await menuService.getMenuItemById(id);
      
      if (response.status === 1) {
        setCurrentMenuItem(response.data);
        return { success: true, data: response.data };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Lấy thông tin món ăn thất bại';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Lấy danh sách món ăn theo nhà hàng
   */
  const getMenuItemsByRestaurant = useCallback(async (restaurantId: number): Promise<MenuItemListActionResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await menuService.getMenuItemsByRestaurant(restaurantId);
      
      if (response.status === 1) {
        setMenuItems(response.data);
        return { success: true, data: response.data };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Lấy danh sách món ăn thất bại';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Lấy tất cả món ăn
   */
  const getAllMenuItems = useCallback(async (): Promise<MenuItemListActionResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await menuService.getAllMenuItems();
      
      if (response.status === 1) {
        setMenuItems(response.data);
        return { success: true, data: response.data };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Lấy danh sách món ăn thất bại';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Tìm kiếm món ăn
   */
  const searchMenuItems = useCallback(async (params: Record<string, unknown>): Promise<MenuItemListActionResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await menuService.searchMenuItems(params);
      
      if (response.status === 1) {
        setMenuItems(response.data);
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
  const value = useMemo<MenuContextValue>(() => ({
    // States
    menuItems,
    currentMenuItem,
    loading,
    error,
    // Actions
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getMenuItemById,
    getMenuItemsByRestaurant,
    getAllMenuItems,
    searchMenuItems,
    // Setters
    setCurrentMenuItem,
    setError
  }), [
    menuItems,
    currentMenuItem,
    loading,
    error,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getMenuItemById,
    getMenuItemsByRestaurant,
    getAllMenuItems,
    searchMenuItems
  ]);

  return (
    <MenuContext.Provider value={value}>
      {children}
    </MenuContext.Provider>
  );
};

/**
 * Custom hook để sử dụng Menu Context
 * @throws {Error} Nếu sử dụng ngoài MenuProvider
 */
export const useMenu = (): MenuContextValue => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within MenuProvider');
  }
  return context;
};
