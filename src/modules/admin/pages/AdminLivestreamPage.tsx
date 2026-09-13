import { useEffect, useMemo, useRef, useState } from 'react';
import { useDialogFocus } from '@/components/navigation/useDialogFocus';
import './adminLivestream.css';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useAppDependencies } from '@/app/dependencies';
import { useOptionalPortalPreview } from '@/components/navigation/usePortalPreviewNavigation';

import type { LivestreamProduct } from '@/services/api/livestreamService';
import type { LivestreamViewer } from '@/services/media/agoraViewer';

export interface AdminLivestreamRoom {
  products?: LivestreamProduct[];
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
  const { notifications, livestreamHost, livestreamMedia, livestreamModeration } = useAppDependencies();
  const preview = useOptionalPortalPreview();
  const [roomsLoading, setRoomsLoading] = useState(!preview);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [reload, setReload] = useState(0);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<AdminLivestreamRoom[]>(preview ? INITIAL_PLATFORM_ROOMS : []);
  const [filter, setFilter] = useState<'ALL' | 'LIVE' | 'SCHEDULED' | 'ENDED' | 'WARNING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [monitoredRoom, setMonitoredRoom] = useState<AdminLivestreamRoom | null>(null);
  const [warningModalRoom, setWarningModalRoom] = useState<AdminLivestreamRoom | null>(null);
  const [warningText, setWarningText] = useState('');
  const [warningSaving, setWarningSaving] = useState(false);
  const [warningError, setWarningError] = useState<string | null>(null);
  const [moderationAction, setModerationAction] = useState<'WARN' | 'FORCE_END' | 'UNPIN'>('WARN');
  const monitorVideoRef = useRef<HTMLDivElement>(null);
  const monitorViewerRef = useRef<LivestreamViewer | null>(null);
  const [monitorMediaError, setMonitorMediaError] = useState<string | null>(null);
  const [monitorMediaConnected, setMonitorMediaConnected] = useState(false);
  const [monitorMediaRevision, setMonitorMediaRevision] = useState(0);

  const [targetProductId, setTargetProductId] = useState<number | null>(null);
  const monitorRef = useDialogFocus(Boolean(monitoredRoom), () => setMonitoredRoom(null), Boolean(warningModalRoom));
  const warningRef = useDialogFocus(Boolean(warningModalRoom), () => { if (!warningSaving) setWarningModalRoom(null); });

  const openWarning = (room: AdminLivestreamRoom) => {
    setModerationAction('WARN');
    setWarningError(null);
    setWarningModalRoom(room);
    setWarningText(room.warning || '');
  };
  const statusLabel = (room: AdminLivestreamRoom) => ({
    LIVE: 'Đang phát', CREATED: 'Sẵn sàng', SCHEDULED: 'Lên lịch', ENDED: 'Đã kết thúc',
  }[room.status]);
  const money = (value: number) => value.toLocaleString('vi-VN') + 'đ';

  // Preview keeps deterministic fixture rooms; runtime uses the paged API.
  useEffect(() => {
    if (preview) return;
    let cancelled = false;
    setRoomsLoading(true);
    setRoomsError(null);
    setRooms([]);
    void livestreamModeration.list(page, 20)
      .then((result) => {
        if (cancelled) return;
        setTotalPages(result.totalPages);
        setRooms(result.content.map((stream) => ({
          id: stream.id, restaurantId: stream.restaurantId, products: stream.pinnedProducts,
          restaurantName: stream.pinnedProducts.find((p) => p.restaurantName)?.restaurantName ?? `Nhà hàng #${stream.restaurantId}`,
          restaurantImage: '', title: stream.title, status: stream.status, streamProvider: 'AGORA',
          startedAt: stream.startedAt ?? '—', viewers: stream.viewCount, orders: 0, revenue: 0, hearts: '—',
          pinnedItem: {
            name: stream.pinnedProducts[0]?.productName ?? (stream.pinnedProducts.length ? `Sản phẩm #${stream.pinnedProducts[0].productId}` : 'Chưa có món ghim'),
            image: stream.pinnedProducts[0]?.productImage ?? '', originalPrice: 0,
            livePrice: stream.pinnedProducts[0]?.priceAtLive ?? 0,
          },
        })));
      })
      .catch(() => { if (!cancelled) setRoomsError('Không thể tải danh sách livestream.'); })
      .finally(() => { if (!cancelled) setRoomsLoading(false); });
    return () => { cancelled = true; };
  }, [livestreamModeration, preview, page, reload]);

