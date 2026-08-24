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
      setSelectedAddressId((current) => current ?? loaded.find((address) => address.isDefault)?.id ?? loaded[0]?.id ?? null);
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
    return <CustomerShell title="Checkout"><div className="rounded-3xl border border-dashed border-[#d7c5af] bg-white p-12 text-center">Giỏ hàng đang trống. <Link to={ROUTES.HOME} className="font-bold text-[#a85d0c]">Quay lại chọn món</Link></div></CustomerShell>;
  }

  return (
    <CustomerShell title="Xác nhận đơn hàng">
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-[#eadfce] bg-white p-6">
            <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-black">Địa chỉ giao hàng</h2><Link to={ROUTES.CUSTOMER_ADDRESSES} className="text-sm font-bold text-[#a85d0c]">Quản lý địa chỉ</Link></div>
            {loadingAddresses && <p className="mt-5 text-[#806c57]">Đang tải địa chỉ…</p>}
            {!loadingAddresses && addresses.length === 0 && <p className="mt-5 rounded-xl bg-[#fff4e4] p-4 text-sm text-[#806c57]">Bạn cần thêm địa chỉ trước khi đặt đơn.</p>}
            <div className="mt-5 space-y-3">{addresses.map((address) => <label key={address.id} className={`block cursor-pointer rounded-2xl border p-4 ${selectedAddressId === address.id ? 'border-[#ed8a16] bg-[#fff8ed]' : 'border-[#eadfce]'}`}><div className="flex gap-3"><input type="radio" name="checkout-address" checked={selectedAddressId === address.id} onChange={() => setSelectedAddressId(address.id)} /><div><div className="flex items-center gap-2"><span className="font-black">{address.label}</span>{address.isDefault && <span className="text-xs font-bold text-green-700">Mặc định</span>}</div><p className="mt-1 text-sm font-semibold">{address.recipientName} · {address.phoneNumber}</p><p className="mt-1 text-sm text-[#806c57]">{formatAddress(address)}</p>{!isVietnamCoordinate(address.latitude, address.longitude) && <p className="mt-1 text-xs font-bold text-red-600">Thiếu tọa độ</p>}</div></div></label>)}</div>
          </div>
          <div className="rounded-3xl border border-[#eadfce] bg-white p-6"><h2 className="text-xl font-black">Ghi chú đơn hàng</h2><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={3} placeholder="Ví dụ: Gọi trước khi giao" className="mt-4 w-full rounded-xl border border-[#dfd2c1] px-4 py-3 outline-none focus:ring-2 focus:ring-[#ed8a16]/30" /></div>
          {voucherEnabled && (
            <div className="rounded-3xl border border-[#eadfce] bg-white p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-black">Voucher</h2>
                <div className="flex gap-2 text-sm">
                  <button type="button" className={`rounded-full px-3 py-1 ${selectionMode === 'AUTO' ? 'bg-[#ed8a16] text-white' : 'bg-[#fff4e4]'}`} onClick={() => { setSelectionMode('AUTO'); setSelectedVoucherIds([]); }}>Tự động</button>
                  <button type="button" className={`rounded-full px-3 py-1 ${selectionMode === 'MANUAL' ? 'bg-[#ed8a16] text-white' : 'bg-[#fff4e4]'}`} onClick={() => setSelectionMode('MANUAL')}>Tự chọn</button>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <input
                  value={voucherCode}
                  onChange={(event) => setVoucherCode(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') void handleCollectVoucher(); }}
                  placeholder="Nhập mã để lưu vào ví"
                  className="min-w-0 flex-1 rounded-xl border border-[#dfd2c1] px-4 py-3"
                />
                <button type="button" onClick={() => void handleCollectVoucher()} disabled={!voucherCode.trim()} className="rounded-xl bg-[#2d2116] px-4 py-3 font-bold text-white disabled:opacity-50">Lưu mã</button>
              </div>
              <div className="mt-4 grid gap-2">
                {selectionMode === 'MANUAL' && checkoutVouchers.map((voucher) => {
                  const checked = selectedVoucherIds.includes(voucher.id);
                  const disabled = !checked && selectedVoucherLayers.has(voucherLayer(voucher));
                  return (
                    <label key={voucher.id} className={`flex items-center gap-3 rounded-xl border border-[#eadfce] p-3 text-sm ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}>
                      <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggleVoucher(voucher)} />
                      <span><b>{voucher.code}</b> · {voucher.name}<br /><span className="text-[#806c57]">{voucherLayer(voucher)}</span></span>
                    </label>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-[#806c57]">Tối đa 3 voucher, mỗi lớp một mã. Voucher không dùng chung Flash Sale.</p>
            </div>
          )}
          {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
          {notice && <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{notice}</div>}
        </section>
        <aside className="h-fit rounded-3xl border border-[#eadfce] bg-white p-6 lg:sticky lg:top-24">
          <h2 className="text-xl font-black">{cart.restaurantName}</h2>
          <div className="mt-5 space-y-3 border-b border-[#eadfce] pb-5">{cart.items.map((item) => <div key={item.menuItemId} className="flex justify-between gap-3 text-sm"><span>{item.quantity} × {item.menuItemName}</span><span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span></div>)}</div>
          {previewLoading && <p className="mt-5 text-sm text-[#806c57]">Đang tính giá từ server…</p>}
          {preview && <><div className="mt-5 space-y-3 text-sm text-[#806c57]"><div className="flex justify-between"><span>Tiền món</span><span>{formatCurrency(preview.subtotal)}</span></div><div className="flex justify-between"><span>Phí giao hàng</span><span>{formatCurrency(preview.shippingFee)}</span></div><div className="flex justify-between"><span>Giảm giá</span><span>-{formatCurrency(preview.discountAmount)}</span></div></div><div className="mt-5 flex justify-between border-t border-[#eadfce] pt-5 text-lg font-black"><span>Tổng COD</span><span className="text-[#ed8a16]">{formatCurrency(preview.totalPrice)}</span></div><p className="mt-3 text-xs text-[#806c57]">Báo giá có hiệu lực đến {new Date(preview.expiresAt).toLocaleTimeString('vi-VN')}.</p>{preview.priceChanges.length > 0 && <p className="mt-2 text-sm font-bold text-amber-700">Có món đã thay đổi giá, hãy kiểm tra lại.</p>}{preview.unavailableItemIds.length > 0 && <p className="mt-2 text-sm font-bold text-red-600">Một số món không còn khả dụng.</p>}</>}
          {preview && (preview.appliedVouchers ?? []).length > 0 && (
            <div className="mt-4 space-y-2 rounded-xl bg-green-50 p-3 text-xs text-green-900">
              {(preview.appliedVouchers ?? []).map((voucher) => (
                <div key={`${voucher.layer}-${voucher.voucherId}`} className="flex justify-between gap-3">
                  <span><b>{voucher.code}</b> · {voucher.layer} · {voucher.fundingSource}</span>
                  <span>-{formatCurrency(voucher.discountAmount)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-5 rounded-xl bg-[#fff4e4] p-4 text-sm text-[#806c57]"><p className="font-bold text-[#2d2116]">Thanh toán khi nhận hàng (COD)</p><p className="mt-1">Bạn thanh toán trực tiếp cho shipper.</p></div>
          <button type="button" onClick={() => void placeOrder()} disabled={placing || previewLoading || !preview || preview.unavailableItemIds.length > 0 || !selectedAddress || (selectionMode === 'MANUAL' && selectedVoucherIds.length === 0)} className="mt-6 w-full rounded-xl bg-[#ed8a16] px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300">{placing ? 'Đang đặt đơn…' : 'Đặt đơn COD'}</button>
        </aside>
      </div>
    </CustomerShell>
  );
};

export default CustomerCheckoutPage;
