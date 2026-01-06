/**
 * PrivateRoute Component
 * Protected route - Yêu cầu user phải đăng nhập
 */

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { ROUTES } from '@/utils/constants';

interface PrivateRouteProps {
  children: ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { isAuthenticated, loading } = useAuth();
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

  // Chưa đăng nhập -> redirect về login
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Đã đăng nhập -> render children
  return children;
};

export default PrivateRoute;
