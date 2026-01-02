# 🚀 DeliveryVN Web - Copilot Instructions

## 📋 Project Info
- **Stack**: React 19 + Vite 6 + Tailwind CSS (CDN)
- **Backend**: Microservices via API Gateway (port 8080)
- **Features**: Auth, Restaurant Management, Menu Management, Dashboard

## 🏗️ Structure
```
src/
├── modules/           # Feature modules
│   ├── auth/         # Login, Register
│   ├── restaurant/   # Restaurant CRUD
│   ├── menu/         # Menu items CRUD
│   └── admin/        # Admin dashboard
├── services/api/     # API client & endpoints
├── routes/           # React Router config
├── utils/            # Constants, helpers
└── App.jsx
```

## 🎨 Design System
**ShopeeFood Orange Theme**:
- Primary: `#f49d25`
- Hover: `#e38b14`
- Font: Plus Jakarta Sans
- Icons: Material Symbols Outlined
- Tailwind via CDN in `index.html`

## 🔌 Backend API
```javascript
// src/services/api/apiClient.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
```

### API Endpoints
```javascript
// src/services/api/endpoints.js
export const API_ENDPOINTS = {
  // Auth Service (port 8081)
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    REFRESH_TOKEN: '/api/auth/refresh-token',
    LOGOUT: '/api/auth/logout',
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
};
```

### Response Format (BaseResponse)
Backend **BẮT BUỘC** trả về:
```javascript
{
  "code": 1,           // 1 = success, 0 = error
  "data": {...},       // Response data
  "message": "Success" // Optional message
}
```

## 🔐 Authentication

### JWT Token Management
```javascript
// Login response
{
  "code": 1,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1Ni...",
    "refreshToken": "uuid-string",
    "expiresIn": 1800  // 30 minutes
  }
}

// Token storage
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

### HTTP Headers
Backend yêu cầu **Authorization header** cho mọi request (trừ /api/auth/**):
```javascript
// apiClient.js - Auto add token
apiClient.interceptors.request.use((config) => {
  const token = TokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### User Roles
```javascript
export const USER_ROLES = {
  SHOP_OWNER: 'SHOP_OWNER',  // Chủ nhà hàng
  ADMIN: 'ADMIN',             // Quản trị viên
};
```

## 📦 Module Examples

### Auth Module
```javascript
// src/modules/auth/services/authService.js
export const authService = {
  async login(credentials) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
      email: credentials.email,
      password: credentials.password,
      deviceType: 'WEB',
    });
    
    const { accessToken, refreshToken } = response.data.data;
    TokenStorage.setAccessToken(accessToken);
    TokenStorage.setRefreshToken(refreshToken);
    
    return response.data.data;
  },

  async register(data) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, {
      email: data.email,
      password: data.password,
      role: data.role || 'SHOP_OWNER',
    });
    return response.data.data;
  },

  async logout() {
    const refreshToken = TokenStorage.getRefreshToken();
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken });
    TokenStorage.clearTokens();
  },
};
```

### Restaurant Module
```javascript
// src/modules/restaurant/services/restaurantService.js
export const restaurantService = {
  async createRestaurant(data) {
    const response = await apiClient.post(API_ENDPOINTS.RESTAURANT.CREATE, data);
    return response.data.data;
  },

  async getAllRestaurants() {
    const response = await apiClient.get(API_ENDPOINTS.RESTAURANT.GET_ALL);
    return response.data.data;
  },

  async updateRestaurant(id, data) {
    const response = await apiClient.put(API_ENDPOINTS.RESTAURANT.UPDATE(id), data);
    return response.data.data;
  },
};
```

### Custom Hook Example
```javascript
// src/modules/restaurant/hooks/useRestaurant.js
export const useRestaurant = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const data = await restaurantService.getAllRestaurants();
      setRestaurants(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return { restaurants, loading, fetchRestaurants };
};
```

## 🛣️ Routing
```javascript
// src/routes/index.jsx
import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: 'restaurants', element: <RestaurantListPage /> },
      { path: 'restaurants/new', element: <CreateRestaurantPage /> },
      { path: 'restaurants/:id', element: <RestaurantDetailPage /> },
      { path: 'restaurants/:restaurantId/menu', element: <MenuListPage /> },
    ],
  },
]);
```

## 📝 Code Style

### Naming Conventions
```javascript
// ✅ GOOD
export const RestaurantCard = () => {};
const handleSubmit = () => {};
export const API_BASE_URL = 'http://localhost:8080';

// ❌ BAD
export const restaurant_card = () => {};
const HandleSubmit = () => {};
```

### Component Structure
```jsx
export const RestaurantList = ({ onSelect }) => {
  // 1. Hooks (state, effects, custom hooks)
  const [restaurants, setRestaurants] = useState([]);
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
    // ...
  };

  // 5. Early returns
  if (loading) return <LoadingSpinner />;

  // 6. Main render
  return (
    <div>
      {restaurants.map(r => (
        <RestaurantCard key={r.id} restaurant={r} onClick={handleSelect} />
      ))}
    </div>
  );
};
```

### Error Handling
```javascript
// ✅ GOOD
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
```

## ⚡ Performance Tips
- Use `React.lazy()` for code splitting
- Use `useMemo()` for expensive calculations
- Use `useCallback()` for event handlers
- Lazy load images with `loading="lazy"`

## 🧪 Testing
```javascript
// Example test with Vitest
import { describe, it, expect, vi } from 'vitest';
import { restaurantService } from '../restaurantService';

describe('restaurantService', () => {
  it('should fetch all restaurants', async () => {
    const result = await restaurantService.getAllRestaurants();
    expect(result).toBeInstanceOf(Array);
  });
});
```

## 🔧 Environment Variables
```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_NAME=DeliveryVN
```

## 📚 Dependencies
```json
{
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router-dom": "^6.30.1",
    "axios": "^1.6.0"
  }
}
```

---

**Happy Coding! 🚀**
