import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AdminLayout from '@/components/layouts/AdminLayout';
import { usePortalPreviewNavigate } from '@/components/navigation/usePortalPreviewNavigation';
import { useRestaurant } from '@/modules/restaurant/hooks/useRestaurant';
import { ROUTES } from '@/utils/constants';

const formatRating = (rating?: number) => rating === undefined ? 'Chưa có đánh giá' : `${rating.toFixed(1)} / 5`;

const AdminRestaurantsPage = () => {
  const location = useLocation();
  const navigate = usePortalPreviewNavigate();
  const { restaurants, loading, error, getMyRestaurants, selectRestaurantById } = useRestaurant();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRestaurants = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    if (!normalizedQuery) return restaurants;
    return restaurants.filter((restaurant) =>
      [restaurant.name, restaurant.address, restaurant.phone, String(restaurant.id)]
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [restaurants, searchTerm]);

  const openRestaurant = (restaurantId: number) => {
    selectRestaurantById(restaurantId);
    const params = new URLSearchParams();
    params.set('restaurantId', String(restaurantId));
    const currentView = new URLSearchParams(location.search).get('view');
    if (currentView) params.set('view', currentView);
    navigate(`${ROUTES.RESTAURANT_DASHBOARD}?${params.toString()}`);
  };

  return (
    <AdminLayout>
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-border-light bg-white p-5 shadow-sm dark:border-border-dark dark:bg-surface-dark sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Platform operations</p>
            <h1 className="mt-1 text-2xl font-black text-gray-900 dark:text-white sm:text-3xl">Quản lý nhà hàng</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Xem danh sách cửa hàng và mở trực tiếp không gian quản lý của từng nhà hàng.
            </p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <label htmlFor="admin-restaurant-search" className="sr-only">Tìm kiếm nhà hàng</label>
            <span aria-hidden="true" className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-xl text-gray-400">search</span>
            <input
              id="admin-restaurant-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tên, địa chỉ hoặc mã nhà hàng..."
              aria-label="Tìm kiếm nhà hàng"
              className="w-full rounded-lg border border-border-light bg-white py-2 pl-10 pr-4 text-sm text-gray-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-border-dark dark:bg-background-dark dark:text-gray-200"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span>{filteredRestaurants.length} nhà hàng{searchTerm.trim() ? ' phù hợp' : ' trong hệ thống'}</span>
          {loading && <span role="status" className="inline-flex items-center gap-2"><span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />Đang tải...</span>}
        </div>

        {error && (
          <div role="alert" className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            <span>{error}</span>
            <button type="button" onClick={() => void getMyRestaurants()} disabled={loading} className="shrink-0 rounded-lg bg-red-700 px-3 py-2 font-semibold text-white disabled:opacity-50">
              Thử lại
            </button>
          </div>
        )}

        {!loading && !error && filteredRestaurants.length === 0 && (
          <div role="status" className="rounded-2xl border border-dashed border-border-light bg-white px-6 py-14 text-center dark:border-border-dark dark:bg-surface-dark">
            <span aria-hidden="true" className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600">storefront</span>
            <h2 className="mt-3 text-lg font-bold text-gray-900 dark:text-white">Chưa có nhà hàng phù hợp</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Thử đổi từ khóa hoặc tải lại danh sách nhà hàng.</p>
          </div>
        )}

        {filteredRestaurants.length > 0 && (
          <div role="list" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredRestaurants.map((restaurant) => (
              <article key={restaurant.id} role="listitem" className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border-light bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md dark:border-border-dark dark:bg-surface-dark">
                <div className="relative h-40 overflow-hidden bg-gray-100 dark:bg-gray-800">
                  {restaurant.image?.trim() ? (
                    <img src={restaurant.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-300 dark:text-gray-600">
                      <span aria-hidden="true" className="material-symbols-outlined text-5xl">storefront</span>
                    </div>
                  )}
                  <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold ${restaurant.open ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-900/70 dark:text-gray-300'}`}>
                    {restaurant.open ? 'Đang mở cửa' : 'Đang đóng cửa'}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="min-w-0 break-words text-lg font-bold text-gray-900 dark:text-white">{restaurant.name}</h2>
                      <span className="shrink-0 text-xs font-semibold text-gray-400">#{restaurant.id}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{restaurant.address || 'Chưa cập nhật địa chỉ'}</p>
                  </div>

                  <dl className="grid grid-cols-2 gap-3 border-y border-border-light py-3 text-sm dark:border-border-dark">
                    <div>
                      <dt className="text-xs text-gray-500 dark:text-gray-400">Đánh giá</dt>
                      <dd className="mt-1 font-semibold text-gray-900 dark:text-white">{formatRating(restaurant.rating)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 dark:text-gray-400">Liên hệ</dt>
                      <dd className="mt-1 truncate font-semibold text-gray-900 dark:text-white">{restaurant.phone || 'Chưa cập nhật'}</dd>
                    </div>
                  </dl>

                  <button
                    type="button"
                    onClick={() => openRestaurant(restaurant.id)}
                    aria-label={`Mở cổng nhà hàng ${restaurant.name}`}
                    className="mt-auto flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-lg">open_in_new</span>
                    Mở cổng nhà hàng
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AdminLayout>
  );
};

export default AdminRestaurantsPage;
