import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './modules/auth/hooks/useAuth';
import { RestaurantProvider } from './modules/restaurant/hooks/useRestaurant';
import { MenuProvider } from './modules/restaurant/hooks/useMenu';
import { OrderProvider } from './modules/restaurant/hooks/useOrder';
import LoginPage from './modules/auth/pages/LoginPageV2';
import AdminLoginPage from './modules/auth/pages/AdminLoginPage';
import RestaurantDashboard from './modules/restaurant/pages/RestaurantDashboard';
import RestaurantProfilePage from './modules/restaurant/pages/RestaurantProfilePage';
import RestaurantOrders from './modules/restaurant/pages/RestaurantOrders';
import MenuManagement from './modules/restaurant/pages/MenuManagement';
import RestaurantReviewsPage from './modules/restaurant/pages/RestaurantReviewsPage';
import AdminDashboard from './modules/admin/pages/AdminDashboard';
import AdminOrdersPage from './modules/admin/pages/AdminOrdersPage';
import AdminShippersPage from './modules/admin/pages/AdminShippersPage';
import AdminRatingsPage from './modules/admin/pages/AdminRatingsPage';
import AdminCouponsPage from './modules/admin/pages/AdminCouponsPage';
import AdminFlashSalePage from './modules/admin/pages/AdminFlashSalePage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import RoleRoute from './routes/RoleRoute';
import { ROUTES, USER_ROLES } from './utils/constants';

const PortalEntry = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Đang tải cổng quản trị…</div>;
  }
  if (user?.role === USER_ROLES.ADMIN) {
    return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
  }
  if (user?.role === USER_ROLES.RESTAURANT_OWNER) {
    return <Navigate to={ROUTES.RESTAURANT_DASHBOARD} replace />;
  }
  return <Navigate to={ROUTES.LOGIN} replace />;
};

const restaurantRoute = (element: ReactNode) => (
  <RoleRoute allowedRoles={[USER_ROLES.RESTAURANT_OWNER]}>{element}</RoleRoute>
);

const adminRoute = (element: ReactNode) => (
  <RoleRoute allowedRoles={[USER_ROLES.ADMIN]} loginPath={ROUTES.ADMIN_LOGIN}>
    {element}
  </RoleRoute>
);

export default function App() {
  return (
    <AuthProvider>
      <RestaurantProvider>
        <MenuProvider>
          <OrderProvider>
            <Routes>
              <Route path={ROUTES.HOME} element={<PortalEntry />} />
              <Route path={ROUTES.LOGIN} element={<LoginPage />} />
              <Route path={ROUTES.ADMIN_LOGIN} element={<AdminLoginPage />} />

              <Route
                path={ROUTES.RESTAURANT_DASHBOARD}
                element={restaurantRoute(<RestaurantDashboard />)}
              />
              <Route
                path={ROUTES.RESTAURANT_PROFILE}
                element={restaurantRoute(<RestaurantProfilePage />)}
              />
              <Route
                path={ROUTES.RESTAURANT_MENU}
                element={restaurantRoute(<MenuManagement />)}
              />
              <Route
                path={ROUTES.RESTAURANT_ORDERS}
                element={restaurantRoute(<RestaurantOrders />)}
              />
              <Route
                path={ROUTES.RESTAURANT_REVIEWS}
                element={restaurantRoute(<RestaurantReviewsPage />)}
              />

              <Route path={ROUTES.ADMIN_DASHBOARD} element={adminRoute(<AdminDashboard />)} />
              <Route path={ROUTES.ADMIN_ORDERS} element={adminRoute(<AdminOrdersPage />)} />
              <Route path={ROUTES.ADMIN_SHIPPERS} element={adminRoute(<AdminShippersPage />)} />
              <Route path={ROUTES.ADMIN_RATINGS} element={adminRoute(<AdminRatingsPage />)} />
              <Route path={ROUTES.ADMIN_COUPONS} element={adminRoute(<AdminCouponsPage />)} />
              <Route path={ROUTES.ADMIN_FLASH_SALES} element={adminRoute(<AdminFlashSalePage />)} />

              <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
              <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
            </Routes>
          </OrderProvider>
        </MenuProvider>
      </RestaurantProvider>
    </AuthProvider>
  );
}
