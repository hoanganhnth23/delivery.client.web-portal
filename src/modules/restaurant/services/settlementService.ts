/**
 * Settlement Service
 * Xử lý tất cả API calls liên quan đến thu nhập, số dư, và giao dịch nhà hàng
 */

import apiClient, { handleResponse, handleError } from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/services/api/endpoints';

// ============================================
// TYPES
// ============================================

export interface BalanceResponse {
  id: number;
  entityId: number;
  entityType: string;
  availableBalance: number;
  pendingBalance: number;
  holdingBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionResponse {
  id: number;
  entityId: number;
  entityType: string;
  orderId: number | null;
  direction: string; // 'CREDIT' | 'DEBIT'
  reason: string;    // 'ORDER_COMMISSION' | 'WITHDRAWAL' | 'DELIVERY_FEE' etc.
  amount: number;
  description: string;
  status: string;    // 'COMPLETED' | 'PENDING' | 'FAILED'
  processedAt: string | null;
  processedBy: number | null;
  createdAt: string;
}

export interface WithdrawalRequest {
  amount: number;
  description?: string;
}

// ═══ Payment Gateway Types ═══

export interface CreatePaymentRequest {
  entityId: number;
  entityType?: string;
  amount: number;
  provider?: string;  // 'VNPAY' | 'FAKE' | 'MOMO'
  purpose?: string;   // 'DEPOSIT_TOPUP'
  returnUrl?: string;
  ipAddress?: string;
}

export interface PaymentOrderResponse {
  id: number;
  paymentRef: string;
  entityId: number;
  entityType: string;
  provider: string;
  amount: number;
  currency: string;
  purpose: string;
  status: string;        // 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED'
  paymentUrl: string;
  providerTransactionId: string | null;
  settlementTransactionId: number | null;
  createdAt: string;
  expiredAt: string;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Lấy số dư hiện tại của nhà hàng
 */
export const getRestaurantBalance = async (entityId: number): Promise<BalanceResponse> => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.SETTLEMENT.GET_RESTAURANT_BALANCE(entityId));
    return handleResponse<BalanceResponse>(response);
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Lấy tổng thu nhập của nhà hàng
 */
export const getRestaurantEarnings = async (entityId: number): Promise<number> => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.SETTLEMENT.GET_RESTAURANT_EARNINGS(entityId));
    return handleResponse<number>(response);
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Yêu cầu rút tiền cho nhà hàng
 */
export const requestRestaurantWithdrawal = async (
  entityId: number,
  data: WithdrawalRequest
): Promise<TransactionResponse> => {
  try {
    const response = await apiClient.post(
      API_ENDPOINTS.SETTLEMENT.REQUEST_RESTAURANT_WITHDRAWAL(entityId),
      data
    );
    return handleResponse<TransactionResponse>(response);
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Lấy lịch sử giao dịch của nhà hàng
 */
export const getRestaurantTransactions = async (entityId: number): Promise<TransactionResponse[]> => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.SETTLEMENT.GET_RESTAURANT_TRANSACTIONS(entityId));
    return handleResponse<TransactionResponse[]>(response);
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Lấy chi tiết giao dịch theo ID
 */
export const getTransactionById = async (id: number): Promise<TransactionResponse> => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.SETTLEMENT.GET_TRANSACTION_BY_ID(id));
    return handleResponse<TransactionResponse>(response);
  } catch (error) {
    throw handleError(error);
  }
};

// ═══════════════════════════════════════════
// Payment Gateway
// ═══════════════════════════════════════════

/**
 * Tạo giao dịch thanh toán qua cổng bên thứ ba
 */
export const createPayment = async (data: CreatePaymentRequest): Promise<PaymentOrderResponse> => {
  try {
    const response = await apiClient.post('/api/settlement/payments/create', data);
    return handleResponse<PaymentOrderResponse>(response);
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Fake confirm (dev/test)
 */
export const confirmFakePayment = async (paymentRef: string): Promise<PaymentOrderResponse> => {
  try {
    const response = await apiClient.get(`/api/settlement/payments/fake-confirm/${paymentRef}`);
    return handleResponse<PaymentOrderResponse>(response);
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Query trạng thái thanh toán
 */
export const getPaymentByRef = async (paymentRef: string): Promise<PaymentOrderResponse> => {
  try {
    const response = await apiClient.get(`/api/settlement/payments/ref/${paymentRef}`);
    return handleResponse<PaymentOrderResponse>(response);
  } catch (error) {
    throw handleError(error);
  }
};

/**
 * Danh sách provider khả dụng
 */
export const getAvailableProviders = async (): Promise<string[]> => {
  try {
    const response = await apiClient.get('/api/settlement/payments/providers');
    return handleResponse<string[]>(response);
  } catch (error) {
    throw handleError(error);
  }
};
