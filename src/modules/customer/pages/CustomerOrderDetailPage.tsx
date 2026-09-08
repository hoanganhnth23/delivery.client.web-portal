import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppDependencies } from '@/app/dependencies';
import type { Order } from '@/types/api.types';
import { CustomerShell } from '../components/CustomerShell';
import { formatCurrency, getErrorMessage } from '../utils';
import { ROUTES } from '@/utils/constants';
import { statusLabels } from '../orderStatus';

const cancelableStatuses: Order['status'][] = ['PENDING', 'CONFIRMED', 'FINDING_SHIPPER', 'WAIT_SHIPPER_CONFIRM', 'ASSIGNED'];
const terminalStatuses: Order['status'][] = ['DELIVERED', 'CANCELLED', 'SHIPPER_NOT_FOUND'];

const CustomerOrderDetailPage = () => {
  const { order: orderService } = useAppDependencies();
  const { orderId } = useParams();
  const id = Number(orderId);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [pollDelayMs, setPollDelayMs] = useState(10_000);
  const pollInFlight = useRef(false);

  const load = useCallback(async () => {
    if (!Number.isSafeInteger(id) || id <= 0) { setError('Đơn hàng không hợp lệ'); setLoading(false); return; }
    try {
      setError(null);
      setOrder(await orderService.getOrderById(id));
      setPollDelayMs(10_000);
    } catch (caught) {
      setPollDelayMs((current) => Math.min(current * 2, 60_000));
      setError(getErrorMessage(caught, 'Không thể tải đơn hàng'));
    }
    finally { setLoading(false); }
  }, [id, orderService]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!order || terminalStatuses.includes(order.status) || typeof document === 'undefined') return;
    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'visible' || pollInFlight.current) return;
      pollInFlight.current = true;
      void load().finally(() => { pollInFlight.current = false; });
    }, pollDelayMs);
    return () => window.clearInterval(interval);
  }, [load, order, pollDelayMs]);

  const cancel = async () => {
    if (!order) return;
    try { setCancelling(true); setError(null); setOrder(await orderService.cancelOrder(order.id, cancelReason)); setShowCancel(false); }
    catch (caught) { setError(getErrorMessage(caught, 'Không thể hủy đơn hàng')); }
    finally { setCancelling(false); }
  };

  return (
    <CustomerShell title="Chi tiết đơn hàng">
      <div className="mb-4 text-xs text-[#777777] sm:mb-5 sm:text-sm"><Link to={ROUTES.CUSTOMER_ORDERS} className="font-bold text-[#c5371d]">Đơn hàng của tôi</Link> <span className="mx-2">/</span> Chi tiết</div>
      {loading && <p>Đang tải đơn hàng…</p>}
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:p-5">{error}<button type="button" onClick={() => void load()} className="ml-3 font-bold underline">Thử lại</button></div>}
      {!loading && order && <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-6">
          <div className="rounded-lg border border-[#eeeeee] bg-white p-4 sm:rounded-lg sm:p-6"><div className="flex flex-wrap justify-between gap-3"><div className="min-w-0"><p className="text-sm text-[#777777]">Đơn #{order.id}</p><h2 className="mt-1 break-words text-xl font-bold sm:text-2xl">{order.restaurantName}</h2></div><span className="shrink-0 rounded-full bg-[#fff3ee] px-3 py-1.5 text-xs font-bold text-[#c5371d] sm:py-2 sm:text-sm">{statusLabels[order.status]}</span></div><div className="mt-6 grid gap-2 sm:mt-7 sm:grid-cols-2 sm:gap-3">{['PENDING', 'CONFIRMED', 'ASSIGNED', 'PICKED_UP', 'DELIVERING', 'DELIVERED'].map((status) => <div key={status} className={`rounded-md border p-3 text-sm ${status === order.status ? 'border-[#ee4d2d] bg-[#fff5ef] font-bold text-[#c5371d]' : 'border-[#eeeeee] text-[#777777]'}`}>{statusLabels[status as Order['status']]}</div>)}</div>{order.status === 'SHIPPER_NOT_FOUND' && <p className="mt-4 rounded-md bg-amber-50 p-4 text-sm font-semibold text-amber-800">Hiện chưa tìm được shipper cho đơn này.</p>}</div>
          <div className="rounded-lg border border-[#eeeeee] bg-white p-4 sm:rounded-lg sm:p-6"><h2 className="text-xl font-bold">Món đã đặt</h2><div className="mt-4 divide-y divide-[#eeeeee]">{order.items.map((item) => <div key={item.id} className="flex justify-between gap-3 py-3 text-sm"><span className="min-w-0 break-words">{item.quantity} × {item.menuItemName}</span><span className="shrink-0 font-bold">{formatCurrency(item.price * item.quantity)}</span></div>)}</div><div className="mt-4 flex justify-between border-t border-[#eeeeee] pt-4 font-bold"><span>Tổng COD</span><span className="text-[#ee4d2d]">{formatCurrency(order.totalPrice)}</span></div></div>
          <div className="rounded-lg border border-[#eeeeee] bg-white p-4 sm:rounded-lg sm:p-6"><h2 className="text-xl font-bold">Giao đến</h2><p className="mt-3 font-semibold">{order.customerName} · {order.customerPhone}</p><p className="mt-1 break-words text-[#777777]">{order.deliveryAddress}</p></div>
        </section>
        <aside className="h-fit rounded-lg border border-[#eeeeee] bg-white p-4 sm:rounded-lg sm:p-6 lg:sticky lg:top-24"><h2 className="text-xl font-bold">Tóm tắt thanh toán</h2><div className="mt-5 space-y-3 text-sm text-[#777777]"><div className="flex justify-between gap-3"><span>Tiền món</span><span>{formatCurrency(order.subtotalPrice)}</span></div><div className="flex justify-between gap-3"><span>Phí giao hàng</span><span>{formatCurrency(order.shippingFee)}</span></div><div className="flex justify-between gap-3"><span>Giảm giá</span><span>-{formatCurrency(order.discountAmount)}</span></div></div><div className="mt-5 flex justify-between border-t border-[#eeeeee] pt-5 text-lg font-bold"><span>COD</span><span className="text-[#ee4d2d]">{formatCurrency(order.totalPrice)}</span></div>{cancelableStatuses.includes(order.status) && <>{!showCancel ? <button type="button" onClick={() => setShowCancel(true)} className="mt-6 min-h-11 w-full rounded-md border border-red-300 px-4 py-3 font-bold text-red-600">Hủy đơn hàng</button> : <div className="mt-6"><label className="text-sm font-bold">Lý do hủy<textarea value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} maxLength={500} rows={3} className="mt-2 w-full rounded-md border border-[#dddddd] p-3" /></label><div className="mt-3 flex gap-2"><button type="button" onClick={() => setShowCancel(false)} className="min-h-10 flex-1 rounded-md border border-[#dddddd] px-3 py-2 font-bold">Đóng</button><button type="button" onClick={() => void cancel()} disabled={cancelling} className="min-h-10 flex-1 rounded-md bg-red-600 px-3 py-2 font-bold text-white disabled:opacity-50">{cancelling ? 'Đang hủy…' : 'Xác nhận hủy'}</button></div></div>}</>}</aside>
      </div>}
    </CustomerShell>
  );
};

export default CustomerOrderDetailPage;
