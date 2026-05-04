import { useState, useEffect } from 'react';
import RestaurantSidebar from '@/components/layout/RestaurantSidebar';
import RestaurantHeader from '@/components/layout/RestaurantHeader';
import { useRestaurant } from '../hooks/useRestaurant';
import { getMerchantCoupons, createMerchantCoupon } from '../services/restaurantService';
import adminService from '@/services/api/adminService';
import { toast } from 'react-hot-toast';

const CouponManagementPage = () => {
  const { currentRestaurant } = useRestaurant();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    name: '',
    description: '',
    rewardType: 'FIXED',
    discountValue: 0,
    maxDiscountValue: 0,
    totalQuantity: 50,
    usageLimitPerUser: 1,
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    minOrderValue: 0,
    scopeType: 'SHOP',
    scopeRefId: 0
  });

  useEffect(() => {
    if (currentRestaurant?.id) {
      loadCoupons();
    }
  }, [currentRestaurant]);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const data = await getMerchantCoupons();
      setCoupons(data);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { 
        ...newCoupon, 
        scopeRefId: currentRestaurant?.id 
      };
      await createMerchantCoupon(data);
      toast.success('Tạo coupon nhà hàng thành công');
      setShowModal(false);
      loadCoupons();
    } catch (error) {
      toast.error('Lỗi khi tạo coupon');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa coupon này?')) return;
    try {
      await adminService.deleteCoupon(id);
      toast.success('Đã xóa coupon');
      loadCoupons();
    } catch (error) {
      toast.error('Lỗi khi xóa coupon');
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
      <RestaurantSidebar
        restaurantName={currentRestaurant?.name}
        restaurantImage={currentRestaurant?.image}
      />

      <main className="flex flex-1 flex-col overflow-hidden">
        <RestaurantHeader
          title="Quản lý Khuyến mãi"
          subtitle="Tạo mã giảm giá riêng cho nhà hàng của bạn"
          actions={
            <button
              onClick={() => setShowModal(true)}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined">add</span>
              Tạo Mã Mới
            </button>
          }
        />

        <div className="flex-1 overflow-y-auto p-8">
          <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-border-light dark:border-border-dark">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Mã / Tên</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Giá trị</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Sử dụng</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Thời hạn</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">Đang tải...</td></tr>
                ) : coupons.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">Bạn chưa tạo mã giảm giá nào</td></tr>
                ) : (
                  coupons.map((coupon: any) => (
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
                        <div className="text-xs text-gray-500">Hết hạn: {new Date(coupon.endTime).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${coupon.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {coupon.active ? 'HIỆU LỰC' : 'HẾT HẠN'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDelete(coupon.id)}
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
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex justify-between items-center">
              <h3 className="text-lg font-bold">Tạo Mã Giảm Giá Nhà Hàng</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mã Coupon</label>
                <input
                  required
                  className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-transparent outline-none"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                  placeholder="E.g. NHÀHÀNG10"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên Mã</label>
                <input
                  required
                  className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-transparent outline-none"
                  value={newCoupon.name}
                  onChange={(e) => setNewCoupon({ ...newCoupon, name: e.target.value })}
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
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số lượng</label>
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
                  className="px-6 py-2 rounded-lg border border-gray-300 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-primary text-white font-bold"
                >
                  Tạo Mã
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponManagementPage;
