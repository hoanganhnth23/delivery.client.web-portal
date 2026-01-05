/**
 * Local Storage Service
 * Quản lý việc lưu trữ và truy xuất dữ liệu từ localStorage
 */

import { STORAGE_KEYS } from '@/utils/constants';
import type { User } from '@/types/api.types';

export const TokenStorage = {
  /**
   * Lưu access token
   */
  setAccessToken(token: string): void {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    }
  },

  /**
   * Lấy access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  /**
   * Lưu refresh token
   */
  setRefreshToken(token: string): void {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
    }
  },

  /**
   * Lấy refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  /**
   * Lưu thông tin user
   */
  setUserInfo(userInfo: User): void {
    if (userInfo) {
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));
    }
  },

  /**
   * Lấy thông tin user
   */
  getUserInfo(): User | null {
    const userInfo = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    return userInfo ? JSON.parse(userInfo) : null;
  },

  /**
   * Xóa tất cả tokens và user info (khi logout)
   */
  clearAll(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_INFO);
  },

  /**
   * Kiểm tra có token hay không
   */
  hasToken(): boolean {
    return !!this.getAccessToken();
  },
};

export default TokenStorage;
