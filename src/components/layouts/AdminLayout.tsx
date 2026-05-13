import { useState, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [darkMode] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex min-h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark transition-colors duration-200">
        {/* Sidebar Navigation */}
        <aside className="hidden lg:flex flex-col w-72 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex-shrink-0 transition-colors duration-200">
          <div className="flex h-full flex-col justify-between p-6">
            <div className="flex flex-col gap-8">
              {/* Logo / User */}
              <div className="flex items-center gap-4 px-2">
                <div
                  className="bg-center bg-no-repeat bg-cover rounded-full size-12 shadow-sm border-2 border-primary"
                  style={{backgroundImage: "url('https://i.pravatar.cc/150?img=5')"}}
                />
                <div className="flex flex-col">
                  <h1 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-tight">ShopeeFood Admin</h1>
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Super Admin</p>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col gap-2">
                <Link to={ROUTES.ADMIN_DASHBOARD} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(ROUTES.ADMIN_DASHBOARD) ? 'bg-primary/10 text-primary group hover:bg-primary/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'}`}>
                  <span className={`material-symbols-outlined ${isActive(ROUTES.ADMIN_DASHBOARD) ? 'icon-filled' : ''}`}>dashboard</span>
                  <span className={`text-sm ${isActive(ROUTES.ADMIN_DASHBOARD) ? 'font-bold' : 'font-medium'}`}>Dashboard</span>
                </Link>
                
                {/* Orders - New */}
                <Link to={ROUTES.ADMIN_ORDERS} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(ROUTES.ADMIN_ORDERS) ? 'bg-primary/10 text-primary group hover:bg-primary/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'}`}>
                  <span className={`material-symbols-outlined ${isActive(ROUTES.ADMIN_ORDERS) ? 'icon-filled' : ''}`}>receipt_long</span>
                  <span className={`text-sm ${isActive(ROUTES.ADMIN_ORDERS) ? 'font-bold' : 'font-medium'}`}>Đơn hàng</span>
                </Link>

                {/* Withdrawals - New */}
                <Link to={ROUTES.ADMIN_WITHDRAWALS} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(ROUTES.ADMIN_WITHDRAWALS) ? 'bg-primary/10 text-primary group hover:bg-primary/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'}`}>
                  <span className={`material-symbols-outlined ${isActive(ROUTES.ADMIN_WITHDRAWALS) ? 'icon-filled' : ''}`}>account_balance_wallet</span>
                  <span className={`text-sm ${isActive(ROUTES.ADMIN_WITHDRAWALS) ? 'font-bold' : 'font-medium'}`}>Duyệt rút tiền</span>
                </Link>

                <Link to={ROUTES.ADMIN_SHIPPERS} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(ROUTES.ADMIN_SHIPPERS) ? 'bg-primary/10 text-primary group hover:bg-primary/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'}`}>
                  <span className={`material-symbols-outlined ${isActive(ROUTES.ADMIN_SHIPPERS) ? 'icon-filled' : ''}`}>local_shipping</span>
                  <span className={`text-sm ${isActive(ROUTES.ADMIN_SHIPPERS) ? 'font-bold' : 'font-medium'}`}>Quản lý Shipper</span>
                </Link>
                
                <Link to={ROUTES.ADMIN_RATINGS} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(ROUTES.ADMIN_RATINGS) ? 'bg-primary/10 text-primary group hover:bg-primary/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'}`}>
                  <span className={`material-symbols-outlined ${isActive(ROUTES.ADMIN_RATINGS) ? 'icon-filled' : ''}`}>reviews</span>
                  <span className={`text-sm ${isActive(ROUTES.ADMIN_RATINGS) ? 'font-bold' : 'font-medium'}`}>Quản lý Đánh giá</span>
                </Link>

                <Link to={ROUTES.ADMIN_COUPONS} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(ROUTES.ADMIN_COUPONS) ? 'bg-primary/10 text-primary group hover:bg-primary/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'}`}>
                  <span className={`material-symbols-outlined ${isActive(ROUTES.ADMIN_COUPONS) ? 'icon-filled' : ''}`}>sell</span>
                  <span className={`text-sm ${isActive(ROUTES.ADMIN_COUPONS) ? 'font-bold' : 'font-medium'}`}>Quản lý Coupon</span>
                </Link>

                <Link to={ROUTES.ADMIN_RESTAURANTS} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(ROUTES.ADMIN_RESTAURANTS) ? 'bg-primary/10 text-primary group hover:bg-primary/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'}`}>
                  <span className={`material-symbols-outlined ${isActive(ROUTES.ADMIN_RESTAURANTS) ? 'icon-filled' : ''}`}>storefront</span>
                  <span className={`text-sm ${isActive(ROUTES.ADMIN_RESTAURANTS) ? 'font-bold' : 'font-medium'}`}>Nhà hàng</span>
                </Link>
                <Link to={ROUTES.ADMIN_MENUS} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(ROUTES.ADMIN_MENUS) ? 'bg-primary/10 text-primary group hover:bg-primary/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'}`}>
                  <span className={`material-symbols-outlined ${isActive(ROUTES.ADMIN_MENUS) ? 'icon-filled' : ''}`}>restaurant_menu</span>
                  <span className={`text-sm ${isActive(ROUTES.ADMIN_MENUS) ? 'font-bold' : 'font-medium'}`}>Menu</span>
                </Link>
                <Link to={ROUTES.ADMIN_CATEGORIES} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(ROUTES.ADMIN_CATEGORIES) ? 'bg-primary/10 text-primary group hover:bg-primary/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'}`}>
                  <span className={`material-symbols-outlined ${isActive(ROUTES.ADMIN_CATEGORIES) ? 'icon-filled' : ''}`}>category</span>
                  <span className={`text-sm ${isActive(ROUTES.ADMIN_CATEGORIES) ? 'font-bold' : 'font-medium'}`}>Danh mục</span>
                </Link>
                <Link to={ROUTES.ADMIN_USERS} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(ROUTES.ADMIN_USERS) ? 'bg-primary/10 text-primary group hover:bg-primary/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'}`}>
                  <span className={`material-symbols-outlined ${isActive(ROUTES.ADMIN_USERS) ? 'icon-filled' : ''}`}>group</span>
                  <span className={`text-sm ${isActive(ROUTES.ADMIN_USERS) ? 'font-bold' : 'font-medium'}`}>Người dùng</span>
                </Link>
                <Link to={ROUTES.ADMIN_CHAT} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(ROUTES.ADMIN_CHAT) ? 'bg-primary/10 text-primary group hover:bg-primary/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'}`}>
                  <span className={`material-symbols-outlined ${isActive(ROUTES.ADMIN_CHAT) ? 'icon-filled' : ''}`}>chat_bubble</span>
                  <span className={`text-sm ${isActive(ROUTES.ADMIN_CHAT) ? 'font-bold' : 'font-medium'}`}>Hỗ trợ Chat</span>
                </Link>
                <div className="h-px bg-border-light dark:bg-border-dark my-2 mx-4"></div>
                <Link to={ROUTES.ADMIN_SETTINGS} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(ROUTES.ADMIN_SETTINGS) ? 'bg-primary/10 text-primary group hover:bg-primary/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'}`}>
                  <span className={`material-symbols-outlined ${isActive(ROUTES.ADMIN_SETTINGS) ? 'icon-filled' : ''}`}>settings</span>
                  <span className={`text-sm ${isActive(ROUTES.ADMIN_SETTINGS) ? 'font-bold' : 'font-medium'}`}>Cài đặt</span>
                </Link>
                <Link to={ROUTES.LOGIN} className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mt-auto">
                  <span className="material-symbols-outlined">logout</span>
                  <span className="text-sm font-medium">Đăng xuất</span>
                </Link>
              </nav>
            </div>

            {/* Bottom Graphic */}
            <div className="rounded-xl bg-gradient-to-br from-primary to-orange-600 p-4 text-white relative overflow-hidden">
              <div className="absolute -right-2 -top-2 opacity-20 transform rotate-12">
                <span className="material-symbols-outlined text-6xl">analytics</span>
              </div>
              <p className="text-xs font-medium opacity-80 mb-1">Trạng thái hệ thống</p>
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
                <p className="font-bold text-sm">Đang hoạt động tốt</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-screen overflow-y-auto">
          {/* Desktop Header / Top Bar */}
          <header className="hidden lg:flex items-center justify-between px-8 py-5 bg-background-light dark:bg-background-dark/50 backdrop-blur-sm sticky top-0 z-10 border-b border-border-light dark:border-border-dark">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
              {location.pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
            </h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
                <input
                  className="pl-10 pr-4 py-2.5 w-64 rounded-full bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-gray-700 dark:text-gray-200 shadow-sm transition-all"
                  placeholder="Tìm kiếm..."
                  type="text"
                />
              </div>
              <button className="relative p-2.5 rounded-full bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark text-gray-600 dark:text-gray-400 hover:text-primary transition-colors shadow-sm">
                <span className="material-symbols-outlined icon-filled">notifications</span>
                <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-surface-dark"></span>
              </button>
            </div>
          </header>

          {/* Children View */}
          <div className="px-4 lg:px-8 pb-8 flex flex-col gap-8 max-w-[1400px] mx-auto w-full mt-6">
            {children}
            
            {/* Footer area */}
            <div className="border-t border-border-light dark:border-border-dark pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 dark:text-gray-400 pb-4 mt-auto">
              <p>© 2026 ShopeeFood Admin. All rights reserved.</p>
              <div className="flex gap-4 mt-2 md:mt-0">
                <a className="hover:text-primary" href="#">Privacy Policy</a>
                <a className="hover:text-primary" href="#">Terms of Service</a>
                <a className="hover:text-primary" href="#">Help Center</a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
