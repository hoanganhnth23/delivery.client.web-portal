import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import adminService, { AdminRating } from '@/services/api/adminService';
import { toast } from 'react-hot-toast';

const AdminRatingsPage = () => {
  const [ratings, setRatings] = useState<AdminRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const statusTabs = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];

  useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = async () => {
    setLoading(true);
    try {
      const data = await adminService.fetchAllRatings();
      setRatings(data || []);
    } catch (error) {
      console.error('Error loading ratings:', error);
      toast.error('Lỗi khi tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (ratingId: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      await adminService.updateRatingStatus(ratingId, status);
      toast.success(status === 'APPROVED' ? 'Đã duyệt đánh giá' : 'Đã từ chối đánh giá');
      // Update local state
      setRatings(prev => prev.map(r => r.id === ratingId ? { ...r, status } : r));
    } catch (error) {
      console.error('Error updating rating status:', error);
      toast.error('Cập nhật trạng thái thất bại');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'APPROVED': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'REJECTED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const filteredRatings = ratings.filter(rating => {
    const matchesStatus = statusFilter === 'ALL' || rating.status === statusFilter;
    const matchesSearch = rating.comment?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          rating.restaurantId.toString().includes(searchTerm) ||
                          rating.orderId.toString().includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
          <div className="flex overflow-x-auto w-full md:w-auto gap-2 pb-2 md:pb-0 hide-scrollbar">
            {statusTabs.map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === tab 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {tab === 'ALL' ? 'Tất cả' : tab}
              </button>
            ))}
          </div>
          
          <div className="relative w-full md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
            <input
              type="text"
              placeholder="Tìm theo nội dung, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>
        </div>

        {/* Ratings Table */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden flex-1">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-border-light dark:border-border-dark">
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Đơn / Nhà hàng</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Khách hàng</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Đánh giá</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nội dung</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      <div className="flex justify-center items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                        Đang tải dữ liệu...
                      </div>
                    </td>
                  </tr>
                ) : filteredRatings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      Không tìm thấy đánh giá nào.
                    </td>
                  </tr>
                ) : (
                  filteredRatings.map((rating) => (
                    <tr key={rating.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Order: #{rating.orderId}</span>
                          <span className="text-xs text-gray-500">Shop: #{rating.restaurantId}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-900 dark:text-white">
                        ID: {rating.customerId}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <span 
                              key={i} 
                              className={`material-symbols-outlined text-lg ${i < rating.rating ? 'text-amber-400' : 'text-gray-300'}`}
                            >
                              star
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate" title={rating.comment}>
                          {rating.comment || <span className="italic text-gray-400">Không có nhận xét</span>}
                        </p>
                        <span className="text-[10px] text-gray-400 mt-1 block">{formatDate(rating.createdAt)}</span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(rating.status)}`}>
                          {rating.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {rating.status === 'PENDING' && (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleUpdateStatus(rating.id, 'APPROVED')}
                              className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                              title="Duyệt"
                            >
                              <span className="material-symbols-outlined text-xl">check_circle</span>
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(rating.id, 'REJECTED')}
                              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                              title="Từ chối"
                            >
                              <span className="material-symbols-outlined text-xl">cancel</span>
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
    </AdminLayout>
  );
};

export default AdminRatingsPage;
