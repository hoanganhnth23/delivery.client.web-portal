# 🚀 DeliveryVN Web - Copilot Instructions

## 📋 Tech Stack
- **Stack**: React 19 + Vite 6 + Tailwind CSS (CDN)

## 🏗️ Structure
```
src/
├── modules/           # Feature modules
│   ├── auth/         # Login, Register, useAuth hook
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

## Coding Conventions
- Naming: Variables (camelCase), Components (PascalCase), Constants (UPPER_CASE)
- Comments: JSDoc for functions
- Error Handling: Always handle async/await with try-catch
- Performance: Use `useMemo`, `useCallback` for expensive operations

## Response Format (BaseResponse)
Backend **BẮT BUỘC** trả về:
```javascript
{
  "status": 1,           // 1 = success, 0 = error
  "data": {...},         // Response data
  "message": "Success" 
}
```

# REACT CONTEXT & HOOK PATTERN

## 1. Core Principles
- **Architecture:** Use **Context API** wrapped in a **Provider** and exposed via a **Custom Hook**.
- **Performance:** MANDATORY use of `useMemo` for the Context `value` and `useCallback` for all action functions to prevent unnecessary re-renders.
- **Fail-fast:** The custom hook must throw an error if used outside its Provider.
- **State:** Manage at least 3 states: `data` (user), `loading`, and `error`.

## 2. Navigation Logic
- **Hybrid Approach:** Implement default navigation logic inside the hook but allow overrides via an `options` object (e.g., `{ skipRedirect: true }`).

## 3. Code Skeleton
```javascript
import { createContext, useContext, useState, useMemo, useCallback } from 'react';

const MyContext = createContext(null);

export const MyProvider = ({ children }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Actions wrapped in useCallback
  const action = useCallback(async (params, options = {}) => {
    try {
      setLoading(true);
      // ... async logic ...
      
      // Navigation logic (Hybrid)
      if (!options.skipRedirect) {
         // navigate(...)
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Context Value wrapped in useMemo (CRITICAL)
  const value = useMemo(() => ({
    data, loading, action
  }), [data, loading, action]);

  return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
};

export const useMyHook = () => {
  const context = useContext(MyContext);
  if (!context) throw new Error('useMyHook must be used within MyProvider');
  return context;
};

**Happy Coding! 🚀**
