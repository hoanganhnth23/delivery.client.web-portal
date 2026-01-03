import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './modules/auth/hooks/useAuth'
import LoginPage from './modules/auth/pages/LoginPageV2'
import AdminLoginPage from './modules/auth/pages/AdminLoginPage'
import RegisterPage from './modules/auth/pages/RegisterPageV2'
import HomePage from './modules/home/pages/HomePage'
import RestaurantDashboard from './modules/restaurant/pages/RestaurantDashboard'
import MenuManagement from './modules/restaurant/pages/MenuManagement'
import AdminDashboard from './modules/admin/pages/AdminDashboard'
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

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        
        {/* Restaurant Routes */}
        <Route path="/restaurant/dashboard" element={<RestaurantDashboard />} />
        <Route path="/restaurant/menu" element={<MenuManagement />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

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
    </AuthProvider>
  )
}

export default App
