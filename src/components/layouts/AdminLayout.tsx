import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { ROUTES } from '@/utils/constants';
import PortalMobileDrawer from '@/components/navigation/PortalMobileDrawer';
import { adminNavigation as navigation } from '@/components/navigation/portalNavigation';

interface AdminLayoutProps {
  children: ReactNode;
}

const pageTitles: Record<string, string> = {
  [ROUTES.ADMIN_DASHBOARD]: 'Dashboard',
  [ROUTES.ADMIN_ORDERS]: 'Đơn hàng',
  [ROUTES.ADMIN_SHIPPERS]: 'Shipper',
  [ROUTES.ADMIN_RATINGS]: 'Đánh giá',
  [ROUTES.ADMIN_COUPONS]: 'Coupon',
  [ROUTES.ADMIN_FLASH_SALES]: 'Flash Sale',
  [ROUTES.ADMIN_CATALOG_IMPORT]: 'Import dữ liệu',
};

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const identity = user?.name || user?.email || 'Quản trị viên';
  const initial = identity.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.ADMIN_LOGIN, { replace: true });
  };

  return (
    <div className="flex min-h-screen w-full min-w-0 overflow-hidden bg-background-light dark:bg-background-dark">
      <aside className="portal-sidebar hidden w-72 flex-shrink-0 flex-col border-r border-border-light bg-surface-light p-6 dark:border-border-dark dark:bg-surface-dark lg:flex">
        <div className="portal-brand"><span aria-hidden="true" className="material-symbols-outlined">restaurant</span>Delivery</div>
      <div className="flex items-center gap-4 px-2">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary text-lg font-black text-white">
            {initial}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-gray-900 dark:text-white">{identity}</h1>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Quản trị viên
            </p>
          </div>
        </div>

        <nav className="mt-8 flex flex-col gap-2">
          {navigation.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                  active
                    ? 'bg-primary/10 font-bold text-primary'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          aria-label="Đăng xuất"
          onClick={() => void handleLogout()}
          className="mt-auto flex items-center gap-3 rounded-lg px-4 py-3 text-left text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <span aria-hidden="true" className="material-symbols-outlined">logout</span>
          <span className="text-sm font-medium">Đăng xuất</span>
        </button>
      </aside>

      <main className="flex h-screen min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="portal-topbar sticky top-0 z-10 border-b border-border-light bg-background-light/95 px-3 py-3 backdrop-blur-sm dark:border-border-dark dark:bg-background-dark/95 sm:px-4 sm:py-5 lg:px-8">
          <div className="mx-auto flex min-w-0 max-w-[1400px] items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="Mở menu"
              onClick={() => setShowMobileMenu(true)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 lg:hidden"
            >
              <span aria-hidden="true" className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="min-w-0 truncate text-xl font-bold capitalize text-gray-900 dark:text-white sm:text-2xl">
              {pageTitles[location.pathname] || location.pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
            </h2>
          </div>
        </header>

        <div className="mx-auto mt-4 flex w-full min-w-0 max-w-[1400px] flex-1 flex-col gap-6 px-3 pb-6 sm:mt-6 sm:gap-8 sm:px-4 sm:pb-8 lg:px-8">
          {children}
          <footer className="mt-auto border-t border-border-light pt-6 text-sm text-gray-500 dark:border-border-dark dark:text-gray-400">
            © 2026 Delivery Admin
          </footer>
        </div>
      </main>
      <PortalMobileDrawer
        open={showMobileMenu}
        title="Delivery Admin"
        identity={identity}
        subtitle="Quản trị viên"
        items={navigation}
        onClose={() => setShowMobileMenu(false)}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default AdminLayout;
