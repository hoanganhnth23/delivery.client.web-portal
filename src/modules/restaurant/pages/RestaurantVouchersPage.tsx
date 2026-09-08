import { useCallback, useEffect, useState } from 'react';
import RestaurantHeader from '@/components/layout/RestaurantHeader';
import RestaurantSidebar from '@/components/layout/RestaurantSidebar';
import { useRestaurant } from '../hooks/useRestaurant';
import { useAppDependencies } from '@/app/dependencies';
import type { CustomerVoucher, CreateShopVoucherRequest } from '@/services/api/promotionService';
import { formatDateTimeLocal, isValidDateTimeRange } from '@/utils/dateTime';

const RestaurantVouchersPage = () => {
  const { currentRestaurant } = useRestaurant();
  const { promotion, notifications, clock } = useAppDependencies();
  const [vouchers, setVouchers] = useState<CustomerVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<CreateShopVoucherRequest, 'restaurantId'>>({
    code: '',
    name: '',
    description: '',
    rewardType: 'PERCENTAGE',
    discountValue: 10,
    maxDiscountValue: null,
    totalQuantity: 100,
    usageLimitPerUser: 1,
    startTime: '',
    endTime: '',
    minOrderValue: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setVouchers(await promotion.listShopVouchers());
    } catch {
      setError('Không thể tải voucher nhà hàng');
    } finally {
      setLoading(false);
    }
  }, [promotion]);

  useEffect(() => {
    const now = clock.now();
    setForm((current) => current.startTime ? current : {
      ...current,
      startTime: formatDateTimeLocal(now),
      endTime: formatDateTimeLocal(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)),
    });
    void load();
  }, [clock, load]);

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentRestaurant || saving) return;
    if (!form.code.trim() || !form.name.trim() || form.discountValue < 0 ||
        form.totalQuantity < 1 || form.usageLimitPerUser < 1 ||
        form.minOrderValue < 0 || !isValidDateTimeRange(form.startTime, form.endTime)) {
      notifications.error('Vui lòng kiểm tra thông tin và thời gian voucher');
      return;
    }
    setSaving(true);
    try {
      await promotion.createShopVoucher({ ...form, code: form.code.trim().toUpperCase(), restaurantId: currentRestaurant.id });
      notifications.success('Voucher đã gửi chờ quản trị viên duyệt');
      setForm((current) => ({ ...current, code: '', name: '', description: '' }));
      await load();
    } catch {
      notifications.error('Không thể tạo voucher nhà hàng');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full min-w-0 bg-background-light dark:bg-background-dark">
      <RestaurantSidebar restaurantName={currentRestaurant?.name} restaurantImage={currentRestaurant?.image} />
      <main className="min-w-0 flex-1">
        <RestaurantHeader title="Voucher nhà hàng" subtitle="Voucher shop cần ADMIN duyệt trước khi phát hành" />
        <div className="grid gap-4 p-4 sm:gap-6 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:p-8">
          <form onSubmit={submit} className="rounded-2xl border border-border-light bg-white p-4 shadow-sm dark:border-border-dark dark:bg-surface-dark sm:p-6">
            <h2 className="text-xl font-black">Tạo voucher giảm giá món</h2>
            <p className="mt-1 text-sm text-gray-500">Hệ thống tự gán lớp SHOP_DISCOUNT và nguồn tài trợ SHOP.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">Mã voucher<input value={form.code} onChange={(event) => update('code', event.target.value.toUpperCase())} className="mt-1 w-full rounded-lg border p-2" required /></label>
              <label className="text-sm font-semibold">Tên chiến dịch<input value={form.name} onChange={(event) => update('name', event.target.value)} className="mt-1 w-full rounded-lg border p-2" required /></label>
              <label className="text-sm font-semibold sm:col-span-2">Mô tả<textarea value={form.description} onChange={(event) => update('description', event.target.value)} className="mt-1 w-full rounded-lg border p-2" rows={2} /></label>
              <label className="text-sm font-semibold">Loại<select value={form.rewardType} onChange={(event) => update('rewardType', event.target.value as CreateShopVoucherRequest['rewardType'])} className="mt-1 w-full rounded-lg border p-2"><option value="PERCENTAGE">Phần trăm</option><option value="FIXED">Số tiền</option></select></label>
              <label className="text-sm font-semibold">Giá trị<input type="number" min={0} value={form.discountValue} onChange={(event) => update('discountValue', Number(event.target.value))} className="mt-1 w-full rounded-lg border p-2" /></label>
              <label className="text-sm font-semibold">Giảm tối đa<input type="number" min={0} value={form.maxDiscountValue ?? ''} onChange={(event) => update('maxDiscountValue', event.target.value === '' ? null : Number(event.target.value))} className="mt-1 w-full rounded-lg border p-2" /></label>
              <label className="text-sm font-semibold">Đơn tối thiểu<input type="number" min={0} value={form.minOrderValue} onChange={(event) => update('minOrderValue', Number(event.target.value))} className="mt-1 w-full rounded-lg border p-2" /></label>
              <label className="text-sm font-semibold">Tổng số lượng<input type="number" min={1} value={form.totalQuantity} onChange={(event) => update('totalQuantity', Number(event.target.value))} className="mt-1 w-full rounded-lg border p-2" /></label>
              <label className="text-sm font-semibold">Mỗi khách<input type="number" min={1} value={form.usageLimitPerUser} onChange={(event) => update('usageLimitPerUser', Number(event.target.value))} className="mt-1 w-full rounded-lg border p-2" /></label>
              <label className="text-sm font-semibold">Bắt đầu<input type="datetime-local" value={form.startTime} onChange={(event) => update('startTime', event.target.value)} className="mt-1 w-full rounded-lg border p-2" required /></label>
              <label className="text-sm font-semibold">Kết thúc<input type="datetime-local" value={form.endTime} onChange={(event) => update('endTime', event.target.value)} className="mt-1 w-full rounded-lg border p-2" required /></label>
            </div>
            <button type="submit" disabled={saving || !currentRestaurant} className="mt-6 w-full rounded-lg bg-primary px-4 py-3 font-bold text-white disabled:opacity-50">{saving ? 'Đang gửi…' : 'Gửi voucher chờ duyệt'}</button>
          </form>
          <section className="rounded-2xl border border-border-light bg-white p-4 shadow-sm dark:border-border-dark dark:bg-surface-dark sm:p-6">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-xl font-black">Chiến dịch của cửa hàng</h2><p className="mt-1 text-sm text-gray-500">Voucher chỉ hoạt động sau khi ADMIN duyệt.</p></div><button type="button" onClick={() => void load()} className="min-h-10 rounded-lg border px-3 py-2 text-sm font-semibold">Làm mới</button></div>
            {loading && <p className="mt-6 text-sm text-gray-500">Đang tải…</p>}
            {error && <p className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {!loading && !error && vouchers.length === 0 && <p className="mt-6 text-sm text-gray-500">Chưa có chiến dịch nào.</p>}
            <div className="mt-5 space-y-3">{vouchers.map((voucher) => <article key={voucher.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><b className="text-primary">{voucher.code}</b><p className="break-words font-semibold">{voucher.name}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${voucher.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{voucher.approvalStatus === 'APPROVED' ? 'ĐÃ DUYỆT' : 'CHỜ DUYỆT'}</span></div><p className="mt-2 text-sm text-gray-500">{voucher.rewardType === 'PERCENTAGE' ? `${voucher.discountValue}%` : `${voucher.discountValue.toLocaleString()}đ`} · tối thiểu {voucher.minOrderValue.toLocaleString()}đ</p></article>)}</div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default RestaurantVouchersPage;