  useEffect(() => {
    if (preview || !monitoredRoom || monitoredRoom.status !== 'LIVE' || !monitorVideoRef.current) {
      setMonitorMediaConnected(false);
      setMonitorMediaError(null);
      return;
    }
    let cancelled = false;
    let viewer: LivestreamViewer | null = null;
    setMonitorMediaConnected(false);
    setMonitorMediaError(null);
    void livestreamHost.join(monitoredRoom.id).then((session) => {
      if (cancelled || !monitorVideoRef.current) return;
      viewer = livestreamMedia.createViewer(monitorVideoRef.current, (message) => {
        if (!cancelled) {
          setMonitorMediaConnected(false);
          setMonitorMediaError(message);
        }
      });
      monitorViewerRef.current = viewer;
      return viewer.start({
        ...session,
        renewToken: () => livestreamHost.renewToken(monitoredRoom.id, {
          channelName: session.channelName,
          uid: session.uid,
          role: 'VIEWER',
        }),
      }).then(() => {
        if (!cancelled) setMonitorMediaConnected(true);
      });
    }).catch((cause: unknown) => {
      if (!cancelled) {
        setMonitorMediaError(cause instanceof Error ? cause.message : 'Không thể kết nối video giám sát.');
      }
    });
    return () => {
      cancelled = true;
      if (monitorViewerRef.current === viewer) monitorViewerRef.current = null;
      void viewer?.stop();
    };
  }, [livestreamHost, livestreamMedia, monitorMediaRevision, monitoredRoom, preview]);

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

