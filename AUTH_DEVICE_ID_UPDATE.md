# 🔐 Authentication Update - Device ID & Role-based Login

## ✅ Changes Made

### 1. **authService.js** - Updated Login Logic

#### Added Device ID Support:
```javascript
// Backend request bây giờ gửm:
{
  email: "user@example.com",
  password: "password123",
  role: "SHOP_OWNER" | "ADMIN",
  deviceType: "WEB" | "MOBILE" | "TABLET",
  deviceId: "123456789" // Auto-generated từ browser fingerprint
}
```

#### New Methods:
- `getOrCreateDeviceId()` - Tạo unique device ID từ browser fingerprint
- `hashCode(str)` - Hash function để tạo device ID

#### Device ID Generation:
```javascript
// Browser fingerprint bao gồm:
- userAgent
- screenResolution (e.g. 1920x1080)
- timezone (e.g. Asia/Ho_Chi_Minh)
- language (e.g. en-US)
- platform (e.g. MacIntel)

// Saved in localStorage with key 'deviceId'
```

---

### 2. **Two Separate Login Pages**

#### **LoginPageV2.jsx** (Shop Owner Login)
- **Role**: `SHOP_OWNER`
- **URL**: `/login`
- **Color**: ShopeeFood Orange (#f49d25)
- **Target**: Chủ nhà hàng
- **Redirect**: `/dashboard` hoặc `/restaurant/dashboard`

#### **AdminLoginPage.jsx** (Admin Login) ✅ NEW
- **Role**: `ADMIN`
- **URL**: `/admin/login`
- **Color**: Red (#dc2626)
- **Target**: Admin hệ thống
- **Redirect**: `/admin/dashboard`
- **Features**: 
  - Security notice warning
  - Admin panel icon
  - Link to Shop Owner login
  - Red color scheme

---

### 3. **useAuth Hook** - Updated Login Function

```javascript
// Old signature:
login(credentials)

// New signature:
login(credentials, options = {})

// credentials MUST include role:
{
  email: "user@example.com",
  password: "password123",
  role: "SHOP_OWNER" | "ADMIN", // REQUIRED!
}

// options (optional):
{
  redirectTo: "/custom/path" // Override default redirect
}
```

#### Role-based Redirect Logic:
```javascript
if (options.redirectTo) {
  navigate(options.redirectTo);
} else if (user.role === 'ADMIN') {
  navigate('/admin/dashboard');
} else if (user.role === 'SHOP_OWNER') {
  navigate('/dashboard');
} else {
  navigate('/restaurants');
}
```

---

### 4. **Updated Routes**

#### App.jsx:
```jsx
// Shop Owner Login
<Route path="/login" element={<LoginPage />} />

// Admin Login (NEW)
<Route path="/admin/login" element={<AdminLoginPage />} />
```

#### constants.js:
```javascript
export const ROUTES = {
  LOGIN: '/login',
  ADMIN_LOGIN: '/admin/login', // NEW
  ADMIN_DASHBOARD: '/admin/dashboard', // Changed from '/admin'
  // ...
}
```

---

## 📝 Usage Examples

### Example 1: Shop Owner Login
```javascript
// LoginPageV2.jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  
  const credentials = {
    email: 'shopowner@example.com',
    password: 'password123',
    role: 'SHOP_OWNER', // ✅ Hardcoded for Shop Owner page
  };
  
  await login(credentials);
  // Auto redirect to /dashboard
};
```

### Example 2: Admin Login
```javascript
// AdminLoginPage.jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  
  const credentials = {
    email: 'admin@example.com',
    password: 'admin123',
    role: 'ADMIN', // ✅ Hardcoded for Admin page
  };
  
  await login(credentials);
  // Auto redirect to /admin/dashboard
};
```

### Example 3: Custom Redirect
```javascript
const credentials = {
  email: 'user@example.com',
  password: 'password123',
  role: 'SHOP_OWNER',
};

await login(credentials, { redirectTo: '/custom/path' });
```

---

## 🔒 Security Features

### Device ID Tracking:
- ✅ Unique ID cho mỗi browser/device
- ✅ Persistent qua localStorage
- ✅ Backend có thể track sessions theo device
- ✅ Cho phép logout all devices

### Role Separation:
- ✅ Admin và Shop Owner có login pages riêng
- ✅ Không thể login sai role (backend sẽ reject)
- ✅ UI khác biệt cho từng role (màu đỏ vs màu cam)

### Device Fingerprint:
```javascript
// Device ID dựa trên:
userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)..."
screenResolution: "1920x1080"
timezone: "Asia/Ho_Chi_Minh"
language: "en-US"
platform: "MacIntel"

// Hash thành number: 1234567890
```

---

## 🎨 UI Differences

### Shop Owner Login (/login):
- 🟠 Orange theme (#f49d25)
- 🏪 Restaurant icon
- 📝 "Merchant Panel" branding
- 🔗 Link to register page

### Admin Login (/admin/login):
- 🔴 Red theme (#dc2626)
- 👨‍💼 Admin panel icon
- 🔒 Security warning notice
- 🔗 Link to Shop Owner login
- ⚠️ "Restricted access" message

---

## 🔄 Migration Checklist

✅ **authService.js**
- Added `role` parameter to login
- Added `deviceId` parameter to login
- Added `getOrCreateDeviceId()` method
- Added `hashCode()` method

✅ **useAuth.jsx**
- Updated `login()` signature with `options` parameter
- Added role validation check
- Updated redirect logic

✅ **LoginPageV2.jsx**
- Hardcoded `role: 'SHOP_OWNER'` in credentials
- Removed unnecessary `navigate('/dashboard')` (useAuth handles it)

✅ **AdminLoginPage.jsx** (NEW)
- Created new component
- Hardcoded `role: 'ADMIN'` in credentials
- Red color scheme
- Security notice

✅ **App.jsx**
- Added `/admin/login` route
- Imported `AdminLoginPage`

✅ **constants.js**
- Added `ADMIN_LOGIN: '/admin/login'`
- Fixed `ADMIN_DASHBOARD: '/admin/dashboard'`

---

## 🚀 Testing

### Test Shop Owner Login:
1. Go to: http://localhost:5173/login
2. Enter Shop Owner credentials
3. Check role sent: `SHOP_OWNER`
4. Check deviceId in localStorage
5. Should redirect to `/dashboard`

### Test Admin Login:
1. Go to: http://localhost:5173/admin/login
2. Enter Admin credentials
3. Check role sent: `ADMIN`
4. Check deviceId in localStorage
5. Should redirect to `/admin/dashboard`

### Test Device ID:
```javascript
// Open console and check:
localStorage.getItem('deviceId')
// Should return number like: "1234567890"

// Device ID should persist across page reloads
```

---

## 📱 Backend Integration

### Backend Expected Request:
```json
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "role": "SHOP_OWNER",
  "deviceType": "WEB",
  "deviceId": "1234567890"
}
```

### Backend Expected Response:
```json
{
  "statusCode": 1,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
  }
}
```

---

## 🎯 Next Steps

### Recommended:
1. ✅ Test both login pages thoroughly
2. ⏳ Add device management page (view/logout all sessions)
3. ⏳ Add "Remember this device" checkbox
4. ⏳ Add 2FA support for Admin login
5. ⏳ Add IP tracking for security audit

### Optional:
6. Add device name customization
7. Add push notification support per device
8. Add suspicious login detection
9. Add login history page

---

**Status**: ✅ Login system updated with deviceId and role-based separation!  
**URLs**: 
- Shop Owner: http://localhost:5173/login
- Admin: http://localhost:5173/admin/login
