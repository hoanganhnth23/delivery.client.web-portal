import { useCallback, useEffect, useRef, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useDialogFocus } from '@/components/navigation/useDialogFocus';
import {
  type FlashSaleCampaign,
  type FlashSaleCampaignStatus,
  type FlashSaleItem,
} from '@/services/api/flashSaleService';
import { useAppDependencies } from '@/app/dependencies';

const AdminFlashSalePage = () => {
  const {
    flashSaleAdmin: flashSaleAdminService,
    notifications,
  } = useAppDependencies();
  const [campaigns, setCampaigns] = useState<FlashSaleCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState<number | null>(null);
  const createDialogRef = useDialogFocus(showModal, () => setShowModal(false));
  const itemsDialogRef = useDialogFocus(showItemsModal !== null, () => setShowItemsModal(null));
  const [campaignItems, setCampaignItems] = useState<FlashSaleItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [statusMutationId, setStatusMutationId] = useState<number | null>(null);
  const [approvingItemId, setApprovingItemId] = useState<number | null>(null);
  const statusMutationRef = useRef<number | null>(null);
  const approvingItemRef = useRef<number | null>(null);
  
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    isRecurring: false,
    startTime: '00:00',
    endTime: '23:59',
  });

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await flashSaleAdminService.getAllCampaigns();
      setCampaigns(data);
    } catch {
      setError('Không thể tải danh sách Flash Sale');
      notifications.error('Lỗi khi tải danh sách Flash Sale');
    } finally {
      setLoading(false);
    }
  }, [flashSaleAdminService, notifications]);

  useEffect(() => {
    void loadCampaigns();
  }, [loadCampaigns]);

  const loadItems = async (campaignId: number) => {
    setItemsLoading(true);
    setItemsError(null);
    setShowItemsModal(campaignId);
    setCampaignItems([]);
    try {
      const data = await flashSaleAdminService.getCampaignItems(campaignId);
      setCampaignItems(data);
    } catch {
      setItemsError('Không thể tải danh sách món ăn');
      notifications.error('Lỗi khi tải danh sách món ăn');
    } finally {
      setItemsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    if (!newCampaign.name.trim() || !newCampaign.startTime || !newCampaign.endTime) {
      notifications.error('Vui lòng nhập đủ thông tin chiến dịch');
      return;
    }

    setCreating(true);
    try {
      // Backend expects proper time strings
      const payload = {
        ...newCampaign,
        startTime: `${newCampaign.startTime}:00`,
        endTime: `${newCampaign.endTime}:00`,
      };
      
      await flashSaleAdminService.createCampaign(payload);
      notifications.success('Tạo chiến dịch thành công');
      setShowModal(false);
      await loadCampaigns();
    } catch {
      notifications.error('Lỗi khi tạo chiến dịch');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: FlashSaleCampaignStatus) => {
    // State updates are committed after the event handler returns. A
    // same-tick double click must therefore use a synchronous ref guard.
    if (statusMutationRef.current !== null) return;
    statusMutationRef.current = id;
    setStatusMutationId(id);
    try {
      await flashSaleAdminService.updateCampaignStatus(id, status);
      notifications.success(`Đã đổi trạng thái thành ${status}`);
      await loadCampaigns();
    } catch {
      notifications.error('Lỗi khi đổi trạng thái');
    } finally {
      statusMutationRef.current = null;
      setStatusMutationId(null);
    }
  };

  const handleApproveItem = async (itemId: number) => {
    if (approvingItemRef.current !== null) return;
    approvingItemRef.current = itemId;
    setApprovingItemId(itemId);
    try {
      await flashSaleAdminService.approveItem(itemId);
      notifications.success('Đã duyệt món ăn');
      if (showItemsModal) await loadItems(showItemsModal);
    } catch {
      notifications.error('Lỗi duyệt món ăn');
    } finally {
      approvingItemRef.current = null;
      setApprovingItemId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-5 flex flex-col items-start justify-between gap-3 sm:mb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Quản lý Flash Sale</h1>
          <p className="text-sm text-gray-500">Tạo chiến dịch và duyệt các món ăn tham gia</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-bold text-white transition-all hover:bg-primary/90 sm:w-auto"
        >
          <span className="material-symbols-outlined">add</span>
          Tạo Chiến dịch
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300" role="alert">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadCampaigns()}
            disabled={loading}
            className="shrink-0 rounded-lg bg-red-700 px-3 py-2 font-semibold text-white disabled:opacity-50"
          >
            Thử lại
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border-light bg-white shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[660px] border-collapse text-left">
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
            ) : error && campaigns.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Chưa có dữ liệu để hiển thị.</td></tr>
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
                          type="button"
                          onClick={() => void handleUpdateStatus(campaign.id, 'ACTIVE')}
                          disabled={statusMutationId !== null}
                          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                          title="Kích hoạt"
                        >
                          <span className="material-symbols-outlined text-sm">play_arrow</span>
                        </button>
                      )}
                      {campaign.status === 'ACTIVE' && (
                        <button
                          type="button"
                          onClick={() => void handleUpdateStatus(campaign.id, 'ENDED')}
                          disabled={statusMutationId !== null}
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
      </div>

      {/* Create Modal */}
      {showModal && (
        <div ref={createDialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Tạo Flash Sale" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-surface-dark">
            <div className="flex items-center justify-between gap-3 border-b border-border-light px-4 py-4 dark:border-border-dark sm:px-6">
              <h3 className="text-lg font-bold">Tạo Flash Sale</h3>
              <button aria-label="Đóng" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-4 p-4 sm:p-6">
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

              <div className="flex flex-col-reverse justify-end gap-3 mt-4 sm:flex-row">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 rounded-lg border border-gray-300 font-bold hover:bg-gray-50 transition-colors">
                  Hủy
                </button>
                <button type="submit" disabled={creating} className="px-6 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:opacity-50">
                  {creating ? 'Đang tạo…' : 'Tạo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Items Review Modal */}
      {showItemsModal && (
        <div ref={itemsDialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Duyệt Món Ăn Flash Sale" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-surface-dark">
            <div className="flex items-center justify-between gap-3 border-b border-border-light bg-gray-50 px-4 py-4 dark:border-border-dark dark:bg-gray-800 sm:px-6">
              <h3 className="min-w-0 text-base font-bold sm:text-lg">Duyệt Món Ăn Flash Sale</h3>
              <button aria-label="Đóng" onClick={() => setShowItemsModal(null)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-0">
              <table className="w-full min-w-[720px] border-collapse text-left">
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
                  ) : itemsError ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-red-600">
                        <p>{itemsError}</p>
                        <button type="button" onClick={() => void loadItems(showItemsModal)} className="mt-3 rounded-lg bg-primary px-3 py-2 font-semibold text-white">
                          Thử lại
                        </button>
                      </td>
                    </tr>
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
                                type="button"
                                onClick={() => void handleApproveItem(item.id)}
                                disabled={approvingItemId !== null}
                                className="px-2 py-1 text-xs font-bold bg-green-500 text-white rounded hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
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
