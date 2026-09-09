import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useAppDependencies } from '@/app/dependencies';

export interface AdminLivestreamRoom {
  id: string;
  restaurantId: number;
  restaurantName: string;
  restaurantImage: string;
  title: string;
  status: 'LIVE' | 'SCHEDULED' | 'ENDED' | 'CREATED';
  streamProvider: 'AGORA';
  startedAt: string;
  viewers: number;
  orders: number;
  revenue: number;
  hearts: string;
  pinnedItem: {
    name: string;
    image: string;
    originalPrice: number;
    livePrice: number;
  };
  warning?: string;
}

const INITIAL_PLATFORM_ROOMS: AdminLivestreamRoom[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    restaurantId: 35,
    restaurantName: 'Quán Test HÀ ĐÔNG',
    restaurantImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80',
    title: 'Bếp Hà Đông hôm nay - Giảm 40% món nướng giòn',
    status: 'LIVE',
    streamProvider: 'AGORA',
    startedAt: '10:15',
    viewers: 1250,
    orders: 34,
    revenue: 4250000,
    hearts: '14.2K',
    pinnedItem: {
      name: 'Cơm sườn nướng mật ong',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80',
      originalPrice: 65000,
      livePrice: 42000,
    },
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    restaurantId: 2,
    restaurantName: 'Trà Sữa Xiang Cha',
    restaurantImage: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&auto=format&fit=crop&q=80',
    title: 'Đại tiệc Trà Sữa 1Đ - Tặng topping trân châu hoàng kim',
    status: 'LIVE',
    streamProvider: 'AGORA',
    startedAt: '09:45',
    viewers: 2840,
    orders: 86,
    revenue: 8920000,
    hearts: '32.1K',
    pinnedItem: {
      name: 'Trà sữa ô long nướng kem cheese',
      image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&auto=format&fit=crop&q=80',
      originalPrice: 50000,
      livePrice: 25000,
    },
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    restaurantId: 3,
    restaurantName: 'Gà Nướng Muối Ớt Cay',
    restaurantImage: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=200&auto=format&fit=crop&q=80',
    title: 'Gà quay nguyên con chỉ từ 99K trên live hôm nay!',
    status: 'LIVE',
    streamProvider: 'AGORA',
    startedAt: '10:30',
    viewers: 980,
    orders: 19,
    revenue: 3120000,
    hearts: '9.4K',
    pinnedItem: {
      name: 'Gà nướng sốt tiêu xanh',
      image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=300&auto=format&fit=crop&q=80',
      originalPrice: 180000,
      livePrice: 129000,
    },
    warning: 'Có phản hồi giá trên live thấp hơn giá niêm yết bất thường',
  },
  {
    id: '00000000-0000-4000-8000-000000000004',
    restaurantId: 4,
    restaurantName: 'Phở Thìn Lò Đúc Phố Cổ',
    restaurantImage: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=200&auto=format&fit=crop&q=80',
    title: 'Phở bò tái lăn chuẩn vị xưa - Deal độc quyền trưa',
    status: 'SCHEDULED',
    streamProvider: 'AGORA',
    startedAt: '11:30',
    viewers: 0,
    orders: 0,
    revenue: 0,
    hearts: '0',
    pinnedItem: {
      name: 'Phở bò tái lăn đặc biệt',
      image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=300&auto=format&fit=crop&q=80',
      originalPrice: 75000,
      livePrice: 55000,
    },
  },
  {
    id: '00000000-0000-4000-8000-000000000005',
    restaurantId: 5,
    restaurantName: 'Bún Đậu Mắm Tôm Phố Mới',
    restaurantImage: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&auto=format&fit=crop&q=80',
    title: 'Mẹt bún đậu thập cẩm giòn rụm chỉ 39K',
    status: 'ENDED',
    streamProvider: 'AGORA',
    startedAt: '08:00',
    viewers: 1450,
    orders: 52,
    revenue: 5460000,
    hearts: '18.9K',
    pinnedItem: {
      name: 'Mẹt bún đậu thập cẩm đặc biệt',
      image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&auto=format&fit=crop&q=80',
      originalPrice: 65000,
      livePrice: 39000,
    },
  },
];

