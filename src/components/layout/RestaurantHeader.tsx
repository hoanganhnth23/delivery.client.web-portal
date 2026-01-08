/**
 * RestaurantHeader Component
 * Header/AppBar đồng nhất cho tất cả pages của Restaurant
 */

import { useState } from 'react';
import { useRestaurant } from '@/modules/restaurant/hooks/useRestaurant';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { ROUTES } from '@/utils/constants';
import { useNavigate } from 'react-router-dom';

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
  const { currentRestaurant } = useRestaurant();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-surface-dark border-b border-border-light dark:border-border-dark shadow-sm">
      <div className="px-4 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Title & Restaurant Info */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <span className="material-symbols-outlined">menu</span>
            </button>

            {/* Title Section */}
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right: Search, Actions, User Menu */}
          <div className="flex items-center gap-3">
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
              <div className="hidden md:flex items-center gap-2">
                {actions}
              </div>
            )}

            {/* Notifications */}
            <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
              <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">
                notifications
              </span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                <div className="hidden md:block text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {user?.name || 'Restaurant Owner'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currentRestaurant?.name || 'Restaurant'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white font-bold">
                  {(user?.name || 'R')[0].toUpperCase()}
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
                        {user?.name || 'Restaurant Owner'}
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
                      <button
                        onClick={() => {
                          navigate(ROUTES.RESTAURANT_PROFILE);
                          setShowUserMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3 text-gray-700 dark:text-gray-300"
                      >
                        <span className="material-symbols-outlined text-xl">person</span>
                        <span className="text-sm font-medium">Thông tin cửa hàng</span>
                      </button>
                      <button
                        onClick={() => {
                          navigate(ROUTES.RESTAURANT_SETTINGS);
                          setShowUserMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3 text-gray-700 dark:text-gray-300"
                      >
                        <span className="material-symbols-outlined text-xl">settings</span>
                        <span className="text-sm font-medium">Cài đặt</span>
                      </button>
                      <div className="h-px bg-border-light dark:bg-border-dark my-2"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 text-red-600 dark:text-red-400"
                      >
                        <span className="material-symbols-outlined text-xl">logout</span>
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
    </header>
  );
};

export default RestaurantHeader;
