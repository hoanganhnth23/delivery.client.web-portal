/**
 * useAuth Hook
 * Custom hook để quản lý authentication state và actions
 * Navigation logic được xử lý bởi UI components, không phải hook
 */

import { useState, useEffect, useCallback, useMemo, createContext, useContext, ReactNode } from 'react';
import { authService } from '../services/authService';
import type { User } from '@/types/api.types';

// ============================================
// LOCAL TYPES
// ============================================

interface LoginCredentials {
  email: string;
  password: string;
  role: string;
}

interface RegisterData {
  email: string;
  password: string;
  name?: string;
  role?: 'admin' | 'restaurant' | 'user';
}

interface LoginResult {
  success: boolean;
  data?: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
  message?: string;
}

interface ActionResult {
  success: boolean;
  message?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<LoginResult>;
  register: (data: RegisterData) => Promise<ActionResult>;
  logout: () => Promise<ActionResult>;
  hasRole: (roles: string | string[]) => boolean;
  isAuthenticated: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Create Auth Context
const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Auth Provider Component
 * Wrap ứng dụng với provider này để share auth state
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Khởi tạo: Check user đã login chưa
  useEffect(() => {
    const initAuth = () => {
      try {
        if (authService.isAuthenticated()) {
          const currentUser = authService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Đăng nhập
   * Hook CHỈ xử lý authentication logic, KHÔNG điều hướng
   * UI component sẽ nhận result và tự quyết định navigation
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<LoginResult> => {
    try {
      setLoading(true);
      setError(null);
      
      // Credentials phải có role (RESTAURANT_OWNER hoặc ADMIN)
      if (!credentials.role) {
        throw new Error('Role is required for login');
      }

      console.log("Login credentials:", credentials);
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
    } catch (err) {
      const errorMessage = (err as Error).message || 'Login failed';
      setError(errorMessage);
      console.error('Login error:', err);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Đăng ký
   */
  const register = useCallback(async (data: RegisterData): Promise<ActionResult> => {
    try {
      setLoading(true);
      setError(null);

      await authService.register(data);

      return { success: true };
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Đăng xuất
   * Hook CHỈ xử lý logout logic, UI component tự navigate
   */
  const logout = useCallback(async (): Promise<ActionResult> => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
      // ✅ KHÔNG navigate, component tự xử lý
      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      const message = (err as Error).message;
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Kiểm tra user có role không
   */
  const hasRole = useCallback(
    (allowedRoles: string | string[]) => {
      return authService.hasRole(allowedRoles);
    },
    [user]
  );

  // ✅ PERFORMANCE OPTIMIZATION: Memoize context value
  // Tránh re-render không cần thiết cho các components con
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      hasRole,
    }),
    [user, loading, error, login, register, logout, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth Hook
 * Sử dụng trong components để access auth state và functions
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
