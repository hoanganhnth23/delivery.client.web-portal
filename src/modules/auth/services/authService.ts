/**
 * Authentication Service
 * Xử lý tất cả logic liên quan đến authentication
 */

import apiClient, { handleResponse, handleError } from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/services/api/endpoints';
import { TokenStorage } from '@/services/storage/localStorage';
import { USER_ROLES, type UserRole } from '@/utils/constants';
import type { User } from '@/types/api.types';
import {
  loginWebSession,
  logoutWebSession,
  readWebSession,
} from '@/services/api/webSessionClient';

// ============================================
// LOCAL TYPES (chỉ dùng trong authService)
// ============================================

interface LoginRequest {
  email: string;
  password: string;
  role?: string; // SHOP_OWNER, ADMIN, etc.
}

interface LoginResult {
  user: User;
}

interface UserProfileResponse {
  id?: number;
  userId?: number;
  authId?: number;
  principalId?: number;
  email: string;
  fullName?: string;
  role: string;
}

export interface CustomerRegistrationInput {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
}

export interface CustomerRegistrationResult {
  principalId: number;
  profileCreated: boolean;
  lifecycleStatus?: string;
  registrationHandle?: string;
  expiresAt?: string;
}

export interface RegistrationStatusResult {
  principalId: number;
  status: string;
  nextAction: string;
  profileLinked: boolean;
  expiresAt?: string;
}

interface AuthRegistrationResponse {
  authId: number;
  principalId?: number;
  email: string;
  role: UserRole;
  provisioningToken: string;
  registrationHandle?: string;
  expiresAt?: string;
  lifecycleStatus?: string;
}

interface UserRegistrationResponse {
  id: number;
  authId: number;
  email: string;
  role: UserRole;
  fullName?: string;
}

const isUserRole = (value: unknown): value is UserRole =>
  typeof value === 'string' && Object.values(USER_ROLES).includes(value as UserRole);

