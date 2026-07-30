import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import type { AdminCoupon } from '@/services/api/adminService';
import { useAppDependencies } from '@/app/dependencies';

const AdminCouponsPage = () => {
  const { admin: adminService, notifications, clock } = useAppDependencies();
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    name: '',
    description: '',
    rewardType: 'FIXED',
    discountValue: 0,
    maxDiscountValue: 0,
    totalQuantity: 100,
    usageLimitPerUser: 1,
    startTime: '',
    endTime: '',
    minOrderValue: 0,
    scopeType: 'ALL'
  });

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.fetchAllCoupons();
      setCoupons(data);
    } catch {
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
      startTime: start.toISOString().slice(0, 16),
      endTime: end.toISOString().slice(0, 16),
    }));
    setShowModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.createCoupon(newCoupon);
      notifications.success('Tạo coupon thành công');
      setShowModal(false);
      void loadCoupons();
    } catch {
      notifications.error('Lỗi khi tạo coupon');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa coupon này?')) return;
    try {
      await adminService.deleteCoupon(id);
      notifications.success('Đã xóa coupon');
      void loadCoupons();
    } catch {
      notifications.error('Lỗi khi xóa coupon');
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Coupon Hệ thống</h1>
          <p className="text-gray-500">Tạo và quản lý các mã giảm giá toàn sàn</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add</span>
          Tạo Coupon Mới
        </button>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
        <table className="w-full text-left border-collapse">
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
                      onClick={() => handleDelete(coupon.id)}
                      aria-label={`Xóa coupon ${coupon.code}`}
                      className="text-red-500 hover:text-red-700 transition-colors"
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="coupon-modal-title">
          <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex justify-between items-center">
              <h3 id="coupon-modal-title" className="text-lg font-bold">Tạo Coupon Mới</h3>
              <button aria-label="Đóng" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 grid grid-cols-2 gap-4">
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
              <div className="col-span-2">
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
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Giá trị giảm</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-transparent outline-none"
                  value={newCoupon.discountValue}
                  onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: Number(e.target.value) })}
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
              <div className="col-span-2 flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 rounded-lg border border-gray-300 font-bold hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
                >
                  Tạo Coupon
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
