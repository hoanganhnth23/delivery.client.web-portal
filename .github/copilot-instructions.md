# 🚀 Copilot Instructions - DeliveryVN Web Application

## 📋 Tổng Quan Dự Án

DeliveryVN Web là ứng dụng quản lý nhà hàng và giao đồ ăn được xây dựng với **React + Vite**. Ứng dụng tích hợp với hệ thống microservices backend qua **API Gateway** (port 8080).

### 🎯 Các Chức Năng Chính
- ✅ **Xác thực**: Đăng nhập, Đăng ký (với role: SHOP_OWNER, ADMIN)
- ✅ **Quản lý nhà hàng**: CRUD nhà hàng, tìm kiếm
- ✅ **Quản lý thực đơn**: CRUD món ăn, danh mục
- ✅ **Dashboard**: Thống kê và quản lý theo role

---

## 🏗️ Kiến Trúc Frontend

### 📁 Cấu Trúc Thư Mục (PHẢI TUÂN THỦ)

```
delivery_web/
├── src/
│   ├── assets/              # Hình ảnh, icons, fonts
│   │   ├── images/
│   │   ├── icons/
│   │   └── styles/
│   │
│   ├── components/          # Các component tái sử dụng
│   │   ├── common/          # Button, Input, Modal, Card...
│   │   ├── layout/          # Header, Sidebar, Footer
│   │   └── forms/           # LoginForm, RegisterForm...
│   │
│   ├── modules/             # Các module nghiệp vụ (feature-based)
│   │   ├── auth/
│   │   │   ├── components/  # LoginForm, RegisterForm
│   │   │   ├── pages/       # LoginPage, RegisterPage
│   │   │   ├── services/    # authService.js
│   │   │   ├── hooks/       # useAuth.js
│   │   │   ├── store/       # authSlice.js (nếu dùng Redux)
│   │   │   └── utils/       # validation, helpers
│   │   │
│   │   ├── restaurant/
│   │   │   ├── components/  # RestaurantCard, RestaurantForm
│   │   │   ├── pages/       # RestaurantListPage, RestaurantDetailPage
│   │   │   ├── services/    # restaurantService.js
│   │   │   ├── hooks/       # useRestaurant.js
│   │   │   └── utils/
│   │   │
│   │   ├── menu/
│   │   │   ├── components/  # MenuItemCard, MenuItemForm
│   │   │   ├── pages/       # MenuListPage, CreateMenuItemPage
│   │   │   ├── services/    # menuService.js
│   │   │   └── hooks/       # useMenu.js
│   │   │
│   │   └── dashboard/
│   │       ├── components/  # StatCard, Chart
│   │       └── pages/       # DashboardPage
│   │
│   ├── routes/              # Cấu hình routing
│   │   ├── index.jsx        # Route definitions
│   │   ├── PrivateRoute.jsx # Protected routes
│   │   └── RoleRoute.jsx    # Role-based access
│   │
│   ├── services/            # API services (shared)
│   │   ├── api/
│   │   │   ├── apiClient.js # Axios instance
│   │   │   └── endpoints.js # API endpoints constants
│   │   └── storage/
│   │       └── localStorage.js
│   │
│   ├── store/               # State management (Redux/Zustand)
│   │   ├── index.js
│   │   └── slices/
│   │
│   ├── hooks/               # Custom hooks (shared)
│   │   ├── useApi.js
│   │   ├── useToast.js
│   │   └── useDebounce.js
│   │
│   ├── utils/               # Utilities (shared)
│   │   ├── constants.js     # App constants
│   │   ├── validation.js    # Form validation
│   │   ├── formatter.js     # Date, currency formatters
│   │   └── helpers.js       # Helper functions
│   │
│   ├── App.jsx              # Root component
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
│
├── public/                  # Static assets
├── .env.development         # Dev environment variables
├── .env.production          # Production environment variables
├── vite.config.js
└── package.json
```

---

## 🔌 Backend Integration

### API Gateway Base URL
```javascript
// src/services/api/apiClient.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
```

### API Endpoints (Từ Backend)

