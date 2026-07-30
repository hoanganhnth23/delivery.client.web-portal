import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDependencies } from '@/app/dependencies';
import type {
  Restaurant,
  RestaurantActionResult,
  RestaurantListActionResult,
} from '@/types/api.types';
import { ROUTES } from '@/utils/constants';
import type { CreateRestaurantRequest } from '../services/restaurantService';

interface ActionOptions {
  skipRedirect?: boolean;
}

interface RestaurantContextValue {
  restaurants: Restaurant[];
  currentRestaurant: Restaurant | null;
  loading: boolean;
  error: string | null;
  createRestaurant: (
    data: CreateRestaurantRequest,
    options?: ActionOptions,
  ) => Promise<RestaurantActionResult>;
  updateRestaurant: (
    id: number,
    data: CreateRestaurantRequest,
    options?: ActionOptions,
  ) => Promise<RestaurantActionResult>;
  getMyRestaurants: () => Promise<RestaurantListActionResult>;
  setCurrentRestaurant: (restaurant: Restaurant | null) => void;
  setError: (error: string | null) => void;
}

const RestaurantContext = createContext<RestaurantContextValue | null>(null);

export const RestaurantProvider = ({ children }: { children: ReactNode }) => {
  const { restaurant: restaurantService, sessionStore } = useAppDependencies();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getMyRestaurants = useCallback(async (): Promise<RestaurantListActionResult> => {
    try {
      setLoading(true);
      setError(null);
      const data = await restaurantService.getMyRestaurants();

      setRestaurants(data);
      const savedRestaurantId = sessionStore.getCurrentRestaurantId();
      const selected =
        data.find((restaurant) => restaurant.id === savedRestaurantId) ??
        data[0] ??
        null;
      setCurrentRestaurant(selected);
      if (selected) {
        sessionStore.setCurrentRestaurantId(selected.id);
      } else {
        sessionStore.clearRestaurantId();
      }
      return { success: true, data };
    } catch (caught) {
      const message =
        (caught as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Lấy danh sách nhà hàng thất bại';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [restaurantService, sessionStore]);

  useEffect(() => {
    if (sessionStore.hasToken() && sessionStore.getCurrentRestaurantId()) {
      void getMyRestaurants();
    }
  }, [getMyRestaurants, sessionStore]);

  const createRestaurant = useCallback(
    async (
      data: CreateRestaurantRequest,
      options: ActionOptions = {},
    ): Promise<RestaurantActionResult> => {
      try {
        setLoading(true);
        setError(null);
        const restaurant = await restaurantService.createRestaurant(data);
        setRestaurants((current) => [restaurant, ...current]);
        setCurrentRestaurant(restaurant);
        sessionStore.setCurrentRestaurantId(restaurant.id);
        if (!options.skipRedirect) navigate(ROUTES.RESTAURANT_DASHBOARD);
        return { success: true, data: restaurant };
      } catch (caught) {
        const message =
          (caught as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'Tạo nhà hàng thất bại';
        setError(message);
        return { success: false, message };
      } finally {
        setLoading(false);
      }
    },
    [navigate, restaurantService, sessionStore],
  );

  const updateRestaurant = useCallback(
    async (
      id: number,
      data: CreateRestaurantRequest,
      options: ActionOptions = {},
    ): Promise<RestaurantActionResult> => {
      try {
        setLoading(true);
        setError(null);
        const restaurant = await restaurantService.updateRestaurant(id, data);
        setRestaurants((current) =>
          current.map((currentRestaurant) =>
            currentRestaurant.id === id ? restaurant : currentRestaurant,
          ),
        );
        setCurrentRestaurant(restaurant);
        if (!options.skipRedirect) navigate(ROUTES.RESTAURANT_DASHBOARD);
        return { success: true, data: restaurant };
      } catch (caught) {
        const message =
          (caught as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'Cập nhật nhà hàng thất bại';
        setError(message);
        return { success: false, message };
      } finally {
        setLoading(false);
      }
    },
    [navigate, restaurantService],
  );

  const setCurrentRestaurantWithSave = useCallback((restaurant: Restaurant | null) => {
    setCurrentRestaurant(restaurant);
    if (restaurant) sessionStore.setCurrentRestaurantId(restaurant.id);
    else sessionStore.clearRestaurantId();
  }, [sessionStore]);

  const value = useMemo<RestaurantContextValue>(
    () => ({
      restaurants,
      currentRestaurant,
      loading,
      error,
      createRestaurant,
      updateRestaurant,
      getMyRestaurants,
      setCurrentRestaurant: setCurrentRestaurantWithSave,
      setError,
    }),
    [
      restaurants,
      currentRestaurant,
      loading,
      error,
      createRestaurant,
      updateRestaurant,
      getMyRestaurants,
      setCurrentRestaurantWithSave,
    ],
  );

  return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>;
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) throw new Error('useRestaurant must be used within RestaurantProvider');
  return context;
};
