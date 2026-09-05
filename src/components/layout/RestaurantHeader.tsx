/**
 * RestaurantHeader Component
 * Header/AppBar đồng nhất cho tất cả pages của Restaurant
 */

import { useState } from 'react';
import { useRestaurant } from '@/modules/restaurant/hooks/useRestaurant';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { ROUTES, USER_ROLES } from '@/utils/constants';
import { useNavigate } from 'react-router-dom';
import PortalMobileDrawer from '@/components/navigation/PortalMobileDrawer';
import { restaurantNavigation } from '@/components/navigation/portalNavigation';

interface RestaurantHeaderProps {
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  actions?: React.ReactNode;
}

const RestaurantHeader = ({
  title,
  subtitle,
  showSearch = false,
  searchPlaceholder = 'Tìm kiếm...',
  onSearch,
  actions
}: RestaurantHeaderProps) => {
  const { currentRestaurant, restaurants, setCurrentRestaurant } = useRestaurant();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isAdmin = user?.role === USER_ROLES.ADMIN;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  const identity = user?.name || user?.email;

  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-surface-dark border-b border-border-light dark:border-border-dark shadow-sm">
      <div className="px-4 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Title & Restaurant Info */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Mở menu"
              onClick={() => setShowMobileMenu(true)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 lg:hidden"
            >
              <span aria-hidden="true" className="material-symbols-outlined">menu</span>
            </button>
            {/* Title Section */}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                  {title}
                </h1>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 text-xs font-bold text-purple-700 dark:text-purple-300">
                    <span className="material-symbols-outlined text-xs">shield_person</span>
                    Admin
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right: Search, Actions, User Menu */}
          <div className="flex items-center gap-3">
            {/* Admin Restaurant Switcher */}
            {isAdmin && restaurants.length > 0 && (
              <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg px-2.5 py-1.5 border border-border-light dark:border-border-dark">
                <span className="material-symbols-outlined text-gray-500 text-lg">storefront</span>
                <select
                  aria-label="Chọn nhà hàng quản trị"
                  value={currentRestaurant?.id ?? ''}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    const match = restaurants.find(r => r.id === id);
                    if (match) setCurrentRestaurant(match);
                  }}
                  className="bg-transparent text-xs font-semibold text-gray-800 dark:text-gray-200 outline-none cursor-pointer max-w-[160px] truncate"
                  title="Chọn nhà hàng để quản lý"
                >
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id} className="text-gray-900 bg-white dark:bg-gray-800 dark:text-white">
                      #{r.id} - {r.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Back to Admin Portal Button */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs transition-colors"
                title="Quay lại Cổng Admin"
              >
                <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                <span className="hidden sm:inline">Về Cổng Admin</span>
              </button>
            )}

            {/* Search Bar */}
            {showSearch && (
              <form onSubmit={handleSearch} className="hidden md:block">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="pl-10 pr-4 py-2 w-64 rounded-full bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-primary focus:bg-white dark:focus:bg-gray-900 focus:outline-none text-sm text-gray-700 dark:text-gray-200 transition-all"
                  />
                </div>
              </form>
            )}

            {/* Custom Actions */}
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}

            {/* User Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                <div className="hidden md:block text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {identity || (isAdmin ? 'Quản trị viên' : 'Chủ nhà hàng')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currentRestaurant?.name || 'Chưa được gán nhà hàng'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white font-bold">
                  {(identity || (isAdmin ? 'A' : 'C'))[0].toUpperCase()}
                </div>
                <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 text-xl">
                  {showUserMenu ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark overflow-hidden z-50">
                    {/* User Info */}
                    <div className="p-4 border-b border-border-light dark:border-border-dark">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {identity || (isAdmin ? 'Quản trị viên' : 'Chủ nhà hàng')}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {user?.email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {currentRestaurant?.name}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              navigate(ROUTES.ADMIN_DASHBOARD);
                              setShowUserMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3 text-primary font-semibold text-sm"
                          >
                            <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
                            <span>Về Cổng Admin</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigate(ROUTES.ADMIN_ORDERS);
                              setShowUserMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3 text-gray-700 dark:text-gray-300 text-sm"
                          >
                            <span className="material-symbols-outlined text-xl">receipt_long</span>
                            <span>Đơn hàng Admin</span>
                          </button>
                          <div className="h-px bg-border-light dark:bg-border-dark my-2"></div>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          navigate(ROUTES.RESTAURANT_PROFILE);
                          setShowUserMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3 text-gray-700 dark:text-gray-300"
                      >
                        <span className="material-symbols-outlined text-xl">person</span>
                        <span className="text-sm font-medium">Thông tin cửa hàng</span>
                      </button>
                      <div className="h-px bg-border-light dark:bg-border-dark my-2"></div>
                      <button
                        type="button"
                        aria-label="Đăng xuất"
                        onClick={() => void handleLogout()}
                        className="w-full px-4 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 text-red-600 dark:text-red-400"
                      >
                        <span aria-hidden="true" className="material-symbols-outlined text-xl">logout</span>
                        <span className="text-sm font-medium">Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <PortalMobileDrawer
        open={showMobileMenu}
        title="Quản lý cửa hàng"
        identity={currentRestaurant?.name || 'Nhà hàng chưa được gán'}
        subtitle="Delivery Restaurant"
        items={restaurantNavigation}
        onClose={() => setShowMobileMenu(false)}
        onLogout={handleLogout}
      />
    </header>
  );
};

export default RestaurantHeader;