```javascript
// src/services/api/endpoints.js
export const API_ENDPOINTS = {
  // Auth Service (port 8081)
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    REFRESH_TOKEN: '/api/auth/refresh-token',
    LOGOUT: '/api/auth/logout',
    GET_SESSIONS: '/api/auth/sessions',
    GET_ACCOUNT_BY_ID: (id) => `/api/auth/accounts/${id}`,
  },

  // Restaurant Service (port 8083)
  RESTAURANT: {
    CREATE: '/api/restaurants',
    UPDATE: (id) => `/api/restaurants/${id}`,
    DELETE: (id) => `/api/restaurants/${id}`,
    GET_BY_ID: (id) => `/api/restaurants/${id}`,
    GET_ALL: '/api/restaurants',
    SEARCH: '/api/restaurants/search', // ?keyword=abc
  },

  // Menu Items (Restaurant Service)
  MENU: {
    CREATE: '/api/menu-items',
    UPDATE: (id) => `/api/menu-items/${id}`,
    DELETE: (id) => `/api/menu-items/${id}`,
    GET_BY_ID: (id) => `/api/menu-items/${id}`,
    GET_BY_RESTAURANT: (restaurantId) => `/api/menu-items/restaurant/${restaurantId}`,
    GET_ALL: '/api/menu-items',
  },

  // User Service (port 8082) - nếu cần
  USER: {
    GET_PROFILE: '/api/users/profile',
    UPDATE_PROFILE: '/api/users/profile',
  },
};
```

### Response Format Chuẩn (BaseResponse)

Backend **BẮT BUỘC** trả về format:
```javascript
{
  "code": 1,           // 1 = success, 0 = error
  "data": {...},       // Response data
  "message": "Success" // Optional message
}
```

**Xử lý response:**
```javascript
// src/services/api/apiClient.js
const handleResponse = (response) => {
  const { code, data, message } = response.data;
  
  if (code === 1) {
    return data;
  } else {
    throw new Error(message || 'API Error');
  }
};
```

---

## 🔐 Authentication & Authorization

### 1. JWT Token Management

**Backend trả về khi login:**
```javascript
{
  "code": 1,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1Ni...",
    "refreshToken": "uuid-string",
    "expiresIn": 1800  // 30 minutes in seconds
  }
}
```

**Lưu trữ token:**
```javascript
// src/services/storage/localStorage.js
export const TokenStorage = {
  setAccessToken: (token) => localStorage.setItem('accessToken', token),
  getAccessToken: () => localStorage.getItem('accessToken'),
  
  setRefreshToken: (token) => localStorage.setItem('refreshToken', token),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  
  clearTokens: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');
  }
};
```

### 2. HTTP Headers (CRITICAL)

