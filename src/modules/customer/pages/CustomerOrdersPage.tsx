import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDependencies } from '@/app/dependencies';
import type { Order, PageData } from '@/types/api.types';
import { CustomerShell } from '../components/CustomerShell';
import { formatCurrency, getErrorMessage } from '../utils';
import { ROUTES } from '@/utils/constants';
import { statusLabels } from '../orderStatus';

const CustomerOrdersPage = () => {
  const { order: orderService } = useAppDependencies();
  const [page, setPage] = useState<PageData<Order> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'HISTORY'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (targetPage: number) => {
    try {
      setLoading(true);
      setError(null);
      setPage(await orderService.getCustomerOrders(targetPage, 10));
    } catch (caught) {
      setError(getErrorMessage(caught, 'Không thể tải lịch sử đơn hàng'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const filteredOrders = page?.items.filter((order) => {
    if (activeTab === 'ACTIVE') return !['DELIVERED', 'CANCELLED'].includes(order.status);
    if (activeTab === 'HISTORY') return ['DELIVERED', 'CANCELLED'].includes(order.status);
    return true;
  }) ?? [];

  return (
    <CustomerShell title="Đơn hàng của tôi">
      {/* Filter Tabs */}
      <div className="mb-5 flex border-b border-[#eeeeee]">
        {[
          { id: 'ALL', label: 'Tất cả' },
          { id: 'ACTIVE', label: 'Đang đến' },
          { id: 'HISTORY', label: 'Lịch sử' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as 'ALL' | 'ACTIVE' | 'HISTORY')}
            className={`relative px-5 py-2.5 text-sm font-bold transition ${
              activeTab === tab.id
                ? 'text-[#ee4d2d] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#ee4d2d]'
                : 'text-[#666666] hover:text-[#222222]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-sm text-[#777777]">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[#ee4d2d] border-t-transparent" />
            <span>Đang tải danh sách đơn hàng…</span>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:p-5">
          {error}
          <button type="button" onClick={() => void load(currentPage)} className="ml-3 font-bold text-red-800 underline">
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && filteredOrders.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#dddddd] bg-white p-8 text-center text-[#777777] sm:p-12">
          <span className="material-symbols-outlined mb-2 text-4xl text-[#cccccc]">receipt_long</span>
          <p className="font-medium">
            {activeTab === 'ACTIVE'
              ? 'Bạn không có đơn hàng nào đang giao.'
              : activeTab === 'HISTORY'
                ? 'Chưa có lịch sử đơn hàng nào.'
                : 'Bạn chưa có đơn hàng nào.'}
          </p>
          <Link to={ROUTES.HOME} className="mt-3 inline-block font-bold text-[#ee4d2d] hover:underline">
            Đặt món ngay ➔
          </Link>
        </div>
      )}

      <div className="space-y-3 sm:space-y-4">
        {filteredOrders.map((order) => (
          <Link
            key={order.id}
            to={ROUTES.CUSTOMER_ORDER(order.id)}
            className="block rounded-xl border border-[#eeeeee] bg-white p-4 transition hover:border-[#ee4d2d] hover:shadow-md sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-lg text-[#ee4d2d]">storefront</span>
                <h2 className="truncate text-base font-bold text-[#222222] sm:text-lg">
                  {order.restaurantName}
                </h2>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                  order.status === 'DELIVERED'
                    ? 'bg-emerald-50 text-emerald-700'
                    : order.status === 'CANCELLED'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-[#fff3ee] text-[#ee4d2d]'
                }`}
              >
                {statusLabels[order.status]}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-[#f5f5f5] pt-3 text-xs text-[#777777] sm:text-sm">
              <span className="truncate">
                {order.items.length > 0
                  ? `${order.items[0].quantity}× ${order.items[0].menuItemName}${
                      order.items.length > 1 ? ` (+${order.items.length - 1} món khác)` : ''
                    }`
                  : `${order.items.reduce((sum, item) => sum + item.quantity, 0)} món`}
              </span>
              <strong className="text-base font-black text-[#222222] sm:text-lg">
                {formatCurrency(order.totalPrice)}
              </strong>
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-[#999999]">
              <span>Đơn #{order.id} · {new Date(order.createdAt).toLocaleString('vi-VN')}</span>
              <span className="font-semibold text-[#ee4d2d]">Xem chi tiết ➔</span>
            </div>
          </Link>
        ))}
      </div>

      {page && page.totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <button
            type="button"
            disabled={currentPage === 0}
            onClick={() => setCurrentPage((value) => value - 1)}
            className="min-h-10 rounded-lg border border-[#dddddd] bg-white px-4 py-2 font-bold disabled:opacity-40 hover:bg-gray-50"
          >
            Trước
          </button>
          <span className="text-sm font-semibold text-[#555555]">
            Trang {page.page + 1}/{page.totalPages}
          </span>
          <button
            type="button"
            disabled={!page.hasNext}
            onClick={() => setCurrentPage((value) => value + 1)}
            className="min-h-10 rounded-lg border border-[#dddddd] bg-white px-4 py-2 font-bold disabled:opacity-40 hover:bg-gray-50"
          >
            Sau
          </button>
        </div>
      )}
    </CustomerShell>
  );
};


export default CustomerOrdersPage;
