import apiClient, { handleResponse, handleError } from './apiClient';
import { API_ENDPOINTS } from './endpoints';

export interface AdminOrder {
  id: number;
  userId: number;
  restaurantId: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  paymentStatus: string;
  paymentMethod: string;
  shippingAddress: string;
  shipperId: number | null;
}

export interface AdminTransaction {
  id: number;
  entityId: number;
  entityType: string;
  direction: string;
  reason: string;
  amount: number;
  description: string;
  status: string;
  walletType: string;
  createdAt: string;
}

export interface AdminShipper {
  id: number;
  userId: number;
  fullName: string;
  phone: string;
  vehicleType: string;
  licensePlate: string;
  isOnline: boolean;
  isBlocked: boolean;
  rating: number;
  totalDeliveries: number;
  createdAt: string;
}

export interface UserStatistics {
  totalUsers: number;
  totalShippers: number;
  totalRestaurants: number;
  newUsersToday: number;
}

export interface AdminRestaurant {
  id: number;
  name: string;
  address: string;
  createdAt: string;
}

class AdminService {
  /**
   * Fetch all orders
   */
  async fetchAllOrders(): Promise<AdminOrder[]> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.ORDER.GET_ALL_ADMIN);
      return handleResponse<AdminOrder[]>(response);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * Fetch orders by status
   */
  async fetchOrdersByStatus(status: string): Promise<AdminOrder[]> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.ORDER.GET_BY_STATUS(status));
      return handleResponse<AdminOrder[]>(response);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * Fetch pending withdrawals
   */
  async fetchPendingWithdrawals(): Promise<AdminTransaction[]> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.SETTLEMENT.ADMIN.GET_PENDING_WITHDRAWALS);
      return handleResponse<AdminTransaction[]>(response);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * Approve a withdrawal
   */
  async approveWithdrawal(transactionId: number): Promise<AdminTransaction> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.SETTLEMENT.ADMIN.APPROVE_WITHDRAWAL(transactionId));
      return handleResponse<AdminTransaction>(response);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * Reject a withdrawal
   */
  async rejectWithdrawal(transactionId: number, reason: string): Promise<AdminTransaction> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.SETTLEMENT.ADMIN.REJECT_WITHDRAWAL(transactionId), { reason });
      return handleResponse<AdminTransaction>(response);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * Get platform revenue
   */
  async fetchPlatformRevenue(): Promise<number> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.SETTLEMENT.ADMIN.GET_REVENUE);
      return handleResponse<number>(response);
    } catch (error) {
      return handleError(error);
    }
  }

  // ==================== SHIPPER MANAGEMENT ====================

  /**
   * Fetch all shippers
   */
  async fetchAllShippers(): Promise<AdminShipper[]> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.SHIPPER.GET_ALL);
      return handleResponse<AdminShipper[]>(response);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * Fetch online shippers
   */
  async fetchOnlineShippers(): Promise<AdminShipper[]> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.SHIPPER.GET_ONLINE);
      return handleResponse<AdminShipper[]>(response);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * Block a shipper account (via Auth Service)
   */
  async blockShipper(authAccountId: number, reason: string): Promise<void> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH_ADMIN.BLOCK_ACCOUNT(authAccountId), { reason });
      return handleResponse<void>(response);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * Unblock a shipper account (via Auth Service)
   */
  async unblockShipper(authAccountId: number): Promise<void> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH_ADMIN.UNBLOCK_ACCOUNT(authAccountId));
      return handleResponse<void>(response);
    } catch (error) {
      return handleError(error);
    }
  }

  // ==================== DASHBOARD STATISTICS ====================

  /**
   * Fetch user statistics (totals by role)
   */
  async fetchUserStatistics(): Promise<UserStatistics> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USER_ADMIN.GET_STATISTICS);
      return handleResponse<UserStatistics>(response);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * Fetch all restaurants (for count)
   */
  async fetchAllRestaurants(): Promise<AdminRestaurant[]> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.RESTAURANT.GET_ALL);
      return handleResponse<AdminRestaurant[]>(response);
    } catch (error) {
      return handleError(error);
    }
  }
}

export default new AdminService();
