/**
 * Restaurant Module - Index
 * Export tất cả hooks, components, services và pages
 */

// Hooks
export { RestaurantProvider, useRestaurant } from './hooks/useRestaurant';
export { MenuProvider, useMenu } from './hooks/useMenu';

// Components
export { default as RestaurantForm } from './components/RestaurantForm';
export { default as MenuItemForm } from './components/MenuItemForm';

// Services
export * as restaurantService from './services/restaurantService';
export * as menuService from './services/menuService';

// Pages
export { default as RestaurantListPage } from './pages/RestaurantListPage';
export { default as RestaurantDashboard } from './pages/RestaurantDashboard';
export { default as MenuManagement } from './pages/MenuManagement';
