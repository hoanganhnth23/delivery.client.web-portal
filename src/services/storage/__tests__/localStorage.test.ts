import { describe, expect, it } from 'vitest';
import TokenStorage from '../localStorage';
import { STORAGE_KEYS, USER_ROLES } from '@/utils/constants';

const user = { id: 4, authId: 44, email: 'user@test', name: 'User', role: USER_ROLES.USER };

describe('TokenStorage', () => {
  it('stores and validates user information', () => {
    TokenStorage.setUserInfo(user);
    expect(TokenStorage.getUserInfo()).toEqual(user);
    expect(TokenStorage.hasToken()).toBe(true);
    TokenStorage.setUserInfo(null as never);
    expect(TokenStorage.getUserInfo()).toEqual(user);
  });

  it('removes malformed stored users', () => {
    localStorage.setItem(STORAGE_KEYS.USER_INFO, '{bad json');
    expect(TokenStorage.getUserInfo()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.USER_INFO)).toBeNull();
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify({ id: 1, email: 'x' }));
    expect(TokenStorage.getUserInfo()).toBeNull();
  });

  it('manages restaurant selection and clears all credentials', () => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'legacy');
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'legacy-refresh');
    TokenStorage.setCurrentRestaurantId(8);
    expect(TokenStorage.getCurrentRestaurantId()).toBe(8);
    TokenStorage.setCurrentRestaurantId(0);
    expect(TokenStorage.getCurrentRestaurantId()).toBe(8);
    TokenStorage.clearRestaurantId();
    expect(TokenStorage.getCurrentRestaurantId()).toBeNull();
    TokenStorage.setUserInfo(user);
    TokenStorage.clearAll();
    expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBeNull();
    expect(TokenStorage.hasToken()).toBe(false);
  });
});
