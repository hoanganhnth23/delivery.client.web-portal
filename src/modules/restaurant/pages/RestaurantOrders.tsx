/**
 * RestaurantOrders Page
 * Trang quản lý đơn hàng của nhà hàng
 */

import { useEffect, useState } from 'react';
import { useOrder } from '../hooks/useOrder';
import { useRestaurant } from '../hooks/useRestaurant';
import RestaurantSidebar from '@/components/layout/RestaurantSidebar';
import PageHeader from '@/components/layout/PageHeader';
import type { Order } from '@/types/api.types';

const RestaurantOrders = () => {
  const { orders, loading, error, getMyOrders, updateOrderStatus } = useOrder();
  const { currentRestaurant } = useRestaurant();
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Load orders khi component mount
  useEffect(() => {
    getMyOrders();
  }, [getMyOrders]);

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
      // Refresh orders
      await getMyOrders();
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
        <PageHeader
          title={`Quản lý đơn hàng - ${filteredOrders.length} đơn`}
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
                  <div
                    key={order.id}
                    className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Order Header */}
                    <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-3xl text-primary">shopping_bag</span>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            Đơn hàng #{order.id}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`
                          px-3 py-1 rounded-full text-xs font-bold
                          ${getStatusColor(order.status) === 'yellow' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}
                          ${getStatusColor(order.status) === 'blue' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'}
                          ${getStatusColor(order.status) === 'purple' && 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'}
                          ${getStatusColor(order.status) === 'green' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'}
                          ${getStatusColor(order.status) === 'red' && 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}
                          ${getStatusColor(order.status) === 'orange' && 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'}
                          ${getStatusColor(order.status) === 'gray' && 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'}
                        `}>
                          {getStatusLabel(order.status)}
                        </span>
                        <button
                          onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined">
                            {selectedOrder?.id === order.id ? 'expand_less' : 'expand_more'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Khách hàng</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{order.customerName}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{order.customerPhone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Địa chỉ giao hàng</p>
                        <p className="text-sm text-gray-900 dark:text-white">{order.deliveryAddress}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tổng tiền</p>
                        <p className="text-xl font-bold text-primary">{formatCurrency(order.totalPrice)}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{order.paymentMethod}</p>
                      </div>
                    </div>

                    {/* Order Details (Expandable) */}
                    {selectedOrder?.id === order.id && (
                      <div className="border-t border-border-light dark:border-border-dark p-4 bg-gray-50 dark:bg-gray-900/20">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-3">Chi tiết món ăn</h4>
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-3">
                                <span className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary rounded-lg font-bold">
                                  {item.quantity}x
                                </span>
                                <div>
                                  <p className="font-semibold text-gray-900 dark:text-white">{item.menuItemName}</p>
                                  {item.notes && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Ghi chú: {item.notes}</p>
                                  )}
                                </div>
                              </div>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {formatCurrency(item.price * item.quantity)}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Pricing Breakdown */}
                        <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Tạm tính</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(order.subtotalPrice)}</span>
                          </div>
                          {order.discountAmount > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Giảm giá</span>
                              <span className="font-semibold text-green-600">-{formatCurrency(order.discountAmount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Phí giao hàng</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(order.shippingFee)}</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold pt-2 border-t border-border-light dark:border-border-dark">
                            <span className="text-gray-900 dark:text-white">Tổng cộng</span>
                            <span className="text-primary">{formatCurrency(order.totalPrice)}</span>
                          </div>
                        </div>

                        {/* Notes */}
                        {order.notes && (
                          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <p className="text-sm text-yellow-900 dark:text-yellow-400">
                              <span className="font-semibold">Ghi chú:</span> {order.notes}
                            </p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                          <div className="mt-4 flex gap-2">
                            {order.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(order.id, 'CONFIRMED')}
                                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-colors"
                                >
                                  Xác nhận đơn
                                </button>
                                <button
                                  onClick={() => handleStatusChange(order.id, 'CANCELLED')}
                                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
                                >
                                  Từ chối
                                </button>
                              </>
                            )}
                            {order.status === 'CONFIRMED' && (
                              <button
                                onClick={() => handleStatusChange(order.id, 'PREPARING')}
                                className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-colors"
                              >
                                Bắt đầu chuẩn bị
                              </button>
                            )}
                            {order.status === 'PREPARING' && (
                              <button
                                onClick={() => handleStatusChange(order.id, 'READY')}
                                className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-colors"
                              >
                                Đã chuẩn bị xong
                              </button>
                            )}
                            {order.status === 'READY' && (
                              <button
                                onClick={() => handleStatusChange(order.id, 'PICKED_UP')}
                                className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-colors"
                              >
                                Đã giao cho shipper
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RestaurantOrders;
