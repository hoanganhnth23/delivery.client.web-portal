/**
 * useSettlement Hook
 * Quản lý state cho Settlement (thu nhập, số dư, giao dịch)
 */

import { useState, useCallback, createContext, useContext, type ReactNode } from 'react';
import {
  getRestaurantBalance,
  getRestaurantEarnings,
  getRestaurantTransactions,
  requestRestaurantWithdrawal,
  createPayment,
  confirmFakePayment,
  type BalanceResponse,
  type TransactionResponse,
  type PaymentOrderResponse,
} from '../services/settlementService';

// ============================================
// TYPES
// ============================================

interface SettlementState {
  balance: BalanceResponse | null;
  earnings: number;
  transactions: TransactionResponse[];
  loading: boolean;
  error: string | null;
}

interface SettlementContextType extends SettlementState {
  fetchBalance: (entityId: number) => Promise<void>;
  fetchEarnings: (entityId: number) => Promise<void>;
  fetchTransactions: (entityId: number) => Promise<void>;
  fetchAll: (entityId: number) => Promise<void>;
  withdraw: (entityId: number, amount: number, description?: string) => Promise<boolean>;
  deposit: (entityId: number, amount: number, provider?: string) => Promise<PaymentOrderResponse | null>;
  clearError: () => void;
}

// ============================================
// CONTEXT
// ============================================

const SettlementContext = createContext<SettlementContextType | null>(null);

export const SettlementProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<SettlementState>({
    balance: null,
    earnings: 0,
    transactions: [],
    loading: false,
    error: null,
  });

  const setLoading = (loading: boolean) => setState((s) => ({ ...s, loading, error: loading ? null : s.error }));
  const setError = (error: string) => setState((s) => ({ ...s, error, loading: false }));

  const fetchBalance = useCallback(async (entityId: number) => {
    setLoading(true);
    try {
      const balance = await getRestaurantBalance(entityId);
      setState((s) => ({ ...s, balance, loading: false }));
    } catch (err: any) {
      setError(err?.message || 'Không thể tải số dư');
    }
  }, []);

  const fetchEarnings = useCallback(async (entityId: number) => {
    try {
      const earnings = await getRestaurantEarnings(entityId);
      setState((s) => ({ ...s, earnings }));
    } catch (err: any) {
      console.error('Failed to fetch earnings:', err);
    }
  }, []);

  const fetchTransactions = useCallback(async (entityId: number) => {
    setLoading(true);
    try {
      const transactions = await getRestaurantTransactions(entityId);
      setState((s) => ({ ...s, transactions, loading: false }));
    } catch (err: any) {
      setError(err?.message || 'Không thể tải lịch sử giao dịch');
    }
  }, []);

  const fetchAll = useCallback(async (entityId: number) => {
    setLoading(true);
    try {
      const [balance, earnings, transactions] = await Promise.all([
        getRestaurantBalance(entityId),
        getRestaurantEarnings(entityId),
        getRestaurantTransactions(entityId),
      ]);
      setState({ balance, earnings, transactions, loading: false, error: null });
    } catch (err: any) {
      setError(err?.message || 'Không thể tải dữ liệu thu nhập');
    }
  }, []);

  const withdraw = useCallback(async (entityId: number, amount: number, description?: string) => {
    setLoading(true);
    try {
      await requestRestaurantWithdrawal(entityId, { amount, description });
      // Refresh data after withdrawal
      await fetchAll(entityId);
      return true;
    } catch (err: any) {
      setError(err?.message || 'Yêu cầu rút tiền thất bại');
      return false;
    }
  }, [fetchAll]);

  const deposit = useCallback(async (entityId: number, amount: number, provider: string = 'FAKE') => {
    setLoading(true);
    try {
      const paymentOrder = await createPayment({
        entityId,
        entityType: 'RESTAURANT',
        amount,
        provider,
        purpose: 'DEPOSIT_TOPUP',
      });

      if (provider === 'FAKE' && paymentOrder.paymentRef) {
        // Auto-confirm fake payment
        const confirmed = await confirmFakePayment(paymentOrder.paymentRef);
        await fetchAll(entityId);
        setState((s) => ({ ...s, loading: false }));
        return confirmed;
      }

      setState((s) => ({ ...s, loading: false }));
      return paymentOrder; // Client mở paymentUrl
    } catch (err: any) {
      setError(err?.message || 'Nạp tiền thất bại');
      return null;
    }
  }, [fetchAll]);

  const clearError = useCallback(() => setState((s) => ({ ...s, error: null })), []);

  return (
    <SettlementContext.Provider
      value={{ ...state, fetchBalance, fetchEarnings, fetchTransactions, fetchAll, withdraw, deposit, clearError }}
    >
      {children}
    </SettlementContext.Provider>
  );
};

export const useSettlement = (): SettlementContextType => {
  const context = useContext(SettlementContext);
  if (!context) {
    throw new Error('useSettlement must be used within a SettlementProvider');
  }
  return context;
};

export default useSettlement;
