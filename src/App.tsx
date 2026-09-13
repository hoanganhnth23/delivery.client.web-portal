import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './modules/auth/hooks/useAuth';
import { RestaurantProvider } from './modules/restaurant/hooks/useRestaurant';
import { MenuProvider } from './modules/restaurant/hooks/useMenu';
import { OrderProvider } from './modules/restaurant/hooks/useOrder';
import RoleRoute from './routes/RoleRoute';
import './components/layouts/portal.css';
import { ROUTES, USER_ROLES } from './utils/constants';
import {
  AppDependenciesProvider,
  type AppDependencies,
} from './app/dependencies';

const LoginPage = lazy(() => import('./modules/auth/pages/LoginPageV2'));
const AdminLoginPage = lazy(() => import('./modules/auth/pages/AdminLoginPage'));
const RestaurantDashboard = lazy(() => import('./modules/restaurant/pages/RestaurantDashboard'));
const RestaurantProfilePage = lazy(() => import('./modules/restaurant/pages/RestaurantProfilePage'));
const RestaurantOrders = lazy(() => import('./modules/restaurant/pages/RestaurantOrders'));
const MenuManagement = lazy(() => import('./modules/restaurant/pages/MenuManagement'));
const RestaurantReviewsPage = lazy(() => import('./modules/restaurant/pages/RestaurantReviewsPage'));
const RestaurantVouchersPage = lazy(() => import('./modules/restaurant/pages/RestaurantVouchersPage'));
const RestaurantLivestreamPage = lazy(() => import('./modules/restaurant/pages/RestaurantLivestreamPage'));
const AdminDashboard = lazy(() => import('./modules/admin/pages/AdminDashboard'));
const AdminOrdersPage = lazy(() => import('./modules/admin/pages/AdminOrdersPage'));
const AdminChatPage = lazy(() => import('./modules/admin/pages/AdminChatPage'));
const AdminRestaurantsPage = lazy(() => import('./modules/admin/pages/AdminRestaurantsPage'));
const AdminShippersPage = lazy(() => import('./modules/admin/pages/AdminShippersPage'));
const AdminRatingsPage = lazy(() => import('./modules/admin/pages/AdminRatingsPage'));
const AdminCouponsPage = lazy(() => import('./modules/admin/pages/AdminCouponsPage'));
const AdminFlashSalePage = lazy(() => import('./modules/admin/pages/AdminFlashSalePage'));
const AdminLivestreamPage = lazy(() => import('./modules/admin/pages/AdminLivestreamPage'));
const CatalogImportPage = lazy(() => import('./modules/restaurant/pages/CatalogImportPage'));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'));
const SystemHandbookPage = lazy(() => import('./modules/system-handbook/pages/SystemHandbookPage'));
const CustomerHomePage = lazy(() => import('./modules/customer/pages/CustomerHomePage'));
const CustomerLivestreamPage = lazy(() => import('./modules/customer/pages/CustomerLivestreamPage'));
const CustomerPreview = import.meta.env.DEV ? lazy(() => import('./modules/customer-preview/CustomerPreview')) : null;
const PortalPreview = import.meta.env.DEV ? lazy(() => import('./modules/portal-preview/PortalPreview')) : null;
const ShipperPreview = import.meta.env.DEV ? lazy(() => import('./modules/shipper-preview/ShipperPreview')) : null;
const CustomerRestaurantPage = lazy(() => import('./modules/customer/pages/CustomerRestaurantPage'));
const CustomerCartPage = lazy(() => import('./modules/customer/pages/CustomerCartPage'));
const CustomerLoginPage = lazy(() => import('./modules/customer/pages/CustomerLoginPage'));
const CustomerRegisterPage = lazy(() => import('./modules/customer/pages/CustomerRegisterPage'));
const VerifyEmailPage = lazy(() => import('./modules/customer/pages/VerifyEmailPage'));
const CustomerAddressesPage = lazy(() => import('./modules/customer/pages/CustomerAddressesPage'));
const CustomerCheckoutPage = lazy(() => import('./modules/customer/pages/CustomerCheckoutPage'));
const CustomerOrdersPage = lazy(() => import('./modules/customer/pages/CustomerOrdersPage'));
const CustomerOrderDetailPage = lazy(() => import('./modules/customer/pages/CustomerOrderDetailPage'));
const CustomerAccountPage = lazy(() => import('./modules/customer/pages/CustomerAccountPage'));