  const handleForceEnd = (room: AdminLivestreamRoom) => {
    setModerationAction('FORCE_END');
    setWarningModalRoom(room);
    setWarningText('');
    setWarningError(null);
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

  // Only apply a warning after the backend acknowledges its audit record.
  const handleSendWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warningModalRoom || !warningText.trim() || warningSaving) return;
    const room = warningModalRoom;
    const reason = warningText.trim();
    if (moderationAction === 'UNPIN' && targetProductId === null) return;
    setWarningSaving(true);
    setWarningError(null);
    try {
      const receipt = await livestreamModeration.moderate(room.id, moderationAction === 'UNPIN'
        ? { action: 'UNPIN', reason, productId: targetProductId! }
        : { action: moderationAction, reason });
      const apply = (entry: AdminLivestreamRoom): AdminLivestreamRoom => {
        if (moderationAction === 'FORCE_END') return { ...entry, status: 'ENDED' };
        if (moderationAction === 'UNPIN') {
          const products = (entry.products ?? []).filter((p) => p.productId !== targetProductId);
          const first = products[0];
          return { ...entry, products, pinnedItem: {
            name: first ? first.productName ?? `Sản phẩm #${first.productId}` : 'Chưa có món ghim',
            image: first?.productImage ?? '', originalPrice: 0, livePrice: first?.priceAtLive ?? 0,
          }};
        }
        return { ...entry, warning: reason };
      };
      setRooms((current) => current.map((entry) => entry.id === room.id ? apply(entry) : entry));
      setMonitoredRoom((current) => current?.id === room.id ? apply(current) : current);
      notifications.success(`Đã lưu kiểm duyệt · Audit #${receipt.auditId}`);
      setWarningModalRoom(null);
      setWarningText('');
    } catch {
      setWarningError(moderationAction === 'UNPIN' ? 'Không thể gỡ món. Vui lòng thử lại.' : moderationAction === 'FORCE_END' ? 'Không thể dừng phát sóng. Vui lòng thử lại.' : 'Không thể lưu cảnh báo. Vui lòng thử lại.');
    } finally {
      setWarningSaving(false);
    }
  };

  return (
    <AdminLayout>
      <section className="live-workspace" aria-label="Quản lý livestream">
        <header className="live-heading">
          <div>
            <h1>Quản lý & Giám sát Livestream</h1>
            <p>Theo dõi phiên phát sóng và xử lý nội dung cần chú ý.</p>
          </div>
          <span className="live-demo">{preview ? 'Dữ liệu mô phỏng' : 'Dữ liệu API · lọc trong trang'}</span>
        </header>
        <dl className="live-summary">
          <div><dt>Đang phát</dt><dd>{stats.liveCount}<small>phòng</small></dd></div>
          <div><dt>{preview ? 'Mắt xem mẫu' : 'Lượt xem tích lũy (trang)'}</dt><dd>{stats.totalViewers.toLocaleString('vi-VN')}</dd></div>
          <div><dt>Doanh số</dt><dd>{preview ? money(stats.totalRevenue) : 'Chưa có dữ liệu'}</dd></div>
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
          {roomsError && <div className="live-empty" role="alert"><p>{roomsError}</p><button className="live-button" onClick={() => setReload((value) => value + 1)}>Thử lại</button></div>}
          {roomsLoading && <div className="live-empty" role="status"><p>Đang tải phiên phát sóng…</p></div>}
          <div className="live-list-heading"><h2>Phiên phát sóng</h2><span role="status">{filteredRooms.length} kết quả</span></div>
          {!roomsLoading && !roomsError && filteredRooms.length === 0 ? (
            <div className="live-empty">
              <span className="material-symbols-outlined" aria-hidden="true">search_off</span>
              <p>Không tìm thấy phòng livestream nào phù hợp.</p>
              <button className="live-button" onClick={() => { setFilter('ALL'); setSearchQuery(''); }}>Xóa bộ lọc</button>
            </div>
          ) : !roomsLoading && !roomsError && filteredRooms.map((room) => (
            <article key={room.id} className="live-room" aria-label={room.restaurantName}>
              <div className="live-room-identity">
                {room.restaurantImage && <img src={room.restaurantImage} alt="" width="48" height="48" />}
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
                <div><dt>Đơn hàng</dt><dd>{preview ? room.orders : '—'}</dd></div>
                <div><dt>Doanh số</dt><dd>{preview ? money(room.revenue) : '—'}</dd></div>
              </dl>
              <div className="live-room-actions">
                <button className="live-button live-button-primary" id={`btn-monitor-${room.id}`} data-testid={`btn-monitor-${room.id}`} onClick={() => setMonitoredRoom(room)}>Giám sát</button>
                <button className="live-button" onClick={() => openWarning(room)}>Cảnh báo</button>
                {room.status === 'LIVE' && <button className="live-button live-button-danger" disabled={warningSaving} onClick={() => void handleForceEnd(room)}>Dừng live</button>}
              </div>
              {room.warning && <p className="live-room-warning"><span className="material-symbols-outlined" aria-hidden="true">warning</span>{room.warning}</p>}
            </article>
          ))}
        </div>
        {!preview && <nav aria-label="Phân trang livestream" className="live-room-actions">
          <button className="live-button" disabled={roomsLoading || page === 0} onClick={() => setPage((value) => value - 1)}>Trang trước</button>
          <span>Trang {page + 1} / {Math.max(totalPages, 1)}</span>
          <button className="live-button" disabled={roomsLoading || page + 1 >= totalPages} onClick={() => setPage((value) => value + 1)}>Trang sau</button>
        </nav>}
        <p className="live-footnote">{preview
          ? 'Preview dùng dữ liệu mô phỏng để kiểm tra bố cục và thao tác.'
          : 'Danh sách, kiểm duyệt và video giám sát dùng API runtime. Đơn hàng, doanh số và tim chưa có nguồn dữ liệu livestream nên hiển thị —.'}</p>
        {monitoredRoom && (
          <div className="live-overlay">
            <div ref={monitorRef} role="dialog" aria-modal="true" aria-labelledby="live-monitor-title" tabIndex={-1} className="live-dialog" inert={Boolean(warningModalRoom)}>
              <header className="live-dialog-header">
                <div><h2 id="live-monitor-title">Giám sát: {monitoredRoom.restaurantName}</h2><p>{monitoredRoom.title}</p></div>
                <button className="live-close" id="btn-close-monitor-modal" aria-label="Đóng giám sát" onClick={() => setMonitoredRoom(null)}><span className="material-symbols-outlined" aria-hidden="true">close</span></button>
              </header>
              <div className="live-monitor-body">
                <div className="live-monitor-stage">
                  <div className="live-stage-top"><span className={`live-status live-status-${monitoredRoom.status.toLowerCase()}`}>{statusLabel(monitoredRoom)}</span><span>{preview ? 'Mô phỏng' : monitoredRoom.streamProvider}</span></div>
                  <div className="live-video-placeholder">
                    {!preview && monitoredRoom.status === 'LIVE' && (
                      <div ref={monitorVideoRef} aria-label="Video giám sát livestream" className="live-video-surface" />
                    )}
                    {(preview || monitoredRoom.status !== 'LIVE' || !monitorMediaConnected) && (
                      <div className="live-video-status">
                        <span className="material-symbols-outlined" aria-hidden="true">{monitorMediaError ? 'videocam_off' : 'videocam'}</span>
                        <h3>{preview
                          ? 'Khung giám sát preview'
                          : monitoredRoom.status !== 'LIVE'
                          ? 'Phiên hiện không phát video'
                          : monitorMediaError
                          ? 'Không thể kết nối video'
                          : 'Đang kết nối video trực tiếp…'}</h3>
                        <p role={monitorMediaError ? 'alert' : 'status'}>{monitorMediaError ?? `${monitoredRoom.streamProvider} · ${monitoredRoom.title}`}</p>
                        {monitorMediaError && monitoredRoom.status === 'LIVE' && (
                          <button className="live-button" onClick={() => setMonitorMediaRevision((value) => value + 1)}>
                            Kết nối lại video
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="live-stage-product"><span className="live-label">Món đang ghim</span><strong>{monitoredRoom.pinnedItem.name}</strong><span>{monitoredRoom.pinnedItem.livePrice > 0 ? money(monitoredRoom.pinnedItem.livePrice) : '—'}</span></div>
                </div>
                <aside className="live-inspector">
                  <h3>Kiểm duyệt luồng</h3>
                  <dl><div><dt>Lượt xem tích lũy</dt><dd>{monitoredRoom.viewers.toLocaleString('vi-VN')}</dd></div><div><dt>Đơn hàng</dt><dd>{preview ? monitoredRoom.orders : '—'}</dd></div><div><dt>Doanh số</dt><dd>{preview ? money(monitoredRoom.revenue) : '—'}</dd></div></dl>
                  {monitoredRoom.warning && <p className="live-room-warning">{monitoredRoom.warning}</p>}
                  {preview ? <button className="live-button" onClick={() => handleUnpinDish(monitoredRoom)}>Gỡ món ghim vi phạm</button>
                    : (monitoredRoom.products ?? []).map((product) => (
                      <button key={product.productId} className="live-button" disabled={warningSaving || monitoredRoom.status === 'ENDED'}
                        onClick={() => {
                          setModerationAction('UNPIN'); setTargetProductId(product.productId);
                          setWarningModalRoom(monitoredRoom); setWarningText(''); setWarningError(null);
                        }}>
                        Gỡ ghim {product.productName ?? `Sản phẩm #${product.productId}`}
                      </button>
                    ))}
                  <button className="live-button" onClick={() => openWarning(monitoredRoom)}>Gửi cảnh báo đến Host</button>
                  {monitoredRoom.status === 'LIVE' && <button className="live-button live-button-danger" disabled={warningSaving} onClick={() => void handleForceEnd(monitoredRoom)}>Dừng phát sóng khẩn cấp</button>}
                  <p className="live-footnote">Mọi cảnh báo, gỡ món và dừng khẩn cấp đều cần lý do và được backend ghi audit. Cảnh báo chưa có thông báo realtime tới Host.</p>
                </aside>
              </div>
            </div>
          </div>
        )}
        {warningModalRoom && (
          <div className="live-overlay">
            <div ref={warningRef} role="dialog" aria-modal="true" aria-labelledby="live-warning-title" tabIndex={-1} className="live-dialog live-warning-dialog">
              <header className="live-dialog-header"><div><h2 id="live-warning-title">{moderationAction === 'UNPIN' ? 'Gỡ món ghim' : moderationAction === 'FORCE_END' ? 'Dừng phát sóng' : 'Cảnh báo kiểm duyệt'}</h2><p>{warningModalRoom.restaurantName}</p></div><button className="live-close" aria-label="Đóng cảnh báo" disabled={warningSaving} onClick={() => setWarningModalRoom(null)}><span className="material-symbols-outlined" aria-hidden="true">close</span></button></header>
              <form className="live-warning-form" onSubmit={handleSendWarning}>
                <label htmlFor="live-warning-message">{moderationAction === 'UNPIN' ? 'Lý do gỡ món' : moderationAction === 'FORCE_END' ? 'Lý do dừng' : 'Lý do cảnh báo'}</label>
                <textarea id="live-warning-message" rows={4} required maxLength={1000} disabled={warningSaving} value={warningText} onChange={(event) => setWarningText(event.target.value)} placeholder="Mô tả nội dung cần điều chỉnh…" />
                <p className="live-footnote">Lưu cảnh báo vào nhật ký kiểm duyệt; không gửi thông báo realtime tới Host.</p>
                {warningError && <p role="alert">{warningError}</p>}
                <div className="live-form-actions"><button type="button" className="live-button" disabled={warningSaving} onClick={() => setWarningModalRoom(null)}>Hủy</button><button type="submit" className="live-button live-button-primary" disabled={warningSaving || !warningText.trim()}>{moderationAction === 'UNPIN' ? 'Xác nhận gỡ món' : moderationAction === 'FORCE_END' ? 'Xác nhận dừng' : 'Gửi cảnh báo'}</button></div>
              </form>
            </div>
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
