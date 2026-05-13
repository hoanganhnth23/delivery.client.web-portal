/**
 * RestaurantOrders Page
 * Trang quản lý đơn hàng của nhà hàng
 */

import { useEffect, useState } from 'react';
import { useOrder } from '../hooks/useOrder';
import { useRestaurant } from '../hooks/useRestaurant';
import RestaurantSidebar from '@/components/layout/RestaurantSidebar';
import RestaurantHeader from '@/components/layout/RestaurantHeader';
import type { Order } from '@/types/api.types';

const RestaurantOrders = () => {
  const { 
    orders, 
    loading, 
    error, 
    getMyOrders, 
    updateOrderStatus,
    totalPages,
    totalElements,
    currentPage
  } = useOrder();
  const { currentRestaurant } = useRestaurant();
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Load orders khi component mount
  useEffect(() => {
    getMyOrders(0, 10);
  }, [getMyOrders]);

  const handlePageChange = (newPage: number) => {
    getMyOrders(newPage, 10);
  };

  // Filter orders theo status
  const filteredOrders = selectedStatus === 'ALL' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus);

  // Order status options
  const statusOptions = [
    { value: 'ALL', label: 'Tất cả', color: 'gray' },
    { value: 'PENDING', label: 'Chờ xác nhận', color: 'yellow' },
    { value: 'CONFIRMED', label: 'Đã xác nhận', color: 'blue' },
    { value: 'PREPARING', label: 'Đang chuẩn bị', color: 'purple' },
    { value: 'READY', label: 'Sẵn sàng', color: 'indigo' },
    { value: 'PICKED_UP', label: 'Đã lấy hàng', color: 'cyan' },
    { value: 'DELIVERING', label: 'Đang giao', color: 'orange' },
    { value: 'DELIVERED', label: 'Đã giao', color: 'green' },
    { value: 'CANCELLED', label: 'Đã hủy', color: 'red' },
  ];

  // Get status color
  const getStatusColor = (status: string) => {
    const statusObj = statusOptions.find(s => s.value === status);
    return statusObj?.color || 'gray';
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    const statusObj = statusOptions.find(s => s.value === status);
    return statusObj?.label || status;
  };

  // Handle status change
  const handleStatusChange = async (orderId: number, newStatus: string) => {
    const result = await updateOrderStatus(orderId, newStatus);
    if (result.success) {
      // Refresh orders on the same page
      await getMyOrders(currentPage, 10);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex min-h-screen w-full bg-background-light dark:bg-background-dark">
      {/* Sidebar */}
      <RestaurantSidebar
        restaurantName={currentRestaurant?.name}
        restaurantImage={currentRestaurant?.image}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <RestaurantHeader
          title="Quản lý đơn hàng"
          subtitle={`${totalElements} đơn hàng`}
          showSearch={false}
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-[1400px] mx-auto space-y-6">
            {/* Status Filter */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 border border-border-light dark:border-border-dark">
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {statusOptions.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => setSelectedStatus(status.value)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all
                      ${selectedStatus === status.value
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    {status.label}
                    {status.value === 'ALL' && ` (${orders.length})`}
                    {status.value !== 'ALL' && ` (${orders.filter(o => o.status === status.value).length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredOrders.length === 0 && (
              <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-12 text-center border border-border-light dark:border-border-dark">
                <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">receipt_long</span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Chưa có đơn hàng nào
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedStatus === 'ALL' 
                    ? 'Chưa có đơn hàng nào trong hệ thống'
                    : `Không có đơn hàng nào ở trạng thái "${getStatusLabel(selectedStatus)}"`
                  }
                </p>
              </div>
            )}

            {/* Orders List */}
            {!loading && !error && filteredOrders.length > 0 && (
              <div className="grid grid-cols-1 gap-4">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-border-light dark:border-border-dark shadow-sm hover:shadow-md transition-all">
                    <div className="flex flex-col lg:flex-row justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between lg:justify-start lg:gap-4">
                          <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                            Đơn hàng #{order.id}
                          </h4>
                          <span className={`
                            px-3 py-1 rounded-full text-xs font-bold
                            ${order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                            ${order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                            ${order.status === 'PREPARING' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : ''}
                            ${order.status === 'READY' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : ''}
                            ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                            ${order.status === 'CANCELLED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                          `}>
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-gray-400 mt-1">person</span>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">Khách hàng</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.customerName}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{order.customerPhone}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-gray-400 mt-1">schedule</span>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">Thời gian</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(order.createdAt)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3 md:col-span-2">
                            <span className="material-symbols-outlined text-gray-400 mt-1">location_on</span>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">Địa chỉ giao hàng</p>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 line-clamp-2">{order.deliveryAddress}</p>
                            </div>
                          </div>
                        </div>

                        {/* Order Items Summary */}
                        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold mb-2">Sản phẩm ({order.items?.length || 0})</p>
                          <div className="flex flex-wrap gap-2">
                            {order.items?.map((item, idx) => (
                              <span key={idx} className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300">
                                {item.quantity}x {item.menuItemName}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col justify-between items-end gap-6 border-t lg:border-t-0 lg:border-l border-border-light dark:border-border-dark pt-6 lg:pt-0 lg:pl-6 min-w-[220px]">
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold mb-1">Tổng cộng</p>
                          <p className="text-2xl font-black text-primary">
                            {formatCurrency(order.totalPrice)}
                          </p>
                        </div>

                        <div className="flex gap-2 w-full lg:w-auto">
                          {order.status === 'PENDING' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'CONFIRMED')}
                              className="flex-1 lg:flex-none px-4 py-2.5 bg-primary hover:bg-orange-600 text-white rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                            >
                              <span className="material-symbols-outlined text-lg">check_circle</span>
                              Xác nhận
                            </button>
                          )}
                          {order.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'PREPARING')}
                              className="flex-1 lg:flex-none px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                            >
                              <span className="material-symbols-outlined text-lg">cooking</span>
                              Chế biến
                            </button>
                          )}
                          {order.status === 'PREPARING' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'READY')}
                              className="flex-1 lg:flex-none px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                            >
                              <span className="material-symbols-outlined text-lg">restaurant</span>
                              Sẵn sàng
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="flex-1 lg:flex-none px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                          >
                            Chi tiết
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Trang <span className="font-bold text-gray-900 dark:text-white">{currentPage + 1}</span> / {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0 || loading}
                    className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                    Trước
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1 || loading}
                    className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Tiếp
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RestaurantOrders;
