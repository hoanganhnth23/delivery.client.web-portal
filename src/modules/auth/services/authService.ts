/**
 * Authentication Service
 * Xử lý tất cả logic liên quan đến authentication
 */

import apiClient, { handleResponse, handleError } from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/services/api/endpoints';
import { TokenStorage } from '@/services/storage/localStorage';
import { DEVICE_TYPES, USER_ROLES, type UserRole } from '@/utils/constants';
import type { User } from '@/types/api.types';

// ============================================
// LOCAL TYPES (chỉ dùng trong authService)
// ============================================

interface LoginRequest {
  email: string;
  password: string;
  role?: string; // SHOP_OWNER, ADMIN, etc.
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  authId: number;
  email: string;
  role: UserRole;
}

interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: User;
}

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

interface UserProfileResponse {
  id?: number;
  userId?: number;
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

const parseAuthResponse = (value: AuthResponse, expectedRole?: string): AuthResponse => {
  const accessToken = requireNonBlankString(value?.accessToken, 'access token');
  const refreshToken = requireNonBlankString(value?.refreshToken, 'refresh token');
  const email = requireNonBlankString(value?.email, 'email');
  if (!Number.isSafeInteger(value?.authId) || value.authId <= 0) {
    throw new Error('Backend response is missing a valid auth id');
  }
  if (!isUserRole(value?.role)) {
    throw new Error('Backend response contains an unsupported role');
  }
  if (expectedRole && value.role !== expectedRole) {
    throw new Error('Authenticated role does not match the requested portal role');
  }

  return { ...value, accessToken, refreshToken, email, role: value.role };
};

export const authService = {
  /**
   * Đăng nhập
   * Backend request: { email, password, role, deviceType, deviceId }
   * Backend response: { accessToken, refreshToken, expiresIn }
   */
  async login(credentials: LoginRequest & { deviceType?: string; deviceId?: string }): Promise<LoginResult> {
    try {
      // Generate unique device ID if not provided
      const deviceId = credentials.deviceId || this.getOrCreateDeviceId();

      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
        email: credentials.email,
        password: credentials.password,
        role: credentials.role || USER_ROLES.RESTAURANT_OWNER, // Role phải được truyền từ login page
        deviceType: credentials.deviceType || DEVICE_TYPES.WEB,
        deviceId: deviceId,
      });

      // Backend trả về: { status: 1, data: { accessToken, refreshToken, authId, email, role } }
      const responseData = parseAuthResponse(
        handleResponse<AuthResponse>(response),
        credentials.role || USER_ROLES.RESTAURANT_OWNER,
      );
      
      // Destructure từ response data
      const { accessToken, refreshToken, authId, email, role } = responseData;

      // Lưu tokens vào localStorage
      TokenStorage.setAccessToken(accessToken);
      TokenStorage.setRefreshToken(refreshToken);

      // Decode JWT để lấy user info (hoặc dùng info từ response)
      const userInfo: User = {
        id: authId,
        email: email,
        name: email.split('@')[0], // Temporary name từ email
        role,
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
   * Backend request: { refreshToken }
   */
  async logout() {
    try {
      const refreshToken = TokenStorage.getRefreshToken();

      if (refreshToken) {
        await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken });
      }
    } catch {
      // Local session cleanup in finally is authoritative for logout.
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
  async refreshToken(): Promise<string> {
    try {
      const refreshToken = TokenStorage.getRefreshToken();

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
        refreshToken,
      });

      const refreshData = handleResponse<RefreshTokenResponse>(response);
      const accessToken = requireNonBlankString(refreshData?.accessToken, 'access token');
      const newRefreshToken = requireNonBlankString(refreshData?.refreshToken, 'refresh token');

      // Cập nhật tokens
      TokenStorage.setRefreshToken(newRefreshToken);
      TokenStorage.setAccessToken(accessToken);

      return accessToken;
    } catch (error) {
      // Refresh token thất bại -> clear storage
      TokenStorage.clearAll();
      throw handleError(error);
    }
  },

  /**
   * Lấy profile của user hiện tại từ backend
   * Endpoint: GET /api/users (với accessToken trong header)
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
    if (!TokenStorage.getAccessToken() && TokenStorage.getRefreshToken()) {
      await this.refreshToken();
    }
    return this.getProfile();
  },

  /**
   * Decode JWT token để lấy user info
   * JWT payload format:
   * {
   *   sub: "email",
   *   userId: 123,
   *   role: "RESTAURANT_OWNER",
   *   iat: timestamp,
   *   exp: timestamp
   * }
   */
  decodeToken(token: string): Record<string, unknown> | null {
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
    } catch {
      return null;
    }
  },

  /**
   * Kiểm tra user đã login chưa
   */
  isAuthenticated(): boolean {
    const token = TokenStorage.getAccessToken();
    if (!token) return false;

    // Kiểm tra token có hết hạn chưa bằng cách decode
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) return false;

      const now = Math.floor(Date.now() / 1000);
      return (decoded.exp as number) > now;
    } catch {
      return false;
    }
  },

  hasStoredSession(): boolean {
    return Boolean(TokenStorage.getAccessToken() || TokenStorage.getRefreshToken());
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
