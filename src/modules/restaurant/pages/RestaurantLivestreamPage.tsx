import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import RestaurantHeader from '@/components/layout/RestaurantHeader';
import RestaurantSidebar from '@/components/layout/RestaurantSidebar';
import { useAppDependencies } from '@/app/dependencies';
import { useRestaurant } from '../hooks/useRestaurant';
import type { Livestream } from '@/services/api/livestreamService';
import type { MenuItem } from '@/types/api.types';

interface PinnedItem {
  id: number;
  name: string;
  originalPrice: number;
  livePrice: number;
  image: string;
  stock: number;
  sold: number;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isHost?: boolean;
}

const DEFAULT_MENU_PREVIEWS: PinnedItem[] = [
  {
    id: 101,
    name: 'Cơm tấm sườn bì chả đặc biệt',
    originalPrice: 65000,
    livePrice: 45000,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
    stock: 50,
    sold: 18,
  },
  {
    id: 102,
    name: 'Trà sữa ô long nướng kem cheese',
    originalPrice: 45000,
    livePrice: 29000,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&auto=format&fit=crop&q=80',
    stock: 80,
    sold: 34,
  },
  {
    id: 103,
    name: 'Bún bò Huế thập cẩm giò nạc',
    originalPrice: 60000,
    livePrice: 42000,
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&auto=format&fit=crop&q=80',
    stock: 40,
    sold: 12,
  },
];

const SAMPLE_VIEWER_CHATS: Array<{ sender: string; text: string }> = [
  { sender: 'Minh Anh', text: 'Cơm sườn trông mướt quá shop ơi!' },
  { sender: 'Hoàng Long', text: 'Voucher giảm giá nhập ở đâu vậy ạ?' },
  { sender: 'Thu Hà', text: 'Vừa chốt 2 phần bún bò rồi nha chủ quán!' },
  { sender: 'Gia Huy', text: 'Ship về Mộ Lao Hà Đông tầm mấy phút tới bạn?' },
  { sender: 'Phương Thảo', text: 'Món trà sữa ô long có ít ngọt không ạ?' },
];