const requireNonBlankString = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Backend response is missing a valid ${field}`);
  }
  return value;
};

export const authService = {
  /**
   * Đăng nhập
   * Backend request: { email, password, role, deviceType, deviceId }
   * BFF response contains only safe session identity; bearer tokens stay server-side.
   */
  async login(credentials: LoginRequest & { deviceType?: string; deviceId?: string }): Promise<LoginResult> {
    try {
      const expectedRole = credentials.role || USER_ROLES.RESTAURANT_OWNER;
      const session = await loginWebSession(credentials.email, credentials.password, expectedRole);
      if (!session.authenticated || !Number.isSafeInteger(session.principalId) ||
          session.principalId! <= 0 || !session.email || !isUserRole(session.role) ||
          session.role !== expectedRole) {
        throw new Error('BFF returned an invalid authenticated session');
      }

      const userInfo: User = {
        id: session.principalId!,
        authId: session.principalId!,
        email: session.email,
        name: session.email.split('@')[0],
        role: session.role,
      };
      TokenStorage.setUserInfo(userInfo);
      return { user: userInfo };
    } catch (error) {
      throw handleError(error);
    }
  },

  async registerCustomer(input: CustomerRegistrationInput): Promise<CustomerRegistrationResult> {
    try {
      const authResponse = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, {
        email: input.email,
        password: input.password,
        role: USER_ROLES.USER,
      });
      const registration = handleResponse<AuthRegistrationResponse>(authResponse);
      const principalId = registration.principalId ?? registration.authId;
      if (!Number.isSafeInteger(principalId) || principalId <= 0) {
        throw new Error('Backend registration response is missing a valid principal id');
      }
      if (registration.role !== USER_ROLES.USER) {
        throw new Error('Backend registration returned an unsupported customer role');
      }
      requireNonBlankString(registration.provisioningToken, 'provisioning token');
      if (registration.registrationHandle !== undefined) {
        requireNonBlankString(registration.registrationHandle, 'registration handle');
      }

      // The provisioning token is intentionally used only in this request and
      // is never written to browser storage. Auth/User linkage remains owned by
      // the backend identity workflow.
      const profileResponse = await apiClient.post(API_ENDPOINTS.USER.REGISTER_PROFILE, {
        provisioningToken: registration.provisioningToken,
        fullName: input.fullName?.trim() || undefined,
        phone: input.phone?.trim() || undefined,
      });
      const profile = handleResponse<UserRegistrationResponse>(profileResponse);
      if (profile.role !== USER_ROLES.USER || profile.authId <= 0) {
        throw new Error('Backend profile registration returned an invalid customer identity');
      }

      return {
        principalId,
        profileCreated: true,
        lifecycleStatus: registration.lifecycleStatus,
        registrationHandle: registration.registrationHandle,
        expiresAt: registration.expiresAt,
      };
    } catch (error) {
      throw handleError(error);
    }
  },

  async getRegistrationStatus(handle: string): Promise<RegistrationStatusResult> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.AUTH.REGISTRATION_STATUS(handle));
      const status = handleResponse<RegistrationStatusResult>(response);
      if (!Number.isSafeInteger(status.principalId) || status.principalId <= 0) {
        throw new Error('Backend registration status is missing a valid principal id');
      }
      if (typeof status.status !== 'string' || typeof status.nextAction !== 'string') {
        throw new Error('Backend registration status has an invalid lifecycle shape');
      }
      return status;
    } catch (error) {
      throw handleError(error);
    }
  },

  async requestEmailVerification(email: string): Promise<void> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.REQUEST_EMAIL_VERIFICATION, { email });
      handleResponse<void>(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  async confirmEmailVerification(token: string): Promise<void> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.CONFIRM_EMAIL_VERIFICATION, { token });
      handleResponse<void>(response);
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Đăng xuất
   * BFF revokes the server-side session and refresh token.
   */
  async logout() {
    try {
      await logoutWebSession();
    } catch {
      // Local session cleanup in finally is authoritative for logout.
    } finally {
      // Luôn clear tokens dù API có lỗi hay không
      TokenStorage.clearAll();
    }
  },

  /**
   * Lấy profile của user hiện tại từ backend
   * Endpoint: GET /api/users through the authenticated BFF.
   */
  async getProfile(): Promise<User> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USER.GET_PROFILE);
      const profileData = handleResponse<UserProfileResponse>(response);
      const profileId = profileData.id ?? profileData.userId;
      if (typeof profileId !== 'number' || !Number.isSafeInteger(profileId) || profileId <= 0) {
        throw new Error('Backend profile response is missing user id');
      }
      const email = requireNonBlankString(profileData?.email, 'profile email');
      if (!isUserRole(profileData?.role)) {
        throw new Error('Backend profile response contains an unsupported role');
      }
      const currentUser = TokenStorage.getUserInfo();
      if (currentUser && (currentUser.email !== email || currentUser.role !== profileData.role)) {
        throw new Error('Backend profile identity does not match the authenticated session');
      }
      
      // Convert response data to User type
      const user: User = {
        id: profileId,
        authId:
          profileData.authId ??
          profileData.principalId ??
          currentUser?.authId,
        email,
        name: profileData.fullName?.trim() || email.split('@')[0],
        role: profileData.role,
      };

      // Cập nhật localStorage với thông tin mới nhất
      TokenStorage.setUserInfo(user);
      
      return user;
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * Restore the current session through the same refresh boundary used by
   * protected requests. This is needed when a page reload happens after the
   * access token has expired but the rotated refresh token is still valid.
   */
  async restoreSession(): Promise<User> {
    const session = await readWebSession();
    if (!session.authenticated || !session.email || !isUserRole(session.role)
        || !Number.isSafeInteger(session.principalId) || session.principalId! <= 0) {
      TokenStorage.clearAll();
      throw new Error('Web session is not active');
    }
    TokenStorage.setUserInfo({
      id: session.principalId!, authId: session.principalId!, email: session.email,
      name: session.email.split('@')[0], role: session.role,
    });
    return this.getProfile();
  },

  /**
   * Kiểm tra user đã login chưa
   */
  isAuthenticated(): boolean {
    return TokenStorage.getUserInfo() !== null;
  },

  hasStoredSession(): boolean {
    return TokenStorage.getUserInfo() !== null;
  },

  /**
   * Lấy thông tin user hiện tại từ localStorage
   */
  getCurrentUser(): User | null {
    return TokenStorage.getUserInfo();
  },

  /**
   * Kiểm tra user có role cụ thể không
   */
  hasRole(allowedRoles: string | string[]): boolean {
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
  getOrCreateDeviceId(): string {
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
  hashCode(str: string): number {
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
