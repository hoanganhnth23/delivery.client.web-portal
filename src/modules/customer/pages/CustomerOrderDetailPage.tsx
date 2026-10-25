import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppDependencies } from '@/app/dependencies';
import type { Order } from '@/types/api.types';
import { CustomerShell } from '../components/CustomerShell';
import { formatCurrency, getErrorMessage } from '../utils';
import { ROUTES } from '@/utils/constants';
import { ORDER_STATUS_LABELS } from '@/utils/orderStatusLabels';
import { statusLabels } from '../orderStatus';
import { formatDateTime } from '@/utils/dateTime';

const cancelableStatuses: Order['status'][] = ['PENDING', 'CONFIRMED', 'FINDING_SHIPPER', 'WAIT_SHIPPER_CONFIRM', 'ASSIGNED'];
const terminalStatuses: Order['status'][] = ['DELIVERED', 'CANCELLED', 'SHIPPER_NOT_FOUND'];

interface StatusConfig {
  title: string;
  subtitle: string;
  iconName: string;
  bannerBg: string;
  textColor: string;
  iconColor: string;
}

const getStatusConfig = (status: Order['status'], cancelReason?: string | null): StatusConfig => {
  switch (status) {
    case 'CANCELLED':
      return {
        title: ORDER_STATUS_LABELS.CANCELLED,
        subtitle: cancelReason ? `Lý do hủy: ${cancelReason}` : 'Đơn hàng đã được hủy.',
        iconName: 'cancel',
        bannerBg: 'bg-[#fff4ee] border-[#ffd7cc]',
        textColor: 'text-[#d35433]',
        iconColor: 'text-[#ee4d2d]',
      };
    case 'DELIVERED':
      return {
        title: ORDER_STATUS_LABELS.DELIVERED,
        subtitle: 'Cảm ơn bạn đã đặt món. Chúc bạn ngon miệng!',
        iconName: 'check_circle',
        bannerBg: 'bg-[#f0fdf4] border-[#bbf7d0]',
        textColor: 'text-[#15803d]',
        iconColor: 'text-[#16a34a]',
      };
    case 'DELIVERING':
      return {
        title: ORDER_STATUS_LABELS.DELIVERING,
        subtitle: 'Tài xế đang trên đường mang món ngon đến bạn.',
        iconName: 'delivery_dining',
        bannerBg: 'bg-[#fff4ee] border-[#ffd7cc]',
        textColor: 'text-[#d35433]',
        iconColor: 'text-[#ee4d2d]',
      };
    case 'PICKED_UP':
      return {
        title: ORDER_STATUS_LABELS.PICKED_UP,
        subtitle: 'Tài xế đã nhận món từ quán và chuẩn bị di chuyển.',
        iconName: 'takeout_dining',
        bannerBg: 'bg-[#fff4ee] border-[#ffd7cc]',
        textColor: 'text-[#d35433]',
        iconColor: 'text-[#ee4d2d]',
      };
    case 'ASSIGNED':
      return {
        title: ORDER_STATUS_LABELS.ASSIGNED,
        subtitle: 'Tài xế đang đến nhà hàng để lấy món.',
        iconName: 'two_wheeler',
        bannerBg: 'bg-[#fff4ee] border-[#ffd7cc]',
        textColor: 'text-[#d35433]',
        iconColor: 'text-[#ee4d2d]',
      };
    case 'WAIT_SHIPPER_CONFIRM':
    case 'FINDING_SHIPPER':
      return {
        title: ORDER_STATUS_LABELS[status],
        subtitle: 'Hệ thống đang điều phối tài xế gần quán nhất.',
        iconName: 'two_wheeler',
        bannerBg: 'bg-[#fff4ee] border-[#ffd7cc]',
        textColor: 'text-[#d35433]',
        iconColor: 'text-[#ee4d2d]',
      };
    case 'CONFIRMED':
      return {
        title: ORDER_STATUS_LABELS.CONFIRMED,
        subtitle: 'Quán đang chuẩn bị món ngon cho bạn.',
        iconName: 'soup_kitchen',
        bannerBg: 'bg-[#fff4ee] border-[#ffd7cc]',
        textColor: 'text-[#d35433]',
        iconColor: 'text-[#ee4d2d]',
      };
    case 'PENDING':
      return {
        title: ORDER_STATUS_LABELS.PENDING,
        subtitle: 'Quán đang tiếp nhận đơn hàng của bạn.',
        iconName: 'pending_actions',
        bannerBg: 'bg-[#fff4ee] border-[#ffd7cc]',
        textColor: 'text-[#d35433]',
        iconColor: 'text-[#ee4d2d]',
      };
    case 'SHIPPER_NOT_FOUND':
      return {
        title: ORDER_STATUS_LABELS.SHIPPER_NOT_FOUND,
        subtitle: 'Hệ thống đang tiếp tục điều phối tài xế cho đơn này.',
        iconName: 'error',
        bannerBg: 'bg-amber-50 border-amber-200',
        textColor: 'text-amber-800',
        iconColor: 'text-amber-600',
      };
    default:
      return {
        title: statusLabels[status] || status,
        subtitle: 'Đơn hàng đang được xử lý',
        iconName: 'receipt_long',
        bannerBg: 'bg-[#f8f9fa] border-[#eeeeee]',
        textColor: 'text-[#555555]',
        iconColor: 'text-[#ee4d2d]',
      };
  }
};

