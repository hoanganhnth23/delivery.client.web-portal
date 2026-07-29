import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import {
  flashSaleAdminService,
  type FlashSaleCampaign,
  type FlashSaleCampaignStatus,
  type FlashSaleItem,
} from '@/services/api/flashSaleService';
import { toast } from 'react-hot-toast';

const AdminFlashSalePage = () => {
  const [campaigns, setCampaigns] = useState<FlashSaleCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState<number | null>(null);
  const [campaignItems, setCampaignItems] = useState<FlashSaleItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    isRecurring: false,
    startTime: '00:00',
    endTime: '23:59',
  });

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const data = await flashSaleAdminService.getAllCampaigns();
      setCampaigns(data);
    } catch {
      toast.error('Lỗi khi tải danh sách Flash Sale');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCampaigns();
  }, [loadCampaigns]);

  const loadItems = async (campaignId: number) => {
    setItemsLoading(true);
    setShowItemsModal(campaignId);
    try {
      const data = await flashSaleAdminService.getCampaignItems(campaignId);
      setCampaignItems(data);
    } catch {
      toast.error('Lỗi khi tải danh sách món ăn');
    } finally {
      setItemsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Backend expects proper time strings
      const payload = {
        ...newCampaign,
        startTime: `${newCampaign.startTime}:00`,
        endTime: `${newCampaign.endTime}:00`,
      };
      
      await flashSaleAdminService.createCampaign(payload);
      toast.success('Tạo chiến dịch thành công');
      setShowModal(false);
      void loadCampaigns();
    } catch {
      toast.error('Lỗi khi tạo chiến dịch');
    }
  };

  const handleUpdateStatus = async (id: number, status: FlashSaleCampaignStatus) => {
    try {
      await flashSaleAdminService.updateCampaignStatus(id, status);
      toast.success(`Đã đổi trạng thái thành ${status}`);
      void loadCampaigns();
    } catch {
      toast.error('Lỗi khi đổi trạng thái');
    }
  };

  const handleApproveItem = async (itemId: number) => {
    try {
      await flashSaleAdminService.approveItem(itemId);
      toast.success('Đã duyệt món ăn');
      if (showItemsModal) void loadItems(showItemsModal);
    } catch {
      toast.error('Lỗi duyệt món ăn');
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Flash Sale</h1>
          <p className="text-gray-500">Tạo chiến dịch và duyệt các món ăn tham gia</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add</span>
          Tạo Chiến dịch
        </button>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-border-light dark:border-border-dark">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tên chiến dịch</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Loại</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Thời gian</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light dark:divide-border-dark">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Đang tải...</td></tr>
            ) : campaigns.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Chưa có chiến dịch Flash Sale nào</td></tr>
            ) : (
              campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 dark:text-white">{campaign.name}</div>
                    <div className="text-xs text-gray-400">ID: {campaign.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${campaign.isRecurring ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {campaign.isRecurring ? 'HẰNG NGÀY' : 'MỘT LẦN'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">{campaign.startTime} - {campaign.endTime}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
                      campaign.status === 'UPCOMING' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadItems(campaign.id)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Xem món ăn"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                      </button>
                      
                      {campaign.status === 'UPCOMING' && (
                        <button
                          onClick={() => handleUpdateStatus(campaign.id, 'ACTIVE')}
                          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                          title="Kích hoạt"
                        >
                          <span className="material-symbols-outlined text-sm">play_arrow</span>
                        </button>
                      )}
                      {campaign.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleUpdateStatus(campaign.id, 'ENDED')}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          title="Kết thúc"
                        >
                          <span className="material-symbols-outlined text-sm">stop</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex justify-between items-center">
              <h3 className="text-lg font-bold">Tạo Flash Sale</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên chiến dịch</label>
                <input
                  required
                  className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-transparent focus:ring-2 focus:ring-primary/50 outline-none"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="Flash Sale Khung Giờ Vàng"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={newCampaign.isRecurring}
                  onChange={(e) => setNewCampaign({ ...newCampaign, isRecurring: e.target.checked })}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="isRecurring" className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Lặp lại hằng ngày (Recurring)
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Giờ bắt đầu</label>
                  <input
                    type="time"
                    required
                    className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-transparent outline-none"
                    value={newCampaign.startTime}
                    onChange={(e) => setNewCampaign({ ...newCampaign, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Giờ kết thúc</label>
                  <input
                    type="time"
                    required
                    className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-transparent outline-none"
                    value={newCampaign.endTime}
                    onChange={(e) => setNewCampaign({ ...newCampaign, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 rounded-lg border border-gray-300 font-bold hover:bg-gray-50 transition-colors">
                  Hủy
                </button>
                <button type="submit" className="px-6 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors">
                  Tạo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Items Review Modal */}
      {showItemsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-gray-50 dark:bg-gray-800">
              <h3 className="text-lg font-bold">Duyệt Món Ăn Flash Sale</h3>
              <button onClick={() => setShowItemsModal(null)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-0">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                  <tr className="border-b border-border-light dark:border-border-dark">
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Món ăn</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Giá gốc</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Giá FS</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Số lượng</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Trạng thái</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Duyệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                  {itemsLoading ? (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">Đang tải...</td></tr>
                  ) : campaignItems.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">Chưa có món ăn nào đăng ký</td></tr>
                  ) : (
                    campaignItems.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                        <td className="px-6 py-3">
                          <div className="font-bold text-sm text-gray-900 dark:text-white">Món #{item.menuItemId}</div>
                          <div className="text-xs text-gray-500">Shop ID: {item.restaurantId}</div>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500 line-through">
                          {item.originalPrice.toLocaleString()}đ
                        </td>
                        <td className="px-6 py-3 font-bold text-primary">
                          {item.flashSalePrice.toLocaleString()}đ
                        </td>
                        <td className="px-6 py-3 text-sm font-medium">
                          {item.stockQuantity}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                            item.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                            item.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          {item.status === 'PENDING' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveItem(item.id)}
                                className="px-2 py-1 text-xs font-bold bg-green-500 text-white rounded hover:bg-green-600"
                              >
                                Duyệt
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminFlashSalePage;
