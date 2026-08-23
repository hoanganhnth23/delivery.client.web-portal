/**
 * useAuth Hook
 * Custom hook để quản lý authentication state và actions
 * Navigation logic được xử lý bởi UI components, không phải hook
 */

import { useState, useEffect, useCallback, useMemo, createContext, useContext, ReactNode } from 'react';
import type { User } from '@/types/api.types';
import { useAppDependencies } from '@/app/dependencies';

// ============================================
// LOCAL TYPES
// ============================================

interface LoginCredentials {
  email: string;
  password: string;
  role: string;
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
  logout: () => Promise<ActionResult>;
  retrySession: () => Promise<void>;
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
  const { auth } = useAppDependencies();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const restoreSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!auth.hasStoredSession() && !auth.isAuthenticated()) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const freshUser = await auth.restoreSession();
      setUser(freshUser);
    } catch (err) {
      // The API client clears the session for an unrecoverable 401/refresh
      // failure. Network and 5xx failures keep the credentials available for
      // a later retry and must not log the user out.
      if (!auth.hasStoredSession() && !auth.isAuthenticated()) {
        setUser(null);
      } else {
        setUser(null);
        setError((err as Error).message || 'Không thể khôi phục phiên đăng nhập');
      }
    } finally {
      setLoading(false);
    }
  }, [auth]);

  // Bootstrap through restoreSession so an expired access token can use the
  // rotated refresh token before the portal decides that the user is logged
  // out.
  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

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

      // 1. Đăng nhập - Lưu tokens vào localStorage
      const result = await auth.login(credentials);
      
      // 2. Get profile để lấy thông tin user đầy đủ từ backend
      const freshUser = await auth.getProfile();
      setUser(freshUser); // Set user với data đầy đủ từ getProfile

      // ✅ Chỉ trả về kết quả, KHÔNG navigate
      return { 
        success: true, 
        data: {
          user: freshUser, // Trả về user data đầy đủ
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        }
      };
    } catch (err) {
      await auth.logout();
      setUser(null);
      const errorMessage = (err as Error).message || 'Login failed';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [auth]);

  /**
   * Đăng xuất
   * Hook CHỈ xử lý logout logic, UI component tự navigate
   */
  const logout = useCallback(async (): Promise<ActionResult> => {
    try {
      setLoading(true);
      await auth.logout();
      setUser(null);
      // ✅ KHÔNG navigate, component tự xử lý
      return { success: true };
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [auth]);

  /**
   * Kiểm tra user có role không
   */
  const hasRole = useCallback(
    (allowedRoles: string | string[]) => {
      return auth.hasRole(allowedRoles);
    },
    [auth]
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
      logout,
      retrySession: restoreSession,
      hasRole,
    }),
    [user, loading, error, login, logout, restoreSession, hasRole]
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