const PortalEntry = () => {
  const { user, loading, error, retrySession } = useAuth();

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải cổng quản trị…</div>;
  if (error && !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background-light px-4 dark:bg-background-dark">
        <section className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm dark:border-red-900 dark:bg-surface-dark">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Không thể khôi phục phiên</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{error}</p>
          <button type="button" onClick={() => void retrySession()} className="mt-5 rounded-lg bg-primary px-4 py-2 font-semibold text-white">Thử lại</button>
        </section>
      </main>
    );
  }
  if (user?.role === USER_ROLES.ADMIN) return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
  if (user?.role === USER_ROLES.RESTAURANT_OWNER) return <Navigate to={ROUTES.RESTAURANT_DASHBOARD} replace />;
  return <CustomerHomePage />;
};

const restaurantRoute = (element: ReactNode) => (
  <RoleRoute allowedRoles={[USER_ROLES.RESTAURANT_OWNER, USER_ROLES.ADMIN]}>
    {element}
  </RoleRoute>
);
const adminRoute = (element: ReactNode) => <RoleRoute allowedRoles={[USER_ROLES.ADMIN]} loginPath={ROUTES.ADMIN_LOGIN}>{element}</RoleRoute>;
const customerRoute = (element: ReactNode) => <RoleRoute allowedRoles={[USER_ROLES.USER]} loginPath={ROUTES.CUSTOMER_LOGIN}>{element}</RoleRoute>;

const RouteFallback = () => <div className="loading-container" role="status" aria-live="polite"><div className="spinner" /><p>Đang tải trang…</p></div>;

