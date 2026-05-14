import { useState, useEffect } from 'react';
import RestaurantSidebar from '@/components/layout/RestaurantSidebar';
import RestaurantHeader from '@/components/layout/RestaurantHeader';
import { flashSaleMerchantService, flashSalePublicService, FlashSaleCampaign, FlashSaleItem } from '@/services/api/flashSaleService';
import { useMenu } from '@/modules/restaurant/hooks/useMenu';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { toast } from 'react-hot-toast';

const RestaurantFlashSalePage = () => {
  const { account } = useAuth();
  const { items: menuItems, fetchItems } = useMenu();
  const [activeCampaigns, setActiveCampaigns] = useState<FlashSaleCampaign[]>([]);
  const [myItems, setMyItems] = useState<FlashSaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [registerData, setRegisterData] = useState({
    campaignId: 0,
    menuItemId: 0,
    flashSalePrice: 0,
    stockQuantity: 10,
  });

  const restaurantId = account?.entityId;

  useEffect(() => {
    if (restaurantId) {
      loadData();
      fetchItems(restaurantId);
    }
  }, [restaurantId]);

  const loadData = async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const [campaignsRes, itemsRes] = await Promise.all([
        flashSalePublicService.getActiveCampaigns(),
        flashSaleMerchantService.getMyItems(restaurantId)
      ]);
      setActiveCampaigns(campaignsRes);
      setMyItems(itemsRes);
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu Flash Sale');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;
    
    if (!registerData.campaignId || !registerData.menuItemId || registerData.flashSalePrice <= 0 || registerData.stockQuantity <= 0) {
      toast.error('Vui lòng nhập đầy đủ và hợp lệ thông tin');
      return;
    }

    try {
      await flashSaleMerchantService.registerItem({
        ...registerData,
        restaurantId
      });
      toast.success('Đăng ký món ăn thành công, chờ admin duyệt');
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error('Lỗi đăng ký món ăn');
    }
  };

  const selectedMenuItem = menuItems.find(item => item.id === registerData.menuItemId);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
      <RestaurantSidebar />

      <main className="flex flex-1 flex-col overflow-hidden">
        <RestaurantHeader
          title="Flash Sale"
          subtitle="Đăng ký món ăn vào các khung giờ vàng để tăng doanh số"
          showSearch={false}
        />

        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="flex justify-end mb-6">
            <button
              onClick={() => {
                if (activeCampaigns.length > 0) {
                  setRegisterData(prev => ({ ...prev, campaignId: activeCampaigns[0].id }));
                }
                setShowModal(true);
              }}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined">bolt</span>
              Đăng ký món ngay
            </button>
          </div>

          {/* Active Campaigns Banner */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeCampaigns.map(campaign => (
              <div key={campaign.id} className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden group">
                <span className="material-symbols-outlined absolute right-[-20px] top-[-20px] text-[120px] opacity-20 transform -rotate-12 group-hover:scale-110 group-hover:rotate-0 transition-transform duration-500">bolt</span>
                <div className="relative z-10">
                  <span className="bg-white/20 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider mb-2 inline-block">
                    {campaign.isRecurring ? 'Hằng ngày' : 'Đặc biệt'}
                  </span>
                  <h3 className="text-xl font-bold mb-1">{campaign.name}</h3>
                  <div className="flex items-center gap-2 text-sm font-medium opacity-90">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    {campaign.startTime} - {campaign.endTime}
                  </div>
                </div>
              </div>
            ))}
            {activeCampaigns.length === 0 && (
              <div className="col-span-full bg-surface-light dark:bg-surface-dark rounded-2xl p-6 text-center text-gray-500 border border-border-light dark:border-border-dark flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-4xl text-gray-300">calendar_today</span>
                <p>Hiện tại không có chiến dịch Flash Sale nào đang mở đăng ký.</p>
              </div>
            )}
          </div>

          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
            <div className="px-6 py-4 border-b border-border-light dark:border-border-dark">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">Các món đã đăng ký</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-border-light dark:border-border-dark">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Chiến dịch</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Món ăn</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Giá & Số lượng</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Đã bán</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                  {loading ? (
                    <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Đang tải...</td></tr>
                  ) : myItems.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-3xl text-gray-300">fastfood</span>
                      Bạn chưa đăng ký món ăn nào
                    </td></tr>
                  ) : (
                    myItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900 dark:text-white">{item.campaign?.name}</div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            {item.campaign?.startTime} - {item.campaign?.endTime}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                          {item.menuItemName}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400 line-through">{item.originalPrice.toLocaleString()}đ</span>
                            <span className="font-bold text-primary text-base">{item.flashSalePrice.toLocaleString()}đ</span>
                            <span className="text-xs text-gray-500 mt-1 font-medium">Tổng kho: {item.stockQuantity}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900 dark:text-white">{item.soldQuantity}</div>
                          <div className="w-24 h-2 bg-gray-100 dark:bg-gray-700 rounded-full mt-1.5 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all" 
                              style={{ width: `${Math.min(100, (item.soldQuantity / item.stockQuantity) * 100)}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            item.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                            item.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-red-100 text-red-700'
                          }`}>
                            {item.status === 'APPROVED' ? 'Đã duyệt' : item.status === 'PENDING' ? 'Chờ duyệt' : 'Từ chối'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Register Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-border-light dark:border-border-dark">
            <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Đăng ký Flash Sale</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleRegister} className="p-6 flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Chọn Chiến Dịch</label>
                <select
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark focus:ring-2 focus:ring-primary/50 outline-none text-sm text-gray-700 dark:text-gray-200"
                  value={registerData.campaignId}
                  onChange={(e) => setRegisterData({ ...registerData, campaignId: Number(e.target.value) })}
                >
                  <option value={0} disabled>-- Chọn chiến dịch --</option>
                  {activeCampaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.startTime}-{c.endTime})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Chọn món ăn</label>
                <select
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark focus:ring-2 focus:ring-primary/50 outline-none text-sm text-gray-700 dark:text-gray-200"
                  value={registerData.menuItemId}
                  onChange={(e) => setRegisterData({ ...registerData, menuItemId: Number(e.target.value) })}
                >
                  <option value={0} disabled>-- Chọn món ăn --</option>
                  {menuItems.map(m => (
                    <option key={m.id} value={m.id}>{m.name} - {m.price.toLocaleString()}đ</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Giá Flash Sale</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      className="w-full pl-4 pr-8 py-2.5 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark outline-none text-primary font-bold focus:ring-2 focus:ring-primary/50"
                      value={registerData.flashSalePrice || ''}
                      onChange={(e) => setRegisterData({ ...registerData, flashSalePrice: Number(e.target.value) })}
                      placeholder="VD: 15000"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-bold">đ</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Số lượng suất</label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    value={registerData.stockQuantity || ''}
                    onChange={(e) => setRegisterData({ ...registerData, stockQuantity: Number(e.target.value) })}
                  />
                </div>
              </div>
              
              {selectedMenuItem && registerData.flashSalePrice > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">local_offer</span>
                  <div>
                    Mức giảm: <span className="font-bold">{Math.round((1 - registerData.flashSalePrice / selectedMenuItem.price) * 100)}%</span> 
                    <div className="text-xs mt-0.5 opacity-80 line-through">{selectedMenuItem.price.toLocaleString()}đ</div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 rounded-xl border border-border-light dark:border-border-dark font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-200">
                  Hủy
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors shadow-sm">
                  Đăng ký ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantFlashSalePage;
