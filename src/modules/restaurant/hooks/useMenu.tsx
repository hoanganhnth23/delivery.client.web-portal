import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  DeleteActionResult,
  MenuItem,
  MenuItemActionResult,
  MenuItemListActionResult,
} from '@/types/api.types';
import { ROUTES } from '@/utils/constants';
import type { CreateMenuItemRequest } from '../services/menuService';
import { useAppDependencies } from '@/app/dependencies';

interface ActionOptions {
  skipRedirect?: boolean;
}

interface MenuContextValue {
  menuItems: MenuItem[];
  currentMenuItem: MenuItem | null;
  loading: boolean;
  error: string | null;
  createMenuItem: (
    data: CreateMenuItemRequest,
    options?: ActionOptions,
  ) => Promise<MenuItemActionResult>;
  updateMenuItem: (
    id: number,
    data: CreateMenuItemRequest,
    options?: ActionOptions,
  ) => Promise<MenuItemActionResult>;
  deleteMenuItem: (id: number, options?: ActionOptions) => Promise<DeleteActionResult>;
  getMyMenuItems: (restaurantId?: number) => Promise<MenuItemListActionResult>;
  setCurrentMenuItem: (menuItem: MenuItem | null) => void;
  setError: (error: string | null) => void;
}

const MenuContext = createContext<MenuContextValue | null>(null);

export const MenuProvider = ({ children }: { children: ReactNode }) => {
  const { menu: menuService } = useAppDependencies();
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [currentMenuItem, setCurrentMenuItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runMutation = useCallback(
    async (
      operation: () => Promise<MenuItem>,
      failureMessage: string,
      options: ActionOptions,
    ): Promise<MenuItemActionResult> => {
      try {
        setLoading(true);
        setError(null);
        const menuItem = await operation();
        setCurrentMenuItem(menuItem);
        if (!options.skipRedirect) navigate(ROUTES.RESTAURANT_MENU);
        return { success: true, data: menuItem };
      } catch (caught) {
        console.error('runMutation error:', caught);
        const message =
          (caught as { response?: { data?: { message?: string } } }).response?.data?.message ||
          (caught as Error)?.message ||
          failureMessage;
        setError(message);
        return { success: false, message };
      } finally {
        setLoading(false);
      }
    },
    [navigate],
  );

  const createMenuItem = useCallback(
    async (data: CreateMenuItemRequest, options: ActionOptions = {}) => {
      const result = await runMutation(
        () => menuService.createMenuItem(data),
        'Tạo món ăn thất bại',
        options,
      );
      if (result.success && result.data) {
        setMenuItems((current) => [result.data!, ...current]);
      }
      return result;
    },
    [menuService, runMutation],
  );

  const updateMenuItem = useCallback(
    async (id: number, data: CreateMenuItemRequest, options: ActionOptions = {}) => {
      const result = await runMutation(
        () => menuService.updateMenuItem(id, data),
        'Cập nhật món ăn thất bại',
        options,
      );
      if (result.success && result.data) {
        setMenuItems((current) =>
          current.map((item) => (item.id === id ? result.data! : item)),
        );
      }
      return result;
    },
    [menuService, runMutation],
  );

  const deleteMenuItem = useCallback(
    async (id: number, options: ActionOptions = {}): Promise<DeleteActionResult> => {
      try {
        setLoading(true);
        setError(null);
        await menuService.deleteMenuItem(id);
        setMenuItems((current) => current.filter((item) => item.id !== id));
        setCurrentMenuItem((current) => (current?.id === id ? null : current));
        if (!options.skipRedirect) navigate(ROUTES.RESTAURANT_MENU);
        return { success: true };
      } catch (caught) {
        console.error('deleteMenuItem error:', caught);
        const message =
          (caught as { response?: { data?: { message?: string } } }).response?.data?.message ||
          (caught as Error)?.message ||
          'Xóa món ăn thất bại';
        setError(message);
        return { success: false, message };
      } finally {
        setLoading(false);
      }
    },
    [menuService, navigate],
  );

  const getMyMenuItems = useCallback(async (restaurantId?: number): Promise<MenuItemListActionResult> => {
    try {
      setLoading(true);
      setError(null);
      const menuItems = restaurantId !== undefined
        ? await menuService.getMyMenuItems(restaurantId)
        : await menuService.getMyMenuItems();
      setMenuItems(menuItems);
      return { success: true, data: menuItems };
    } catch (caught) {
      console.error('getMyMenuItems error:', caught);
      const message =
        (caught as { response?: { data?: { message?: string } } }).response?.data?.message ||
        (caught as Error)?.message ||
        'Lấy danh sách món ăn thất bại';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [menuService]);

  const value = useMemo<MenuContextValue>(
    () => ({
      menuItems,
      currentMenuItem,
      loading,
      error,
      createMenuItem,
      updateMenuItem,
      deleteMenuItem,
      getMyMenuItems,
      setCurrentMenuItem,
      setError,
    }),
    [
      menuItems,
      currentMenuItem,
      loading,
      error,
      createMenuItem,
      updateMenuItem,
      deleteMenuItem,
      getMyMenuItems,
    ],
  );

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
};

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) throw new Error('useMenu must be used within MenuProvider');
  return context;
};