interface TimelineStep {
  label: string;
  description: string;
  isDone: boolean;
  isCurrent: boolean;
  isCancelled?: boolean;
}

const getTimelineSteps = (order: Order): TimelineStep[] => {
  if (order.status === 'CANCELLED') {
    return [
      {
        label: 'Đã đặt đơn',
        description: formatDateTime(order.createdAt),
        isDone: true,
        isCurrent: false,
      },
      {
        label: 'Đã hủy đơn hàng',
        description: order.notes ? `Ghi chú: ${order.notes}` : 'Đơn hàng đã được hủy',
        isDone: true,
        isCurrent: true,
        isCancelled: true,
      },
    ];
  }

  let currentStageIndex = 0;
  if (order.status === 'CONFIRMED') currentStageIndex = 1;
  else if (['FINDING_SHIPPER', 'WAIT_SHIPPER_CONFIRM', 'ASSIGNED', 'SHIPPER_NOT_FOUND'].includes(order.status)) currentStageIndex = 2;
  else if (['PICKED_UP', 'DELIVERING'].includes(order.status)) currentStageIndex = 3;
  else if (order.status === 'DELIVERED') currentStageIndex = 4;

  const stageDefinitions = [
    { label: 'Đã đặt đơn', description: 'Đơn hàng gửi đến quán thành công' },
    { label: 'Quán đang chuẩn bị', description: 'Nhà hàng đã nhận đơn và chế biến' },
    { label: 'Tài xế nhận đơn', description: order.status === 'SHIPPER_NOT_FOUND' ? 'Đang tìm lại tài xế...' : 'Tài xế đang đến quán lấy món' },
    { label: 'Đang giao hàng', description: 'Tài xế đang mang món đến bạn' },
    { label: 'Giao hàng thành công', description: 'Đơn hàng đã hoàn thành' },
  ];

  return stageDefinitions.map((step, idx) => ({
    label: step.label,
    description: step.description,
    isDone: idx <= currentStageIndex,
    isCurrent: idx === currentStageIndex,
  }));
};

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

  const statusConfig = order ? getStatusConfig(order.status, order.notes) : null;
  const timelineSteps = order ? getTimelineSteps(order) : [];

  return (
    <CustomerShell title="Chi tiết đơn hàng">
      <div className="mb-4 text-xs text-[#777777] sm:mb-5 sm:text-sm">
        <Link to={ROUTES.CUSTOMER_ORDERS} className="font-bold text-[#ee4d2d] hover:underline">
          Đơn hàng của tôi
        </Link>
        <span className="mx-2">/</span>
        <span>Chi tiết đơn #{id || '—'}</span>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-sm text-[#777777]">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[#ee4d2d] border-t-transparent" />
            <span>Đang tải thông tin đơn hàng…</span>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:p-5">
          {error}
          <button type="button" onClick={() => void load()} className="ml-3 font-bold text-red-800 underline">
            Thử lại
          </button>
        </div>
      )}

      {!loading && order && statusConfig && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Main Column */}
          <section className="space-y-5">
            {/* ShopeeFood Status Hero Card */}
            <div className={`overflow-hidden rounded-xl border p-6 text-center shadow-sm sm:p-8 ${statusConfig.bannerBg}`}>
              <div className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm sm:h-20 sm:w-20 ${statusConfig.iconColor}`}>
                <span className="material-symbols-outlined text-4xl sm:text-5xl">{statusConfig.iconName}</span>
              </div>
              <h2 className={`text-xl font-black sm:text-2xl ${statusConfig.textColor}`}>
                {statusConfig.title}
              </h2>
              <p className="mt-1 text-xs text-[#666666] sm:text-sm">
                {statusConfig.subtitle}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-[#777777]">
                <span className="rounded bg-white/80 px-2.5 py-1 font-semibold border border-black/5">Đơn #{order.id}</span>
                <span className="rounded bg-white/80 px-2.5 py-1 font-semibold border border-black/5">{formatDateTime(order.createdAt)}</span>
                <span className="rounded bg-white/80 px-2.5 py-1 font-semibold border border-black/5">{order.restaurantName}</span>
              </div>
            </div>

            {/* Sơ đồ lộ trình minh họa khi có shipper / đang giao */}
            {['ASSIGNED', 'PICKED_UP', 'DELIVERING'].includes(order.status) && (
              <div className="overflow-hidden rounded-xl border border-[#eeeeee] bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-[#eeeeee] bg-[#fff8ed] px-4 py-3 text-xs text-[#927653] sm:text-sm">
                  <span className="font-bold text-[#b45309]">Sơ đồ lộ trình giao hàng</span>
                  <span className="text-[11px] text-[#b45309]">Minh họa lộ trình</span>
                </div>
                <div className="relative bg-[#edf0e9]">
                  <svg viewBox="0 0 390 180" className="h-auto w-full" role="img" aria-label="Lộ trình giao hàng">
                    <rect width="390" height="180" fill="#edf0e9" />
                    <path d="M0 35H390M0 90H390M0 145H390M55 0V180M150 0V180M290 0V180" stroke="white" strokeWidth="12" />
                    <path d="M350 0Q305 65 355 110T355 180" fill="none" stroke="#c1e5e9" strokeWidth="20" />
                    <rect x="175" y="95" width="70" height="35" rx="8" fill="#d1e3bf" />
                    <text x="188" y="116" fontSize="9" fill="#719063" fontWeight="bold">Công viên</text>
                    <path d="M70 135L110 110L160 85L240 65L320 40" stroke="white" strokeWidth="8" fill="none" />
                    <path d="M70 135L110 110L160 85L240 65L320 40" stroke="#ee4d2d" strokeWidth="4" fill="none" strokeDasharray={order.status === 'ASSIGNED' ? '6 4' : undefined} />
                    <circle cx="70" cy="135" r="12" fill="#fff" stroke="#ee4d2d" strokeWidth="2" />
                    <text x="65" y="140" fontSize="12" fill="#ee4d2d" fontWeight="bold">Q</text>
                    <text x="32" y="160" fontSize="10" fill="#555" fontWeight="bold">Quán ăn</text>
                    <circle cx="320" cy="40" r="12" fill="#ee4d2d" />
                    <text x="315" y="44" fontSize="11" fill="white" fontWeight="bold">⌂</text>
                    <text x="286" y="24" fontSize="10" fill="#555" fontWeight="bold">Nơi nhận</text>
                    {/* Driver marker */}
                    <g style={{ transform: order.status === 'DELIVERING' ? 'translate(230px, 60px)' : 'translate(100px, 115px)' }}>
                      <circle r="14" fill="#fff" stroke="#179b80" strokeWidth="2.5" />
                      <text x="-6" y="5" fontSize="16" fill="#179b80">➤</text>
                    </g>
                  </svg>
                </div>
                <div className="flex items-center justify-between p-4 text-xs sm:text-sm">
                  <div>
                    <b className="text-base font-bold text-[#ee4d2d] sm:text-lg">
                      {order.status === 'DELIVERING' ? 'Dự kiến còn ~15 phút' : 'Tài xế đang tới quán (~5-10 phút)'}
                    </b>
                    <p className="mt-0.5 text-xs text-[#777777]">{order.deliveryAddress}</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-[#f0fdf4] px-3 py-2 text-xs font-bold text-[#16a34a]">
                    <span className="material-symbols-outlined text-lg">two_wheeler</span>
                    <span>Tài xế DeliveryVN</span>
                  </div>
                </div>
              </div>
            )}

            {/* ShopeeFood Timeline Stepper */}
            <div className="rounded-xl border border-[#eeeeee] bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-base font-bold text-[#222222] sm:text-lg">Tiến độ đơn hàng</h2>
              <div className="mt-5 space-y-0">
                {timelineSteps.map((step, idx) => (
                  <div key={step.label} className="relative flex items-start gap-4 pb-6 last:pb-0">
                    {/* Connecting vertical line */}
                    {idx < timelineSteps.length - 1 && (
                      <span
                        className={`absolute left-[13px] top-[24px] h-[calc(100%-14px)] w-[2px] ${
                          timelineSteps[idx + 1].isDone
                            ? step.isCancelled
                              ? 'bg-[#fca5a5]'
                              : 'bg-[#ee4d2d]'
                            : 'bg-[#e5e7eb]'
                        }`}
                        aria-hidden="true"
                      />
                    )}

                    {/* Step bullet */}
                    <div className="relative z-10 flex shrink-0 items-center justify-center">
                      {step.isCancelled ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shadow-sm ring-4 ring-red-100">
                          <span className="material-symbols-outlined text-base font-bold">close</span>
                        </div>
                      ) : step.isCurrent ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ee4d2d] text-white shadow-md ring-4 ring-[#ffede6]">
                          {step.isDone && order.status === 'DELIVERED' ? (
                            <span className="material-symbols-outlined text-base font-bold">check</span>
                          ) : (
                            <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                          )}
                        </div>
                      ) : step.isDone ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ee4d2d] text-white shadow-sm">
                          <span className="material-symbols-outlined text-base font-bold">check</span>
                        </div>
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#d1d5db] bg-white">
                          <span className="h-2 w-2 rounded-full bg-[#9ca3af]" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm sm:text-base ${
                            step.isCancelled
                              ? 'font-bold text-red-600'
                              : step.isCurrent
                                ? 'font-bold text-[#ee4d2d]'
                                : step.isDone
                                  ? 'font-semibold text-[#1f2937]'
                                  : 'font-medium text-[#9ca3af]'
                          }`}
                        >
                          {step.label}
                        </span>
                        {step.isCurrent && (
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            step.isCancelled ? 'bg-red-50 text-red-700' : 'bg-[#fff3ee] text-[#ee4d2d]'
                          }`}>
                            Trạng thái hiện tại
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-[#777777] sm:text-sm">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Món đã đặt */}
            <div className="rounded-xl border border-[#eeeeee] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2 border-b border-[#eeeeee] pb-3">
                <span className="material-symbols-outlined text-[#ee4d2d]">storefront</span>
                <h2 className="text-base font-bold sm:text-lg">{order.restaurantName}</h2>
              </div>
              <div className="mt-3 divide-y divide-[#eeeeee]">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#fff4ee] font-bold text-[#ee4d2d]">
                        {item.quantity}×
                      </div>
                      <span className="truncate font-medium text-[#222222]">{item.menuItemName}</span>
                    </div>
                    <span className="shrink-0 font-bold text-[#222222]">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between border-t border-[#eeeeee] pt-4 text-sm font-bold">
                <span className="text-[#666666]">Tiền món ({order.items.reduce((s, i) => s + i.quantity, 0)} phần)</span>
                <span className="text-[#222222]">{formatCurrency(order.subtotalPrice)}</span>
              </div>
            </div>

            {/* Giao đến */}
            <div className="rounded-xl border border-[#eeeeee] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2 border-b border-[#eeeeee] pb-3">
                <span className="material-symbols-outlined text-[#ee4d2d]">location_on</span>
                <h2 className="text-base font-bold sm:text-lg">Địa chỉ nhận hàng</h2>
              </div>
              <div className="mt-3 space-y-1 text-sm">
                <p className="font-bold text-[#222222]">{order.customerName} · {order.customerPhone}</p>
                <p className="text-[#666666]">{order.deliveryAddress}</p>
                {order.deliveryAddress && (
                  <p className="text-xs text-[#999999] pt-1">Mã đơn: #{order.id}</p>
                )}
              </div>
            </div>
          </section>

          {/* Aside Column: Payment Summary & Cancel Button */}
          <aside className="h-fit rounded-xl border border-[#eeeeee] bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-24">
            <h2 className="text-base font-bold text-[#222222] sm:text-lg">Tóm tắt thanh toán</h2>
            <div className="mt-4 space-y-2.5 text-sm text-[#666666]">
              <div className="flex justify-between gap-3">
                <span>Tiền món</span>
                <span className="font-medium text-[#222222]">{formatCurrency(order.subtotalPrice)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Phí giao hàng</span>
                <span className="font-medium text-[#222222]">{formatCurrency(order.shippingFee)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between gap-3 text-[#16a34a]">
                  <span>Voucher giảm giá</span>
                  <span className="font-medium">-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-baseline justify-between border-t border-[#eeeeee] pt-4">
              <div>
                <span className="block text-sm font-bold text-[#222222]">Tổng thanh toán</span>
                <span className="text-xs text-[#888888]">Thanh toán khi nhận hàng (COD)</span>
              </div>
              <span className="text-xl font-black text-[#ee4d2d]">
                {formatCurrency(order.totalPrice)}
              </span>
            </div>

            {/* Cancel Action */}
            {cancelableStatuses.includes(order.status) && (
              <div className="mt-6 border-t border-[#eeeeee] pt-5">
                {!showCancel ? (
                  <button
                    type="button"
                    onClick={() => setShowCancel(true)}
                    className="min-h-11 w-full rounded-lg border border-[#ffd7cc] bg-[#fff5ef] px-4 py-2.5 text-sm font-bold text-[#c5371d] transition hover:bg-[#ffece4]"
                  >
                    Hủy đơn hàng
                  </button>
                ) : (
                  <div className="rounded-lg border border-[#ffd7cc] bg-[#fff5ef] p-4">
                    <label className="block text-xs font-bold text-[#c5371d]">
                      Lý do hủy đơn hàng
                      <textarea
                        value={cancelReason}
                        onChange={(event) => setCancelReason(event.target.value)}
                        placeholder="Vui lòng nhập lý do hủy đơn (đổi món, đổi địa chỉ, bận việc...)"
                        maxLength={500}
                        rows={3}
                        className="mt-2 w-full rounded-md border border-[#ffd7cc] bg-white p-2.5 text-xs text-[#222222] focus:border-[#ee4d2d] focus:outline-none"
                      />
                    </label>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCancel(false)}
                        className="min-h-9 flex-1 rounded-md border border-[#cccccc] bg-white px-3 py-1.5 text-xs font-bold text-[#666666] hover:bg-gray-50"
                      >
                        Đóng
                      </button>
                      <button
                        type="button"
                        onClick={() => void cancel()}
                        disabled={cancelling}
                        className="min-h-9 flex-1 rounded-md bg-[#ee4d2d] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#d73211] disabled:opacity-50"
                      >
                        {cancelling ? 'Đang hủy…' : 'Xác nhận hủy'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      )}
    </CustomerShell>
  );
};

export default CustomerOrderDetailPage;

