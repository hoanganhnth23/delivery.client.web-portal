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
      <div className="mb-5 text-sm text-[#806c57]"><Link to={ROUTES.CUSTOMER_ORDERS} className="font-bold text-[#a85d0c]">Đơn hàng của tôi</Link> <span className="mx-2">/</span> Chi tiết</div>
      {loading && <p>Đang tải đơn hàng…</p>}
      {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">{error}<button type="button" onClick={() => void load()} className="ml-3 font-bold underline">Thử lại</button></div>}
      {!loading && !error && order && <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-[#eadfce] bg-white p-6"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-sm text-[#806c57]">Đơn #{order.id}</p><h2 className="mt-1 text-2xl font-black">{order.restaurantName}</h2></div><span className="rounded-full bg-[#fff1dc] px-3 py-2 text-sm font-bold text-[#a85d0c]">{statusLabels[order.status]}</span></div><div className="mt-7 grid gap-3 sm:grid-cols-2">{['PENDING', 'CONFIRMED', 'ASSIGNED', 'PICKED_UP', 'DELIVERING', 'DELIVERED'].map((status) => <div key={status} className={`rounded-xl border p-3 text-sm ${status === order.status ? 'border-[#ed8a16] bg-[#fff8ed] font-bold text-[#a85d0c]' : 'border-[#eadfce] text-[#806c57]'}`}>{statusLabels[status as Order['status']]}</div>)}</div>{order.status === 'SHIPPER_NOT_FOUND' && <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">Hiện chưa tìm được shipper cho đơn này.</p>}</div>
          <div className="rounded-3xl border border-[#eadfce] bg-white p-6"><h2 className="text-xl font-black">Món đã đặt</h2><div className="mt-4 divide-y divide-[#eadfce]">{order.items.map((item) => <div key={item.id} className="flex justify-between gap-4 py-3 text-sm"><span>{item.quantity} × {item.menuItemName}</span><span className="font-bold">{formatCurrency(item.price * item.quantity)}</span></div>)}</div><div className="mt-4 flex justify-between border-t border-[#eadfce] pt-4 font-black"><span>Tổng COD</span><span className="text-[#ed8a16]">{formatCurrency(order.totalPrice)}</span></div></div>
          <div className="rounded-3xl border border-[#eadfce] bg-white p-6"><h2 className="text-xl font-black">Giao đến</h2><p className="mt-3 font-semibold">{order.customerName} · {order.customerPhone}</p><p className="mt-1 text-[#806c57]">{order.deliveryAddress}</p></div>
        </section>
        <aside className="h-fit rounded-3xl border border-[#eadfce] bg-white p-6 lg:sticky lg:top-24"><h2 className="text-xl font-black">Tóm tắt thanh toán</h2><div className="mt-5 space-y-3 text-sm text-[#806c57]"><div className="flex justify-between"><span>Tiền món</span><span>{formatCurrency(order.subtotalPrice)}</span></div><div className="flex justify-between"><span>Phí giao hàng</span><span>{formatCurrency(order.shippingFee)}</span></div><div className="flex justify-between"><span>Giảm giá</span><span>-{formatCurrency(order.discountAmount)}</span></div></div><div className="mt-5 flex justify-between border-t border-[#eadfce] pt-5 text-lg font-black"><span>COD</span><span className="text-[#ed8a16]">{formatCurrency(order.totalPrice)}</span></div>{cancelableStatuses.includes(order.status) && <>{!showCancel ? <button type="button" onClick={() => setShowCancel(true)} className="mt-6 w-full rounded-xl border border-red-300 px-4 py-3 font-bold text-red-600">Hủy đơn hàng</button> : <div className="mt-6"><label className="text-sm font-bold">Lý do hủy<textarea value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} maxLength={500} rows={3} className="mt-2 w-full rounded-xl border border-[#dfd2c1] p-3" /></label><div className="mt-3 flex gap-2"><button type="button" onClick={() => setShowCancel(false)} className="flex-1 rounded-xl border border-[#dfd2c1] px-3 py-2 font-bold">Đóng</button><button type="button" onClick={() => void cancel()} disabled={cancelling} className="flex-1 rounded-xl bg-red-600 px-3 py-2 font-bold text-white disabled:opacity-50">{cancelling ? 'Đang hủy…' : 'Xác nhận hủy'}</button></div></div>}</>}</aside>
      </div>}
    </CustomerShell>
  );
};

export default CustomerOrderDetailPage;