Backend yêu cầu headers sau **mọi request** (ngoại trừ /api/auth/**):

```javascript
// src/services/api/apiClient.js
import axios from 'axios';
import { TokenStorage } from '../storage/localStorage';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Tự động thêm token
apiClient.interceptors.request.use(
  (config) => {
    const token = TokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Xử lý token hết hạn
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = TokenStorage.getRefreshToken();
        const response = await axios.post(
          `${API_BASE_URL}/api/auth/refresh-token`,
          { refreshToken }
        );
        
        const { accessToken } = response.data.data;
        TokenStorage.setAccessToken(accessToken);
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        TokenStorage.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 3. User Roles & Permissions

**Backend roles (từ AuthAccount.Role):**
```javascript
export const USER_ROLES = {
  SHOP_OWNER: 'SHOP_OWNER',  // Chủ nhà hàng
  ADMIN: 'ADMIN',             // Quản trị viên hệ thống
  USER: 'USER',               // Khách hàng (không dùng cho web này)
  SHIPPER: 'SHIPPER',         // Shipper (không dùng cho web này)
};
```

**Role-based routing:**
```jsx
// src/routes/RoleRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../modules/auth/hooks/useAuth';

export const RoleRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};
```

---

## 📦 Module: Auth (Xác Thực)

### Chức năng
- ✅ Đăng nhập (Login) - cho SHOP_OWNER và ADMIN
- ✅ Đăng ký (Register) - tạo tài khoản SHOP_OWNER
- ✅ Đăng xuất (Logout)
- ✅ Refresh token tự động
- ✅ Quản lý sessions

### Service Implementation

```javascript
// src/modules/auth/services/authService.js
import apiClient from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/services/api/endpoints';
import { TokenStorage } from '@/services/storage/localStorage';

export const authService = {
  /**
   * Đăng ký tài khoản mới
   * @param {Object} data - { email, password, role }
   * @returns {Promise<Boolean>}
   */
  async register(data) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, {
      email: data.email,
      password: data.password,
      role: data.role || 'SHOP_OWNER', // Default role
    });
    
    return response.data.data; // true/false
  },

  /**
   * Đăng nhập
   * @param {Object} credentials - { email, password, deviceType }
   * @returns {Promise<Object>} - { accessToken, refreshToken, expiresIn }
   */
  async login(credentials) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
      email: credentials.email,
      password: credentials.password,
      deviceType: credentials.deviceType || 'WEB',
    });
    
    const { accessToken, refreshToken, expiresIn } = response.data.data;
    
    // Lưu tokens
    TokenStorage.setAccessToken(accessToken);
    TokenStorage.setRefreshToken(refreshToken);
    
    // Decode JWT để lấy user info
    const userInfo = this.decodeToken(accessToken);
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    
    return response.data.data;
  },

  /**
   * Đăng xuất
   */
  async logout() {
    const refreshToken = TokenStorage.getRefreshToken();
    
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      TokenStorage.clearTokens();
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken() {
    const refreshToken = TokenStorage.getRefreshToken();
    
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
      refreshToken,
    });
    
    const { accessToken } = response.data.data;
    TokenStorage.setAccessToken(accessToken);
    
    return accessToken;
  },

  /**
   * Lấy danh sách sessions đang hoạt động
   */
  async getSessions() {
    const response = await apiClient.get(API_ENDPOINTS.AUTH.GET_SESSIONS);
    return response.data.data;
  },

  /**
   * Decode JWT token để lấy user info
   */
  decodeToken(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Token decode error:', error);
      return null;
    }
  },

  /**
   * Kiểm tra user đã login chưa
   */
  isAuthenticated() {
    return !!TokenStorage.getAccessToken();
  },

  /**
   * Lấy thông tin user hiện tại
   */
  getCurrentUser() {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  },
};
```

### React Hook

```javascript
// src/modules/auth/hooks/useAuth.js
import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = authService.getCurrentUser();
    setUser(user);
    setLoading(false);
  }, []);

  const login = useCallback(async (credentials) => {
    try {
      await authService.login(credentials);
      const user = authService.getCurrentUser();
      setUser(user);
      
      // Redirect dựa vào role
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'SHOP_OWNER') {
        navigate('/restaurant/dashboard');
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [navigate]);

  const register = useCallback(async (data) => {
    try {
      await authService.register(data);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    navigate('/login');
  }, [navigate]);

  return {
    user,
    loading,
    isAuthenticated: authService.isAuthenticated(),
    login,
    register,
    logout,
  };
};
```

### UI Components

```jsx
// src/modules/auth/pages/LoginPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData);
    
    if (!result.success) {
      setError(result.error || 'Đăng nhập thất bại');
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Đăng nhập</h2>
        <p className="subtitle">DeliveryVN - Quản lý nhà hàng</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="your-email@example.com"
            />
          </div>
          
          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="••••••••"
            />
          </div>
          
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
        </div>
      </div>
    </div>
  );
};
```

```jsx
// src/modules/auth/pages/RegisterPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { USER_ROLES } from '@/utils/constants';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: USER_ROLES.SHOP_OWNER, // Default
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu không khớp');
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    const result = await register({
      email: formData.email,
      password: formData.password,
      role: formData.role,
    });

    if (result.success) {
      navigate('/login', {
        state: { message: 'Đăng ký thành công! Vui lòng đăng nhập.' }
      });
    } else {
      setError(result.error || 'Đăng ký thất bại');
    }
    
    setLoading(false);
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2>Đăng ký tài khoản</h2>
        <p className="subtitle">Tạo tài khoản để quản lý nhà hàng</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Xác nhận mật khẩu</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Loại tài khoản</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value={USER_ROLES.SHOP_OWNER}>Chủ nhà hàng</option>
              <option value={USER_ROLES.ADMIN}>Quản trị viên</option>
            </select>
          </div>
          
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>
        
        <div className="register-footer">
          <p>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
        </div>
      </div>
    </div>
  );
};
```

---

## 📦 Module: Restaurant (Quản lý Nhà hàng)

### Chức năng
- ✅ Xem danh sách nhà hàng (GET /api/restaurants)
- ✅ Xem chi tiết nhà hàng (GET /api/restaurants/:id)
- ✅ Tạo nhà hàng mới (POST /api/restaurants) - Chỉ SHOP_OWNER và ADMIN
- ✅ Cập nhật nhà hàng (PUT /api/restaurants/:id)
- ✅ Xóa nhà hàng (DELETE /api/restaurants/:id)
- ✅ Tìm kiếm nhà hàng (GET /api/restaurants/search?keyword=xxx)

### Data Models

```typescript
// Backend Restaurant Entity
interface Restaurant {
  id: number;
  name: string;
  description: string;
  address: string;
  phoneNumber: string;
  imageUrl: string;
  rating: number;
  isActive: boolean;
  createdById: number;
  createdAt: string;
  updatedAt: string;
}

