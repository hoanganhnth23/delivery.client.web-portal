import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDependencies } from '@/app/dependencies';
import type { UserAddress } from '@/types/api.types';
import { CustomerShell } from '../components/CustomerShell';
import { formatAddress } from '@/services/api/addressService';
import { getErrorMessage, isVietnamCoordinate } from '../utils';
import { ROUTES } from '@/utils/constants';

type AddressForm = {
  label: string;
  recipientName: string;
  phoneNumber: string;
  addressLine: string;
  ward: string;
  district: string;
  city: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  isDefault: boolean;
};

const emptyForm: AddressForm = {
  label: 'Nhà riêng',
  recipientName: '',
  phoneNumber: '',
  addressLine: '',
  ward: '',
  district: '',
  city: 'TP. Hồ Chí Minh',
  postalCode: '',
  latitude: '10.776889',
  longitude: '106.700806',
  isDefault: false,
};

const toForm = (address: UserAddress): AddressForm => ({
  label: address.label,
  recipientName: address.recipientName,
  phoneNumber: address.phoneNumber,
  addressLine: address.addressLine,
  ward: address.ward,
  district: address.district,
  city: address.city,
  postalCode: address.postalCode ?? '',
  latitude: address.latitude?.toString() ?? '',
  longitude: address.longitude?.toString() ?? '',
  isDefault: address.isDefault === true,
});

