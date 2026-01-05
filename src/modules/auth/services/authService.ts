/**
 * Authentication Service
 * Xử lý tất cả logic liên quan đến authentication
 */

import apiClient, { handleResponse, handleError } from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/services/api/endpoints';
import { TokenStorage } from '@/services/storage/localStorage';
import { DEVICE_TYPES } from '@/utils/constants';

export const authService = {
  /**
   * Đăng ký tài khoản mới
   * @param {Object} data - { email, password, role }
   * @returns {Promise<Boolean>}
   */
  async register(data) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, {
        email: data.email,
        password: data.password,
        role: data.role || 'SHOP_OWNER', // Default role
      });

      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Đăng nhập
   * Backend request: { email, password, role, deviceType, deviceId }
   * Backend response: { accessToken, refreshToken, expiresIn }
   * 
   * @param {Object} credentials - { email, password, role, deviceType, deviceId }
   * @returns {Promise<Object>}
   */
  async login(credentials) {
    try {
      // Generate unique device ID if not provided
      const deviceId = credentials.deviceId || this.getOrCreateDeviceId();

      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
        email: credentials.email,
        password: credentials.password,
        role: credentials.role || 'SHOP_OWNER', // Role phải được truyền từ login page
        deviceType: credentials.deviceType || DEVICE_TYPES.WEB,
        deviceId: deviceId,
      });

      // Backend trả về: { status: 1, data: { accessToken, refreshToken, authId, email, role } }
      const responseData = handleResponse(response);
      
      // Destructure từ response data
      const { accessToken, refreshToken, authId, email, role } = responseData;

      // Lưu tokens vào localStorage
      TokenStorage.setAccessToken(accessToken);
      TokenStorage.setRefreshToken(refreshToken);

      // Decode JWT để lấy user info (hoặc dùng info từ response)
      const userInfo = {
        authId: authId,
        email: email,
        role: role,
        userId: authId, // authId = userId
      };
      
      TokenStorage.setUserInfo(userInfo);

      return {
        accessToken,
        refreshToken,
        user: userInfo,
      };
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Đăng xuất
   * Backend request: { refreshToken }
   */
  async logout() {
    try {
      const refreshToken = TokenStorage.getRefreshToken();

      if (refreshToken) {
        await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Luôn clear tokens dù API có lỗi hay không
      TokenStorage.clearAll();
    }
  },

  /**
   * Refresh access token
   * Backend request: { refreshToken }
   * Backend response: { accessToken, refreshToken, expiresIn }
   */
  async refreshToken() {
    try {
      const refreshToken = TokenStorage.getRefreshToken();

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = handleResponse(response);

      // Cập nhật tokens
      TokenStorage.setAccessToken(accessToken);
      if (newRefreshToken) {
        TokenStorage.setRefreshToken(newRefreshToken);
      }

      return accessToken;
    } catch (error) {
      // Refresh token thất bại -> clear storage
      TokenStorage.clearAll();
      throw handleError(error);
    }
  },

  /**
   * Lấy danh sách sessions đang hoạt động
   * Yêu cầu: User đã đăng nhập
   */
  async getSessions() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.AUTH.GET_SESSIONS);
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Lấy thông tin account theo ID
   * @param {Number} id - Account ID
   */
  async getAccountById(id) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.AUTH.GET_ACCOUNT_BY_ID(id));
      return handleResponse(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Decode JWT token để lấy user info
   * JWT payload format:
   * {
   *   sub: "email",
   *   userId: 123,
   *   role: "SHOP_OWNER",
   *   iat: timestamp,
   *   exp: timestamp
   * }
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

      const payload = JSON.parse(jsonPayload);

      return {
        email: payload.sub,
        userId: payload.userId,
        role: payload.role,
        iat: payload.iat,
        exp: payload.exp,
      };
    } catch (error) {
      console.error('Token decode error:', error);
      return null;
    }
  },

  /**
   * Kiểm tra user đã login chưa
   */
  isAuthenticated() {
    const token = TokenStorage.getAccessToken();
    if (!token) return false;

    // Kiểm tra token có hết hạn chưa
    const userInfo = TokenStorage.getUserInfo();
    if (!userInfo || !userInfo.exp) return false;

    const now = Math.floor(Date.now() / 1000);
    return userInfo.exp > now;
  },

  /**
   * Lấy thông tin user hiện tại từ localStorage
   */
  getCurrentUser() {
    return TokenStorage.getUserInfo();
  },

  /**
   * Kiểm tra user có role cụ thể không
   * @param {String|Array} allowedRoles - Role hoặc mảng roles cho phép
   */
  hasRole(allowedRoles) {
    const user = this.getCurrentUser();
    if (!user || !user.role) return false;

    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(user.role);
    }

    return user.role === allowedRoles;
  },

  /**
   * Lấy hoặc tạo Device ID
   * Sử dụng fingerprint của browser để tạo unique device ID
   */
  getOrCreateDeviceId() {
    const DEVICE_ID_KEY = 'deviceId';
    
    // Kiểm tra đã có deviceId trong localStorage chưa
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    
    if (!deviceId) {
      // Tạo deviceId mới từ browser fingerprint
      const userAgent = navigator.userAgent;
      const screenResolution = `${window.screen.width}x${window.screen.height}`;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const language = navigator.language;
      const platform = navigator.platform;
      
      // Tạo hash từ các thông tin trên
      const fingerprint = `${userAgent}-${screenResolution}-${timezone}-${language}-${platform}`;
      deviceId = this.hashCode(fingerprint).toString();
      
      // Lưu vào localStorage
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    
    return deviceId;
  },

  /**
   * Hash function đơn giản để tạo device ID
   */
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  },
};

export default authService;
