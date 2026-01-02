/**
 * Local Storage Service
 * Quản lý việc lưu trữ và truy xuất dữ liệu từ localStorage
 */

import { STORAGE_KEYS } from '@/utils/constants';

export const TokenStorage = {
  /**
   * Lưu access token
   */
  setAccessToken(token) {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    }
  },

  /**
   * Lấy access token
   */
  getAccessToken() {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  /**
   * Lưu refresh token
   */
  setRefreshToken(token) {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
    }
  },

  /**
   * Lấy refresh token
   */
  getRefreshToken() {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  /**
   * Lưu thông tin user
   */
  setUserInfo(userInfo) {
    if (userInfo) {
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));
    }
  },

  /**
   * Lấy thông tin user
   */
  getUserInfo() {
    const userInfo = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    return userInfo ? JSON.parse(userInfo) : null;
  },

  /**
   * Xóa tất cả tokens và user info (khi logout)
   */
  clearAll() {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_INFO);
  },

  /**
   * Kiểm tra có token hay không
   */
  hasToken() {
    return !!this.getAccessToken();
  },
};

export default TokenStorage;
