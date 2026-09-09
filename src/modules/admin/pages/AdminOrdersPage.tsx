import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import type { AdminOrder } from '@/services/api/adminService';
import { useAppDependencies } from '@/app/dependencies';
import { useRestaurant } from '@/modules/restaurant/hooks/useRestaurant';
import { ROUTES } from '@/utils/constants';
import { usePortalPreviewNavigate } from '@/components/navigation/usePortalPreviewNavigation';

const AdminOrdersPage = () => {
  const { admin: adminService, notifications } = useAppDependencies();
  const { selectRestaurantById } = useRestaurant();
  const navigate = usePortalPreviewNavigate();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [batchConfirming, setBatchConfirming] = useState(false);
  
  const statusTabs = [
    'ALL',
    'PENDING',
    'CONFIRMED',
    'FINDING_SHIPPER',
    'WAIT_SHIPPER_CONFIRM',
    'ASSIGNED',
    'PICKED_UP',
    'DELIVERING',
    'DELIVERED',
    'CANCELLED',
    'SHIPPER_NOT_FOUND',
  ];

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (statusFilter === 'ALL') {
        const data = await adminService.fetchAllOrders(page, 20);
        setOrders(data.items);
        setTotalPages(data.totalPages);
      } else {
        const data = await adminService.fetchOrdersByStatus(statusFilter, page, 20);
        setOrders(data.items);
        setTotalPages(data.totalPages);
      }
    } catch {
      setError('Không thể tải danh sách đơn hàng');
      notifications.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [adminService, notifications, page, statusFilter]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const changeStatusFilter = (status: string) => {
    setStatusFilter(status);
    setPage(0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'DELIVERING': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'DELIVERED': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'CANCELLED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const filteredOrders = orders.filter(order => 
    order.id.toString().includes(searchTerm) || 
    order.userId?.toString().includes(searchTerm) ||
    order.restaurantId?.toString().includes(searchTerm)
  );

  const pendingOrders = filteredOrders.filter(order => order.status === 'PENDING');

  const handleConfirm = async (order: AdminOrder) => {
    setActionLoadingId(order.id);
    try {
      await adminService.confirmOrder(order.id, order.restaurantId, 30);
      notifications.success(`Đã xác nhận đơn hàng #${order.id}`);
      await loadOrders();
    } catch {
      notifications.error(`Xác nhận đơn hàng #${order.id} thất bại`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (order: AdminOrder) => {
    const reason = window.prompt(`Lý do từ chối đơn hàng #${order.id}:`, 'Nhà hàng tạm thời hết món')?.trim();
    if (!reason) return;
    setActionLoadingId(order.id);
    try {
      await adminService.rejectOrder(order.id, order.restaurantId, reason);
      notifications.success(`Đã từ chối đơn hàng #${order.id}`);
      await loadOrders();
    } catch {
      notifications.error(`Từ chối đơn hàng #${order.id} thất bại`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBatchConfirm = async () => {
    if (pendingOrders.length === 0) return;
    setBatchConfirming(true);
    try {
      const results = await Promise.allSettled(
        pendingOrders.map(order => adminService.confirmOrder(order.id, order.restaurantId, 30))
      );
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.length - successful;
      if (failed === 0) {
        notifications.success(`Đã xác nhận thành công tất cả ${successful} đơn hàng!`);
      } else {
        notifications.success(`Đã xác nhận ${successful}/${results.length} đơn hàng (${failed} lỗi)`);
      }
      await loadOrders();
    } catch {
      notifications.error('Xác nhận hàng loạt thất bại');
    } finally {
      setBatchConfirming(false);
    }
  };

  const handleAccessRestaurant = (restaurantId: number) => {
    selectRestaurantById(restaurantId);
    navigate(ROUTES.RESTAURANT_ORDERS);
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Header & Controls */}
        <div className="flex flex-col gap-3 rounded-xl border border-border-light bg-surface-light p-3 shadow-sm dark:border-border-dark dark:bg-surface-dark sm:gap-4 sm:p-4">
          <div
            className="portal-order-status-tabs flex min-w-0 w-full gap-2 overflow-x-auto pb-1 hide-scrollbar"
            aria-label="Lọc trạng thái đơn hàng"
            role="group"
          >
            {statusTabs.map(tab => (
              <button
                key={tab}
                type="button"
                aria-pressed={statusFilter === tab}
                onClick={() => changeStatusFilter(tab)}
                className={`min-h-10 rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors sm:px-4 ${
                  statusFilter === tab 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {tab === 'ALL' ? 'Tất cả' : tab}
              </button>
            ))}
          </div>
          
          <div className="flex w-full flex-col items-stretch gap-3 border-t border-border-light pt-3 dark:border-border-dark md:flex-row md:items-center md:justify-end">
            {/* Batch Confirm Button for Fast Local Testing */}
            {pendingOrders.length > 0 && (
              <button
                type="button"
                disabled={batchConfirming || loading}
                onClick={() => void handleBatchConfirm()}
                className="flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold whitespace-nowrap text-white shadow-sm transition-colors hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 md:w-auto"
                title="Xác nhận tất cả các đơn hàng PENDING trong danh sách hiện tại"
              >
                {batchConfirming ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Đang xác nhận ({pendingOrders.length})...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">bolt</span>
                    <span>Xác nhận tất cả đơn chờ ({pendingOrders.length})</span>
                  </>
                )}
              </button>
            )}

            <div className="relative w-full md:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
              <input
                type="search"
                placeholder="Tìm kiếm ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Tìm kiếm đơn hàng"
                className="pl-10 pr-4 py-2 w-full rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300" role="alert">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void loadOrders()}
              disabled={loading}
              className="shrink-0 rounded-lg bg-red-700 px-3 py-2 font-semibold text-white disabled:opacity-50"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden flex-1">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-border-light dark:border-border-dark">
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mã Đơn</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Khách / Nhà hàng</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tổng tiền</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Shipper</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      <div className="flex justify-center items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                        Đang tải dữ liệu...
                      </div>
                    </td>
                  </tr>
                ) : error && filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">Chưa có dữ liệu để hiển thị.</td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      Không tìm thấy đơn hàng nào.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="p-4 font-semibold text-gray-900 dark:text-white">#{order.id}</td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">User ID: {order.userId}</span>
                          <span className="text-xs text-gray-500">Restaurant ID: {order.restaurantId}</span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-gray-900 dark:text-white">
                        {formatCurrency(order.totalPrice)}
                      </td>
                      <td className="p-4">
                        {order.shipperId ? (
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Shipper #{order.shipperId}</span>
                        ) : (
                          <span className="text-xs text-gray-400">Chưa có</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {order.status === 'PENDING' && (
                            <>
                              <button
                                type="button"
                                disabled={actionLoadingId === order.id || batchConfirming}
                                onClick={() => void handleConfirm(order)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 font-semibold text-xs border border-emerald-300 dark:border-emerald-800 transition-colors disabled:opacity-50"
                                title="Xác nhận đơn hàng"
                              >
                                {actionLoadingId === order.id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-emerald-600 border-t-transparent" />
                                ) : (
                                  <span className="material-symbols-outlined text-sm">check_circle</span>
                                )}
                                <span>Xác nhận</span>
                              </button>
                              <button
                                type="button"
                                disabled={actionLoadingId === order.id || batchConfirming}
                                onClick={() => void handleReject(order)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:hover:bg-red-900/60 dark:text-red-300 font-semibold text-xs border border-red-300 dark:border-red-800 transition-colors disabled:opacity-50"
                                title="Từ chối đơn hàng"
                              >
                                <span className="material-symbols-outlined text-sm">cancel</span>
                                <span>Từ chối</span>
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => handleAccessRestaurant(order.restaurantId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 font-medium text-xs border border-border-light dark:border-border-dark transition-colors"
                            title={`Mở quản lý nhà hàng #${order.restaurantId}`}
                          >
                            <span className="material-symbols-outlined text-sm">storefront</span>
                            <span className="hidden sm:inline">Nhà hàng</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col items-start gap-3 border-t border-border-light bg-gray-50 px-4 py-3 dark:border-border-dark dark:bg-gray-800/50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Trang <span className="font-medium text-gray-900 dark:text-white">{page + 1}</span> / <span className="font-medium text-gray-900 dark:text-white">{totalPages}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 text-sm border border-border-light dark:border-border-dark rounded-md bg-white dark:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300"
                >
                  Trước
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1 text-sm border border-border-light dark:border-border-dark rounded-md bg-white dark:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </AdminLayout>
  );
};

export default AdminOrdersPage;
