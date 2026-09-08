import { useCallback, useEffect, useState } from 'react';
import RestaurantHeader from '@/components/layout/RestaurantHeader';
import RestaurantSidebar from '@/components/layout/RestaurantSidebar';
import { useAppDependencies } from '@/app/dependencies';
import { useRestaurant } from '../hooks/useRestaurant';
import type { Livestream } from '@/services/api/livestreamService';

export default function RestaurantLivestreamPage() {
  const { currentRestaurant } = useRestaurant();
  const { livestreamHost, notifications } = useAppDependencies();
  const [streams, setStreams] = useState<Livestream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [transitioningId, setTransitioningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!currentRestaurant) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setStreams(await livestreamHost.inspect(currentRestaurant.id));
    } catch {
      setError('Không thể tải livestream.');
    } finally {
      setLoading(false);
    }
  }, [currentRestaurant, livestreamHost]);

  useEffect(() => {
    void load();
  }, [load]);

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
      notifications.success(
        action === 'start' ? 'Đã bắt đầu livestream' : 'Đã kết thúc livestream',
      );
    } catch {
      notifications.error('Không thể cập nhật livestream');
    } finally {
      setTransitioningId(null);
    }
  };

  return (
    <div className="flex min-h-screen min-w-0 bg-background-light dark:bg-background-dark">
      <RestaurantSidebar
        restaurantName={currentRestaurant?.name}
        restaurantImage={currentRestaurant?.image}
      />
      <main className="min-w-0 flex-1">
        <RestaurantHeader
          title="Livestream"
          subtitle="Host controls use Gateway-only server-issued media credentials"
        />
        <section className="space-y-5 p-4 sm:p-6 lg:p-8">
          <div className="rounded-2xl border bg-white p-5 dark:bg-surface-dark">
            <label className="block text-sm font-semibold">
              Tiêu đề livestream
              <input
                aria-label="Tiêu đề livestream"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-1 w-full rounded border p-2"
              />
            </label>
            <button
              type="button"
              onClick={() => void create()}
              disabled={saving || !currentRestaurant}
              className="mt-3 rounded bg-primary px-4 py-2 font-bold text-white disabled:opacity-50"
            >
              {saving ? 'Đang tạo…' : 'Tạo livestream'}
            </button>
          </div>

          {loading ? (
            <p>Đang tải…</p>
          ) : error ? (
            <div>
              <p role="alert">{error}</p>
              <button type="button" onClick={() => void load()}>
                Thử lại
              </button>
            </div>
          ) : streams.length === 0 ? (
            <p>Chưa có livestream.</p>
          ) : (
            streams.map((stream) => {
              const isTransitioning = transitioningId === stream.id;
              return (
                <article
                  key={stream.id}
                  className="rounded-xl border bg-white p-4 dark:bg-surface-dark"
                >
                  <b>{stream.title}</b>
                  <p>{stream.status}</p>
                  {stream.status === 'CREATED' && (
                    <button
                      type="button"
                      disabled={isTransitioning}
                      onClick={() => void transition(stream, 'start')}
                    >
                      {isTransitioning ? 'Đang cập nhật…' : 'Bắt đầu'}
                    </button>
                  )}
                  {stream.status === 'LIVE' && (
                    <button
                      type="button"
                      disabled={isTransitioning}
                      onClick={() => void transition(stream, 'end')}
                    >
                      {isTransitioning ? 'Đang cập nhật…' : 'Kết thúc'}
                    </button>
                  )}
                </article>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}
