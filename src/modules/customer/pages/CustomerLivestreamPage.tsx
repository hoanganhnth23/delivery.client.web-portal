import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppDependencies } from '@/app/dependencies';
import { ROUTES } from '@/utils/constants';
import type { Livestream } from '@/services/api/livestreamService';
import { CustomerShell } from '../components/CustomerShell';
import type { LivestreamViewer } from '@/services/media/agoraViewer';
import { useCustomerCart } from '../cart/useCustomerCart';
import { formatVnd } from '@/utils/money';

export default function CustomerLivestreamPage() {
  const { livestreamId } = useParams();
  const { livestreamHost, livestreamMedia } = useAppDependencies();
  const { addFromLivestream } = useCustomerCart();
  const [rooms, setRooms] = useState<Livestream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const videoTarget = useRef<HTMLDivElement>(null);
  const viewer = useRef<LivestreamViewer | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaConnected, setMediaConnected] = useState(false);
  const [mediaRevision, setMediaRevision] = useState(0);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const room = rooms[0];
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null); setRooms([]);
    const request = livestreamId
      ? livestreamHost.getById(livestreamId).then((room) => [room])
      : livestreamHost.getActive();
    void request.then((data) => { if (!cancelled) setRooms(data); })
      .catch(() => { if (!cancelled) setError('Không thể tải livestream. Vui lòng thử lại.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [livestreamId, livestreamHost, revision]);
  useEffect(() => {
    if (!livestreamId || !room || room.status !== 'LIVE' || !videoTarget.current) return;
    let cancelled = false;
    let instance: LivestreamViewer | null = null;
    setMediaError(null);
    setMediaConnected(false);
    void livestreamHost.join(room.id).then((session) => {
      if (cancelled || !videoTarget.current) return;
      instance = livestreamMedia.createViewer(videoTarget.current,
        (message) => {
          if (!cancelled) {
            setMediaConnected(false);
            setMediaError(message);
          }
        });
      viewer.current = instance;
      return instance.start({
        ...session,
        renewToken: () => livestreamHost.renewToken(room.id, {
          channelName: session.channelName,
          uid: session.uid,
          role: 'VIEWER',
        }),
      }).then(() => {
        if (!cancelled) setMediaConnected(true);
      });
    }).catch((error: unknown) => {
      if (!cancelled) setMediaError(error instanceof Error ? error.message : 'Không thể kết nối video livestream.');
    });
    return () => {
      cancelled = true;
      if (viewer.current === instance) viewer.current = null;
      void instance?.stop();
    };
  }, [livestreamId, livestreamHost, livestreamMedia, mediaRevision, room]);
  return <CustomerShell title={livestreamId && room ? room.title : 'Livestream'}>
    {livestreamId && <Link className="inline-flex min-h-11 items-center text-primary" to={ROUTES.CUSTOMER_LIVESTREAMS}>Tất cả livestream</Link>}
    {loading && <p role="status" className="py-8">Đang tải livestream…</p>}
    {error && <section role="alert" className="space-y-3 py-6">
      <p>{error}</p><button className="min-h-11 rounded border bg-white px-4" onClick={() => setRevision((value) => value + 1)}>Thử lại</button>
    </section>}
    {!loading && !error && !rooms.length && <p className="py-8">Chưa có phiên đang phát.</p>}
    {!loading && !error && !livestreamId && <ul className="divide-y rounded-lg border bg-white">
      {rooms.map((entry) => <li key={entry.id} className="p-4">
        <Link className="inline-flex min-h-11 items-center font-semibold text-primary" to={`${ROUTES.CUSTOMER_LIVESTREAMS}/${entry.id}`}>{entry.title}</Link>
        <p className="text-sm text-gray-600">Nhà hàng #{entry.restaurantId} · {entry.viewCount.toLocaleString('vi-VN')} lượt xem</p>
      </li>)}
    </ul>}
    {!loading && !error && livestreamId && room && <section className="space-y-4">
      <p className="text-sm text-gray-600">{room.status === 'LIVE' ? 'Đang phát' : room.status === 'ENDED' ? 'Đã kết thúc' : 'Chưa bắt đầu'}</p>
      <div className="relative min-h-56 overflow-hidden rounded-lg bg-gray-900 text-white">
        <div ref={videoTarget} aria-label="Video livestream" className="absolute inset-0" />
        {!mediaConnected && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8 text-center">
            <p role={mediaError ? 'alert' : 'status'}>{mediaError ?? (room.status === 'LIVE' ? 'Đang kết nối trình phát video…' : 'Phiên chưa phát video.')}</p>
          </div>
        )}
      </div>
      {mediaError && room.status === 'LIVE' && (
        <button className="min-h-11 rounded border bg-white px-4" onClick={() => setMediaRevision((value) => value + 1)}>
          Kết nối lại video
        </button>
      )}
      <h2 className="text-lg font-semibold">Món đang ghim</h2>
      {!room.pinnedProducts.length && <p>Chưa có món ghim.</p>}
      <ul className="divide-y rounded-lg border bg-white">
        {room.pinnedProducts.map((product) => <li key={product.productId} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <span>{product.productName ?? `Món #${product.productId}`}</span>
          <strong>{formatVnd(product.priceAtLive)}</strong>
          <button className="min-h-11 rounded bg-primary px-4 font-semibold text-white" onClick={() => {
            const result = addFromLivestream(
              { id: room.restaurantId, name: product.restaurantName ?? `Nhà hàng #${room.restaurantId}` },
              { id: product.productId, restaurantId: room.restaurantId, name: product.productName ?? `Món #${product.productId}`, price: product.priceAtLive, image: product.productImage ?? '' },
              room.id,
            );
            setCartMessage(result.requiresRestaurantConfirmation ? 'Giỏ đang có món từ nhà hàng khác. Hãy hoàn tất hoặc xóa giỏ trước.' : result.changed ? 'Đã thêm món live vào giỏ.' : 'Không thể thêm món live vào giỏ.');
          }}>Thêm vào giỏ</button>
          <Link className="inline-flex min-h-11 items-center text-primary" to={`${ROUTES.CUSTOMER_RESTAURANTS}/${room.restaurantId}`}>Xem thực đơn</Link>
        </li>)}
      </ul>
      {cartMessage && <p role="status" className="text-sm text-gray-700">{cartMessage}</p>}
      <Link className="inline-flex min-h-11 items-center font-semibold text-primary" to={ROUTES.CUSTOMER_CART}>Mở giỏ hàng</Link>
    </section>}
  </CustomerShell>;
}
