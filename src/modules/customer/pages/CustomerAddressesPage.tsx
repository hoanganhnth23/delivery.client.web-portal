import { useEffect, useMemo, useState } from 'react';
import { useAppDependencies } from '@/app/dependencies';
import type { UserAddress } from '@/types/api.types';
import { CustomerShell } from '../components/CustomerShell';
import { formatAddress } from '@/services/api/addressService';
import { getErrorMessage, isVietnamCoordinate } from '../utils';

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
  label: 'Nhà', recipientName: '', phoneNumber: '', addressLine: '', ward: '', district: '', city: '', postalCode: '', latitude: '', longitude: '', isDefault: false,
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
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
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
      setAddresses(await addressService.getUserAddresses(userId));
    } catch (caught) {
      setError(getErrorMessage(caught, 'Không thể tải địa chỉ'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); /* one load per authenticated profile */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const coordinates = useMemo(() => {
    const latitude = form.latitude.trim() ? Number(form.latitude) : undefined;
    const longitude = form.longitude.trim() ? Number(form.longitude) : undefined;
    return { latitude, longitude };
  }, [form.latitude, form.longitude]);

  const setField = <K extends keyof AddressForm>(field: K, value: AddressForm[K]) => setForm((current) => ({ ...current, [field]: value }));

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ lấy vị trí hiện tại');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setField('latitude', position.coords.latitude.toFixed(6));
        setField('longitude', position.coords.longitude.toFixed(6));
        setNotice('Đã lấy tọa độ hiện tại');
      },
      () => setError('Không thể lấy vị trí. Bạn có thể nhập tọa độ thủ công.'),
      { enableHighAccuracy: false, timeout: 10_000 },
    );
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) return;
    if (!isVietnamCoordinate(coordinates.latitude, coordinates.longitude)) {
      setError('Vui lòng nhập tọa độ giao hàng hợp lệ trong Việt Nam');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const input = {
        label: form.label.trim(), recipientName: form.recipientName.trim(), phoneNumber: form.phoneNumber.trim(), addressLine: form.addressLine.trim(), ward: form.ward.trim(), district: form.district.trim(), city: form.city.trim(), postalCode: form.postalCode.trim() || undefined, latitude: coordinates.latitude, longitude: coordinates.longitude, isDefault: form.isDefault,
      };
      if (editing) await addressService.updateAddress(editing, input);
      else await addressService.createAddress(userId, input);
      setForm(emptyForm);
      setEditing(null);
      setNotice('Đã lưu địa chỉ');
      await load();
    } catch (caught) {
      setError(getErrorMessage(caught, 'Không thể lưu địa chỉ'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (address: UserAddress) => {
    if (!window.confirm(`Xóa địa chỉ ${address.label}?`)) return;
    try {
      await addressService.deleteAddress(address.id);
      await load();
    } catch (caught) { setError(getErrorMessage(caught, 'Không thể xóa địa chỉ')); }
  };

  const setDefault = async (address: UserAddress) => {
    try {
      await addressService.setDefaultAddress(address.id);
      await load();
    } catch (caught) { setError(getErrorMessage(caught, 'Không thể đặt địa chỉ mặc định')); }
  };

  return (
    <CustomerShell title="Địa chỉ giao hàng">
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-lg border border-[#eeeeee] bg-white p-4 sm:rounded-lg sm:p-6">
          {loading && <p>Đang tải địa chỉ…</p>}
          {error && <div role="alert" className="mb-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
          {!loading && addresses.length === 0 && <p className="rounded-lg border border-dashed border-[#dddddd] p-6 text-center text-[#777777] sm:p-8">Bạn chưa có địa chỉ nào.</p>}
          <div className="space-y-4">
            {addresses.map((address) => (
              <article key={address.id} className="rounded-lg border border-[#eeeeee] p-4">
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{address.label}</h3>{address.isDefault && <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">Mặc định</span>}</div><p className="mt-2 break-words font-semibold">{address.recipientName} · {address.phoneNumber}</p><p className="mt-1 break-words text-sm text-[#777777]">{formatAddress(address)}</p>{!isVietnamCoordinate(address.latitude, address.longitude) && <p className="mt-2 text-xs font-bold text-amber-700">Thiếu tọa độ — chưa dùng được khi checkout</p>}</div><div className="flex shrink-0 gap-2"><button type="button" onClick={() => { setEditing(address.id); setForm(toForm(address)); }} className="min-h-9 text-sm font-bold text-[#c5371d]">Sửa</button><button type="button" onClick={() => void remove(address)} className="min-h-9 text-sm font-bold text-red-600">Xóa</button></div></div>
                {!address.isDefault && <button type="button" onClick={() => void setDefault(address)} className="mt-3 text-sm font-bold text-[#777777] underline">Đặt mặc định</button>}
              </article>
            ))}
          </div>
        </section>
        <section className="h-fit rounded-lg border border-[#eeeeee] bg-white p-4 sm:rounded-lg sm:p-6 lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">{editing ? 'Sửa địa chỉ' : 'Thêm địa chỉ'}</h2>{editing && <button type="button" onClick={() => { setEditing(null); setForm(emptyForm); }} className="text-sm font-bold text-[#777777]">Hủy sửa</button>}</div>
          {notice && <p role="status" className="mt-3 text-sm font-semibold text-green-700">{notice}</p>}
          <form onSubmit={submit} className="mt-5 space-y-4">
            {([['label', 'Nhãn', 'Nhà'], ['recipientName', 'Tên người nhận', 'Nguyễn Văn A'], ['phoneNumber', 'Số điện thoại', '090…'], ['addressLine', 'Số nhà, tên đường', '12 Nguyễn Huệ'], ['ward', 'Phường/Xã', 'Bến Nghé'], ['district', 'Quận/Huyện', 'Quận 1'], ['city', 'Tỉnh/Thành phố', 'TP. Hồ Chí Minh']] as const).map(([field, label, placeholder]) => <label key={field} className="block text-sm font-bold">{label}<input required value={form[field]} onChange={(event) => setField(field, event.target.value)} placeholder={placeholder} className="mt-1.5 w-full rounded-md border border-[#dddddd] px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-[#ee4d2d]/30" /></label>)}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="block text-sm font-bold">Latitude<input required type="number" step="any" value={form.latitude} onChange={(event) => setField('latitude', event.target.value)} className="mt-1.5 w-full rounded-md border border-[#dddddd] px-3 py-2.5 font-normal" /></label><label className="block text-sm font-bold">Longitude<input required type="number" step="any" value={form.longitude} onChange={(event) => setField('longitude', event.target.value)} className="mt-1.5 w-full rounded-md border border-[#dddddd] px-3 py-2.5 font-normal" /></label></div>
            <button type="button" onClick={useCurrentLocation} className="w-full rounded-md border border-[#ee4d2d] px-4 py-2.5 text-sm font-bold text-[#c5371d]">Dùng vị trí hiện tại</button>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.isDefault} onChange={(event) => setField('isDefault', event.target.checked)} /> Đặt làm địa chỉ mặc định</label>
            <button type="submit" disabled={saving} className="w-full rounded-md bg-[#ee4d2d] px-4 py-3 font-bold text-white disabled:opacity-50">{saving ? 'Đang lưu…' : 'Lưu địa chỉ'}</button>
          </form>
        </section>
      </div>
    </CustomerShell>
  );
};

export default CustomerAddressesPage;
