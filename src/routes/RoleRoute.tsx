/**
 * RoleRoute Component
 * Protected route dựa trên role - Kiểm tra quyền truy cập
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { ROUTES } from '@/utils/constants';

const RoleRoute = ({ children, allowedRoles }) => {
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
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // Kiểm tra role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  // Có quyền -> render children
  return children;
};

export default RoleRoute;
