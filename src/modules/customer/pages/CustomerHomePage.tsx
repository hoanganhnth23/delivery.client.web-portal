import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDependencies } from '@/app/dependencies';
import type { Restaurant } from '@/types/api.types';
import { CustomerShell } from '../components/CustomerShell';
import { getErrorMessage } from '../utils';
import { useResourceQuery } from '@/services/data/useResourceQuery';

const CustomerHomePage = () => {
  const { restaurant } = useAppDependencies();
  const [keyword, setKeyword] = useState('');
  const [submittedKeyword, setSubmittedKeyword] = useState('');
  const queryKey = useMemo(() => ['customer', 'restaurants', submittedKeyword], [submittedKeyword]);
  const fetchRestaurants = useCallback(
    () => submittedKeyword.trim()
      ? restaurant.searchRestaurants(submittedKeyword.trim())
      : restaurant.getAllRestaurants(),
    [restaurant, submittedKeyword],
  );
  const { data: restaurants = [], loading, error: queryError, refresh } = useResourceQuery<Restaurant[]>({
    key: queryKey,
    fetcher: fetchRestaurants,
    ttlMs: 30_000,
  });
  const error = queryError ? getErrorMessage(queryError, 'Không thể tải danh sách nhà hàng') : null;
  const featuredImage = restaurants.find((item) => item.image)?.image;

  return (
    <CustomerShell>
      <section className="relative overflow-hidden rounded-lg bg-[#fce8da] px-5 py-7 sm:px-8 sm:py-9">
        <div className="relative z-10 max-w-2xl lg:max-w-[60%]">
        <p className="text-xs font-bold uppercase tracking-wider text-[#b2371f]">Khám phá món ngon</p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-[#ee4d2d] sm:text-4xl">Hôm nay bạn muốn ăn gì?</h1>
        <p className="mt-3 text-sm text-[#8d4d3a] sm:text-base">Tìm quán yêu thích, chọn món và giao đến tận cửa.</p>
        <form
          className="mt-6 flex max-w-xl items-center gap-2 rounded-md border border-[#eeeeee] bg-white p-1.5"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmittedKeyword(keyword.trim());
          }}
        >
          <input
            aria-label="Tìm nhà hàng"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm theo tên nhà hàng…"
            className="min-h-11 min-w-0 flex-1 rounded-md px-4 py-3 text-sm text-[#222222] outline-none sm:text-base"
          />
          <button type="submit" className="min-h-11 shrink-0 rounded-md bg-[#ee4d2d] px-5 py-3 font-bold text-white">
            Tìm
          </button>
        </form>
        </div>
        {featuredImage && <img src={featuredImage} alt="" className="absolute right-8 top-1/2 hidden h-56 w-56 -translate-y-1/2 rounded-full border-8 border-white/70 object-cover lg:block" />}
      </section>

      <section className="mt-8 sm:mt-10">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-[#ee4d2d]">Khám phá</p>
            <h2 className="mt-1 text-xl font-bold sm:text-2xl">Quán ngon dành cho bạn</h2>
          </div>
          {keyword && (
            <button type="button" onClick={() => { setKeyword(''); setSubmittedKeyword(''); }} className="text-sm font-semibold text-[#c5371d]">
              Xóa tìm kiếm
            </button>
          )}
        </div>

        {loading && <p className="mt-8 text-[#777777]">Đang tải nhà hàng…</p>}
        {error && (
          <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">
            <p>{error}</p>
            <button type="button" onClick={() => void refresh()} className="mt-3 font-bold underline">Thử lại</button>
          </div>
        )}
        {!loading && !error && restaurants.length === 0 && (
          <div className="mt-8 rounded-lg border border-dashed border-[#dddddd] p-10 text-center text-[#777777]">
            Không tìm thấy nhà hàng phù hợp.
          </div>
        )}
        <div className="mt-5 grid gap-4 sm:mt-6 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((restaurantItem) => (
            <Link
              key={restaurantItem.id}
              to={`${'/restaurants'}/${restaurantItem.id}`}
              className="group overflow-hidden rounded-lg border border-[#eeeeee] bg-white transition hover:border-[#ee4d2d]"
            >
              <div className="h-40 overflow-hidden bg-[#f5efeb] sm:h-44">
                {restaurantItem.image ? (
                  <img src={restaurantItem.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition group-hover:scale-105" />
                ) : <div className="flex h-full items-center justify-center text-[#b88d7a]"><span aria-hidden="true" className="material-symbols-outlined text-5xl">restaurant</span></div>}
              </div>
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="min-w-0 text-base font-bold group-hover:text-[#ee4d2d] sm:text-lg">{restaurantItem.name}</h3>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold sm:text-xs ${restaurantItem.open ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {restaurantItem.open ? 'Đang mở' : 'Đã đóng'}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-[#777777]">{restaurantItem.description || restaurantItem.address}</p>
                <p className="mt-4 text-sm font-semibold text-[#c5371d]">★ {(restaurantItem.rating ?? 0).toFixed(1)} · {restaurantItem.ratingCount ?? 0} đánh giá</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </CustomerShell>
  );
};

export default CustomerHomePage;
