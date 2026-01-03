# 🔄 Navigation Logic Refactoring

## ✅ Đã chuyển logic điều hướng từ Hook sang UI Components

### 🎯 Nguyên tắc thiết kế mới:

**Hook chỉ xử lý:**
- ✅ Authentication state (user, loading, error)
- ✅ API calls (login, logout, register)
- ✅ Return results

**UI Component xử lý:**
- ✅ Navigation/Redirect logic
- ✅ Conditional routing
- ✅ User experience flow

---

## 📝 Changes Made

### 1. **useAuth.jsx** - Removed Navigation

#### ❌ Before (Hook controls navigation):
```jsx
const login = async (credentials, options = {}) => {
  const result = await authService.login(credentials);
  setUser(result.user);
  
  // ❌ Hook tự động navigate
  if (result.user.role === 'ADMIN') {
    navigate('/admin/dashboard');
  } else {
    navigate('/restaurant/dashboard');
  }
  
  return { success: true, data: result };
};
```

#### ✅ After (Hook only returns result):
```jsx
const login = async (credentials) => {
  const result = await authService.login(credentials);
  setUser(result.user);
  
  // ✅ Chỉ trả về kết quả, KHÔNG navigate
  return { 
    success: true, 
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    }
  };
};
```

**Removed:**
- ❌ `useNavigate()` import
- ❌ `navigate` dependency
- ❌ Navigation logic trong hook
- ❌ Options parameter (redirectTo, skipRedirect)

---

### 2. **LoginPageV2.jsx** - Component Handles Navigation

#### ✅ New Pattern:
```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  
  const result = await login({
    ...formData,
    role: 'SHOP_OWNER',
  });
  
  // ✅ UI component quyết định navigation
  if (result.success) {
    if (result.data.user.role === 'SHOP_OWNER') {
      navigate('/restaurant/dashboard');
    } else {
      navigate('/dashboard');
    }
  } else {
    setErrors({ general: result.error });
  }
};
```

---

### 3. **AdminLoginPage.jsx** - Component Handles Navigation

#### ✅ New Pattern:
```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  
  const result = await login({
    ...formData,
    role: 'ADMIN',
  });
  
  // ✅ UI component quyết định navigation
  if (result.success) {
    navigate('/admin/dashboard');
  } else {
    setErrors({ general: result.error });
  }
};
```

---

## 🎁 Benefits (Lợi ích)

### 1. **Separation of Concerns**
- ✅ Hook: Pure authentication logic
- ✅ Component: UI & navigation logic
- ✅ Clear responsibility boundaries

### 2. **Flexibility**
```jsx
// Component có thể quyết định navigation phức tạp
if (result.success) {
  const { user, isFirstLogin, needsSetup } = result.data;
  
  if (isFirstLogin) {
    navigate('/onboarding');
  } else if (needsSetup) {
    navigate('/setup-profile');
  } else if (user.role === 'ADMIN') {
    navigate('/admin/dashboard');
  } else {
    navigate('/restaurant/dashboard');
  }
}
```

### 3. **Testability**
```jsx
// Hook test: Không cần mock navigate
test('login should return success result', async () => {
  const result = await login(credentials);
  expect(result.success).toBe(true);
  expect(result.data.user).toBeDefined();
});

// Component test: Chỉ test navigation logic
test('should navigate to dashboard on success', async () => {
  const { result } = renderHook(() => useAuth());
  await result.current.login(credentials);
  expect(mockNavigate).toHaveBeenCalledWith('/restaurant/dashboard');
});
```

### 4. **Reusability**
```jsx
// Dùng chung hook cho nhiều scenarios khác nhau

// Login Modal (no redirect)
const LoginModal = () => {
  const result = await login(credentials);
  if (result.success) {
    closeModal(); // ✅ Stay on page
  }
};

// Login Page (redirect)
const LoginPage = () => {
  const result = await login(credentials);
  if (result.success) {
    navigate('/dashboard'); // ✅ Navigate away
  }
};

// Cart Login (redirect to checkout)
const CartLogin = () => {
  const result = await login(credentials);
  if (result.success) {
    navigate('/checkout'); // ✅ Custom redirect
  }
};
```

---

## 📊 API Changes

### Login API:

**Before:**
```typescript
login(credentials, options?) => Promise<Result>
// options: { redirectTo?, skipRedirect? }
```

**After:**
```typescript
login(credentials) => Promise<Result>
// No options, component decides navigation
```

### Result Format:

```typescript
// Success
{
  success: true,
  data: {
    user: { authId, email, role },
    accessToken: string,
    refreshToken: string,
  }
}

// Error
{
  success: false,
  error: string
}
```

---

## 🎓 Usage Patterns

### Pattern 1: Simple Login
```jsx
const result = await login(credentials);
if (result.success) {
  navigate('/dashboard');
}
```

### Pattern 2: Role-Based Routing
```jsx
const result = await login(credentials);
if (result.success) {
  const { role } = result.data.user;
  
  switch (role) {
    case 'ADMIN':
      navigate('/admin/dashboard');
      break;
    case 'SHOP_OWNER':
      navigate('/restaurant/dashboard');
      break;
    default:
      navigate('/');
  }
}
```

### Pattern 3: Conditional Navigation
```jsx
const result = await login(credentials);
if (result.success) {
  // Check if user came from a specific page
  const from = location.state?.from?.pathname;
  
  if (from) {
    navigate(from); // Return to previous page
  } else {
    navigate('/dashboard'); // Default
  }
}
```

### Pattern 4: Multi-Step Flow
```jsx
const result = await login(credentials);
if (result.success) {
  if (!result.data.user.emailVerified) {
    navigate('/verify-email');
  } else if (!result.data.user.profileCompleted) {
    navigate('/complete-profile');
  } else {
    navigate('/dashboard');
  }
}
```

---

## 📋 Migration Checklist

✅ **useAuth.jsx**
- Removed `useNavigate()` hook
- Removed navigation logic
- Removed `options` parameter
- Return full result object

✅ **LoginPageV2.jsx**
- Added navigation logic in component
- Handle success/error scenarios
- Navigate based on role

✅ **AdminLoginPage.jsx**
- Added navigation logic in component
- Handle success/error scenarios
- Navigate to admin dashboard

✅ **copilot-instructions.md**
- Updated API documentation
- Added usage example
- Clarified responsibility

---

## 🎯 Design Philosophy

**Before:**
```
Hook (Smart) → Controls everything
Component (Dumb) → Just UI
```

**After:**
```
Hook (Service) → Pure auth logic
Component (Smart) → Controls flow & navigation
```

**Reason:**
- Navigation is UI concern, not business logic
- Different UI contexts need different navigation
- Easier to test and maintain
- Better separation of concerns

---

**Status**: ✅ Navigation logic successfully moved to UI components!  
**Pattern**: Hook returns result → Component decides navigation  
**Benefit**: More flexible, testable, and maintainable