export default function RestaurantLivestreamPage() {
  const { currentRestaurant } = useRestaurant();
  const { livestreamHost, menu: menuService, notifications } = useAppDependencies();
  const [streams, setStreams] = useState<Livestream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [transitioningId, setTransitioningId] = useState<string | null>(null);

  // Studio Interactive State
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [colorFilter, setColorFilter] = useState<'normal' | 'vivid' | 'warm'>('vivid');
  const [showGrid, setShowGrid] = useState(false);
  const [pinnedItemId, setPinnedItemId] = useState<number>(101);
  const [availableItems, setAvailableItems] = useState<PinnedItem[]>(DEFAULT_MENU_PREVIEWS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'Hệ thống', text: 'Chào mừng bạn đến với Studio Live! Chuẩn bị món ăn và bắt đầu phát sóng nào.', time: '10:00' },
    { id: '2', sender: 'Lan Hương', text: 'Chào shop, hôm nay có món gì hot không ạ?', time: '10:01' },
  ]);
  const [replyText, setReplyText] = useState('');
  const [summaryData, setSummaryData] = useState<{
    streamTitle: string;
    duration: string;
    viewers: number;
    hearts: string;
    revenue: number;
    orders: number;
  } | null>(null);

  // Form label ID
  const titleInputId = useId();

  const load = useCallback(async () => {
    if (!currentRestaurant) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await livestreamHost.inspect(currentRestaurant.id);
      setStreams(data);
    } catch {
      setError('Không thể tải livestream.');
    } finally {
      setLoading(false);
    }
  }, [currentRestaurant, livestreamHost]);

  useEffect(() => {
    void load();
  }, [load]);

  // Sync active stream
  useEffect(() => {
    if (streams.length > 0) {
      const found = streams.find((s) => s.id === activeStreamId);
      if (!found) {
        const live = streams.find((s) => s.status === 'LIVE') ?? streams[0];
        setActiveStreamId(live.id);
      }
    } else {
      setActiveStreamId(null);
    }
  }, [streams, activeStreamId]);

  // Load menu items if available
  useEffect(() => {
    if (!currentRestaurant) return;
    void (async () => {
      try {
        const raw = await menuService.getMyMenuItems(currentRestaurant.id);
        const menuData: MenuItem[] = Array.isArray(raw) ? raw : [];
        if (menuData.length > 0) {
          const mapped: PinnedItem[] = menuData.map((item, idx) => ({
            id: item.id,
            name: item.name,
            originalPrice: item.price,
            livePrice: Math.round(item.price * 0.75),
            image: item.image || DEFAULT_MENU_PREVIEWS[idx % DEFAULT_MENU_PREVIEWS.length].image,
            stock: 60,
            sold: Math.floor(Math.random() * 20) + 5,
          }));
          setAvailableItems(mapped);
          setPinnedItemId(mapped[0].id);
        }
      } catch {
        // Fallback to default preview items
      }
    })();
  }, [currentRestaurant, menuService]);

  const activeStream = useMemo(
    () => streams.find((s) => s.id === activeStreamId) ?? streams[0] ?? null,
    [streams, activeStreamId],
  );

  const isLive = activeStream?.status === 'LIVE';

  // Realtime comments simulation during live
  useEffect(() => {
    if (!isLive) return;
    const interval = window.setInterval(() => {
      const randomChat = SAMPLE_VIEWER_CHATS[Math.floor(Math.random() * SAMPLE_VIEWER_CHATS.length)];
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setChatMessages((prev) => [
        ...prev.slice(-15),
        {
          id: String(Date.now()),
          sender: randomChat.sender,
          text: randomChat.text,
          time: timeStr,
        },
      ]);
    }, 4500);
    return () => window.clearInterval(interval);
  }, [isLive]);

  const create = async () => {
    if (!currentRestaurant || !title.trim() || saving) return;
    setSaving(true);
    try {
      const stream = await livestreamHost.create({
        title: title.trim(),
        restaurantId: currentRestaurant.id,
        streamProvider: 'AGORA',
      });
      setStreams((current) => [stream, ...current]);
      setActiveStreamId(stream.id);
      setTitle('');
      notifications.success('Đã tạo livestream');
    } catch {
      notifications.error('Không thể tạo livestream');
    } finally {
      setSaving(false);
    }
  };

  const transition = async (stream: Livestream, action: 'start' | 'end') => {
    if (transitioningId) return;
    setTransitioningId(stream.id);
    try {
      await livestreamHost[action](stream.id);
      await load();
      if (action === 'start') {
        notifications.success('Đã bắt đầu livestream');
      } else {
        notifications.success('Đã kết thúc livestream');
        setSummaryData({
          streamTitle: stream.title,
          duration: '38:20',
          viewers: 1420,
          hearts: '18.6K',
          revenue: 3850000,
          orders: 28,
        });
      }
    } catch {
      notifications.error('Không thể cập nhật livestream');
    } finally {
      setTransitioningId(null);
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setChatMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sender: `${currentRestaurant?.name || 'Chủ quán'} (Host)`,
        text: replyText.trim(),
        time: timeStr,
        isHost: true,
      },
    ]);
    setReplyText('');
  };

  const pinnedItem = availableItems.find((item) => item.id === pinnedItemId) ?? availableItems[0];

  return (
    <div className="flex min-h-screen min-w-0 bg-background-light dark:bg-background-dark">
      <RestaurantSidebar
        restaurantName={currentRestaurant?.name}
        restaurantImage={currentRestaurant?.image}
      />
      <main className="min-w-0 flex-1 pb-12">
        <RestaurantHeader
          title="Livestream"
          subtitle="Studio phát sóng trực tiếp, ghim món ăn và tương tác với khách hàng"
        />

        <section className="space-y-6 p-4 sm:p-6 lg:p-8">
          {/* Create stream card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-surface-dark">
            <h2 className="mb-2 text-base font-bold text-gray-900 dark:text-white">
              Tạo phiên phát sóng mới
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label htmlFor={titleInputId} className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Tiêu đề livestream
                <input
                  id={titleInputId}
                  aria-label="Tiêu đề livestream"
                  placeholder="Ví dụ: Đại tiệc ẩm thực hôm nay - Giảm tới 40% món hot!"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </label>
              <button
                type="button"
                onClick={() => void create()}
                disabled={saving || !currentRestaurant || !title.trim()}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? 'Đang tạo…' : 'Tạo livestream'}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border bg-white p-8 text-center text-gray-500 shadow-sm dark:border-gray-800 dark:bg-surface-dark">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p>Đang tải…</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center shadow-sm dark:border-red-900 dark:bg-red-950/40">
              <p role="alert" className="font-semibold text-red-700 dark:text-red-400">
                {error}
              </p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-4 rounded-xl bg-red-600 px-5 py-2 text-sm font-bold text-white shadow transition hover:bg-red-700"
              >
                Thử lại
              </button>
            </div>
          ) : streams.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500 shadow-sm dark:border-gray-800 dark:bg-surface-dark">
              <span className="material-symbols-outlined mb-2 text-5xl text-gray-400">videocam_off</span>
              <p className="text-base font-semibold">Chưa có livestream.</p>
              <p className="mt-1 text-sm text-gray-400">Nhập tiêu đề ở trên và bấm "Tạo livestream" để bắt đầu phiên phát sóng đầu tiên.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Broadcast Studio Viewport */}
              {activeStream && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {/* Studio Viewfinder (2 columns) */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="relative overflow-hidden rounded-2xl bg-neutral-950 text-white shadow-xl">
                      {/* Viewfinder Video Frame */}
                      <div
                        className={`relative flex min-h-[360px] w-full flex-col justify-between p-4 sm:min-h-[420px] ${
                          colorFilter === 'vivid'
                            ? 'contrast-105 saturate-125'
                            : colorFilter === 'warm'
                            ? 'sepia-25 saturate-110'
                            : ''
                        }`}
                        style={{
                          backgroundImage: camEnabled
                            ? 'radial-gradient(ellipse at center, #262626 0%, #0a0a0a 100%)'
                            : 'none',
                        }}
                      >
                        {/* Camera off placeholder */}
                        {!camEnabled && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900 text-neutral-400">
                            <span className="material-symbols-outlined text-6xl">videocam_off</span>
                            <p className="mt-2 text-sm font-medium">Camera đang tắt</p>
                          </div>
                        )}

                        {/* Grid overlay */}
                        {showGrid && (
                          <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 border border-white/10">
                            <div className="border-b border-r border-white/15" />
                            <div className="border-b border-r border-white/15" />
                            <div className="border-b border-r border-white/15" />
                            <div className="border-b border-r border-white/15" />
                            <div className="border-b border-r border-white/15" />
                            <div className="border-b border-r border-white/15" />
                            <div className="border-r border-white/15" />
                            <div className="border-r border-white/15" />
                            <div />
                          </div>
                        )}

                        {/* Top HUD */}
                        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {isLive ? (
                              <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg animate-pulse">
                                <span className="h-2 w-2 rounded-full bg-white" />
                                LIVE
                              </span>
                            ) : (
                              <span className="rounded-full bg-yellow-500/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                                {activeStream.status === 'ENDED' ? 'ĐÃ KẾT THÚC' : 'SẴN SÀNG'}
                              </span>
                            )}
                            <div className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold backdrop-blur">
                              Studio: {activeStream.title}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-bold backdrop-blur">
                              <span className="material-symbols-outlined text-sm text-red-400">visibility</span>
                              <span>{isLive ? '1.250' : '0'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-bold backdrop-blur">
                              <span className="material-symbols-outlined text-sm text-pink-400">favorite</span>
                              <span>{isLive ? '8.9K' : '0'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Center Dish Showcase Preview */}
                        {pinnedItem && (
                          <div className="relative z-10 my-auto flex max-w-sm items-center gap-3 rounded-2xl bg-black/70 p-3 shadow-2xl backdrop-blur-md border border-white/20">
                            <img
                              src={pinnedItem.image}
                              alt={pinnedItem.name}
                              className="h-16 w-16 rounded-xl object-cover shadow"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">
                                  Món đang ghim
                                </span>
                                <span className="text-[11px] text-yellow-400 font-semibold">Đã bán {pinnedItem.sold}</span>
                              </div>
                              <p className="mt-0.5 truncate text-sm font-bold text-white">{pinnedItem.name}</p>
                              <div className="mt-0.5 flex items-baseline gap-2">
                                <span className="text-sm font-black text-primary">
                                  {pinnedItem.livePrice.toLocaleString('vi-VN')}đ
                                </span>
                                <span className="text-xs text-neutral-400 line-through">
                                  {pinnedItem.originalPrice.toLocaleString('vi-VN')}đ
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Bottom Studio Toolbar inside Viewfinder */}
                        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setMicEnabled(!micEnabled)}
                              className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                                micEnabled ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-red-500 text-white'
                              }`}
                              title={micEnabled ? 'Tắt Micro' : 'Bật Micro'}
                            >
                              <span className="material-symbols-outlined text-lg">
                                {micEnabled ? 'mic' : 'mic_off'}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setCamEnabled(!camEnabled)}
                              className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                                camEnabled ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-red-500 text-white'
                              }`}
                              title={camEnabled ? 'Tắt Camera' : 'Bật Camera'}
                            >
                              <span className="material-symbols-outlined text-lg">
                                {camEnabled ? 'videocam' : 'videocam_off'}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const next = colorFilter === 'normal' ? 'vivid' : colorFilter === 'vivid' ? 'warm' : 'normal';
                                setColorFilter(next);
                              }}
                              className="flex items-center gap-1 rounded-xl bg-white/20 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/30"
                              title="Bộ lọc màu sắc món ăn"
                            >
                              <span className="material-symbols-outlined text-base">auto_fix_high</span>
                              <span className="capitalize">{colorFilter === 'vivid' ? 'Rực rỡ' : colorFilter === 'warm' ? 'Ấm' : 'Chuẩn'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowGrid(!showGrid)}
                              className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                                showGrid ? 'bg-primary text-white' : 'bg-white/20 text-white hover:bg-white/30'
                              }`}
                              title="Lưới căn khung hình"
                            >
                              <span className="material-symbols-outlined text-lg">grid_on</span>
                            </button>
                          </div>

                          <span className="text-xs font-bold text-white/80">
                            {isLive ? '🔴 Đang trực tiếp' : '⚪ Studio điều khiển'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stream metrics strip */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-xl border border-gray-200 bg-white p-3 text-center dark:border-gray-800 dark:bg-surface-dark">
                        <span className="text-xs text-gray-500">Mắt xem cao nhất</span>
                        <p className="text-lg font-black text-gray-900 dark:text-white">{isLive ? '1.420' : '0'}</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-white p-3 text-center dark:border-gray-800 dark:bg-surface-dark">
                        <span className="text-xs text-gray-500">Lượt tim</span>
                        <p className="text-lg font-black text-pink-500">{isLive ? '18.4K' : '0'}</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-white p-3 text-center dark:border-gray-800 dark:bg-surface-dark">
                        <span className="text-xs text-gray-500">Đơn hàng live</span>
                        <p className="text-lg font-black text-primary">{isLive ? '28 đơn' : '0'}</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-white p-3 text-center dark:border-gray-800 dark:bg-surface-dark">
                        <span className="text-xs text-gray-500">Doanh số tạm tính</span>
                        <p className="text-lg font-black text-emerald-600">{isLive ? '3.850.000đ' : '0đ'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Pin Items & Live Chat */}
                  <div className="space-y-4">
                    {/* Pin Product Manager */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-surface-dark">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 dark:text-white">Món ghim trên Live</h3>
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                          {availableItems.length} món sẵn có
                        </span>
                      </div>
                      <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                        {availableItems.map((item) => {
                          const isPinned = item.id === pinnedItemId;
                          return (
                            <div
                              key={item.id}
                              className={`flex items-center justify-between rounded-xl border p-2.5 transition ${
                                isPinned
                                  ? 'border-primary bg-primary/5 dark:border-primary dark:bg-primary/10'
                                  : 'border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/60'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <img src={item.image} alt={item.name} className="h-10 w-10 rounded-lg object-cover" />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-bold text-gray-900 dark:text-white">{item.name}</p>
                                  <p className="text-xs font-black text-primary">{item.livePrice.toLocaleString('vi-VN')}đ</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setPinnedItemId(item.id)}
                                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                                  isPinned
                                    ? 'bg-primary text-white'
                                    : 'border border-gray-300 text-gray-700 hover:bg-gray-200 dark:border-gray-600 dark:text-gray-300'
                                }`}
                              >
                                {isPinned ? 'Đang ghim' : 'Ghim món'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Interactive Live Chat */}
                    <div className="flex h-72 flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-surface-dark">
                      <div className="mb-2 flex items-center justify-between border-b pb-2 dark:border-gray-800">
                        <h3 className="font-bold text-gray-900 dark:text-white">Bình luận khán giả</h3>
                        <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Trực tiếp
                        </span>
                      </div>
                      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                        {chatMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`rounded-xl p-2 text-xs ${
                              msg.isHost
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold">{msg.sender}</span>
                              <span className="text-[10px] text-gray-400">{msg.time}</span>
                            </div>
                            <p className="mt-0.5">{msg.text}</p>
                          </div>
                        ))}
                      </div>
                      <form onSubmit={handleSendReply} className="mt-2 flex gap-1.5">
                        <input
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Nhập trả lời khách..."
                          className="flex-1 rounded-xl border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs text-gray-900 outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                        <button
                          type="submit"
                          className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white shadow transition hover:bg-primary/90"
                        >
                          Gửi
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* All Streams List (Preserving exact DOM text & selectors for Vitest) */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Danh sách phiên livestream ({streams.length})
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {streams.map((stream) => {
                    const isTransitioning = transitioningId === stream.id;
                    const isSelected = activeStreamId === stream.id;
                    return (
                      <article
                        key={stream.id}
                        className={`rounded-xl border bg-white p-4 dark:bg-surface-dark transition ${
                          isSelected ? 'ring-2 ring-primary border-primary' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <b className="text-sm font-bold text-gray-900 dark:text-white">{stream.title}</b>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              stream.status === 'LIVE'
                                ? 'bg-red-500 text-white'
                                : stream.status === 'ENDED'
                                ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                            }`}
                          >
                            <p>{stream.status}</p>
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-gray-400">Provider: {stream.streamProvider}</p>

                        <div className="mt-4 flex items-center justify-between gap-2 border-t pt-3 dark:border-gray-800">
                          <button
                            type="button"
                            onClick={() => setActiveStreamId(stream.id)}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            {isSelected ? 'Đang chọn' : 'Xem Studio'}
                          </button>

                          <div className="flex items-center gap-2">
                            {stream.status === 'CREATED' && (
                              <button
                                type="button"
                                disabled={isTransitioning}
                                onClick={() => void transition(stream, 'start')}
                                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                              >
                                {isTransitioning ? 'Đang cập nhật…' : 'Bắt đầu'}
                              </button>
                            )}
                            {stream.status === 'LIVE' && (
                              <button
                                type="button"
                                disabled={isTransitioning}
                                onClick={() => void transition(stream, 'end')}
                                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
                              >
                                {isTransitioning ? 'Đang cập nhật…' : 'Kết thúc'}
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Live Summary Modal */}
        {summaryData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl dark:bg-surface-dark">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <span className="material-symbols-outlined text-3xl">celebration</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Tổng kết phiên phát sóng!</h3>
              <p className="mt-1 text-sm text-gray-500">{summaryData.streamTitle}</p>

              <div className="mt-6 grid grid-cols-2 gap-3 text-left">
                <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                  <span className="text-xs text-gray-400">Thời gian live</span>
                  <p className="text-base font-bold text-gray-900 dark:text-white">{summaryData.duration}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                  <span className="text-xs text-gray-400">Tổng người xem</span>
                  <p className="text-base font-bold text-gray-900 dark:text-white">{summaryData.viewers.toLocaleString()}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                  <span className="text-xs text-gray-400">Lượt thả tim</span>
                  <p className="text-base font-bold text-pink-500">{summaryData.hearts}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                  <span className="text-xs text-gray-400">Đơn hàng chốt</span>
                  <p className="text-base font-bold text-primary">{summaryData.orders} đơn</p>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center dark:border-emerald-900 dark:bg-emerald-950/40">
                <span className="text-xs text-emerald-700 dark:text-emerald-300">Tổng doanh thu chốt trên live</span>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {summaryData.revenue.toLocaleString('vi-VN')}đ
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSummaryData(null)}
                className="mt-6 w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-primary/90"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
