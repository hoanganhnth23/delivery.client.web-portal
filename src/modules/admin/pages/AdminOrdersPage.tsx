import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import adminService, { AdminOrder, AdminShipper } from '@/services/api/adminService';
import { toast } from 'react-hot-toast';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Shipper assignment states
  const [showShipperModal, setShowShipperModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [onlineShippers, setOnlineShippers] = useState<AdminShipper[]>([]);
  const [loadingShippers, setLoadingShippers] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const statusTabs = ['ALL', 'PENDING', 'CONFIRMED', 'DELIVERING', 'DELIVERED', 'CANCELLED'];

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      if (statusFilter === 'ALL') {
        const data = await adminService.fetchAllOrders();
        setOrders(data || []);
      } else {
        const data = await adminService.fetchOrdersByStatus(statusFilter);
        setOrders(data || []);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (order: AdminOrder) => {
    const reason = window.prompt(`Nhập lý do hủy đơn hàng #${order.id}:`, 'Admin hủy theo yêu cầu');
    if (reason === null) return;

    setProcessingId(order.id);
    try {
      await adminService.cancelOrder(order.id, reason);
      toast.success(`Đã hủy đơn hàng #${order.id}`);
      loadOrders();
    } catch (error) {
      toast.error('Không thể hủy đơn hàng');
    } finally {
      setProcessingId(null);
    }
  };

  const openAssignModal = async (order: AdminOrder) => {
    setSelectedOrder(order);
    setShowShipperModal(true);
    setLoadingShippers(true);
    try {
      const shippers = await adminService.fetchOnlineShippers();
      setOnlineShippers(shippers || []);
    } catch (error) {
      toast.error('Không thể tải danh sách shipper online');
    } finally {
      setLoadingShippers(false);
    }
  };

  const handleAssignShipper = async (shipperId: number) => {
    if (!selectedOrder) return;

    setProcessingId(selectedOrder.id);
    try {
      await adminService.assignShipper(selectedOrder.id, shipperId);
      toast.success('Đã gán shipper thành công');
      setShowShipperModal(false);
      loadOrders();
    } catch (error) {
      toast.error('Không thể gán shipper');
    } finally {
      setProcessingId(null);
    }
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN');
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
                onClick={() => setStatusFilter(tab)}
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
                        {formatCurrency(order.totalAmount)}
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
                        <div className="flex justify-end gap-2">
                          {['PENDING', 'CONFIRMED'].includes(order.status) && (
                            <>
                              <button 
                                onClick={() => openAssignModal(order)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 transition-colors text-xs font-semibold"
                              >
                                <span className="material-symbols-outlined text-sm">local_shipping</span>
                                Gán Shipper
                              </button>
                              <button 
                                onClick={() => handleCancelOrder(order)}
                                disabled={processingId === order.id}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 transition-colors text-xs font-semibold disabled:opacity-50"
                              >
                                <span className="material-symbols-outlined text-sm">cancel</span>
                                Hủy đơn
                              </button>
                            </>
                          )}
                          <button className="p-2 rounded-lg text-gray-400 hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-xl">visibility</span>
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

      {/* Shipper Selection Modal */}
      {showShipperModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-dark w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-border-light dark:border-border-dark flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Gán Shipper cho đơn #{selectedOrder?.id}</h3>
                <p className="text-sm text-gray-500">Chọn một shipper đang trực tuyến</p>
              </div>
              <button 
                onClick={() => setShowShipperModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {loadingShippers ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                </div>
              ) : onlineShippers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Không có shipper nào đang online.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {onlineShippers.map(shipper => (
                    <button
                      key={shipper.id}
                      onClick={() => handleAssignShipper(shipper.id)}
                      disabled={processingId !== null}
                      className="flex items-center justify-between p-4 rounded-xl border border-border-light dark:border-border-dark hover:border-primary hover:bg-primary/5 transition-all group text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                          {shipper.fullName?.[0]?.toUpperCase() || 'S'}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                            {shipper.fullName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {shipper.vehicleType} · {shipper.licensePlate}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center text-amber-500">
                          <span className="material-symbols-outlined text-sm">star</span>
                          <span className="text-sm font-bold ml-1">{shipper.rating.toFixed(1)}</span>
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {shipper.totalDeliveries} đơn đã giao
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
              <button 
                onClick={() => setShowShipperModal(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminOrdersPage;
