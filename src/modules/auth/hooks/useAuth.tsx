/**
 * useAuth Hook
 * Custom hook để quản lý authentication state và actions
 * Navigation logic được xử lý bởi UI components, không phải hook
 */

import { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { authService } from '../services/authService';
import { USER_ROLES } from '@/utils/constants';

// Create Auth Context
const AuthContext = createContext(null);

/**
 * Auth Provider Component
 * Wrap ứng dụng với provider này để share auth state
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        setError(err.message);
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
   * 
   * @param {Object} credentials - { email, password, role }
   * @returns {Promise<Object>} - { success, data: { user, accessToken, refreshToken }, error }
   */
  const login = useCallback(async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      // Credentials phải có role (SHOP_OWNER hoặc ADMIN)
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
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      console.error('Login error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Đăng ký
   * @param {Object} data - { email, password, role }
   */
  const register = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);

      await authService.register(data);

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Đăng xuất
   * Hook CHỈ xử lý logout logic, UI component tự navigate
   */
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
      // ✅ KHÔNG navigate, component tự xử lý
      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh user info
   */
  const refreshUser = useCallback(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, []);

  /**
   * Kiểm tra user có role không
   */
  const hasRole = useCallback(
    (allowedRoles) => {
      return authService.hasRole(allowedRoles);
    },
    [user]
  );

  // ✅ PERFORMANCE OPTIMIZATION: Memoize context value
  // Tránh re-render không cần thiết cho các components con
  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshUser,
      hasRole,
    }),
    [user, loading, error, login, register, logout, refreshUser, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth Hook
 * Sử dụng trong components để access auth state và functions
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};

export default useAuth;
