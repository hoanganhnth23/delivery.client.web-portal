import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import type { AdminShipper } from '@/services/api/adminService';
import { useAppDependencies } from '@/app/dependencies';

const AdminShippersPage = () => {
  const { admin: adminService, notifications } = useAppDependencies();
  const [shippers, setShippers] = useState<AdminShipper[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const filterTabs: Array<{ key: 'ALL' | 'ONLINE' | 'OFFLINE'; label: string }> = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'ONLINE', label: 'Đang online' },
    { key: 'OFFLINE', label: 'Offline' },
  ];

  const loadShippers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data: AdminShipper[];
      if (filter === 'ONLINE') {
        data = await adminService.fetchOnlineShippers();
      } else {
        const page = await adminService.fetchAllShippers();
        data = page.items;
      }

      if (filter === 'OFFLINE') {
        data = data.filter(s => !s.isOnline);
      }

      setShippers(data || []);
    } catch {
      setError('Không thể tải danh sách shipper');
      notifications.error('Không thể tải danh sách shipper');
    } finally {
      setLoading(false);
    }
  }, [adminService, filter, notifications]);

  useEffect(() => {
    void loadShippers();
  }, [loadShippers]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const filteredShippers = shippers.filter(shipper =>
    shipper.id.toString().includes(searchTerm) ||
    shipper.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipper.phone?.includes(searchTerm) ||
    shipper.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onlineCount = shippers.filter(s => s.isOnline).length;

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Quản lý Shipper</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Tổng cộng {shippers.length} shipper · {onlineCount} đang online
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">{onlineCount} online</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300" role="alert">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void loadShippers()}
              disabled={loading}
              className="shrink-0 rounded-lg bg-red-700 px-3 py-2 font-semibold text-white disabled:opacity-50"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
          <div className="flex overflow-x-auto w-full md:w-auto gap-2 pb-2 md:pb-0 hide-scrollbar">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                  filter === tab.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT, biển số..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>
        </div>

        {/* Shippers Table */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden flex-1">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-border-light dark:border-border-dark">
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Shipper</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">SĐT</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Xe</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Ngày tham gia</th>
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
                ) : error && filteredShippers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">Chưa có dữ liệu để hiển thị.</td>
                  </tr>
                ) : filteredShippers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-4xl text-gray-300">local_shipping</span>
                        <span>Không tìm thấy shipper nào.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredShippers.map((shipper) => (
                    <tr key={shipper.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="p-4 font-semibold text-gray-900 dark:text-white">#{shipper.id}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {(shipper.fullName || '?')[0].toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {shipper.fullName || 'Chưa cập nhật'}
                            </span>
                            <span className="text-xs text-gray-500 md:hidden">{shipper.phone || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">
                        {shipper.phone || 'N/A'}
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm text-gray-900 dark:text-white font-medium">{shipper.licensePlate || 'N/A'}</span>
                          <span className="text-xs text-gray-500">{shipper.vehicleType || ''}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium w-fit ${
                          shipper.isOnline
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${shipper.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                          {shipper.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                        {formatDate(shipper.createdAt)}
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

export default AdminShippersPage;
