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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (targetPage: number) => {
    try { setLoading(true); setError(null); setPage(await orderService.getCustomerOrders(targetPage, 10)); }
    catch (caught) { setError(getErrorMessage(caught, 'Không thể tải lịch sử đơn hàng')); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(currentPage); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  return (
    <CustomerShell title="Đơn hàng của tôi">
      {loading && <p>Đang tải đơn hàng…</p>}
      {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">{error}<button type="button" onClick={() => void load(currentPage)} className="ml-3 font-bold underline">Thử lại</button></div>}
      {!loading && !error && page?.items.length === 0 && <div className="rounded-3xl border border-dashed border-[#d7c5af] bg-white p-12 text-center text-[#806c57]">Bạn chưa có đơn hàng nào. <Link to={ROUTES.HOME} className="font-bold text-[#a85d0c]">Đặt món ngay</Link></div>}
      <div className="space-y-4">{page?.items.map((order) => <Link key={order.id} to={ROUTES.CUSTOMER_ORDER(order.id)} className="block rounded-2xl border border-[#eadfce] bg-white p-5 transition hover:border-[#ed8a16] hover:shadow-md"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm text-[#806c57]">Đơn #{order.id} · {new Date(order.createdAt).toLocaleString('vi-VN')}</p><h2 className="mt-1 text-lg font-black">{order.restaurantName}</h2></div><span className="rounded-full bg-[#fff1dc] px-3 py-1.5 text-xs font-bold text-[#a85d0c]">{statusLabels[order.status]}</span></div><div className="mt-4 flex flex-wrap justify-between gap-3 text-sm text-[#806c57]"><span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} món · COD</span><strong className="text-base text-[#2d2116]">{formatCurrency(order.totalPrice)}</strong></div></Link>)}</div>
      {page && page.totalPages > 1 && <div className="mt-6 flex items-center justify-center gap-4"><button type="button" disabled={currentPage === 0} onClick={() => setCurrentPage((value) => value - 1)} className="rounded-lg border border-[#dfd2c1] px-4 py-2 font-bold disabled:opacity-40">Trước</button><span className="text-sm font-semibold">Trang {page.page + 1}/{page.totalPages}</span><button type="button" disabled={!page.hasNext} onClick={() => setCurrentPage((value) => value + 1)} className="rounded-lg border border-[#dfd2c1] px-4 py-2 font-bold disabled:opacity-40">Sau</button></div>}
    </CustomerShell>
  );
};

export default CustomerOrdersPage;
