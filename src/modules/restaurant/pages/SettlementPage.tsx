/**
 * Settlement Page - Trang Thu Nhập / Tài Chính cho Nhà Hàng
 * Hiển thị số dư, tổng thu nhập, rút tiền, lịch sử giao dịch
 */

import { useState, useEffect } from 'react';
import RestaurantSidebar from '@/components/layout/RestaurantSidebar';
import RestaurantHeader from '@/components/layout/RestaurantHeader';
import { useRestaurant } from '../hooks/useRestaurant';
import { useSettlement } from '../hooks/useSettlement';

const SettlementPage = () => {
  const { currentRestaurant } = useRestaurant();
  const { balance, earnings, transactions, loading, error, fetchAll, withdraw, deposit, clearError } = useSettlement();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDescription, setWithdrawDescription] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState<'FAKE' | 'VNPAY'>('FAKE');
  const [activeTab, setActiveTab] = useState<'all' | 'credit' | 'debit'>('all');

  useEffect(() => {
    if (currentRestaurant?.id) {
      fetchAll(currentRestaurant.id);
    }
  }, [currentRestaurant?.id, fetchAll]);

  const handleWithdraw = async () => {
    if (!currentRestaurant?.id || !withdrawAmount) return;
    setWithdrawLoading(true);
    const success = await withdraw(currentRestaurant.id, parseFloat(withdrawAmount), withdrawDescription || undefined);
    setWithdrawLoading(false);
    if (success) {
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setWithdrawDescription('');
    }
  };

  const handleDeposit = async () => {
    if (!currentRestaurant?.id || !depositAmount) return;
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 10000) return;
    setDepositLoading(true);
    const result = await deposit(currentRestaurant.id, amount, paymentProvider);
    setDepositLoading(false);
    if (result) {
      if (paymentProvider !== 'FAKE' && result.paymentUrl) {
        window.open(result.paymentUrl, '_blank');
      }
      setShowDepositModal(false);
      setDepositAmount('');
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return '0₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const filteredTransactions = transactions.filter((t) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'credit') return t.direction === 'CREDIT';
    if (activeTab === 'debit') return t.direction === 'DEBIT';
    return true;
  });

  const getDirectionStyle = (direction: string) => {
    if (direction === 'CREDIT') return 'text-green-600 dark:text-green-400';
    return 'text-red-500 dark:text-red-400';
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      COMPLETED: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      PENDING: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      FAILED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    };
    return styles[status] || 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
      <RestaurantSidebar
        restaurantName={currentRestaurant?.name}
        restaurantImage={currentRestaurant?.image}
      />

      <main className="flex flex-1 flex-col overflow-hidden">
        <RestaurantHeader
          title="Thu nhập"
          subtitle="Quản lý thu nhập, số dư và rút tiền"
          actions={
            <div className="flex gap-3">
              <button
                onClick={() => setShowDepositModal(true)}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-violet-700 hover:shadow transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">add_card</span>
                Nạp tiền
              </button>
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary/90 hover:shadow transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                Rút tiền
              </button>
            </div>
          }
        />

        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            {/* Error */}
            {error && (
              <div className="mb-6 flex items-center justify-between rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500">error</span>
                  <span className="text-sm font-medium text-red-700 dark:text-red-400">{error}</span>
                </div>
                <button onClick={clearError} className="text-red-500 hover:text-red-700">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            )}

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {/* Total Earnings */}
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-orange-600 p-6 shadow-lg text-white">
                <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-white/10 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10 flex flex-col gap-1">
                  <p className="text-sm font-medium opacity-80">Tổng thu nhập</p>
                  <span className="text-3xl font-extrabold">
                    {loading ? '...' : formatCurrency(earnings)}
                  </span>
                  <p className="text-xs opacity-60 mt-1">Tổng cộng từ tất cả đơn hàng</p>
                </div>
              </div>

              {/* Available Balance */}
              <div className="group relative overflow-hidden rounded-2xl bg-card-light dark:bg-card-dark p-6 shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md">
                <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-green-500/10 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-500 text-xl">account_balance</span>
                    <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Có thể rút</p>
                  </div>
                  <span className="text-3xl font-extrabold text-green-600 dark:text-green-400">
                    {loading ? '...' : formatCurrency(balance?.availableBalance)}
                  </span>
                </div>
              </div>

              {/* Pending Balance */}
              <div className="group relative overflow-hidden rounded-2xl bg-card-light dark:bg-card-dark p-6 shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md">
                <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-yellow-500/10 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-yellow-500 text-xl">pending</span>
                    <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Đang chờ xử lý</p>
                  </div>
                  <span className="text-3xl font-extrabold text-yellow-600 dark:text-yellow-400">
                    {loading ? '...' : formatCurrency(balance?.pendingBalance)}
                  </span>
                </div>
              </div>

              {/* Holding Balance */}
              <div className="group relative overflow-hidden rounded-2xl bg-card-light dark:bg-card-dark p-6 shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md">
                <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-blue-500/10 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-500 text-xl">lock</span>
                    <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Tạm giữ</p>
                  </div>
                  <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                    {loading ? '...' : formatCurrency(balance?.holdingBalance)}
                  </span>
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <div className="rounded-2xl bg-card-light dark:bg-card-dark shadow-sm border border-gray-100 dark:border-gray-800">
              {/* Tabs */}
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 pt-5">
                <div className="flex gap-6">
                  {[
                    { key: 'all' as const, label: 'Tất cả', count: transactions.length },
                    { key: 'credit' as const, label: 'Thu nhập', count: transactions.filter((t) => t.direction === 'CREDIT').length },
                    { key: 'debit' as const, label: 'Chi', count: transactions.filter((t) => t.direction === 'DEBIT').length },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`relative pb-3 text-sm font-bold transition-colors ${
                        activeTab === tab.key
                          ? 'text-primary'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                      }`}
                    >
                      {tab.label} ({tab.count})
                      {activeTab === tab.key && (
                        <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary rounded-t-full"></span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Thời gian</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Mã đơn</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Loại</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Lý do</th>
                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Số tiền</th>
                      <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                            <span className="text-sm text-gray-500">Đang tải...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600">receipt_long</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Chưa có giao dịch nào</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {formatDate(tx.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            {tx.orderId ? (
                              <span className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                                #{tx.orderId}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <span className={`material-symbols-outlined text-[16px] ${getDirectionStyle(tx.direction)}`}>
                                {tx.direction === 'CREDIT' ? 'arrow_downward' : 'arrow_upward'}
                              </span>
                              <span className={`text-sm font-bold ${getDirectionStyle(tx.direction)}`}>
                                {tx.direction === 'CREDIT' ? 'Thu' : 'Chi'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {tx.description || tx.reason}
                            </span>
                          </td>
                          <td className={`px-6 py-4 text-right text-sm font-bold whitespace-nowrap ${getDirectionStyle(tx.direction)}`}>
                            {tx.direction === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${getStatusBadge(tx.status)}`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Yêu cầu rút tiền</h2>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Available balance info */}
            <div className="mb-6 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
              <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Số dư khả dụng</p>
              <p className="text-2xl font-extrabold text-green-700 dark:text-green-300">
                {formatCurrency(balance?.availableBalance)}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Số tiền rút <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Nhập số tiền..."
                  min={1}
                  max={balance?.availableBalance || 0}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Ghi chú
                </label>
                <textarea
                  value={withdrawDescription}
                  onChange={(e) => setWithdrawDescription(e.target.value)}
                  placeholder="Ghi chú (không bắt buộc)..."
                  rows={2}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-3 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleWithdraw}
                disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || withdrawLoading}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {withdrawLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    Xác nhận rút tiền
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Nạp tiền</h2>
              <button
                onClick={() => setShowDepositModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Current balance info */}
            <div className="mb-6 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 p-4">
              <p className="text-xs font-medium text-violet-600 dark:text-violet-400 mb-1">Số dư hiện tại</p>
              <p className="text-2xl font-extrabold text-violet-700 dark:text-violet-300">
                {formatCurrency(balance?.availableBalance)}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Số tiền nạp <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-400 ml-1">(tối thiểu 10,000₫)</span>
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Nhập số tiền..."
                  min={10000}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                />
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2">
                {[100000, 200000, 500000, 1000000].map((v) => (
                  <button
                    key={v}
                    onClick={() => setDepositAmount(String(v))}
                    className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 py-2 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                  >
                    {formatCurrency(v)}
                  </button>
                ))}
              </div>

              {/* Payment provider */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Phương thức thanh toán
                </label>
                <div className="flex gap-3">
                  {([['FAKE', '🎭 Demo (Tự động)'], ['VNPAY', '🏦 VNPay']] as const).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setPaymentProvider(key as 'FAKE' | 'VNPAY')}
                      className={`flex-1 rounded-xl border-2 py-3 text-sm font-bold transition-all ${
                        paymentProvider === key
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDepositModal(false)}
                className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-3 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDeposit}
                disabled={!depositAmount || parseFloat(depositAmount) < 10000 || depositLoading}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {depositLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">payment</span>
                    Nạp tiền
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettlementPage;