function PortalRoutes() {
  return (
    <AuthProvider>
      <Suspense fallback={<RouteFallback />}>
        <RestaurantProvider>
          <MenuProvider>
            <OrderProvider>
              <Routes>
                <Route path={ROUTES.HOME} element={<PortalEntry />} />
                <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                <Route path={ROUTES.ADMIN_LOGIN} element={<AdminLoginPage />} />
                <Route path={ROUTES.CUSTOMER_LOGIN} element={<CustomerLoginPage />} />
                <Route path={ROUTES.CUSTOMER_REGISTER} element={<CustomerRegisterPage />} />
                <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />
                <Route path={ROUTES.CUSTOMER_RESTAURANTS} element={<CustomerHomePage />} />
                <Route path={`${ROUTES.CUSTOMER_RESTAURANTS}/:restaurantId`} element={<CustomerRestaurantPage />} />
                <Route path={ROUTES.CUSTOMER_CART} element={<CustomerCartPage />} />
                <Route path={ROUTES.CUSTOMER_CHECKOUT} element={customerRoute(<CustomerCheckoutPage />)} />
                <Route path={ROUTES.CUSTOMER_ADDRESSES} element={customerRoute(<CustomerAddressesPage />)} />
                <Route path={ROUTES.CUSTOMER_ORDERS} element={customerRoute(<CustomerOrdersPage />)} />
                <Route path={ROUTES.CUSTOMER_LIVESTREAMS} element={customerRoute(<CustomerLivestreamPage />)} />
                <Route path={`${ROUTES.CUSTOMER_LIVESTREAMS}/:livestreamId`} element={customerRoute(<CustomerLivestreamPage />)} />
                <Route path="/customer/orders/:orderId" element={customerRoute(<CustomerOrderDetailPage />)} />
                <Route path={ROUTES.CUSTOMER_ACCOUNT} element={<CustomerAccountPage />} />
                <Route path={ROUTES.RESTAURANT_DASHBOARD} element={restaurantRoute(<RestaurantDashboard />)} />
                <Route path={ROUTES.RESTAURANT_PROFILE} element={restaurantRoute(<RestaurantProfilePage />)} />
                <Route path={ROUTES.RESTAURANT_MENU} element={restaurantRoute(<MenuManagement />)} />
                <Route path={ROUTES.RESTAURANT_ORDERS} element={restaurantRoute(<RestaurantOrders />)} />
                <Route path={ROUTES.RESTAURANT_REVIEWS} element={restaurantRoute(<RestaurantReviewsPage />)} />
                <Route path={ROUTES.RESTAURANT_VOUCHERS} element={restaurantRoute(<RestaurantVouchersPage />)} />
                <Route path={ROUTES.RESTAURANT_LIVESTREAM} element={restaurantRoute(<RestaurantLivestreamPage />)} />
                <Route path={ROUTES.RESTAURANT_CATALOG_IMPORT} element={restaurantRoute(<CatalogImportPage portal="restaurant" />)} />
                <Route path={ROUTES.ADMIN_DASHBOARD} element={adminRoute(<AdminDashboard />)} />
                <Route path={ROUTES.ADMIN_ORDERS} element={adminRoute(<AdminOrdersPage />)} />
                <Route path={ROUTES.ADMIN_CHAT} element={adminRoute(<AdminChatPage />)} />
                <Route path={ROUTES.ADMIN_RESTAURANTS} element={adminRoute(<AdminRestaurantsPage />)} />
                <Route path={ROUTES.ADMIN_SHIPPERS} element={adminRoute(<AdminShippersPage />)} />
                <Route path={ROUTES.ADMIN_RATINGS} element={adminRoute(<AdminRatingsPage />)} />
                <Route path={ROUTES.ADMIN_COUPONS} element={adminRoute(<AdminCouponsPage />)} />
                <Route path={ROUTES.ADMIN_FLASH_SALES} element={adminRoute(<AdminFlashSalePage />)} />
                <Route path={ROUTES.ADMIN_LIVESTREAMS} element={adminRoute(<AdminLivestreamPage />)} />
                <Route path={ROUTES.ADMIN_CATALOG_IMPORT} element={adminRoute(<CatalogImportPage portal="admin" />)} />
                <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
                <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
              </Routes>
            </OrderProvider>
          </MenuProvider>
        </RestaurantProvider>
      </Suspense>
    </AuthProvider>
  );
}

function PublicHandbookRoutes() {
  return <Suspense fallback={<RouteFallback />}><Routes><Route path={`${ROUTES.SYSTEM_OVERVIEW}/*`} element={<SystemHandbookPage />} /></Routes></Suspense>;
}

interface AppProps {
  dependencies?: AppDependencies;
}

export default function App({ dependencies }: AppProps) {
  const location = useLocation();
  if (CustomerPreview && (location.pathname === '/preview/shopeefood' || location.pathname.startsWith('/preview/shopeefood/'))) {
    return <Suspense fallback={<RouteFallback />}><CustomerPreview /></Suspense>;
  }
  if (ShipperPreview && (location.pathname === '/preview/shipper' || location.pathname.startsWith('/preview/shipper/'))) {
    return <Suspense fallback={<RouteFallback />}><ShipperPreview /></Suspense>;
  }
  if (PortalPreview && (location.pathname === '/preview/admin' || location.pathname.startsWith('/preview/admin/') || location.pathname === '/preview/restaurant' || location.pathname.startsWith('/preview/restaurant/'))) {
    return <Suspense fallback={<RouteFallback />}><PortalPreview /></Suspense>;
  }
  const isPublicHandbook = location.pathname === ROUTES.SYSTEM_OVERVIEW || location.pathname.startsWith(`${ROUTES.SYSTEM_OVERVIEW}/`);

  const isPortal = location.pathname.startsWith('/admin') || location.pathname.startsWith('/restaurant/') || location.pathname === ROUTES.LOGIN;
  const content = <AppDependenciesProvider dependencies={dependencies}>{isPublicHandbook ? <PublicHandbookRoutes /> : <PortalRoutes />}</AppDependenciesProvider>;
  return <div className={isPortal ? 'portal-theme' : undefined}>{content}</div>;
}
