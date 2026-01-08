import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './modules/auth/hooks/useAuth'
import { RestaurantProvider } from './modules/restaurant/hooks/useRestaurant'
import { MenuProvider } from './modules/restaurant/hooks/useMenu'
import { OrderProvider } from './modules/restaurant/hooks/useOrder'
import { ChatProvider } from './modules/chat/hooks/useChat'
import LoginPage from './modules/auth/pages/LoginPageV2'
import AdminLoginPage from './modules/auth/pages/AdminLoginPage'
import RegisterPage from './modules/auth/pages/RegisterPageV2'
import HomePage from './modules/home/pages/HomePage'
import RestaurantDashboard from './modules/restaurant/pages/RestaurantDashboard'
import RestaurantProfilePage from './modules/restaurant/pages/RestaurantProfilePage'
import RestaurantOrders from './modules/restaurant/pages/RestaurantOrders'
import RestaurantChatPage from './modules/chat/pages/RestaurantChatPage'
import MenuManagement from './modules/restaurant/pages/MenuManagement'
import AdminDashboard from './modules/admin/pages/AdminDashboard'
import ChatWidget from './modules/chat/components/ChatWidget'
import PrivateRoute from './routes/PrivateRoute'
import { ROUTES } from './utils/constants'
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
            <ChatProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                <Route path={ROUTES.ADMIN_LOGIN} element={<AdminLoginPage />} />
                <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
                
                {/* Restaurant Routes */}
                <Route path={ROUTES.RESTAURANT_DASHBOARD} element={<RestaurantDashboard />} />
                <Route path={ROUTES.RESTAURANT_PROFILE} element={<RestaurantProfilePage />} />
                <Route path={ROUTES.RESTAURANT_MENU} element={<MenuManagement />} />
                <Route path={ROUTES.RESTAURANT_ORDERS} element={<RestaurantOrders />} />
                <Route path={ROUTES.RESTAURANT_CHAT} element={<RestaurantChatPage />} />

                {/* Admin Routes */}
                <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboard />} />

                {/* Protected Routes */}
                <Route
                  path={ROUTES.DASHBOARD}
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />

                {/* 404 Route */}
                <Route path="*" element={<div>404 - Page Not Found</div>} />
              </Routes>

              {/* Floating Chat Widget - Hiện trên tất cả trang */}
              <ChatWidget />
            </ChatProvider>
          </OrderProvider>
        </MenuProvider>
      </RestaurantProvider>
    </AuthProvider>
  )
}

