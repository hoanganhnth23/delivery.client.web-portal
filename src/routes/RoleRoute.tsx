/**
 * RoleRoute Component
 * Protected route dựa trên role - Kiểm tra quyền truy cập
 */

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { ROUTES } from '@/utils/constants';

interface RoleRouteProps {
  children: ReactNode;
  allowedRoles: string[];
  loginPath?: string;
}

const RoleRoute = ({ children, allowedRoles, loginPath = ROUTES.LOGIN }: RoleRouteProps) => {
  const { user, loading } = useAuth();

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
  if (!user) {
    return <Navigate to={loginPath} replace />;
  }

  // Kiểm tra role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  // Có quyền -> render children
  return children;
};

export default RoleRoute;