const CustomerAddressesPage = () => {
  const { auth, address: addressService } = useAppDependencies();
  const userId = auth.getCurrentUser()?.id;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isCheckoutContext = searchParams.get('context') === 'checkout';
  const selectedIdFromParam = searchParams.get('selectedId') ? Number(searchParams.get('selectedId')) : null;

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await addressService.getUserAddresses(userId);
      setAddresses(data);
    } catch (caught) {
      setError(getErrorMessage(caught, 'Không thể tải danh sách địa chỉ'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const coordinates = useMemo(() => {
    const latitude = form.latitude.trim() ? Number(form.latitude) : undefined;
    const longitude = form.longitude.trim() ? Number(form.longitude) : undefined;
    return { latitude, longitude };
  }, [form.latitude, form.longitude]);

  const setField = <K extends keyof AddressForm>(field: K, value: AddressForm[K]) =>
    setForm((current) => ({ ...current, [field]: value }));

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ định vị GPS tự động');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setField('latitude', position.coords.latitude.toFixed(6));
        setField('longitude', position.coords.longitude.toFixed(6));
        setNotice('Đã cập nhật tọa độ GPS thành công');
      },
      () => setError('Không thể lấy tọa độ hiện tại. Bạn có thể nhập tọa độ thủ công.'),
      { enableHighAccuracy: false, timeout: 10_000 },
    );
  };

  const handleSelectForCheckout = (address: UserAddress) => {
    if (!isVietnamCoordinate(address.latitude, address.longitude)) {
      setError('Địa chỉ này chưa có tọa độ hợp lệ. Vui lòng bấm Sửa để cập nhật tọa độ trước khi dùng.');
      return;
    }
    try {
      window.sessionStorage.setItem('delivery.selected-address-id', String(address.id));
    } catch {
      // Ignore storage errors
    }
    navigate(ROUTES.CUSTOMER_CHECKOUT);
  };

  const startCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      isDefault: addresses.length === 0,
      recipientName: auth.getCurrentUser()?.name || '',
    });
    setIsCreating(true);
  };

  const startEdit = (address: UserAddress) => {
    setIsCreating(false);
    setEditingId(address.id);
    setForm(toForm(address));
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) return;
    if (!isVietnamCoordinate(coordinates.latitude, coordinates.longitude)) {
      setError('Vui lòng cung cấp tọa độ giao hàng hợp lệ tại Việt Nam');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const input = {
        label: form.label.trim() || 'Nhà riêng',
        recipientName: form.recipientName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        addressLine: form.addressLine.trim(),
        ward: form.ward.trim(),
        district: form.district.trim(),
        city: form.city.trim(),
        postalCode: form.postalCode.trim() || undefined,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        isDefault: form.isDefault,
      };

      if (editingId) {
        await addressService.updateAddress(editingId, input);
        setNotice('Đã cập nhật địa chỉ thành công');
      } else {
        const created = await addressService.createAddress(userId, input);
        setNotice('Đã thêm địa chỉ mới thành công');
        if (isCheckoutContext) {
          try {
            window.sessionStorage.setItem('delivery.selected-address-id', String(created.id));
          } catch {
            // Ignore
          }
          navigate(ROUTES.CUSTOMER_CHECKOUT);
          return;
        }
      }
      cancelForm();
      await load();
    } catch (caught) {
      setError(getErrorMessage(caught, 'Không thể lưu địa chỉ'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (address: UserAddress) => {
    if (!window.confirm(`Bạn có chắc muốn xóa địa chỉ "${address.label}: ${address.addressLine}"?`)) return;
    try {
      await addressService.deleteAddress(address.id);
      setNotice('Đã xóa địa chỉ');
      await load();
    } catch (caught) {
      setError(getErrorMessage(caught, 'Không thể xóa địa chỉ'));
    }
  };

  const setDefault = async (address: UserAddress) => {
    try {
      await addressService.setDefaultAddress(address.id);
      setNotice(`Đã đặt "${address.label}" làm địa chỉ mặc định`);
      await load();
    } catch (caught) {
      setError(getErrorMessage(caught, 'Không thể đặt địa chỉ mặc định'));
    }
  };

  const pageTitle = isCheckoutContext ? 'Chọn địa chỉ giao hàng' : 'Địa chỉ của tôi';

  return (
    <CustomerShell title={pageTitle}>
      <div className="mx-auto max-w-3xl space-y-5 sm:space-y-6">
        {/* Context Notice if from Checkout */}
        {isCheckoutContext && (
          <div className="flex items-center justify-between rounded-xl border border-orange-200 bg-[#fff5ef] p-4 text-xs text-[#d35433] sm:text-sm">
            <div className="flex items-center gap-2 font-medium">
              <span className="material-symbols-outlined text-lg">local_shipping</span>
              <span>Chọn địa chỉ nhận món cho đơn hàng hiện tại của bạn</span>
            </div>
            <button
              type="button"
              onClick={() => navigate(ROUTES.CUSTOMER_CHECKOUT)}
              className="font-bold text-[#ee4d2d] underline"
            >
              Quay lại checkout
            </button>
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        {notice && (
          <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">
            {notice}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-sm text-[#777777]">
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[#ee4d2d] border-t-transparent" />
              <span>Đang tải danh sách địa chỉ…</span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && addresses.length === 0 && !isCreating && (
          <div className="rounded-2xl border border-dashed border-[#dddddd] bg-white p-8 text-center sm:p-12">
            <span className="material-symbols-outlined text-5xl text-[#dacbc3]">location_off</span>
            <h2 className="mt-3 text-lg font-bold text-[#222222]">Chưa có địa chỉ nào</h2>
            <p className="mt-1 text-sm text-[#777777]">Thêm địa chỉ giao hàng để thuận tiện đặt món nhanh chóng hơn.</p>
            <button
              type="button"
              onClick={startCreate}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#ee4d2d] px-5 py-2.5 font-bold text-white shadow-sm hover:bg-[#d84023]"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              <span>Thêm địa chỉ mới</span>
            </button>
          </div>
        )}

        {/* List of Addresses (ShopeeFood sf-addresses style) */}
        {!loading && addresses.length > 0 && !isCreating && editingId === null && (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-2xl border border-[#eeeeee] bg-white shadow-sm divide-y divide-[#eeeeee]">
              {addresses.map((address) => {
                const isSelected = selectedIdFromParam === address.id;
                const isHome = address.label.toLowerCase().includes('nhà');
                const isOffice = address.label.toLowerCase().includes('văn phòng') || address.label.toLowerCase().includes('công ty');
                const iconName = isOffice ? 'work' : isHome ? 'home' : 'location_on';

                return (
                  <article
                    key={address.id}
                    className={`flex items-start justify-between gap-3 p-4 transition sm:p-5 ${
                      isSelected ? 'border-l-4 border-l-[#ee4d2d] bg-[#fff9f6]' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Main Address Info */}
                    <div
                      className={`flex flex-1 items-start gap-3.5 ${isCheckoutContext ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        if (isCheckoutContext) handleSelectForCheckout(address);
                      }}
                    >
                      <span className="material-symbols-outlined mt-0.5 text-2xl text-[#ee4d2d]" aria-hidden="true">
                        {iconName}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <b className="text-sm font-bold text-[#222222] sm:text-base">
                            {address.recipientName}
                          </b>
                          <span className="text-xs text-[#777777] sm:text-sm">· {address.phoneNumber}</span>
                          <span className="rounded border border-[#dddddd] bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-[#555555]">
                            {address.label}
                          </span>
                          {address.isDefault && (
                            <span className="rounded border border-[#ee4d2d] bg-[#fff5ef] px-2 py-0.5 text-[11px] font-bold text-[#ee4d2d]">
                              Mặc định
                            </span>
                          )}
                        </div>

                        <p className="mt-1.5 text-xs text-[#555555] sm:text-sm leading-relaxed">
                          {formatAddress(address)}
                        </p>

                        {!isVietnamCoordinate(address.latitude, address.longitude) ? (
                          <p className="mt-2 text-xs font-bold text-red-600">
                            ⚠ Thiếu tọa độ GPS — Vui lòng bấm Sửa để bổ sung
                          </p>
                        ) : (
                          <span className="mt-1.5 inline-block text-[11px] text-[#999999]">
                            Tọa độ: {address.latitude?.toFixed(4)}, {address.longitude?.toFixed(4)}
                          </span>
                        )}

                        {/* Button for checkout selection */}
                        {isCheckoutContext && (
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectForCheckout(address);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#ee4d2d] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#d84023]"
                            >
                              <span className="material-symbols-outlined text-base">check</span>
                              <span>Giao đến địa chỉ này</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions: Edit, Delete, Set Default */}
                    <div className="flex shrink-0 flex-col items-end gap-2 text-right">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => startEdit(address)}
                          className="text-xs font-bold text-[#ee4d2d] hover:underline sm:text-sm"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(address)}
                          className="text-xs font-semibold text-[#999999] hover:text-red-600 sm:text-sm"
                        >
                          Xóa
                        </button>
                      </div>
                      {!address.isDefault && (
                        <button
                          type="button"
                          onClick={() => void setDefault(address)}
                          className="text-[11px] font-medium text-[#777777] hover:text-[#222222] hover:underline"
                        >
                          Đặt làm mặc định
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {/* ShopeeFood .sf-new-address button */}
            <button
              type="button"
              onClick={startCreate}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#ffd3c7] bg-white p-4 font-bold text-[#ee4d2d] shadow-sm transition hover:border-[#ee4d2d] hover:bg-[#fff9f6]"
            >
              <span className="material-symbols-outlined text-2xl">add_circle_outline</span>
              <span>Thêm địa chỉ mới</span>
            </button>
          </div>
        )}

        {/* Add/Edit Form */}
        {(isCreating || editingId !== null) && (
          <section className="overflow-hidden rounded-2xl border border-[#eeeeee] bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center justify-between border-b border-[#eeeeee] pb-4">
              <h2 className="text-base font-bold text-[#222222] sm:text-lg">
                {editingId !== null ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ giao hàng mới'}
              </h2>
              <button
                type="button"
                onClick={cancelForm}
                className="text-xs font-bold text-[#777777] hover:text-[#222222]"
              >
                Hủy bỏ
              </button>
            </div>

            <form onSubmit={submit} className="mt-5 space-y-4 text-sm">
              {/* Quick Label Selector */}
              <div>
                <label className="block font-bold text-[#444444] mb-2">Loại địa chỉ</label>
                <div className="flex flex-wrap gap-2">
                  {['Nhà riêng', 'Văn phòng', 'Khác'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setField('label', type)}
                      className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                        form.label === type
                          ? 'border border-[#ee4d2d] bg-[#fff5ef] text-[#ee4d2d]'
                          : 'border border-[#dddddd] bg-gray-50 text-[#666666] hover:bg-gray-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient info */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block font-bold">
                  Họ và tên người nhận <span className="text-red-500">*</span>
                  <input
                    required
                    value={form.recipientName}
                    onChange={(e) => setField('recipientName', e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="mt-1.5 w-full rounded-xl border border-[#dddddd] px-3.5 py-2.5 font-normal outline-none focus:border-[#ee4d2d] focus:ring-2 focus:ring-[#ee4d2d]/20"
                  />
                </label>
                <label className="block font-bold">
                  Số điện thoại <span className="text-red-500">*</span>
                  <input
                    required
                    type="tel"
                    value={form.phoneNumber}
                    onChange={(e) => setField('phoneNumber', e.target.value)}
                    placeholder="Ví dụ: 0901234567"
                    className="mt-1.5 w-full rounded-xl border border-[#dddddd] px-3.5 py-2.5 font-normal outline-none focus:border-[#ee4d2d] focus:ring-2 focus:ring-[#ee4d2d]/20"
                  />
                </label>
              </div>

              {/* Address details */}
              <label className="block font-bold">
                Số nhà, tên đường, toà nhà <span className="text-red-500">*</span>
                <input
                  required
                  value={form.addressLine}
                  onChange={(e) => setField('addressLine', e.target.value)}
                  placeholder="Ví dụ: 123 Nguyễn Huệ, Tầng 5"
                  className="mt-1.5 w-full rounded-xl border border-[#dddddd] px-3.5 py-2.5 font-normal outline-none focus:border-[#ee4d2d] focus:ring-2 focus:ring-[#ee4d2d]/20"
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="block font-bold">
                  Phường / Xã <span className="text-red-500">*</span>
                  <input
                    required
                    value={form.ward}
                    onChange={(e) => setField('ward', e.target.value)}
                    placeholder="Phường Bến Nghé"
                    className="mt-1.5 w-full rounded-xl border border-[#dddddd] px-3.5 py-2.5 font-normal outline-none focus:border-[#ee4d2d] focus:ring-2 focus:ring-[#ee4d2d]/20"
                  />
                </label>
                <label className="block font-bold">
                  Quận / Huyện <span className="text-red-500">*</span>
                  <input
                    required
                    value={form.district}
                    onChange={(e) => setField('district', e.target.value)}
                    placeholder="Quận 1"
                    className="mt-1.5 w-full rounded-xl border border-[#dddddd] px-3.5 py-2.5 font-normal outline-none focus:border-[#ee4d2d] focus:ring-2 focus:ring-[#ee4d2d]/20"
                  />
                </label>
                <label className="block font-bold">
                  Tỉnh / Thành phố <span className="text-red-500">*</span>
                  <input
                    required
                    value={form.city}
                    onChange={(e) => setField('city', e.target.value)}
                    placeholder="TP. Hồ Chí Minh"
                    className="mt-1.5 w-full rounded-xl border border-[#dddddd] px-3.5 py-2.5 font-normal outline-none focus:border-[#ee4d2d] focus:ring-2 focus:ring-[#ee4d2d]/20"
                  />
                </label>
              </div>

              {/* Coordinates & GPS */}
              <div className="rounded-xl border border-[#eeeeee] bg-[#fafafa] p-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#333333]">Tọa độ định vị giao hàng</span>
                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#ee4d2d] hover:underline"
                  >
                    <span className="material-symbols-outlined text-base">my_location</span>
                    <span>Lấy vị trí GPS của tôi</span>
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-[#666666]">
                    Vĩ độ (Latitude)
                    <input
                      required
                      type="number"
                      step="any"
                      value={form.latitude}
                      onChange={(e) => setField('latitude', e.target.value)}
                      placeholder="10.776889"
                      className="mt-1 w-full rounded-lg border border-[#dddddd] bg-white px-3 py-2 text-sm font-normal"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-[#666666]">
                    Kinh độ (Longitude)
                    <input
                      required
                      type="number"
                      step="any"
                      value={form.longitude}
                      onChange={(e) => setField('longitude', e.target.value)}
                      placeholder="106.700806"
                      className="mt-1 w-full rounded-lg border border-[#dddddd] bg-white px-3 py-2 text-sm font-normal"
                    />
                  </label>
                </div>
              </div>

              {/* Default address checkbox */}
              <label className="flex items-center gap-2.5 cursor-pointer pt-1 font-medium text-[#444444]">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setField('isDefault', e.target.checked)}
                  className="h-4 w-4 rounded text-[#ee4d2d] focus:ring-[#ee4d2d]"
                />
                <span>Đặt làm địa chỉ nhận hàng mặc định</span>
              </label>

              {/* Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="flex-1 rounded-xl border border-[#dddddd] py-3 font-bold text-[#666666] hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-[2] rounded-xl bg-[#ee4d2d] py-3 font-bold text-white shadow-sm hover:bg-[#d84023] disabled:opacity-50"
                >
                  {saving ? 'Đang lưu địa chỉ…' : editingId !== null ? 'Lưu thay đổi' : 'Hoàn tất & Thêm mới'}
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </CustomerShell>
  );
};

export default CustomerAddressesPage;
