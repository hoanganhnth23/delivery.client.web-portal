/**
 * RoleRoute Component
 * Protected route dựa trên role - Kiểm tra quyền truy cập
 */

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { ROUTES } from '@/utils/constants';

interface RoleRouteProps {
  children: ReactNode;
  allowedRoles: string[];
  loginPath?: string;
}

const RoleRoute = ({ children, allowedRoles, loginPath = ROUTES.LOGIN }: RoleRouteProps) => {
  const { user, loading, error, retrySession } = useAuth();
  const location = useLocation();

  // Đang loading -> hiển thị loading
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  if (error && !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background-light px-4 dark:bg-background-dark">
        <section className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm dark:border-red-900 dark:bg-surface-dark">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Không thể khôi phục phiên</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{error}</p>
          <button
            type="button"
            onClick={() => void retrySession()}
            className="mt-5 rounded-lg bg-primary px-4 py-2 font-semibold text-white"
          >
            Thử lại
          </button>
        </section>
      </main>
    );
  }

  // Chưa đăng nhập -> redirect về login
  if (!user) {
    const isCustomerLogin = loginPath === ROUTES.CUSTOMER_LOGIN;
    const returnTo = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={isCustomerLogin ? `${loginPath}?returnTo=${encodeURIComponent(returnTo)}` : loginPath}
        replace
      />
    );
  }

  // Kiểm tra role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  // Có quyền -> render children
  return children;
};

export default RoleRoute;
