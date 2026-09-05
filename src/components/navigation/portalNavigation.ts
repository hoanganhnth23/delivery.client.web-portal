import { ROUTES } from '@/utils/constants';

export interface PortalNavigationItem {
  to: string;
  icon: string;
  label: string;
}

export const restaurantNavigation: PortalNavigationItem[] = [
  { icon: 'dashboard', label: 'Dashboard', to: ROUTES.RESTAURANT_DASHBOARD },
  { icon: 'shopping_bag', label: 'Đơn hàng', to: ROUTES.RESTAURANT_ORDERS },
  { icon: 'menu_book', label: 'Quản lý Menu', to: ROUTES.RESTAURANT_MENU },
  { icon: 'storefront', label: 'Hồ sơ cửa hàng', to: ROUTES.RESTAURANT_PROFILE },
  { icon: 'reviews', label: 'Đánh giá', to: ROUTES.RESTAURANT_REVIEWS },
  { icon: 'local_offer', label: 'Voucher nhà hàng', to: ROUTES.RESTAURANT_VOUCHERS },
  { icon: 'videocam', label: 'Livestream', to: ROUTES.RESTAURANT_LIVESTREAM },
  { icon: 'upload_file', label: 'Import dữ liệu', to: ROUTES.RESTAURANT_CATALOG_IMPORT },
];

export const adminNavigation: PortalNavigationItem[] = [
  { to: ROUTES.ADMIN_DASHBOARD, icon: 'dashboard', label: 'Dashboard' },
  { to: ROUTES.ADMIN_ORDERS, icon: 'receipt_long', label: 'Đơn hàng' },
  { to: ROUTES.ADMIN_SHIPPERS, icon: 'local_shipping', label: 'Shipper' },
  { to: ROUTES.ADMIN_RATINGS, icon: 'reviews', label: 'Đánh giá' },
  { to: ROUTES.ADMIN_COUPONS, icon: 'sell', label: 'Coupon' },
  { to: ROUTES.ADMIN_FLASH_SALES, icon: 'bolt', label: 'Flash Sale' },
  { to: ROUTES.ADMIN_CATALOG_IMPORT, icon: 'upload_file', label: 'Import dữ liệu' },
  { to: ROUTES.RESTAURANT_DASHBOARD, icon: 'storefront', label: 'Cổng nhà hàng' },
];
