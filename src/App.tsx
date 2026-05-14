import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './modules/auth/hooks/useAuth'
import { RestaurantProvider } from './modules/restaurant/hooks/useRestaurant'
import { MenuProvider } from './modules/restaurant/hooks/useMenu'
import { OrderProvider } from './modules/restaurant/hooks/useOrder'
import { SettlementProvider } from './modules/restaurant/hooks/useSettlement'
import { ChatProvider } from './modules/chat/hooks/useChat'
import { LivestreamProvider } from './modules/livestream/hooks/useLivestream'
import { ViewerProvider } from './modules/livestream/hooks/useViewerLivestream'
import LoginPage from './modules/auth/pages/LoginPageV2'
import AdminLoginPage from './modules/auth/pages/AdminLoginPage'
import RegisterPage from './modules/auth/pages/RegisterPageV2'
import HomePage from './modules/home/pages/HomePage'
import RestaurantDashboard from './modules/restaurant/pages/RestaurantDashboard'
import RestaurantProfilePage from './modules/restaurant/pages/RestaurantProfilePage'
import RestaurantOrders from './modules/restaurant/pages/RestaurantOrders'
import RestaurantChatPage from './modules/chat/pages/RestaurantChatPage'
import MenuManagement from './modules/restaurant/pages/MenuManagement'
import SettlementPage from './modules/restaurant/pages/SettlementPage'
import RestaurantReviewsPage from './modules/restaurant/pages/RestaurantReviewsPage'
import LivestreamPage from './modules/livestream/pages/LivestreamPage'
import LivestreamManagementPage from './modules/livestream/pages/LivestreamManagementPage'
import ViewerLivestreamPage from './modules/livestream/pages/ViewerLivestreamPage'
import AdminDashboard from './modules/admin/pages/AdminDashboard'
import AdminOrdersPage from './modules/admin/pages/AdminOrdersPage'
import AdminWithdrawalsPage from './modules/admin/pages/AdminWithdrawalsPage'
import AdminShippersPage from './modules/admin/pages/AdminShippersPage'
import AdminRatingsPage from './modules/admin/pages/AdminRatingsPage'
import AdminCouponsPage from './modules/admin/pages/AdminCouponsPage'
import AdminFlashSalePage from './modules/admin/pages/AdminFlashSalePage'
import AdminChatPage from './modules/admin/pages/AdminChatPage'
import CouponManagementPage from './modules/restaurant/pages/CouponManagementPage'
import RestaurantFlashSalePage from './modules/restaurant/pages/RestaurantFlashSalePage'
import ChatWidget from './modules/chat/components/ChatWidget'
import UnauthorizedPage from './pages/UnauthorizedPage'
import PrivateRoute from './routes/PrivateRoute'
import RoleRoute from './routes/RoleRoute'
import { ROUTES, USER_ROLES } from './utils/constants'
import './App.css'

// Temporary Dashboard Component
const Dashboard = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Dashboard</h1>
      <p>Welcome to DeliveryVN Admin Panel</p>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <RestaurantProvider>
        <MenuProvider>
          <OrderProvider>
            <SettlementProvider>
              <ChatProvider>
                <LivestreamProvider>
                  <ViewerProvider>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<HomePage />} />
                      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                      <Route path={ROUTES.ADMIN_LOGIN} element={<AdminLoginPage />} />
                      <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
                    
                      {/* Livestream Viewer Route - Public */}
                      <Route path={ROUTES.LIVESTREAM_VIEWER} element={<ViewerLivestreamPage />} />
                    
                      {/* Restaurant Routes */}
                    <Route path={ROUTES.RESTAURANT_DASHBOARD} element={<RestaurantDashboard />} />
                    <Route path={ROUTES.RESTAURANT_PROFILE} element={<RestaurantProfilePage />} />
                    <Route path={ROUTES.RESTAURANT_MENU} element={<MenuManagement />} />
                    <Route path={ROUTES.RESTAURANT_ORDERS} element={<RestaurantOrders />} />
                    <Route path={ROUTES.RESTAURANT_CHAT} element={<RestaurantChatPage />} />
                    <Route path={ROUTES.RESTAURANT_SETTLEMENT} element={<SettlementPage />} />
                    <Route path={ROUTES.RESTAURANT_REVIEWS} element={<RestaurantReviewsPage />} />
                    <Route path={ROUTES.RESTAURANT_COUPONS} element={<CouponManagementPage />} />
                    <Route path={ROUTES.RESTAURANT_FLASH_SALES} element={<RestaurantFlashSalePage />} />
                    <Route path={ROUTES.RESTAURANT_LIVESTREAM} element={<LivestreamPage />} />
                    <Route path={ROUTES.RESTAURANT_LIVESTREAM_DETAIL} element={<LivestreamPage />} />
                    <Route path={ROUTES.RESTAURANT_LIVESTREAM_MANAGEMENT} element={<LivestreamManagementPage />} />

                    {/* Admin Routes - Bảo vệ bằng RoleRoute */}
                  <Route
                    path={ROUTES.ADMIN_DASHBOARD}
                    element={
                      <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                        <AdminDashboard />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path={ROUTES.ADMIN_ORDERS}
                    element={
                      <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                        <AdminOrdersPage />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path={ROUTES.ADMIN_WITHDRAWALS}
                    element={
                      <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                        <AdminWithdrawalsPage />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path={ROUTES.ADMIN_SHIPPERS}
                    element={
                      <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                        <AdminShippersPage />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path={ROUTES.ADMIN_RATINGS}
                    element={
                      <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                        <AdminRatingsPage />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path={ROUTES.ADMIN_COUPONS}
                    element={
                      <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                        <AdminCouponsPage />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path={ROUTES.ADMIN_FLASH_SALES}
                    element={
                      <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                        <AdminFlashSalePage />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path={ROUTES.ADMIN_CHAT}
                    element={
                      <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                        <AdminChatPage />
                      </RoleRoute>
                    }
                  />

                  {/* Protected Routes */}
                  <Route
                    path={ROUTES.DASHBOARD}
                    element={
                      <PrivateRoute>
                        <Dashboard />
                      </PrivateRoute>
                    }
                  />

                {/* Error Routes */}
                <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
                <Route path="*" element={<div>404 - Page Not Found</div>} />
              </Routes>

              {/* Floating Chat Widget - Hiện trên tất cả trang */}
              <ChatWidget />
            </ViewerProvider>
          </LivestreamProvider>
        </ChatProvider>
      </SettlementProvider>
    </OrderProvider>
  </MenuProvider>
</RestaurantProvider>
</AuthProvider>
  )
}