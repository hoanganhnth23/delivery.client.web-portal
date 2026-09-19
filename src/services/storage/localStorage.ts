/**
 * Local Storage Service
 * Quản lý việc lưu trữ và truy xuất dữ liệu từ localStorage
 */

import { STORAGE_KEYS } from '@/utils/constants';
import type { User } from '@/types/api.types';

export const TokenStorage = {
  /** Remove credentials written by pre-BFF releases; they are never imported. */
  clearLegacyCredentials(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
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
    if (!userInfo) return null;

    try {
      const parsed = JSON.parse(userInfo) as Partial<User>;
      if (
        typeof parsed.id !== 'number' ||
        typeof parsed.email !== 'string' ||
        typeof parsed.name !== 'string' ||
        typeof parsed.role !== 'string'
      ) {
        throw new Error('Stored user info has an invalid shape');
      }
      return parsed as User;
    } catch {
      localStorage.removeItem(STORAGE_KEYS.USER_INFO);
      return null;
    }
  },

  /**
   * Xóa tất cả tokens và user info (khi logout)
   */
  clearAll(): void {
    this.clearLegacyCredentials();
    localStorage.removeItem(STORAGE_KEYS.USER_INFO);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_RESTAURANT_ID);
  },

  /**
   * Kiểm tra có token hay không
   */
  hasToken(): boolean {
    return this.getUserInfo() !== null;
  },

  /**
   * Lưu restaurant ID hiện tại
   */
  setCurrentRestaurantId(restaurantId: number): void {
    if (restaurantId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_RESTAURANT_ID, restaurantId.toString());
    }
  },

  /**
   * Lấy restaurant ID hiện tại
   */
  getCurrentRestaurantId(): number | null {
    const id = localStorage.getItem(STORAGE_KEYS.CURRENT_RESTAURANT_ID);
    return id ? parseInt(id, 10) : null;
  },

  /**
   * Xóa restaurant ID
   */
  clearRestaurantId(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_RESTAURANT_ID);
  },
};

export default TokenStorage;