// Create Request
interface CreateRestaurantRequest {
  name: string;
  description: string;
  address: string;
  phoneNumber: string;
  imageUrl?: string;
}

// Update Request
interface UpdateRestaurantRequest {
  name?: string;
  description?: string;
  address?: string;
  phoneNumber?: string;
  imageUrl?: string;
  isActive?: boolean;
}
```

### Service Implementation

```javascript
// src/modules/restaurant/services/restaurantService.js
import apiClient from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/services/api/endpoints';

export const restaurantService = {
  async createRestaurant(data) {
    const response = await apiClient.post(API_ENDPOINTS.RESTAURANT.CREATE, data);
    return response.data.data;
  },

  async updateRestaurant(id, data) {
    const response = await apiClient.put(API_ENDPOINTS.RESTAURANT.UPDATE(id), data);
    return response.data.data;
  },

  async deleteRestaurant(id) {
    const response = await apiClient.delete(API_ENDPOINTS.RESTAURANT.DELETE(id));
    return response.data.data;
  },

  async getRestaurantById(id) {
    const response = await apiClient.get(API_ENDPOINTS.RESTAURANT.GET_BY_ID(id));
    return response.data.data;
  },

  async getAllRestaurants() {
    const response = await apiClient.get(API_ENDPOINTS.RESTAURANT.GET_ALL);
    return response.data.data;
  },

  async searchRestaurants(keyword) {
    const response = await apiClient.get(API_ENDPOINTS.RESTAURANT.SEARCH, {
      params: { keyword }
    });
    return response.data.data;
  },
};
```

### React Hook

```javascript
// src/modules/restaurant/hooks/useRestaurant.js
import { useState, useEffect } from 'react';
import { restaurantService } from '../services/restaurantService';

