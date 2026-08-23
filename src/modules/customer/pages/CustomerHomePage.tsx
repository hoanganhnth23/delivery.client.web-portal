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

  return (
    <CustomerShell>
      <section className="rounded-3xl bg-[#3b2b1d] px-6 py-10 text-white sm:px-10 sm:py-14">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ffc777]">Đặt món dễ dàng</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-black leading-tight sm:text-5xl">
          Món ngon đến cửa nhà bạn.
        </h1>
        <p className="mt-4 max-w-xl text-[#f6dfc1]">
          Chọn nhà hàng, thêm món vào giỏ và đặt COD trong vài bước.
        </p>
        <form
          className="mt-7 flex max-w-xl gap-2 rounded-2xl bg-white p-2"
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
            className="min-w-0 flex-1 rounded-xl px-4 py-3 text-[#2d2116] outline-none"
          />
          <button type="submit" className="rounded-xl bg-[#ed8a16] px-5 py-3 font-bold text-white">
            Tìm
          </button>
        </form>
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-[#ed8a16]">Khám phá</p>
            <h2 className="mt-1 text-2xl font-black">Nhà hàng gần bạn</h2>
          </div>
          {keyword && (
            <button type="button" onClick={() => { setKeyword(''); setSubmittedKeyword(''); }} className="text-sm font-semibold text-[#a85d0c]">
              Xóa tìm kiếm
            </button>
          )}
        </div>

        {loading && <p className="mt-8 text-[#806c57]">Đang tải nhà hàng…</p>}
        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p>{error}</p>
            <button type="button" onClick={() => void refresh()} className="mt-3 font-bold underline">Thử lại</button>
          </div>
        )}
        {!loading && !error && restaurants.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-[#d7c5af] p-10 text-center text-[#806c57]">
            Không tìm thấy nhà hàng phù hợp.
          </div>
        )}
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((restaurantItem) => (
            <Link
              key={restaurantItem.id}
              to={`${'/restaurants'}/${restaurantItem.id}`}
              className="group overflow-hidden rounded-2xl border border-[#eadfce] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="h-44 overflow-hidden bg-[#f6ead9]">
                {restaurantItem.image ? (
                  <img src={restaurantItem.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition group-hover:scale-105" />
                ) : <div className="flex h-full items-center justify-center text-5xl">🍲</div>}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-black group-hover:text-[#ed8a16]">{restaurantItem.name}</h3>
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ${restaurantItem.open ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {restaurantItem.open ? 'Đang mở' : 'Đã đóng'}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-[#806c57]">{restaurantItem.description || restaurantItem.address}</p>
                <p className="mt-4 text-sm font-semibold text-[#a85d0c]">★ {(restaurantItem.rating ?? 0).toFixed(1)} · {restaurantItem.ratingCount ?? 0} đánh giá</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </CustomerShell>
  );
};

export default CustomerHomePage;
