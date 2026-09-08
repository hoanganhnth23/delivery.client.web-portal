import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useDialogFocus } from '@/components/navigation/useDialogFocus';
import type { AdminCoupon, CreateAdminCouponRequest } from '@/services/api/adminService';
import { useAppDependencies } from '@/app/dependencies';
import { formatDateTimeLocal, isValidDateTimeRange } from '@/utils/dateTime';

const AdminCouponsPage = () => {
  const { admin: adminService, notifications, clock } = useAppDependencies();
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [pendingShopCoupons, setPendingShopCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const dialogRef = useDialogFocus(showModal, () => setShowModal(false));
  const [creating, setCreating] = useState(false);
  const [deletingCouponId, setDeletingCouponId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newCoupon, setNewCoupon] = useState<CreateAdminCouponRequest>({
    code: '',
    name: '',
    description: '',
    rewardType: 'FIXED',
    discountValue: 0,
    maxDiscountValue: null,
    totalQuantity: 100,
    usageLimitPerUser: 1,
    startTime: '',
    endTime: '',
    minOrderValue: 0,
    scopeType: 'ALL',
    scopeRefId: null,
  });

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, pending] = await Promise.all([
        adminService.fetchAllCoupons(),
        adminService.fetchPendingShopCoupons(),
      ]);
      setCoupons(data);
      setPendingShopCoupons(pending);
    } catch {
      setError('Không thể tải danh sách coupon');
      notifications.error('Lỗi khi tải danh sách coupon');
    } finally {
      setLoading(false);
    }
  }, [adminService, notifications]);

  useEffect(() => {
    void loadCoupons();
  }, [loadCoupons]);

  const openCreateModal = () => {
    const start = clock.now();
    const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    setNewCoupon((current) => ({
      ...current,
      startTime: formatDateTimeLocal(start),
      endTime: formatDateTimeLocal(end),
    }));
    setShowModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    if (
      !newCoupon.code.trim() ||
      !newCoupon.name.trim() ||
      newCoupon.discountValue < 0 ||
      (newCoupon.maxDiscountValue !== null && newCoupon.maxDiscountValue < 0) ||
      newCoupon.totalQuantity < 1 ||
      newCoupon.minOrderValue < 0 ||
      (newCoupon.scopeType === 'SHOP' && (!newCoupon.scopeRefId || newCoupon.scopeRefId < 1)) ||
      !isValidDateTimeRange(newCoupon.startTime, newCoupon.endTime)
    ) {
      notifications.error('Vui lòng kiểm tra thông tin và thời gian coupon');
      return;
    }

    setCreating(true);
    try {
      await adminService.createCoupon(newCoupon);
      notifications.success('Tạo coupon thành công');
      setShowModal(false);
      await loadCoupons();
    } catch {
      notifications.error('Lỗi khi tạo coupon');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (deletingCouponId !== null) return;
    if (!confirm('Bạn có chắc muốn xóa coupon này?')) return;
    setDeletingCouponId(id);
    try {
      await adminService.deleteCoupon(id);
      notifications.success('Đã xóa coupon');
      await loadCoupons();
    } catch {
      notifications.error('Lỗi khi xóa coupon');
    } finally {
      setDeletingCouponId(null);
    }
  };

  const reviewShopCoupon = async (id: number, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') await adminService.approveShopCoupon(id);
      else await adminService.rejectShopCoupon(id);
      notifications.success(action === 'approve' ? 'Đã duyệt voucher nhà hàng' : 'Đã từ chối voucher nhà hàng');
      await loadCoupons();
    } catch { notifications.error('Không thể cập nhật trạng thái voucher nhà hàng'); }
  };

  return (
    <AdminLayout>
      <div className="mb-5 flex flex-col items-start justify-between gap-3 sm:mb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Quản lý Coupon Hệ thống</h1>
          <p className="text-sm text-gray-500">Tạo và quản lý voucher toàn sàn hoặc theo nhà hàng</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-bold text-white transition-all hover:bg-primary/90 sm:w-auto"
        >
          <span className="material-symbols-outlined">add</span>
          Tạo Coupon Mới
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300" role="alert">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadCoupons()}
            disabled={loading}
            className="shrink-0 rounded-lg bg-red-700 px-3 py-2 font-semibold text-white disabled:opacity-50"
          >
            Thử lại
          </button>
        </div>
      )}

      {pendingShopCoupons.length > 0 && <section className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20 sm:p-5"><h2 className="font-bold text-amber-900 dark:text-amber-200">Voucher nhà hàng chờ duyệt</h2><div className="mt-3 space-y-2">{pendingShopCoupons.map((coupon) => <div key={coupon.id} className="flex flex-col items-start justify-between gap-3 rounded-lg bg-white p-3 dark:bg-surface-dark sm:flex-row sm:items-center"><span className="break-words"><b>{coupon.code}</b> · {coupon.name} <small className="text-gray-500">SHOP #{coupon.scopeRefId}</small></span><span className="flex gap-2"><button type="button" onClick={() => void reviewShopCoupon(coupon.id, 'approve')} className="min-h-9 rounded-lg bg-green-600 px-3 py-1 text-xs font-bold text-white">Duyệt</button><button type="button" onClick={() => void reviewShopCoupon(coupon.id, 'reject')} className="min-h-9 rounded-lg bg-red-600 px-3 py-1 text-xs font-bold text-white">Từ chối</button></span></div>)}</div></section>}

      <div className="overflow-hidden rounded-xl border border-border-light bg-white shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-border-light dark:border-border-dark">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Mã / Tên</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Loại / Giá trị</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Số lượng</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Thời hạn</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light dark:divide-border-dark">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">Đang tải...</td></tr>
            ) : error && coupons.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">Chưa có dữ liệu để hiển thị.</td></tr>
            ) : coupons.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">Chưa có mã giảm giá nào</td></tr>
            ) : (
              coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-primary">{coupon.code}</div>
                    <div className="text-sm text-gray-500">{coupon.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">
                      {coupon.rewardType === 'FIXED' ? `${coupon.discountValue.toLocaleString()}đ` : `${coupon.discountValue}%`}
                    </div>
                    <div className="text-xs text-gray-400">Min: {coupon.minOrderValue.toLocaleString()}đ</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">{coupon.usedQuantity} / {coupon.totalQuantity}</div>
                    <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${(coupon.usedQuantity / coupon.totalQuantity) * 100}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-500">Bắt đầu: {new Date(coupon.startTime).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-500">Kết thúc: {new Date(coupon.endTime).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${coupon.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {coupon.active ? 'ĐANG CHẠY' : 'DỪNG'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => void handleDelete(coupon.id)}
                      disabled={deletingCouponId !== null}
                      aria-label={`Xóa coupon ${coupon.code}`}
                      className="text-red-500 transition-colors hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {showModal && (
        <div ref={dialogRef} tabIndex={-1} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="coupon-modal-title">
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-surface-dark">
            <div className="flex items-center justify-between gap-3 border-b border-border-light px-4 py-4 dark:border-border-dark sm:px-6">
              <h3 id="coupon-modal-title" className="text-lg font-bold">Tạo Coupon Mới</h3>
              <button aria-label="Đóng" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6">
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mã Coupon</label>
                <input
                  required
                  className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-transparent focus:ring-2 focus:ring-primary/50 outline-none"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                  placeholder="E.g. HELLO2024"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên Coupon</label>
                <input
                  required
                  className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-transparent focus:ring-2 focus:ring-primary/50 outline-none"
                  value={newCoupon.name}
                  onChange={(e) => setNewCoupon({ ...newCoupon, name: e.target.value })}
                  placeholder="Giảm giá chào mừng"
                />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mô tả</label>
                <textarea
                  className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-transparent focus:ring-2 focus:ring-primary/50 outline-none"
                  value={newCoupon.description}
                  onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Loại Giảm Giá</label>
                <select
                  className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-transparent outline-none"
                  value={newCoupon.rewardType}
                  onChange={(e) => setNewCoupon({ ...newCoupon, rewardType: e.target.value })}
                >
                  <option value="FIXED">Số tiền cố định (đ)</option>
                  <option value="PERCENTAGE">Phần trăm (%)</option>
                  <option value="FREESHIP">Miễn phí vận chuyển</option>
                </select>
              </div>
              <div className="col-span-1">
                <label htmlFor="coupon-scope" className="block text-xs font-bold text-gray-500 uppercase mb-1">Phạm vi</label>
                <select
                  id="coupon-scope"
                  className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-transparent outline-none"
                  value={newCoupon.scopeType}
                  onChange={(e) => {
                    const scopeType = e.target.value as 'ALL' | 'SHOP';
                    setNewCoupon({ ...newCoupon, scopeType, scopeRefId: null });
                  }}
                >
                  <option value="ALL">Toàn sàn</option>
                  <option value="SHOP">Theo nhà hàng</option>
                </select>
              </div>
              {newCoupon.scopeType === 'SHOP' && (
                <div className="col-span-1">
                  <label htmlFor="coupon-restaurant-id" className="block text-xs font-bold text-gray-500 uppercase mb-1">Restaurant ID</label>
                  <input
                    id="coupon-restaurant-id"
                    required
                    min={1}
                    type="number"
                    className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-transparent outline-none"
                    value={newCoupon.scopeRefId ?? ''}
                    onChange={(e) => setNewCoupon({
                      ...newCoupon,
                      scopeRefId: e.target.value === '' ? null : Number(e.target.value),
                    })}
                  />
                </div>
              )}
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Giá trị giảm</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-transparent outline-none"
                  value={newCoupon.discountValue}
                  onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Giảm tối đa</label>
                <input
                  type="number"
                  min={0}
                  placeholder="Không giới hạn"
                  className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-transparent outline-none"
                  value={newCoupon.maxDiscountValue ?? ''}
                  onChange={(e) => setNewCoupon({
                    ...newCoupon,
                    maxDiscountValue: e.target.value === '' ? null : Number(e.target.value),
                  })}
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số lượng tổng</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-transparent outline-none"
                  value={newCoupon.totalQuantity}
                  onChange={(e) => setNewCoupon({ ...newCoupon, totalQuantity: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Đơn tối thiểu</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-transparent outline-none"
                  value={newCoupon.minOrderValue}
                  onChange={(e) => setNewCoupon({ ...newCoupon, minOrderValue: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ngày bắt đầu</label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-transparent outline-none"
                  value={newCoupon.startTime}
                  onChange={(e) => setNewCoupon({ ...newCoupon, startTime: e.target.value })}
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ngày kết thúc</label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-transparent outline-none"
                  value={newCoupon.endTime}
                  onChange={(e) => setNewCoupon({ ...newCoupon, endTime: e.target.value })}
                />
              </div>
              <div className="col-span-1 mt-4 flex flex-col-reverse justify-end gap-3 sm:col-span-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 rounded-lg border border-gray-300 font-bold hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-primary px-6 py-2 font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? 'Đang tạo…' : 'Tạo Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCouponsPage;
