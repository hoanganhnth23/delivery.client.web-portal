import { useEffect, useMemo, useState } from 'react';
import { useDialogFocus } from '@/components/navigation/useDialogFocus';
import './adminLivestream.css';
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

  const monitorRef = useDialogFocus(Boolean(monitoredRoom), () => setMonitoredRoom(null), Boolean(warningModalRoom));
  const warningRef = useDialogFocus(Boolean(warningModalRoom), () => setWarningModalRoom(null));

  const openWarning = (room: AdminLivestreamRoom) => {
    setWarningModalRoom(room);
    setWarningText(room.warning || '');
  };
  const statusLabel = (room: AdminLivestreamRoom) => ({
    LIVE: 'Đang phát', CREATED: 'Sẵn sàng', SCHEDULED: 'Lên lịch', ENDED: 'Đã kết thúc',
  }[room.status]);
  const money = (value: number) => value.toLocaleString('vi-VN') + 'đ';

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
        const query = searchQuery.trim().toLowerCase();
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
      <section className="live-workspace" aria-label="Quản lý livestream">
        <header className="live-heading">
          <div>
            <h1>Quản lý & Giám sát Livestream</h1>
            <p>Theo dõi phiên phát sóng và xử lý nội dung cần chú ý.</p>
          </div>
          <span className="live-demo">Dữ liệu mô phỏng</span>
        </header>
        <dl className="live-summary">
          <div><dt>Đang phát</dt><dd>{stats.liveCount}<small>phòng</small></dd></div>
          <div><dt>Mắt xem trực tiếp</dt><dd>{stats.totalViewers.toLocaleString('vi-VN')}</dd></div>
          <div><dt>Doanh số mẫu</dt><dd>{money(stats.totalRevenue)}</dd></div>
          <div><dt>Cần chú ý</dt><dd>{rooms.filter((room) => room.warning).length}<small>phòng</small></dd></div>
        </dl>
        <div className="live-toolbar">
          <div className="live-filters" role="group" aria-label="Lọc trạng thái livestream">
            {([
              ['ALL', `Tất cả (${rooms.length})`],
              ['LIVE', `Đang phát sóng (${stats.liveCount})`],
              ['SCHEDULED', 'Đã lên lịch'],
              ['ENDED', 'Đã kết thúc'],
              ['WARNING', `Cần chú ý (${rooms.filter((room) => room.warning).length})`],
            ] as const).map(([key, label]) => (
              <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>
            ))}
          </div>
          <label className="live-search">
            <span className="material-symbols-outlined" aria-hidden="true">search</span>
            <input type="search" aria-label="Tìm livestream" placeholder="Tìm quán hoặc tiêu đề live…" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
          </label>
        </div>
        <div className="live-list">
          <div className="live-list-heading"><h2>Phiên phát sóng</h2><span role="status">{filteredRooms.length} kết quả</span></div>
          {filteredRooms.length === 0 ? (
            <div className="live-empty">
              <span className="material-symbols-outlined" aria-hidden="true">search_off</span>
              <p>Không tìm thấy phòng livestream nào phù hợp.</p>
              <button className="live-button" onClick={() => { setFilter('ALL'); setSearchQuery(''); }}>Xóa bộ lọc</button>
            </div>
          ) : filteredRooms.map((room) => (
            <article key={room.id} className="live-room" aria-label={room.restaurantName}>
              <div className="live-room-identity">
                <img src={room.restaurantImage} alt="" width="48" height="48" />
                <div><h3>{room.restaurantName}</h3><p>{room.title}</p>
                  <div className="live-room-status"><span className={`live-status live-status-${room.status.toLowerCase()}`}>{statusLabel(room)}</span><span>{room.status === 'SCHEDULED' ? 'Dự kiến' : 'Mốc giờ mẫu'} {room.startedAt}</span></div>
                </div>
              </div>
              <div className="live-pinned">
                <span className="live-label">Món đang ghim</span>
                <strong>{room.pinnedItem.name}</strong>
                <span className="live-price">{room.pinnedItem.livePrice > 0 ? money(room.pinnedItem.livePrice) : '—'}</span>
              </div>
              <dl className="live-room-metrics">
                <div><dt>{room.status === 'LIVE' ? 'Mắt xem' : 'Lượt xem mẫu'}</dt><dd>{room.viewers.toLocaleString('vi-VN')}</dd></div>
                <div><dt>Đơn mẫu</dt><dd>{room.orders}</dd></div>
                <div><dt>Doanh số mẫu</dt><dd>{money(room.revenue)}</dd></div>
              </dl>
              <div className="live-room-actions">
                <button className="live-button live-button-primary" id={`btn-monitor-${room.id}`} data-testid={`btn-monitor-${room.id}`} onClick={() => setMonitoredRoom(room)}>Giám sát</button>
                <button className="live-button" onClick={() => openWarning(room)}>Cảnh báo</button>
                {room.status === 'LIVE' && <button className="live-button live-button-danger" disabled={stoppingId !== null} onClick={() => void handleForceEnd(room)}>{stoppingId === room.id ? 'Đang dừng…' : 'Dừng live'}</button>}
              </div>
              {room.warning && <p className="live-room-warning"><span className="material-symbols-outlined" aria-hidden="true">warning</span>{room.warning}</p>}
            </article>
          ))}
        </div>
        <p className="live-footnote">Số liệu và thao tác cảnh báo, gỡ món đang được mô phỏng. Chưa kết nối video hoặc xác minh trạng thái Agora.</p>
        {monitoredRoom && (
          <div className="live-overlay">
            <div ref={monitorRef} role="dialog" aria-modal="true" aria-labelledby="live-monitor-title" tabIndex={-1} className="live-dialog" inert={Boolean(warningModalRoom)}>
              <header className="live-dialog-header">
                <div><h2 id="live-monitor-title">Giám sát: {monitoredRoom.restaurantName}</h2><p>{monitoredRoom.title}</p></div>
                <button className="live-close" id="btn-close-monitor-modal" aria-label="Đóng giám sát" onClick={() => setMonitoredRoom(null)}><span className="material-symbols-outlined" aria-hidden="true">close</span></button>
              </header>
              <div className="live-monitor-body">
                <div className="live-monitor-stage">
                  <div className="live-stage-top"><span className={`live-status live-status-${monitoredRoom.status.toLowerCase()}`}>{statusLabel(monitoredRoom)}</span><span>Mô phỏng</span></div>
                  <div className="live-video-placeholder"><span className="material-symbols-outlined" aria-hidden="true">videocam_off</span><h3>Chưa kết nối video trực tiếp</h3><p>Khung giám sát mẫu · {monitoredRoom.streamProvider}</p></div>
                  <div className="live-stage-product"><span className="live-label">Món đang ghim</span><strong>{monitoredRoom.pinnedItem.name}</strong><span>{monitoredRoom.pinnedItem.livePrice > 0 ? money(monitoredRoom.pinnedItem.livePrice) : '—'}</span></div>
                </div>
                <aside className="live-inspector">
                  <h3>Kiểm duyệt luồng</h3>
                  <dl><div><dt>Lượt xem mẫu</dt><dd>{monitoredRoom.viewers.toLocaleString('vi-VN')}</dd></div><div><dt>Đơn mẫu</dt><dd>{monitoredRoom.orders}</dd></div><div><dt>Doanh số mẫu</dt><dd>{money(monitoredRoom.revenue)}</dd></div></dl>
                  {monitoredRoom.warning && <p className="live-room-warning">{monitoredRoom.warning}</p>}
                  <button className="live-button" onClick={() => handleUnpinDish(monitoredRoom)}>Gỡ món ghim vi phạm</button>
                  <button className="live-button" onClick={() => openWarning(monitoredRoom)}>Gửi cảnh báo đến Host</button>
                  {monitoredRoom.status === 'LIVE' && <button className="live-button live-button-danger" disabled={stoppingId !== null} onClick={() => void handleForceEnd(monitoredRoom)}>{stoppingId === monitoredRoom.id ? 'Đang dừng…' : 'Dừng phát sóng khẩn cấp'}</button>}
                  <p className="live-footnote">Cảnh báo và gỡ món chỉ thay đổi dữ liệu hiển thị; chưa gửi tới Host hoặc ghi audit.</p>
                </aside>
              </div>
            </div>
          </div>
        )}
        {warningModalRoom && (
          <div className="live-overlay">
            <div ref={warningRef} role="dialog" aria-modal="true" aria-labelledby="live-warning-title" tabIndex={-1} className="live-dialog live-warning-dialog">
              <header className="live-dialog-header"><div><h2 id="live-warning-title">Cảnh báo kiểm duyệt</h2><p>{warningModalRoom.restaurantName}</p></div><button className="live-close" aria-label="Đóng cảnh báo" onClick={() => setWarningModalRoom(null)}><span className="material-symbols-outlined" aria-hidden="true">close</span></button></header>
              <form className="live-warning-form" onSubmit={handleSendWarning}>
                <label htmlFor="live-warning-message">Lý do cảnh báo</label>
                <textarea id="live-warning-message" rows={4} required value={warningText} onChange={(event) => setWarningText(event.target.value)} placeholder="Mô tả nội dung cần điều chỉnh…" />
                <p className="live-footnote">Cảnh báo mô phỏng, chưa gửi tới Host.</p>
                <div className="live-form-actions"><button type="button" className="live-button" onClick={() => setWarningModalRoom(null)}>Hủy</button><button type="submit" className="live-button live-button-primary" disabled={!warningText.trim()}>Gửi cảnh báo</button></div>
              </form>
            </div>
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
