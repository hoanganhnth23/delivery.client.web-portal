import { createContext, useContext, type ReactNode } from 'react';
import authService from '@/modules/auth/services/authService';
import * as menuService from '@/modules/restaurant/services/menuService';
import * as orderService from '@/modules/restaurant/services/orderService';
import * as restaurantService from '@/modules/restaurant/services/restaurantService';
import adminService from '@/services/api/adminService';
import { flashSaleAdminService } from '@/services/api/flashSaleService';
import TokenStorage from '@/services/storage/localStorage';
import { toast } from 'react-hot-toast';

export type AuthServicePort = Pick<
  typeof authService,
  'getCurrentUser' | 'getProfile' | 'hasRole' | 'isAuthenticated' | 'login' | 'logout'
>;

export type RestaurantServicePort = Pick<
  typeof restaurantService,
  'createRestaurant' | 'getMyRestaurants' | 'getRestaurantRatings' | 'updateRestaurant'
>;

export type MenuServicePort = Pick<
  typeof menuService,
  'createMenuItem' | 'deleteMenuItem' | 'getMyMenuItems' | 'updateMenuItem'
>;

export type OrderServicePort = Pick<
  typeof orderService,
  'confirmOrder' | 'getMyOrders' | 'getOrderById' | 'rejectOrder'
>;

export type AdminServicePort = Pick<
  typeof adminService,
  | 'createCoupon'
  | 'deleteCoupon'
  | 'fetchAllCoupons'
  | 'fetchAllOrders'
  | 'fetchAllRatings'
  | 'fetchAllShippers'
  | 'fetchOnlineShippers'
  | 'fetchOrdersByStatus'
  | 'updateRatingStatus'
>;

export type FlashSaleAdminServicePort = Pick<
  typeof flashSaleAdminService,
  | 'approveItem'
  | 'createCampaign'
  | 'getAllCampaigns'
  | 'getCampaignItems'
  | 'updateCampaignStatus'
>;

export interface NotificationPort {
  success(message: string): unknown;
  error(message: string): unknown;
}

export interface ClockPort {
  now(): Date;
}

export interface DelayPort {
  wait(delayMs: number): Promise<void>;
}

export type SessionStorePort = Pick<
  typeof TokenStorage,
  | 'clearRestaurantId'
  | 'getCurrentRestaurantId'
  | 'hasToken'
  | 'setCurrentRestaurantId'
>;

export interface AppDependencies {
  auth: AuthServicePort;
  restaurant: RestaurantServicePort;
  menu: MenuServicePort;
  order: OrderServicePort;
  admin: AdminServicePort;
  flashSaleAdmin: FlashSaleAdminServicePort;
  notifications: NotificationPort;
  clock: ClockPort;
  delay: DelayPort;
  sessionStore: SessionStorePort;
}

export const productionDependencies: AppDependencies = {
  auth: authService,
  restaurant: restaurantService,
  menu: menuService,
  order: orderService,
  admin: adminService,
  flashSaleAdmin: flashSaleAdminService,
  notifications: toast,
  clock: { now: () => new Date() },
  delay: {
    wait: (delayMs) =>
      new Promise((resolve) => window.setTimeout(resolve, delayMs)),
  },
  sessionStore: TokenStorage,
};

const AppDependenciesContext = createContext<AppDependencies | null>(null);

interface AppDependenciesProviderProps {
  children: ReactNode;
  dependencies?: AppDependencies;
}

export function AppDependenciesProvider({
  children,
  dependencies = productionDependencies,
}: AppDependenciesProviderProps) {
  return (
    <AppDependenciesContext.Provider value={dependencies}>
      {children}
    </AppDependenciesContext.Provider>
  );
}

export function useAppDependencies(): AppDependencies {
  const dependencies = useContext(AppDependenciesContext);
  if (!dependencies) {
    throw new Error('useAppDependencies must be used within AppDependenciesProvider');
  }
  return dependencies;
}
