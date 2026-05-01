import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import adminService, { AdminTransaction } from '@/services/api/adminService';

const AdminWithdrawalsPage = () => {
  const [withdrawals, setWithdrawals] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    setLoading(true);
    try {
      const data = await adminService.fetchPendingWithdrawals();
      setWithdrawals(data || []);
    } catch (error) {
      console.error('Error loading withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn DUYỆT yêu cầu rút tiền này?')) return;
    
    setProcessingId(id);
    try {
      await adminService.approveWithdrawal(id);
      // Remove from list or reload
      loadWithdrawals();
      alert('Đã duyệt yêu cầu rút tiền thành công');
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      alert('Có lỗi xảy ra khi duyệt yêu cầu');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number) => {
    const reason = window.prompt('Nhập lý do TỪ CHỐI yêu cầu rút tiền này:');
    if (reason === null) return; // User cancelled
    
    setProcessingId(id);
    try {
      await adminService.rejectWithdrawal(id, reason || 'Bị từ chối bởi Admin');
      // Remove from list or reload
      loadWithdrawals();
      alert('Đã từ chối yêu cầu rút tiền');
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      alert('Có lỗi xảy ra khi từ chối yêu cầu');
    } finally {
      setProcessingId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Yêu cầu Rút tiền (Chờ duyệt)</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Quản lý và xét duyệt các yêu cầu rút tiền từ ví Thu nhập của Shipper và Nhà hàng.
          </p>
        </div>

        {/* Withdrawals Table */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden flex-1">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-border-light dark:border-border-dark">
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mã GD</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Đối tượng</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Số tiền</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ngày yêu cầu</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      <div className="flex justify-center items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                        Đang tải dữ liệu...
                      </div>
                    </td>
                  </tr>
                ) : withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-4xl text-gray-300">check_circle</span>
                        <span>Không có yêu cầu rút tiền nào đang chờ duyệt.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="p-4 font-semibold text-gray-900 dark:text-white">#{withdrawal.id}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-md ${
                            withdrawal.entityType === 'SHIPPER' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {withdrawal.entityType}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">ID: {withdrawal.entityId}</span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(withdrawal.amount)}
                      </td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(withdrawal.createdAt)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleApprove(withdrawal.id)}
                            disabled={processingId === withdrawal.id}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 dark:text-green-400 transition-colors disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-sm">check</span>
                            <span className="text-sm font-semibold">Duyệt</span>
                          </button>
                          <button 
                            onClick={() => handleReject(withdrawal.id)}
                            disabled={processingId === withdrawal.id}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 transition-colors disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                            <span className="text-sm font-semibold">Từ chối</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminWithdrawalsPage;
