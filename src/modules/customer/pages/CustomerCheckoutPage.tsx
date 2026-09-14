import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDependencies } from '@/app/dependencies';
import type { CheckoutPreview, UserAddress } from '@/types/api.types';
import type { ApiClientError } from '@/services/api/apiClient';
import type { CustomerVoucher } from '@/services/api/promotionService';
import { formatAddress } from '@/services/api/addressService';
import { CustomerShell } from '../components/CustomerShell';
import { useCustomerCart } from '../cart/useCustomerCart';
import { formatCurrency, getErrorMessage, isVietnamCoordinate } from '../utils';
import { ROUTES } from '@/utils/constants';

const ATTEMPT_STORAGE_KEY = 'delivery.customer-order-attempt.v1';

const createUuid = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const isApiError = (value: unknown): value is ApiClientError =>
  value instanceof Error && typeof (value as Partial<ApiClientError>).code === 'string';

const voucherLayer = (voucher: CustomerVoucher): string => voucher.layer
  ?? (voucher.rewardType === 'FREESHIP'
    ? 'FREESHIP'
    : voucher.creatorType === 'SHOP' || voucher.scopeType === 'SHOP'
      ? 'SHOP_DISCOUNT'
      : 'PLATFORM_DISCOUNT');

const CustomerCheckoutPage = () => {
  const { auth, address: addressService, order: orderService, promotion } = useAppDependencies();
  const { cart, clear } = useCustomerCart();
  const navigate = useNavigate();
  const userId = auth.getCurrentUser()?.id;
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [note, setNote] = useState('');
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mustConfirmFreshQuote, setMustConfirmFreshQuote] = useState(false);
  const [vouchers, setVouchers] = useState<CustomerVoucher[]>([]);
  const [voucherEnabled, setVoucherEnabled] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [selectedVoucherIds, setSelectedVoucherIds] = useState<number[]>([]);
  const [voucherCode, setVoucherCode] = useState('');
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const placingRef = useRef(false);

  const checkoutVouchers = useMemo(
    () => vouchers.filter((voucher) =>
      voucher.scopeType === 'ALL' || voucher.scopeRefId === cart?.restaurantId),
    [cart?.restaurantId, vouchers],
  );

  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  const selectedVoucherLayers = useMemo(() => new Set(
    checkoutVouchers
      .filter((voucher) => selectedVoucherIds.includes(voucher.id))
      .map(voucherLayer),
  ), [checkoutVouchers, selectedVoucherIds]);

  useEffect(() => {
    setSelectedVoucherIds((current) => {
      const layers = new Set<string>();
      const valid = current.filter((id) => {
        const voucher = checkoutVouchers.find((candidate) => candidate.id === id);
        if (!voucher) return false;
        const layer = voucherLayer(voucher);
        if (layers.has(layer)) return false;
        layers.add(layer);
        return true;
      });
      return valid.length === current.length ? current : valid;
    });
  }, [checkoutVouchers]);

  const loadAddresses = useCallback(async () => {
    if (!userId) return;
    try {
      setLoadingAddresses(true);
      const loaded = await addressService.getUserAddresses(userId);
      setAddresses(loaded);

      // Check if session storage has selected address from addresses page
      let preferredId: number | null = null;
      try {
        const storedId = window.sessionStorage.getItem('delivery.selected-address-id');
        if (storedId) {
          const parsed = Number(storedId);
          if (loaded.some((a) => a.id === parsed)) {
            preferredId = parsed;
          }
        }
      } catch {
        // Ignore
      }

      setSelectedAddressId((current) =>
        preferredId ?? current ?? loaded.find((address) => address.isDefault)?.id ?? loaded[0]?.id ?? null,
      );
    } catch (caught) {
      setError(getErrorMessage(caught, 'Không thể tải địa chỉ giao hàng'));
    } finally {
      setLoadingAddresses(false);
    }
  }, [addressService, userId]);

  useEffect(() => { void loadAddresses(); }, [loadAddresses]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([promotion.getVoucherCapability(), promotion.getMyVouchers()]).then(([capability, wallet]) => {
      if (cancelled) return;
      setVoucherEnabled(capability.enabled);
      setVouchers(wallet);
    }).catch(() => { if (!cancelled) setVoucherEnabled(false); });
    return () => { cancelled = true; };
  }, [promotion]);

  const refreshPreview = useCallback(async (preserveFreshQuoteConfirmation = false) => {
    if (!cart || !selectedAddress || !isVietnamCoordinate(selectedAddress.latitude, selectedAddress.longitude)) {
      setPreview(null);
      return;
    }
    try {
      setPreviewLoading(true);
      setError(null);
      const next = await orderService.checkoutPreview({
        ...(cart.livestreamId ? { livestreamId: cart.livestreamId } : {}),
        restaurantId: cart.restaurantId,
        deliveryLat: selectedAddress.latitude!,
        deliveryLng: selectedAddress.longitude!,
        items: cart.items.map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity })),
        ...(voucherEnabled ? { selectedVoucherIds, selectionMode } : {}),
      });
      setPreview(next);
      if (!preserveFreshQuoteConfirmation) setMustConfirmFreshQuote(false);
    } catch (caught) {
      setPreview(null);
      setError(getErrorMessage(caught, 'Không thể tính giá checkout'));
    } finally {
      setPreviewLoading(false);
    }
  }, [cart, orderService, selectedAddress, selectedVoucherIds, selectionMode, voucherEnabled]);

  useEffect(() => { void refreshPreview(); }, [refreshPreview]);

  const handleCollectVoucher = async () => {
    const code = voucherCode.trim();
    if (!code) return;
    try {
      await promotion.collectVoucher(code);
      setVouchers(await promotion.getMyVouchers());
      setVoucherCode('');
      setNotice('Đã lưu voucher vào ví và cập nhật báo giá.');
      await refreshPreview();
    } catch (caught) {
      setError(getErrorMessage(caught, 'Mã voucher không hợp lệ hoặc đã được lưu.'));
    }
  };

  const toggleVoucher = (voucher: CustomerVoucher) => {
    setSelectedVoucherIds((current) => {
      if (current.includes(voucher.id)) return current.filter((id) => id !== voucher.id);
      if (current.length >= 3 || selectedVoucherLayers.has(voucherLayer(voucher))) return current;
      return [...current, voucher.id];
    });
  };

  const placeOrder = async () => {
    if (!cart || !selectedAddress || !preview) {
      setError('Vui lòng chọn giỏ hàng, địa chỉ và báo giá hợp lệ');
      return;
    }
    if (preview.unavailableItemIds.length > 0) {
      setError('Có món không còn khả dụng. Vui lòng quay lại giỏ hàng để cập nhật.');
      return;
    }
    if (!isVietnamCoordinate(selectedAddress.latitude, selectedAddress.longitude)) {
      setError('Địa chỉ đang thiếu tọa độ giao hàng hợp lệ');
      return;
    }
    if (placingRef.current) return;
    if (mustConfirmFreshQuote) {
      setNotice('Giá mới đã được tải. Vui lòng kiểm tra và bấm đặt đơn lại.');
      return;
    }

    const request = {
      ...(cart.livestreamId ? { livestreamId: cart.livestreamId } : {}),
      quoteId: preview.quoteId,
      restaurantId: cart.restaurantId,
      deliveryAddress: formatAddress(selectedAddress),
      deliveryLat: selectedAddress.latitude!,
      deliveryLng: selectedAddress.longitude!,
      customerName: selectedAddress.recipientName,
      customerPhone: selectedAddress.phoneNumber,
      paymentMethod: 'COD' as const,
      ...(voucherEnabled ? {
        voucherIds: selectionMode === 'AUTO' ? [] : selectedVoucherIds,
        selectionMode,
      } : {}),
      notes: note.trim() || undefined,
      items: cart.items.map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity, notes: item.notes })),
    };
    const fingerprint = JSON.stringify(request);
    let key = '';
    placingRef.current = true;
    try {
      const stored = window.sessionStorage.getItem(ATTEMPT_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) as { key?: string; fingerprint?: string } : null;
      key = parsed?.fingerprint === fingerprint && typeof parsed.key === 'string' ? parsed.key : createUuid();
    } catch {
      key = createUuid();
    }
    window.sessionStorage.setItem(ATTEMPT_STORAGE_KEY, JSON.stringify({ key, fingerprint, quoteId: preview.quoteId }));

    try {
      setPlacing(true);
      setError(null);
      const result = await orderService.createCustomerOrder(request, key);
      window.sessionStorage.removeItem(ATTEMPT_STORAGE_KEY);
      clear();
      navigate(ROUTES.CUSTOMER_ORDER(result.order.id), { replace: true });
    } catch (caught) {
      const code = isApiError(caught) ? caught.code : undefined;
      if (code === 'PRICE_CHANGED') {
        setMustConfirmFreshQuote(true);
        setNotice('Giá món đã thay đổi. Hệ thống đã lấy lại báo giá mới, hãy kiểm tra trước khi đặt.');
        window.sessionStorage.removeItem(ATTEMPT_STORAGE_KEY);
        await refreshPreview(true);
      } else if (code === 'QUOTE_EXPIRED' || code === 'QUOTE_MISMATCH' || code === 'QUOTE_ALREADY_USED') {
        window.sessionStorage.removeItem(ATTEMPT_STORAGE_KEY);
        setNotice('Báo giá đã thay đổi. Hệ thống đang tính lại, bạn hãy xác nhận lại.');
        await refreshPreview();
      } else if (code === 'IDEMPOTENCY_IN_PROGRESS') {
        setError('Yêu cầu đặt đơn vẫn đang được xử lý. Hãy thử lại với cùng nút Đặt đơn.');
      } else {
        setError(getErrorMessage(caught, 'Không thể đặt đơn. Bạn có thể thử lại an toàn.'));
      }
    } finally {
      placingRef.current = false;
      setPlacing(false);
    }
  };

  if (!cart) {
    return (
      <CustomerShell title="Xác nhận đơn hàng">
        <div className="rounded-2xl border border-dashed border-[#dddddd] bg-white p-8 text-center sm:p-12">
          <span className="material-symbols-outlined text-5xl text-[#dacbc3]">shopping_bag</span>
          <h2 className="mt-3 text-lg font-bold text-[#222222]">Chưa có món trong giỏ</h2>
          <p className="mt-1 text-sm text-[#777777]">Chọn món ăn yêu thích để bắt đầu đặt hàng.</p>
          <Link
            to={ROUTES.HOME}
            className="mt-5 inline-flex items-center rounded-xl bg-[#ee4d2d] px-5 py-2.5 font-bold text-white shadow-sm hover:bg-[#d84023]"
          >
            Khám phá quán ăn
          </Link>
        </div>
      </CustomerShell>
    );
  }

  const totalItemsCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CustomerShell title="Xác nhận đơn hàng">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Main Column */}
        <section className="space-y-4">
          {/* ShopeeFood Checkout Address Banner (.sf-checkout-address) */}
          <div
            onClick={() => {
              if (addresses.length > 0) setShowAddressModal(true);
              else navigate(ROUTES.CUSTOMER_ADDRESSES + '?context=checkout');
            }}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-[#eeeeee] border-b-4 border-b-[#f1b3a4] bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5"
            role="button"
            tabIndex={0}
            aria-label="Chọn hoặc đổi địa chỉ giao hàng"
          >
            <div className="flex items-start gap-3.5">
              <span className="material-symbols-outlined mt-0.5 text-2xl text-[#ee4d2d]" aria-hidden="true">
                location_on
              </span>
              <div className="min-w-0 flex-1">
                {loadingAddresses ? (
                  <div className="flex items-center gap-2 py-1 text-xs text-[#888888]">
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#ee4d2d] border-t-transparent" />
                    <span>Đang tải địa chỉ giao hàng…</span>
                  </div>
                ) : selectedAddress ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <b className="text-sm font-bold text-[#222222] sm:text-base">
                        {selectedAddress.recipientName} · {selectedAddress.phoneNumber}
                      </b>
                      <span className="rounded border border-[#dddddd] bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-[#555555]">
                        {selectedAddress.label}
                      </span>
                      {selectedAddress.isDefault && (
                        <span className="rounded border border-[#ee4d2d] bg-[#fff5ef] px-2 py-0.5 text-[11px] font-bold text-[#ee4d2d]">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[#666666] sm:text-sm leading-relaxed">
                      {formatAddress(selectedAddress)}
                    </p>
                    {!isVietnamCoordinate(selectedAddress.latitude, selectedAddress.longitude) && (
                      <p className="mt-1.5 text-xs font-bold text-red-600">
                        ⚠ Địa chỉ này đang thiếu tọa độ giao hàng hợp lệ. Vui lòng bấm để cập nhật.
                      </p>
                    )}
                  </>
                ) : (
                  <div>
                    <b className="text-sm font-bold text-[#ee4d2d] sm:text-base">Thêm địa chỉ giao hàng</b>
                    <p className="mt-0.5 text-xs text-[#777777]">Chưa chọn địa chỉ nhận món. Bấm để chọn hoặc thêm mới.</p>
                  </div>
                )}
              </div>
              <span className="material-symbols-outlined text-xl text-[#999999] transition group-hover:translate-x-0.5" aria-hidden="true">
                chevron_right
              </span>
            </div>
          </div>

          {/* Restaurant & Order Items Block (.sf-block) */}
          <div className="rounded-2xl border border-[#eeeeee] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between border-b border-[#eeeeee] pb-3.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-[#ee4d2d]">storefront</span>
                <h2 className="truncate text-base font-bold text-[#222222] sm:text-lg">
                  {cart.restaurantName}
                </h2>
              </div>
              <span className="shrink-0 text-xs text-[#888888]">Giao hàng · ~20–30 phút</span>
            </div>

            {/* Item lines */}
            <div className="mt-3 divide-y divide-[#f2f2f2]">
              {cart.items.map((item) => (
                <div key={item.menuItemId} className="flex items-start gap-3 py-3 text-sm">
                  <span className="flex h-7 min-w-7 items-center justify-center rounded-md border border-[#ffd7cc] bg-[#fff5f2] text-xs font-bold text-[#ee4d2d]">
                    {item.quantity}×
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-[#222222]">{item.menuItemName}</span>
                    {item.notes && <p className="mt-0.5 text-xs text-[#888888]">{item.notes}</p>}
                  </div>
                  <b className="shrink-0 font-bold text-[#222222]">
                    {formatCurrency(item.price * item.quantity)}
                  </b>
                </div>
              ))}
            </div>

            {/* Note for restaurant (.sf-note) */}
            <div className="mt-4 border-t border-[#eeeeee] pt-3">
              <label className="block text-xs font-bold text-[#555555]">
                Ghi chú cho quán
                <input
                  type="text"
                  maxLength={500}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: ít cay, không hành, để riêng nước chấm..."
                  className="mt-1.5 w-full rounded-xl border border-[#dddddd] bg-[#fafafa] px-3.5 py-2.5 text-xs font-normal outline-none focus:border-[#ee4d2d] focus:bg-white focus:ring-2 focus:ring-[#ee4d2d]/20 sm:text-sm"
                />
              </label>
            </div>
          </div>

          {/* ShopeeFood Voucher Block */}
          {voucherEnabled && (
            <div className="rounded-2xl border border-[#eeeeee] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#ee4d2d]" aria-hidden="true">
                    confirmation_number
                  </span>
                  <h2 className="text-base font-bold text-[#222222] sm:text-lg">Voucher</h2>
                </div>
                <div className="flex w-full gap-2 text-xs sm:w-auto">
                  <button
                    type="button"
                    className={`rounded-full px-3.5 py-1.5 font-bold transition ${
                      selectionMode === 'AUTO' ? 'bg-[#ee4d2d] text-white shadow-sm' : 'bg-[#fff5ef] text-[#ee4d2d]'
                    }`}
                    onClick={() => {
                      setSelectionMode('AUTO');
                      setSelectedVoucherIds([]);
                    }}
                  >
                    Tự động
                  </button>
                  <button
                    type="button"
                    className={`rounded-full px-3.5 py-1.5 font-bold transition ${
                      selectionMode === 'MANUAL' ? 'bg-[#ee4d2d] text-white shadow-sm' : 'bg-[#fff5ef] text-[#ee4d2d]'
                    }`}
                    onClick={() => setSelectionMode('MANUAL')}
                  >
                    Tự chọn
                  </button>
                </div>
              </div>

              {/* Input voucher code */}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  value={voucherCode}
                  onChange={(event) => setVoucherCode(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void handleCollectVoucher();
                  }}
                  placeholder="Nhập mã để lưu vào ví"
                  className="min-w-0 flex-1 rounded-xl border border-[#dddddd] px-3.5 py-2.5 text-xs outline-none focus:border-[#ee4d2d] focus:ring-2 focus:ring-[#ee4d2d]/20 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => void handleCollectVoucher()}
                  disabled={!voucherCode.trim()}
                  className="min-h-10 rounded-xl bg-[#222222] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-black disabled:opacity-50 sm:shrink-0 sm:text-sm"
                >
                  Lưu mã
                </button>
              </div>

              {/* Manual vouchers selection list */}
              {selectionMode === 'MANUAL' && (
                <div className="mt-4 grid gap-2">
                  {checkoutVouchers.length === 0 ? (
                    <p className="py-2 text-xs text-[#888888]">Chưa có voucher áp dụng cho quán này.</p>
                  ) : (
                    checkoutVouchers.map((voucher) => {
                      const checked = selectedVoucherIds.includes(voucher.id);
                      const disabled = !checked && selectedVoucherLayers.has(voucherLayer(voucher));
                      return (
                        <label
                          key={voucher.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-xs transition ${
                            checked ? 'border-[#ee4d2d] bg-[#fff9f6]' : 'border-[#eeeeee]'
                          } ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-gray-300'}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={() => toggleVoucher(voucher)}
                            className="h-4 w-4 rounded text-[#ee4d2d] focus:ring-[#ee4d2d]"
                          />
                          <span className="min-w-0 flex-1">
                            <b className="font-bold text-[#222222]">{voucher.code}</b> · {voucher.name}
                            <br />
                            <span className="text-[11px] text-[#777777]">{voucherLayer(voucher)}</span>
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              )}

              {selectionMode === 'AUTO' && (
                <p className="mt-3 text-xs text-[#888888]">
                  Hệ thống tự động áp dụng các voucher tốt nhất cho đơn hàng của bạn.
                </p>
              )}

              <p className="mt-2 text-[11px] text-[#999999]">
                Tối đa 3 voucher, mỗi lớp một mã. Voucher không dùng chung Flash Sale.
              </p>
            </div>
          )}

          {/* Payment Method (.sf-block sf-row) */}
          <div className="flex items-center gap-3 rounded-2xl border border-[#eeeeee] bg-white p-4 shadow-sm sm:p-5">
            <span className="material-symbols-outlined text-2xl text-[#16a34a]" aria-hidden="true">
              payments
            </span>
            <div className="min-w-0 flex-1">
              <b className="block text-sm font-bold text-[#222222] sm:text-base">
                Thanh toán khi nhận hàng (COD)
              </b>
              <small className="block text-xs text-[#777777]">
                Thanh toán bằng tiền mặt trực tiếp cho tài xế khi nhận món
              </small>
            </div>
            <span className="material-symbols-outlined text-xl text-[#16a34a]">check_circle</span>
          </div>

          {/* Error & Status Alerts */}
          {error && (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
          {notice && (
            <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
              {notice}
            </div>
          )}

          <p className="px-2 text-xs text-[#999999]">
            Kiểm tra kỹ thông tin địa chỉ và danh sách món ăn trước khi nhấn Đặt đơn.
          </p>
        </section>

        {/* Sidebar Column: Cost Breakdown & Order Button */}
        <aside className="h-fit rounded-2xl border border-[#eeeeee] bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-24 space-y-4">
          <h2 className="text-base font-bold text-[#222222] sm:text-lg">Chi tiết thanh toán</h2>

          <div className="space-y-2.5 text-sm text-[#666666]">
            <div className="flex justify-between">
              <span>Tổng tiền món ({totalItemsCount} món)</span>
              <span className="font-medium text-[#222222]">
                {preview ? formatCurrency(preview.subtotal) : '…'}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Phí giao hàng</span>
              <span className="font-medium text-[#222222]">
                {preview ? formatCurrency(preview.shippingFee) : '…'}
              </span>
            </div>

            {preview && preview.discountAmount > 0 && (
              <div className="flex justify-between text-[#16a34a] font-medium">
                <span>Ưu đãi voucher</span>
                <span>-{formatCurrency(preview.discountAmount)}</span>
              </div>
            )}
          </div>

          {/* Applied Vouchers breakdown */}
          {preview && (preview.appliedVouchers ?? []).length > 0 && (
            <div className="space-y-1.5 rounded-xl bg-green-50/80 p-3 text-xs text-green-900">
              {(preview.appliedVouchers ?? []).map((voucher) => (
                <div key={`${voucher.layer}-${voucher.voucherId}`} className="flex justify-between">
                  <span>
                    <b>{voucher.code}</b> ({voucher.layer})
                  </span>
                  <span>-{formatCurrency(voucher.discountAmount)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Total Price */}
          <div className="flex items-baseline justify-between border-t border-[#eeeeee] pt-4">
            <div>
              <span className="block text-sm font-bold text-[#222222]">Tổng COD</span>
              <span className="text-[11px] text-[#888888]">Thanh toán khi nhận hàng</span>
            </div>
            <b className="text-xl font-black text-[#ee4d2d] sm:text-2xl">
              {preview ? formatCurrency(preview.totalPrice) : '…'}
            </b>
          </div>

          {previewLoading && (
            <div className="flex items-center gap-2 text-xs text-[#888888]">
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#ee4d2d] border-t-transparent" />
              <span>Đang tính lại giá từ server…</span>
            </div>
          )}

          {/* Main Action Button */}
          <button
            type="button"
            onClick={() => void placeOrder()}
            disabled={
              placing ||
              previewLoading ||
              !preview ||
              preview.unavailableItemIds.length > 0 ||
              !selectedAddress ||
              (selectionMode === 'MANUAL' && selectedVoucherIds.length === 0)
            }
            className="w-full rounded-xl bg-[#ee4d2d] py-3.5 font-bold text-white shadow-md transition hover:bg-[#d84023] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none sm:text-base"
          >
            {placing ? 'Đang gửi đơn hàng…' : 'Đặt đơn COD'}
          </button>
        </aside>
      </div>

      {/* Address Selection Modal */}
      {showAddressModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="address-modal-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-center justify-between border-b border-[#eeeeee] pb-3.5">
              <h3 id="address-modal-title" className="text-base font-bold text-[#222222] sm:text-lg">
                Chọn địa chỉ giao hàng
              </h3>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                className="rounded-full p-1 text-[#777777] hover:bg-gray-100"
                aria-label="Đóng"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mt-4 max-h-[60vh] space-y-2.5 overflow-y-auto pr-1">
              {addresses.map((address) => {
                const isSelected = address.id === selectedAddressId;
                return (
                  <div
                    key={address.id}
                    onClick={() => {
                      setSelectedAddressId(address.id);
                      setShowAddressModal(false);
                    }}
                    className={`cursor-pointer rounded-xl border p-3.5 transition ${
                      isSelected
                        ? 'border-[#ee4d2d] bg-[#fff9f6]'
                        : 'border-[#eeeeee] hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <b className="text-sm font-bold text-[#222222]">{address.recipientName}</b>
                          <span className="text-xs text-[#777777]">· {address.phoneNumber}</span>
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-[#555555]">
                            {address.label}
                          </span>
                          {address.isDefault && (
                            <span className="rounded bg-[#fff0ea] px-1.5 py-0.5 text-[10px] font-bold text-[#ee4d2d]">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-[#666666] leading-relaxed">
                          {formatAddress(address)}
                        </p>
                      </div>
                      <input
                        type="radio"
                        name="modal-address"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedAddressId(address.id);
                          setShowAddressModal(false);
                        }}
                        className="mt-1 text-[#ee4d2d] focus:ring-[#ee4d2d]"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex gap-2 border-t border-[#eeeeee] pt-4">
              <Link
                to={ROUTES.CUSTOMER_ADDRESSES + '?context=checkout'}
                className="flex-1 rounded-xl border border-[#dddddd] py-2.5 text-center text-xs font-bold text-[#555555] hover:bg-gray-50 sm:text-sm"
              >
                + Thêm địa chỉ mới
              </Link>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                className="flex-1 rounded-xl bg-[#ee4d2d] py-2.5 text-center text-xs font-bold text-white shadow-sm hover:bg-[#d84023] sm:text-sm"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ShopeeFood Voucher Modal */}
      {showVoucherModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="voucher-modal-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-center justify-between border-b border-[#eeeeee] pb-3.5">
              <h3 id="voucher-modal-title" className="text-base font-bold text-[#222222] sm:text-lg">
                ShopeeFood Voucher
              </h3>
              <button
                type="button"
                onClick={() => setShowVoucherModal(false)}
                className="rounded-full p-1 text-[#777777] hover:bg-gray-100"
                aria-label="Đóng"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Input code */}
            <div className="mt-4 flex gap-2">
              <input
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void handleCollectVoucher(); }}
                placeholder="Nhập mã voucher để lưu vào ví"
                className="min-w-0 flex-1 rounded-xl border border-[#dddddd] px-3.5 py-2.5 text-sm outline-none focus:border-[#ee4d2d]"
              />
              <button
                type="button"
                onClick={() => void handleCollectVoucher()}
                disabled={!voucherCode.trim()}
                className="rounded-xl bg-[#222222] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-black disabled:opacity-50"
              >
                Áp dụng
              </button>
            </div>

            {/* Mode toggles */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-bold text-[#555555]">Chế độ chọn voucher</span>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSelectionMode('AUTO');
                    setSelectedVoucherIds([]);
                  }}
                  className={`rounded-full px-3 py-1 font-bold ${
                    selectionMode === 'AUTO' ? 'bg-[#ee4d2d] text-white' : 'bg-gray-100 text-[#666666]'
                  }`}
                >
                  Tự động tối ưu
                </button>
                <button
                  type="button"
                  onClick={() => setSelectionMode('MANUAL')}
                  className={`rounded-full px-3 py-1 font-bold ${
                    selectionMode === 'MANUAL' ? 'bg-[#ee4d2d] text-white' : 'bg-gray-100 text-[#666666]'
                  }`}
                >
                  Tự chọn mã
                </button>
              </div>
            </div>

            {/* Vouchers list */}
            <div className="mt-3 max-h-[50vh] space-y-2.5 overflow-y-auto pr-1">
              {checkoutVouchers.length === 0 && (
                <div className="py-8 text-center text-xs text-[#888888]">
                  Chưa có voucher khả dụng cho nhà hàng này.
                </div>
              )}
              {selectionMode === 'MANUAL' &&
                checkoutVouchers.map((voucher) => {
                  const checked = selectedVoucherIds.includes(voucher.id);
                  const disabled = !checked && selectedVoucherLayers.has(voucherLayer(voucher));
                  return (
                    <label
                      key={voucher.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-xs transition ${
                        checked ? 'border-[#ee4d2d] bg-[#fff9f6]' : 'border-[#eeeeee]'
                      } ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-gray-300'}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleVoucher(voucher)}
                        className="text-[#ee4d2d] focus:ring-[#ee4d2d]"
                      />
                      <div className="min-w-0 flex-1">
                        <b className="font-bold text-[#222222]">{voucher.code}</b> · {voucher.name}
                        <p className="text-[11px] text-[#777777]">Lớp áp dụng: {voucherLayer(voucher)}</p>
                      </div>
                    </label>
                  );
                })}
              {selectionMode === 'AUTO' && checkoutVouchers.length > 0 && (
                <div className="rounded-xl bg-orange-50/60 p-3 text-xs text-[#a0462e]">
                  Hệ thống sẽ tự động chọn mã giảm giá tốt nhất cho đơn hàng của bạn.
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowVoucherModal(false)}
              className="mt-5 w-full rounded-xl bg-[#ee4d2d] py-3 text-center text-sm font-bold text-white shadow-sm hover:bg-[#d84023]"
            >
              Xong
            </button>
          </div>
        </div>
      )}
    </CustomerShell>
  );
};

export default CustomerCheckoutPage;