export default function AdminLivestreamPage() {
  const { notifications, livestreamHost } = useAppDependencies();
  const [rooms, setRooms] = useState<AdminLivestreamRoom[]>(INITIAL_PLATFORM_ROOMS);
  const [filter, setFilter] = useState<'ALL' | 'LIVE' | 'SCHEDULED' | 'ENDED' | 'WARNING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [monitoredRoom, setMonitoredRoom] = useState<AdminLivestreamRoom | null>(null);
  const [warningModalRoom, setWarningModalRoom] = useState<AdminLivestreamRoom | null>(null);
  const [warningText, setWarningText] = useState('');
  const [stoppingId, setStoppingId] = useState<string | null>(null);

  // Sync if any streams exist in backend for current restaurant
  useEffect(() => {
    void (async () => {
      try {
        const backendStreams = await livestreamHost.inspect(35);
        if (backendStreams.length > 0) {
          setRooms((prev) => {
            const copy = [...prev];
            for (const b of backendStreams) {
              const idx = copy.findIndex((r) => r.id === b.id);
              if (idx >= 0) {
                copy[idx] = { ...copy[idx], status: b.status, title: b.title };
              }
            }
            return copy;
          });
        }
      } catch {
        // Keep initial mock rooms
      }
    })();
  }, [livestreamHost]);

  // Statistics calculation
  const stats = useMemo(() => {
    const liveCount = rooms.filter((r) => r.status === 'LIVE').length;
    const totalViewers = rooms
      .filter((r) => r.status === 'LIVE')
      .reduce((sum, r) => sum + r.viewers, 0);
    const totalRevenue = rooms.reduce((sum, r) => sum + r.revenue, 0);
    const totalOrders = rooms.reduce((sum, r) => sum + r.orders, 0);
    return { liveCount, totalViewers, totalRevenue, totalOrders };
  }, [rooms]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      if (filter === 'LIVE' && room.status !== 'LIVE') return false;
      if (filter === 'SCHEDULED' && room.status !== 'SCHEDULED' && room.status !== 'CREATED') return false;
      if (filter === 'ENDED' && room.status !== 'ENDED') return false;
      if (filter === 'WARNING' && !room.warning) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = room.title.toLowerCase().includes(query);
        const matchName = room.restaurantName.toLowerCase().includes(query);
        if (!matchTitle && !matchName) return false;
      }
      return true;
    });
  }, [rooms, filter, searchQuery]);

  // Force stop / end live stream
  const handleForceEnd = async (room: AdminLivestreamRoom) => {
    setStoppingId(room.id);
    try {
      await livestreamHost.end(room.id);
      setRooms((prev) =>
        prev.map((r) => (r.id === room.id ? { ...r, status: 'ENDED' } : r)),
      );
      if (monitoredRoom?.id === room.id) {
        setMonitoredRoom((prev) => (prev ? { ...prev, status: 'ENDED' } : null));
      }
      notifications.success(`Đã dừng phát sóng phòng live của ${room.restaurantName}`);
    } catch {
      notifications.error('Không thể dừng phiên livestream');
    } finally {
      setStoppingId(null);
    }
  };

  // Unpin dish action
  const handleUnpinDish = (room: AdminLivestreamRoom) => {
    setRooms((prev) =>
      prev.map((r) =>
        r.id === room.id
          ? {
              ...r,
              pinnedItem: {
                name: 'Đã gỡ món vi phạm',
                image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80',
                originalPrice: 0,
                livePrice: 0,
              },
            }
          : r,
      ),
    );
    if (monitoredRoom?.id === room.id) {
      setMonitoredRoom((prev) =>
        prev
          ? {
              ...prev,
              pinnedItem: {
                name: 'Đã gỡ món vi phạm',
                image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80',
                originalPrice: 0,
                livePrice: 0,
              },
            }
          : null,
      );
    }
    notifications.success('Đã gỡ món ghim vi phạm');
  };

  // Submit warning
  const handleSendWarning = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warningModalRoom || !warningText.trim()) return;
    const updated = rooms.map((r) =>
      r.id === warningModalRoom.id ? { ...r, warning: warningText.trim() } : r,
    );
    setRooms(updated);
    if (monitoredRoom?.id === warningModalRoom.id) {
      setMonitoredRoom({ ...warningModalRoom, warning: warningText.trim() });
    }
    notifications.success(`Đã gửi cảnh báo kiểm duyệt tới ${warningModalRoom.restaurantName}`);
    setWarningModalRoom(null);
    setWarningText('');
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        {/* Page Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
              Quản lý & Giám sát Livestream
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Giám sát toàn bộ phiên phát sóng trực tiếp trên nền tảng, kiểm duyệt nội dung và hỗ trợ can thiệp thời gian thực.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Cổng Agora Gateway: Hoạt động tốt
            </span>
          </div>
        </div>

        {/* Platform KPI Summary */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-surface-dark">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Phòng đang phát</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                <span className="material-symbols-outlined text-lg">live_tv</span>
              </span>
            </div>
            <p className="mt-2 text-2xl font-black text-red-600">{stats.liveCount} phòng</p>
            <span className="text-xs text-gray-500">Đang trực tiếp toàn sàn</span>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-surface-dark">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Tổng mắt xem</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <span className="material-symbols-outlined text-lg">visibility</span>
              </span>
            </div>
            <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
              {stats.totalViewers.toLocaleString()}
            </p>
            <span className="text-xs text-blue-600 font-semibold">Khách đang xem live</span>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-surface-dark">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Doanh số live hôm nay</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <span className="material-symbols-outlined text-lg">payments</span>
              </span>
            </div>
            <p className="mt-2 text-2xl font-black text-emerald-600">
              {stats.totalRevenue.toLocaleString('vi-VN')}đ
            </p>
            <span className="text-xs text-gray-500">{stats.totalOrders} đơn hàng phát sinh</span>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-surface-dark">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Tỉ lệ chốt đơn</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                <span className="material-symbols-outlined text-lg">trending_up</span>
              </span>
            </div>
            <p className="mt-2 text-2xl font-black text-purple-600">8.4%</p>
            <span className="text-xs text-emerald-600 font-semibold">+2.1% so với hôm qua</span>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'ALL', label: `Tất cả (${rooms.length})` },
              { key: 'LIVE', label: `Đang phát sóng (${stats.liveCount})` },
              { key: 'SCHEDULED', label: 'Đã lên lịch' },
              { key: 'ENDED', label: 'Đã kết thúc' },
              { key: 'WARNING', label: `Cần chú ý (${rooms.filter((r) => r.warning).length})` },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key as typeof filter)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                  filter === tab.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 dark:bg-surface-dark dark:text-gray-300 dark:border-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-lg">search</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm quán hoặc tiêu đề live..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-primary dark:border-gray-800 dark:bg-surface-dark dark:text-white"
            />
          </div>
        </div>

        {/* Livestream Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-surface-dark">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-800 dark:bg-gray-800/50">
                <tr>
                  <th className="py-3.5 pl-6 pr-3 font-semibold">Nhà hàng & Tiêu đề Live</th>
                  <th className="px-3 py-3.5 font-semibold">Món đang ghim</th>
                  <th className="px-3 py-3.5 font-semibold">Trạng thái & Bắt đầu</th>
                  <th className="px-3 py-3.5 font-semibold">Mắt xem & Đơn hàng</th>
                  <th className="px-3 py-3.5 font-semibold">Doanh số live</th>
                  <th className="py-3.5 pl-3 pr-6 text-right font-semibold">Hành động kiểm duyệt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredRooms.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      Không tìm thấy phòng livestream nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredRooms.map((room) => {
                    const isLive = room.status === 'LIVE';
                    return (
                      <tr key={room.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        {/* Restaurant & Title */}
                        <td className="py-4 pl-6 pr-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={room.restaurantImage}
                              alt={room.restaurantName}
                              className="h-10 w-10 rounded-xl object-cover shadow-sm"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 dark:text-white">{room.restaurantName}</p>
                              <p className="max-w-xs truncate text-xs text-gray-500 dark:text-gray-400">{room.title}</p>
                              {room.warning && (
                                <span className="mt-1 inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                  <span className="material-symbols-outlined text-[12px]">warning</span>
                                  {room.warning}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Pinned Dish */}
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-2">
                            <img
                              src={room.pinnedItem.image}
                              alt={room.pinnedItem.name}
                              className="h-9 w-9 rounded-lg object-cover"
                            />
                            <div>
                              <p className="max-w-[140px] truncate font-semibold text-gray-800 dark:text-gray-200">
                                {room.pinnedItem.name}
                              </p>
                              <p className="text-xs font-bold text-primary">
                                {room.pinnedItem.livePrice > 0
                                  ? `${room.pinnedItem.livePrice.toLocaleString('vi-VN')}đ`
                                  : '-'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Status & Time */}
                        <td className="px-3 py-4">
                          <div>
                            {isLive ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-black text-red-700 dark:bg-red-950 dark:text-red-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping" />
                                LIVE
                              </span>
                            ) : room.status === 'SCHEDULED' || room.status === 'CREATED' ? (
                              <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-bold text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400">
                                {room.status === 'CREATED' ? 'SẴN SÀNG' : 'LÊN LỊCH'}
                              </span>
                            ) : (
                              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                ĐÃ KẾT THÚC
                              </span>
                            )}
                            <p className="mt-1 text-[11px] text-gray-400">Bắt đầu: {room.startedAt}</p>
                          </div>
                        </td>

                        {/* Viewers & Orders */}
                        <td className="px-3 py-4">
                          <div className="space-y-0.5">
                            <p className="font-bold text-gray-900 dark:text-white">
                              {room.viewers.toLocaleString()} 👁
                            </p>
                            <p className="text-[11px] text-gray-500">{room.orders} đơn chốt</p>
                          </div>
                        </td>

                        {/* Revenue */}
                        <td className="px-3 py-4">
                          <span className="font-black text-emerald-600">
                            {room.revenue.toLocaleString('vi-VN')}đ
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 pl-3 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              id={`btn-monitor-${room.id}`}
                              data-testid={`btn-monitor-${room.id}`}
                              type="button"
                              onClick={() => setMonitoredRoom(room)}
                              className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 font-bold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition"
                            >
                              <span className="material-symbols-outlined text-sm">visibility</span>
                              Giám sát
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setWarningModalRoom(room);
                                setWarningText(room.warning || '');
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 font-bold text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400 transition"
                              title="Gửi cảnh báo kiểm duyệt"
                            >
                              <span className="material-symbols-outlined text-sm">warning</span>
                              Cảnh báo
                            </button>

                            {isLive && (
                              <button
                                type="button"
                                disabled={stoppingId === room.id}
                                onClick={() => void handleForceEnd(room)}
                                className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 font-bold text-white shadow-sm hover:bg-red-700 transition disabled:opacity-50"
                                title="Cưỡng chế dừng phiên live"
                              >
                                <span className="material-symbols-outlined text-sm">gavel</span>
                                {stoppingId === room.id ? 'Đang dừng…' : 'Dừng live'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Monitor Modal */}
        {monitoredRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-surface-dark">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b px-6 py-4 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <span className="flex h-3 w-3 rounded-full bg-red-500 animate-ping" />
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      Màn hình Giám sát Trực tiếp: {monitoredRoom.restaurantName}
                    </h3>
                    <p className="text-xs text-gray-500">{monitoredRoom.title}</p>
                  </div>
                </div>
                <button
                  id="btn-close-monitor-modal"
                  type="button"
                  onClick={() => setMonitoredRoom(null)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="grid flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-3">
                {/* Simulated Live Stream Video Box (2 cols) */}
                <div className="relative flex min-h-[380px] flex-col justify-between bg-black p-4 text-white lg:col-span-2">
                  {/* Video overlays */}
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
                      {monitoredRoom.status}
                    </span>
                    <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold backdrop-blur">
                      Channel: agora_{monitoredRoom.id.slice(0, 8)} | 1080p @ 60fps
                    </span>
                  </div>

                  {/* Pinned dish in video */}
                  <div className="my-auto max-w-xs rounded-xl bg-black/70 p-3 backdrop-blur border border-white/20">
                    <span className="text-[10px] font-bold text-primary uppercase">Món đang ghim bán:</span>
                    <p className="text-xs font-bold text-white">{monitoredRoom.pinnedItem.name}</p>
                    <p className="text-xs font-black text-primary">
                      {monitoredRoom.pinnedItem.livePrice.toLocaleString('vi-VN')}đ
                    </p>
                  </div>

                  {/* Video HUD info */}
                  <div className="flex items-center justify-between border-t border-white/20 pt-3 text-xs">
                    <span>Mắt xem: <b>{monitoredRoom.viewers.toLocaleString()}</b></span>
                    <span>Lượt tim: <b>{monitoredRoom.hearts}</b></span>
                    <span>Đơn chốt: <b>{monitoredRoom.orders}</b></span>
                  </div>
                </div>

                {/* Right Moderation Side Panel */}
                <div className="flex flex-col justify-between border-l p-5 dark:border-gray-800">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">Kiểm duyệt luồng</h4>
                      <p className="mt-1 text-xs text-gray-500">Thông số kỹ thuật & hành động cưỡng chế.</p>
                    </div>

                    <div className="space-y-2 rounded-xl bg-gray-50 p-3 text-xs dark:bg-gray-800/60">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Stream Provider:</span>
                        <span className="font-bold text-gray-900 dark:text-white">{monitoredRoom.streamProvider}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Thời gian bắt đầu:</span>
                        <span className="font-bold text-gray-900 dark:text-white">{monitoredRoom.startedAt}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Doanh số live:</span>
                        <span className="font-bold text-emerald-600">
                          {monitoredRoom.revenue.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    </div>

                    {/* Moderation actions inside monitor */}
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => handleUnpinDish(monitoredRoom)}
                        className="w-full rounded-xl border border-amber-300 bg-amber-50 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                      >
                        Gỡ món ghim vi phạm
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setWarningModalRoom(monitoredRoom);
                          setWarningText(monitoredRoom.warning || '');
                        }}
                        className="w-full rounded-xl border border-gray-300 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 transition dark:border-gray-700 dark:text-gray-300"
                      >
                        Gửi cảnh báo đến Host
                      </button>

                      {monitoredRoom.status === 'LIVE' && (
                        <button
                          type="button"
                          onClick={() => void handleForceEnd(monitoredRoom)}
                          className="w-full rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white shadow hover:bg-red-700 transition"
                        >
                          Dừng phát sóng khẩn cấp
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="mt-4 text-[10px] text-gray-400">
                    Mọi can thiệp cưỡng chế đều được lưu vết kiểm toán (Audit Trail) trên hệ thống.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Send Warning Modal */}
        {warningModalRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-surface-dark">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Gửi cảnh báo kiểm duyệt tới {warningModalRoom.restaurantName}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Tin nhắn cảnh báo sẽ hiển thị trực tiếp vào màn hình Studio phát sóng của chủ quán.
              </p>

              <form onSubmit={handleSendWarning} className="mt-4 space-y-3">
                <textarea
                  rows={3}
                  required
                  value={warningText}
                  onChange={(e) => setWarningText(e.target.value)}
                  placeholder="Nhập lý do cảnh báo (ví dụ: Hình ảnh món chưa đảm bảo quy định, thông tin giảm giá không chính xác)..."
                  className="w-full rounded-xl border border-gray-300 p-3 text-xs outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setWarningModalRoom(null)}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-amber-700"
                  >
                    Gửi cảnh báo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
