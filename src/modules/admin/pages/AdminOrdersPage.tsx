import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import type { AdminOrder } from '@/services/api/adminService';
import { useAppDependencies } from '@/app/dependencies';

const AdminOrdersPage = () => {
  const { admin: adminService, notifications } = useAppDependencies();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
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

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
          <div className="flex overflow-x-auto w-full md:w-auto gap-2 pb-2 md:pb-0 hide-scrollbar">
            {statusTabs.map(tab => (
              <button
                key={tab}
                onClick={() => changeStatusFilter(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === tab 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {tab === 'ALL' ? 'Tất cả' : tab}
              </button>
            ))}
          </div>
          
          <div className="relative w-full md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
            <input
              type="text"
              placeholder="Tìm kiếm ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
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
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-border-light dark:border-border-dark">
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mã Đơn</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Khách / Nhà hàng</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tổng tiền</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Shipper</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trạng thái</th>
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
                ) : error && filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">Chưa có dữ liệu để hiển thị.</td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-800/50">
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
