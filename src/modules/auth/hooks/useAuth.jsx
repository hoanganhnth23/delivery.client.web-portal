/**
 * useAuth Hook
 * Custom hook để quản lý authentication state và actions
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { USER_ROLES, ROUTES } from '@/utils/constants';

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
  const navigate = useNavigate();

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
   * @param {Object} credentials - { email, password, role }
   * @param {Object} options - { redirectTo } - Custom redirect path
   */
  const login = useCallback(
    async (credentials, options = {}) => {
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

        // Custom redirect hoặc redirect dựa vào role
        if (options.redirectTo) {
          navigate(options.redirectTo);
        } else if (result.user.role === USER_ROLES.ADMIN) {
          // Admin → Admin Dashboard
          navigate(ROUTES.ADMIN_DASHBOARD);
        } else if (result.user.role === USER_ROLES.SHOP_OWNER) {
          // Shop Owner → Restaurant Management Dashboard
          navigate('/restaurant/dashboard');
        } else {
          navigate(ROUTES.RESTAURANTS);
        }

        return { success: true, data: result };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

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
   */
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
      navigate(ROUTES.LOGIN);
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

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

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
    hasRole,
  };

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
