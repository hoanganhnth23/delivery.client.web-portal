# 🚀 DeliveryVN Web - Copilot Instructions

## 📋 Tech Stack
- **Stack**: React 19 + Vite 6 + TypeScript + Tailwind CSS (CDN)

## 🏗️ Structure
```
src/
├── types/            # TypeScript type definitions
│   └── api.types.ts  # API interfaces & types
├── modules/          # Feature modules
│   ├── auth/         # Login, Register, useAuth hook
│   ├── restaurant/   # Restaurant CRUD
│   │   ├── services/ # API calls (.ts)
│   │   ├── hooks/    # State management (.tsx)
│   │   ├── pages/    # UI Pages
│   │   └── components/ # Reusable components
│   └── admin/        # Admin dashboard
├── services/
│   ├── api/          # API client & endpoints (.ts)
│   └── storage/      # localStorage service (.ts)
├── routes/           # React Router config
├── utils/            # Constants, helpers (.ts)
├── main.tsx          # App entry point
└── App.tsx           # Main App component
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
- File Extensions: Use `.tsx` for React components, `.ts` for utilities/services
- Types: Always use TypeScript interfaces/types, never `any`
- Documentation: DO NOT create `.md` files (README, SUMMARY, ARCHITECTURE, etc.) unless explicitly requested

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

## 3. Type Safety with TypeScript
- **NO `any` types:** Always use SPECIFIC types from `src/types/api.types.ts`
- **Import types:** Use `import type { TypeName } from '@/types/api.types'`
- **Type annotations:** All function parameters, return values, and state must have explicit types
- **Generic types:** Use specific response types (e.g., `RestaurantResponse`, `MenuItemListResponse`)

### Type Examples:
```typescript
// Import types
import type { Restaurant, RestaurantActionResult, CreateRestaurantRequest } from '@/types/api.types';

// State with types
const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);

// Function with types
const createRestaurant = useCallback(async (
  data: CreateRestaurantRequest,
  options: ActionOptions = {}
): Promise<RestaurantActionResult> => {
  // ...
}, []);
```

## 4. Code Skeleton
```typescript
import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import type { EntityName, EntityActionResult, CreateEntityRequest } from '@/types/api.types';

interface MyContextValue {
  // States
  data: EntityName[];
  loading: boolean;
  error: string | null;
  
  // Actions
  action: (params: CreateEntityRequest, options?: ActionOptions) => Promise<EntityActionResult>;
}

interface ActionOptions {
  skipRedirect?: boolean;
}

interface MyProviderProps {
  children: ReactNode;
}

const MyContext = createContext<MyContextValue | null>(null);

export const MyProvider = ({ children }: MyProviderProps) => {
  // States with types
  const [data, setData] = useState<EntityName[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Actions wrapped in useCallback with return types
  const action = useCallback(async (
    params: CreateEntityRequest,
    options: ActionOptions = {}
  ): Promise<EntityActionResult> => {
    try {
      setLoading(true);
      // ... async logic ...
      
      // Navigation logic (Hybrid)
      if (!options.skipRedirect) {
         // navigate(...)
      }
      
      return { success: true, data: result };
    } catch (err) {
      return { success: false, message: (err as Error).message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Context Value wrapped in useMemo (CRITICAL)
  const value = useMemo<MyContextValue>(() => ({
    data, loading, error, action
  }), [data, loading, error, action]);

  return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
};

export const useMyHook = (): MyContextValue => {
  const context = useContext(MyContext);
  if (!context) throw new Error('useMyHook must be used within MyProvider');
  return context;
};
```

## 5. Type Definitions Location
- All API types MUST be defined in `src/types/api.types.ts`
- Use specific types for different response patterns:
  - `EntityResponse` for single entity
  - `EntityListResponse` for array of entities
  - `EntityActionResult` for hook action results
  - `DeleteResponse` / `DeleteActionResult` for delete operations

**Happy Coding! 🚀**