export const useRestaurant = (restaurantId = null) => {
  const [restaurants, setRestaurants] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all restaurants
  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const data = await restaurantService.getAllRestaurants();
      setRestaurants(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch single restaurant
  const fetchRestaurant = async (id) => {
    setLoading(true);
    try {
      const data = await restaurantService.getRestaurantById(id);
      setRestaurant(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create restaurant
  const createRestaurant = async (data) => {
    try {
      const newRestaurant = await restaurantService.createRestaurant(data);
      setRestaurants([...restaurants, newRestaurant]);
      return { success: true, data: newRestaurant };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Update restaurant
  const updateRestaurant = async (id, data) => {
    try {
      const updated = await restaurantService.updateRestaurant(id, data);
      setRestaurants(restaurants.map(r => r.id === id ? updated : r));
      if (restaurant?.id === id) setRestaurant(updated);
      return { success: true, data: updated };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Delete restaurant
  const deleteRestaurant = async (id) => {
    try {
      await restaurantService.deleteRestaurant(id);
      setRestaurants(restaurants.filter(r => r.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Search restaurants
  const searchRestaurants = async (keyword) => {
    setLoading(true);
    try {
      const data = await restaurantService.searchRestaurants(keyword);
      setRestaurants(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantId) {
      fetchRestaurant(restaurantId);
    }
  }, [restaurantId]);

  return {
    restaurants,
    restaurant,
    loading,
    error,
    fetchRestaurants,
    fetchRestaurant,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    searchRestaurants,
  };
};
```

---

## 📦 Module: Menu (Quản lý Thực đơn)

### Chức năng
- ✅ Xem danh sách món ăn theo nhà hàng
- ✅ Tạo món ăn mới (POST /api/menu-items)
- ✅ Cập nhật món ăn (PUT /api/menu-items/:id)
- ✅ Xóa món ăn (DELETE /api/menu-items/:id)
- ✅ Xem chi tiết món ăn

### Data Models

```typescript
interface MenuItem {
  id: number;
  restaurantId: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Service Implementation

```javascript
// src/modules/menu/services/menuService.js
import apiClient from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/services/api/endpoints';

export const menuService = {
  async createMenuItem(data) {
    const response = await apiClient.post(API_ENDPOINTS.MENU.CREATE, data);
    return response.data.data;
  },

  async updateMenuItem(id, data) {
    const response = await apiClient.put(API_ENDPOINTS.MENU.UPDATE(id), data);
    return response.data.data;
  },

  async deleteMenuItem(id) {
    const response = await apiClient.delete(API_ENDPOINTS.MENU.DELETE(id));
    return response.data.data;
  },

  async getMenuItemById(id) {
    const response = await apiClient.get(API_ENDPOINTS.MENU.GET_BY_ID(id));
    return response.data.data;
  },

  async getMenuItemsByRestaurant(restaurantId) {
    const response = await apiClient.get(API_ENDPOINTS.MENU.GET_BY_RESTAURANT(restaurantId));
    return response.data.data;
  },

  async getAllMenuItems() {
    const response = await apiClient.get(API_ENDPOINTS.MENU.GET_ALL);
    return response.data.data;
  },
};
```

---

## 🎨 UI/UX Guidelines

### Design Principles
1. **Clean & Modern**: Giao diện sạch, hiện đại, dễ sử dụng
2. **Responsive**: Hoạt động tốt trên desktop, tablet, mobile
3. **Accessibility**: Tuân thủ WCAG 2.1 guidelines
4. **Performance**: Lazy loading, code splitting, optimized images

### Color Palette (Đề xuất)
```css
:root {
  /* Primary Colors */
  --primary-500: #3B82F6;      /* Blue - Main brand color */
  --primary-600: #2563EB;
  --primary-700: #1D4ED8;

  /* Secondary Colors */
  --secondary-500: #10B981;    /* Green - Success states */
  --secondary-600: #059669;

  /* Neutral Colors */
  --gray-50: #F9FAFB;
  --gray-100: #F3F4F6;
  --gray-200: #E5E7EB;
  --gray-300: #D1D5DB;
  --gray-500: #6B7280;
  --gray-700: #374151;
  --gray-900: #111827;

  /* Semantic Colors */
  --error: #EF4444;
  --warning: #F59E0B;
  --success: #10B981;
  --info: #3B82F6;

  /* Background */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F9FAFB;
}
```

### Typography
```css
:root {
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  
  /* Font Sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
}
```

---

## 🛣️ Routing Structure

```javascript
// src/routes/index.jsx
import { createBrowserRouter } from 'react-router-dom';
import { RoleRoute } from './RoleRoute';
import { USER_ROLES } from '@/utils/constants';

// Layouts
import MainLayout from '@/components/layout/MainLayout';
import AuthLayout from '@/components/layout/AuthLayout';

// Auth pages
import LoginPage from '@/modules/auth/pages/LoginPage';
import RegisterPage from '@/modules/auth/pages/RegisterPage';

// Restaurant pages
import RestaurantListPage from '@/modules/restaurant/pages/RestaurantListPage';
import RestaurantDetailPage from '@/modules/restaurant/pages/RestaurantDetailPage';
import CreateRestaurantPage from '@/modules/restaurant/pages/CreateRestaurantPage';
import EditRestaurantPage from '@/modules/restaurant/pages/EditRestaurantPage';

// Menu pages
import MenuListPage from '@/modules/menu/pages/MenuListPage';
import CreateMenuItemPage from '@/modules/menu/pages/CreateMenuItemPage';
import EditMenuItemPage from '@/modules/menu/pages/EditMenuItemPage';

// Dashboard
import DashboardPage from '@/modules/dashboard/pages/DashboardPage';
import AdminDashboard from '@/modules/dashboard/pages/AdminDashboard';

export const router = createBrowserRouter([
  // Public routes (no auth required)
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },

  // Protected routes (auth required)
  {
    path: '/',
    element: <MainLayout />,
    children: [
      // Restaurant routes (SHOP_OWNER + ADMIN)
      {
        path: 'restaurants',
        children: [
          { index: true, element: <RestaurantListPage /> },
          { 
            path: 'new', 
            element: (
              <RoleRoute allowedRoles={[USER_ROLES.SHOP_OWNER, USER_ROLES.ADMIN]}>
                <CreateRestaurantPage />
              </RoleRoute>
            )
          },
          { path: ':id', element: <RestaurantDetailPage /> },
          { 
            path: ':id/edit', 
            element: (
              <RoleRoute allowedRoles={[USER_ROLES.SHOP_OWNER, USER_ROLES.ADMIN]}>
                <EditRestaurantPage />
              </RoleRoute>
            )
          },
        ],
      },

      // Menu routes (SHOP_OWNER + ADMIN)
      {
        path: 'restaurants/:restaurantId/menu',
        children: [
          { index: true, element: <MenuListPage /> },
          { 
            path: 'new', 
            element: (
              <RoleRoute allowedRoles={[USER_ROLES.SHOP_OWNER, USER_ROLES.ADMIN]}>
                <CreateMenuItemPage />
              </RoleRoute>
            )
          },
          { 
            path: ':menuId/edit', 
            element: (
              <RoleRoute allowedRoles={[USER_ROLES.SHOP_OWNER, USER_ROLES.ADMIN]}>
                <EditMenuItemPage />
              </RoleRoute>
            )
          },
        ],
      },

      // Dashboard routes
      {
        path: 'dashboard',
        element: (
          <RoleRoute allowedRoles={[USER_ROLES.SHOP_OWNER, USER_ROLES.ADMIN]}>
            <DashboardPage />
          </RoleRoute>
        ),
      },
      {
        path: 'admin',
        element: (
          <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
            <AdminDashboard />
          </RoleRoute>
        ),
      },
    ],
  },
]);
```

---

## 📝 Code Style & Best Practices

### 1. Naming Conventions

```javascript
// ✅ GOOD - PascalCase for components
export const RestaurantCard = () => {};

// ✅ GOOD - camelCase for functions/variables
const handleSubmit = () => {};
const restaurantData = {};

// ✅ GOOD - UPPER_CASE for constants
export const API_BASE_URL = 'http://localhost:8080';
export const USER_ROLES = { ADMIN: 'ADMIN' };

// ❌ BAD
export const restaurant_card = () => {};
const HandleSubmit = () => {};
```

### 2. File Naming

```
✅ GOOD:
- RestaurantCard.jsx
- useAuth.js
- restaurantService.js
- constants.js

❌ BAD:
- restaurant-card.jsx
- UseAuth.js
- RestaurantService.js
```

### 3. Import Order

```javascript
// 1. React imports
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Third-party libraries
import axios from 'axios';

// 3. Local modules (use @ alias)
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { restaurantService } from '@/modules/restaurant/services/restaurantService';
import { API_ENDPOINTS } from '@/services/api/endpoints';

// 4. Components
import Button from '@/components/common/Button';
import RestaurantCard from '../components/RestaurantCard';

// 5. Styles
import './RestaurantList.css';
```

### 4. Component Structure

```jsx
// ✅ GOOD - Functional component with hooks
import { useState, useEffect } from 'react';

export const RestaurantList = ({ onSelect }) => {
  // 1. Hooks (state, effects, custom hooks)
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // 2. Event handlers
  const handleSelect = (restaurant) => {
    onSelect?.(restaurant);
  };

  // 3. Effects
  useEffect(() => {
    fetchRestaurants();
  }, []);

  // 4. Helper functions
  const fetchRestaurants = async () => {
    setLoading(true);
    // ...
    setLoading(false);
  };

  // 5. Early returns
  if (loading) return <LoadingSpinner />;
  if (!restaurants.length) return <EmptyState />;

  // 6. Main render
  return (
    <div className="restaurant-list">
      {restaurants.map(restaurant => (
        <RestaurantCard
          key={restaurant.id}
          restaurant={restaurant}
          onClick={handleSelect}
        />
      ))}
    </div>
  );
};
```

### 5. Error Handling

```javascript
// ✅ GOOD - Proper error handling
const createRestaurant = async (data) => {
  try {
    const response = await restaurantService.createRestaurant(data);
    toast.success('Tạo nhà hàng thành công!');
    return { success: true, data: response };
  } catch (error) {
    const message = error.response?.data?.message || 'Có lỗi xảy ra';
    toast.error(message);
    return { success: false, error: message };
  }
};

// ❌ BAD - No error handling
const createRestaurant = async (data) => {
  const response = await restaurantService.createRestaurant(data);
  return response;
};
```

### 6. PropTypes / TypeScript (nếu dùng)

```javascript
// Nếu dùng PropTypes
import PropTypes from 'prop-types';

RestaurantCard.propTypes = {
  restaurant: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    rating: PropTypes.number,
  }).isRequired,
  onClick: PropTypes.func,
};

// Hoặc TypeScript (khuyến nghị)
interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick?: (restaurant: Restaurant) => void;
}
```

---

## ⚡ Performance Optimization

### 1. Code Splitting

```javascript
// src/routes/index.jsx
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Lazy load pages
const RestaurantListPage = lazy(() => import('@/modules/restaurant/pages/RestaurantListPage'));
const DashboardPage = lazy(() => import('@/modules/dashboard/pages/DashboardPage'));

// Wrap in Suspense
<Suspense fallback={<LoadingSpinner />}>
  <RestaurantListPage />
</Suspense>
```

### 2. Image Optimization

```jsx
// ✅ GOOD - Lazy load images
import { useState } from 'react';

export const RestaurantImage = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="image-container">
      {!loaded && <div className="skeleton" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        style={{ display: loaded ? 'block' : 'none' }}
      />
    </div>
  );
};
```

### 3. Memoization

```javascript
import { useMemo, useCallback } from 'react';

export const RestaurantList = ({ restaurants, onSelect }) => {
  // Memoize expensive calculations
  const sortedRestaurants = useMemo(() => {
    return restaurants.sort((a, b) => b.rating - a.rating);
  }, [restaurants]);

  // Memoize callbacks
  const handleSelect = useCallback((restaurant) => {
    onSelect?.(restaurant);
  }, [onSelect]);

  return (
    <div>
      {sortedRestaurants.map(r => (
        <RestaurantCard key={r.id} restaurant={r} onClick={handleSelect} />
      ))}
    </div>
  );
};
```

---

## 🧪 Testing Guidelines

### Unit Tests (Vitest + React Testing Library)

```javascript
// src/modules/restaurant/services/__tests__/restaurantService.test.js
import { describe, it, expect, vi } from 'vitest';
import { restaurantService } from '../restaurantService';
import apiClient from '@/services/api/apiClient';

vi.mock('@/services/api/apiClient');

describe('restaurantService', () => {
  it('should fetch all restaurants', async () => {
    const mockData = [{ id: 1, name: 'Restaurant 1' }];
    apiClient.get.mockResolvedValue({
      data: { code: 1, data: mockData }
    });

    const result = await restaurantService.getAllRestaurants();
    
    expect(result).toEqual(mockData);
    expect(apiClient.get).toHaveBeenCalledWith('/api/restaurants');
  });
});
```

---

## 🔧 Environment Variables

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_NAME=DeliveryVN
VITE_APP_VERSION=1.0.0

# .env.production
VITE_API_BASE_URL=https://api.deliveryvn.com
VITE_APP_NAME=DeliveryVN
VITE_APP_VERSION=1.0.0
```

---

## 📚 Required Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.0",
    "@tanstack/react-query": "^5.0.0",  // For data fetching (optional)
    "zustand": "^4.4.0",                 // State management (hoặc Redux)
    "react-hook-form": "^7.48.0",        // Form handling
    "zod": "^3.22.0",                    // Validation
    "react-toastify": "^9.1.0",          // Toast notifications
    "date-fns": "^2.30.0"                // Date formatting
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",                  // Testing
    "@testing-library/react": "^14.1.0",
    "@testing-library/jest-dom": "^6.1.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.3.0"              // CSS framework (optional)
  }
}
```

---

## 🚀 Getting Started

### 1. Setup Project

```bash
# Clone repository
git clone <repo-url>
cd delivery_web

# Install dependencies
npm install

# Create .env file
cp .env.example .env.development

# Start dev server
npm run dev
```

### 2. Backend Integration Checklist

- [ ] API Gateway đang chạy ở port 8080
- [ ] Auth Service đang chạy ở port 8081
- [ ] Restaurant Service đang chạy ở port 8083
- [ ] Database (PostgreSQL) đã được khởi tạo
- [ ] JWT public key đã được cấu hình trong API Gateway

### 3. First Implementation Steps

1. **Setup API client** (`src/services/api/apiClient.js`)
2. **Implement Auth module** (Login/Register)
3. **Setup routing** (`src/routes/index.jsx`)
4. **Create layout components** (Header, Sidebar)
5. **Implement Restaurant module** (CRUD operations)
6. **Implement Menu module** (CRUD operations)
7. **Create Dashboard** (Statistics and overview)

---

## 🎯 Development Workflow

### Khi tạo feature mới:

1. **Tạo service** (`services/{feature}Service.js`)
2. **Tạo custom hook** (`hooks/use{Feature}.js`)
3. **Tạo components** (`components/{Feature}Card.jsx`)
4. **Tạo pages** (`pages/{Feature}Page.jsx`)
5. **Thêm routes** (`routes/index.jsx`)
6. **Viết tests** (`__tests__/{feature}.test.js`)

### Khi gọi API:

1. **Kiểm tra endpoint** trong backend instructions
2. **Kiểm tra response format** (BaseResponse)
3. **Xử lý error** properly
4. **Thêm loading state**
5. **Show toast notification**

---

## 🆘 Common Issues & Solutions

### Issue 1: Token hết hạn (401 Unauthorized)

**Solution**: Đã có auto-refresh token trong `apiClient.js` interceptor

### Issue 2: CORS Error

**Solution**: Backend phải enable CORS cho origin của frontend
```java
// Backend SecurityConfig.java
@Bean
CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.addAllowedOrigin("http://localhost:5173"); // Vite default port
    config.addAllowedMethod("*");
    config.addAllowedHeader("*");
    config.setAllowCredentials(true);
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}
```

### Issue 3: BaseResponse không có data

**Solution**: Backend luôn trả về `{ code: 1, data: {...}, message: "..." }`
- Check `code === 1` trước khi access `data`

---

## ✅ Definition of Done

Một feature được coi là hoàn thành khi:

- [ ] Code tuân thủ naming conventions
- [ ] API integration hoạt động đúng
- [ ] Error handling đầy đủ
- [ ] Loading states được hiển thị
- [ ] Toast notifications cho user actions
- [ ] Responsive trên mobile/tablet
- [ ] Code được review
- [ ] Tests pass (nếu có)
- [ ] Documentation cập nhật

---

## 📞 Support & Resources

- **Backend API Docs**: `/Users/a/Documents/backend_delivery/.github/copilot-instructions.md`
- **Postman Collection**: (Tạo collection từ endpoints trên)
- **Design System**: (Link to Figma/Design file)

---

**Happy Coding! 🚀**
