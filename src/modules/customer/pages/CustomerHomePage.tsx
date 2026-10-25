import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDependencies } from '@/app/dependencies';
import type { Restaurant } from '@/types/api.types';
import { CustomerShell } from '../components/CustomerShell';
import { getErrorMessage } from '../utils';
import { useResourceQuery } from '@/services/data/useResourceQuery';
import { ROUTES } from '@/utils/constants';
import { formatVnd } from '@/utils/money';

const money = formatVnd;

interface FeaturedDish {
  id: number;
  name: string;
  price: number;
  image: string;
  restaurantId: number;
  restaurantName: string;
}

const CATEGORIES = [
  { label: 'Tất cả', icon: 'restaurant', bg: 'bg-[#fff0e9]', color: 'text-[#e55c31]' },
  { label: 'Mì & phở', icon: 'ramen_dining', bg: 'bg-[#fff3d7]', color: 'text-[#c99822]' },
  { label: 'Cơm & bún', icon: 'rice_bowl', bg: 'bg-[#e6f3ef]', color: 'text-[#3d9c80]' },
  { label: 'Bánh cuốn', icon: 'bakery_dining', bg: 'bg-[#fcebe8]', color: 'text-[#cb6a53]' },
  { label: 'Ăn vặt', icon: 'cookie', bg: 'bg-[#fff0e9]', color: 'text-[#e55c31]' },
];

// Curate featured dishes from catalog
const FEATURED_DISHES: FeaturedDish[] = [];

const CustomerHomePage = () => {
  const { restaurant } = useAppDependencies();
  const [keyword, setKeyword] = useState('');
  const [submittedKeyword, setSubmittedKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [sortOption, setSortOption] = useState<'Đề xuất' | 'Gần tôi' | 'Đánh giá'>('Đề xuất');
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [savedVouchers, setSavedVouchers] = useState<Record<string, boolean>>({
    FREESHIP15: true,
  });

  const [visibleCount, setVisibleCount] = useState(12);

  const queryKey = useMemo(
    () => ['customer', 'restaurants', submittedKeyword],
    [submittedKeyword],
  );

  const fetchRestaurants = useCallback(
    () =>
      submittedKeyword.trim()
        ? restaurant.searchRestaurants(submittedKeyword.trim())
        : restaurant.getAllRestaurants(),
    [restaurant, submittedKeyword],
  );

  const {
    data: apiRestaurants = [],
    loading,
    error: queryError,
    refresh,
  } = useResourceQuery<Restaurant[]>({
    key: queryKey,
    fetcher: fetchRestaurants,
    ttlMs: 30_000,
  });

  const error = queryError ? getErrorMessage(queryError, 'Không thể tải danh sách nhà hàng') : null;

  // The backend is the sole source of catalog truth. An empty successful
  // response must remain empty so the CUSTOMER-01 contract can distinguish it
  // from a loading or failed request.
  const baseRestaurants = apiRestaurants;

  // Link featured dishes to real restaurant IDs when available
  const featuredDishes = useMemo(() => {
    return FEATURED_DISHES.map((dish, idx) => {
      const matched = baseRestaurants[idx % baseRestaurants.length];
      return {
        ...dish,
        restaurantId: matched ? matched.id : dish.restaurantId,
        restaurantName: matched ? matched.name : dish.restaurantName,
      };
    });
  }, [baseRestaurants]);

  // Calculate distance from default location (Keangnam Hanoi: 21.0169, 105.7838)
  const calculateDistance = useCallback((r: Restaurant): string => {
    if ('distance' in r && r.distance) return String(r.distance);
    const raw = r as Restaurant & { latitude?: number; longitude?: number };
    const lat = raw.addressLat ?? raw.latitude;
    const lng = raw.addressLng ?? raw.longitude;
    if (lat && lng) {
      const lat1 = 21.0169;
      const lon1 = 105.7838;
      const lat2 = Number(lat);
      const lon2 = Number(lng);
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = 6371 * c;
      return d > 0 ? d.toFixed(1) : '1.2';
    }
    return '1.2';
  }, []);

  // Filter & sort restaurants
  const displayRestaurants = useMemo(() => {
    return baseRestaurants
      .filter((r) => {
        const matchesCategory =
          selectedCategory === 'Tất cả' ||
          ('category' in r && r.category === selectedCategory) ||
          r.description?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
          r.name?.toLowerCase().includes(selectedCategory.toLowerCase());
        return matchesCategory;
      })
      .sort((a, b) => {
        if (sortOption === 'Đánh giá') {
          return (b.rating ?? 0) - (a.rating ?? 0);
        }
        if (sortOption === 'Gần tôi') {
          const distA = Number(calculateDistance(a)) || 0;
          const distB = Number(calculateDistance(b)) || 0;
          return distA - distB;
        }
        return 0;
      });
  }, [baseRestaurants, selectedCategory, sortOption, calculateDistance]);

  const visibleRestaurants = useMemo(
    () => displayRestaurants.slice(0, visibleCount),
    [displayRestaurants, visibleCount],
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedKeyword(keyword.trim());
  };

  const handleToggleVoucher = (code: string) => {
    setSavedVouchers((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  return (
    <CustomerShell>
      {/* Mobile-Only Top Navigation & Location Bar */}
      <div className="mb-3 rounded-lg bg-white p-3 shadow-sm md:hidden">
        <div className="flex h-9 items-center justify-between">
          <Link
            to={ROUTES.CUSTOMER_LOGIN}
            className="flex h-8 w-8 items-center justify-center text-[#555555]"
            aria-label="Tài khoản"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
              person
            </span>
          </Link>
          <span className="text-xl font-bold tracking-tight text-[#ee4d2d]">
            Shopee<span className="font-normal">Food</span>
          </span>
          <div className="flex h-7 items-center rounded-full border border-[#dedede] px-2 text-[#666666]">
            <Link
              to={ROUTES.CUSTOMER_ADDRESSES}
              className="flex items-center"
              aria-label="Quản lý địa chỉ"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                more_horiz
              </span>
            </Link>
            <span className="mx-1 h-3.5 w-px bg-[#dddddd]" />
            <Link to={ROUTES.CUSTOMER_CART} className="flex items-center" aria-label="Giỏ hàng">
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                shopping_bag
              </span>
            </Link>
          </div>
        </div>

        <Link
          to={ROUTES.CUSTOMER_ADDRESSES}
          className="mt-2 flex items-center gap-1.5 py-1 text-xs text-[#222222]"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-[#ee4d2d]">
            location_on
          </span>
          <span className="min-w-0 flex-1 truncate">
            Giao đến: <b className="font-semibold">Toà nhà Keangnam, Mễ Trì, Nam Từ Liêm</b>
          </span>
          <span aria-hidden="true" className="material-symbols-outlined text-sm text-[#888888]">
            chevron_right
          </span>
        </Link>
      </div>

      {/* Prominent Search Bar */}
      <form
        className="mb-4 flex h-11 items-center gap-2 rounded-lg border border-[#e5e5e5] bg-white px-3 shadow-sm sm:h-12 sm:px-4"
        onSubmit={handleSearchSubmit}
      >
        <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-[#888888]">
          search
        </span>
        <input
          aria-label="Tìm nhà hàng"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm món ngon, quán yêu thích…"
          className="min-w-0 flex-1 bg-transparent text-xs text-[#222222] outline-none sm:text-sm"
        />
        {keyword && (
          <button
            type="button"
            onClick={() => {
              setKeyword('');
              setSubmittedKeyword('');
            }}
            className="text-xs text-[#888888] hover:text-[#ee4d2d]"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-base">
              close
            </span>
          </button>
        )}
        <button
          type="submit"
          className="rounded-md bg-[#ee4d2d] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#d84023] sm:px-4 sm:py-2 sm:text-sm"
        >
          Tìm
        </button>
      </form>

      {/* Hero Banner & Category Shortcuts (Desktop 2-column, Mobile stacked) */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_330px]">
        {/* Banner Section */}
        <div className="relative flex min-h-[160px] overflow-hidden rounded-lg bg-[#fce8da] p-4 sm:min-h-[220px] sm:p-7">
          <div className="relative z-10 flex flex-col justify-between max-w-[65%] sm:max-w-[60%]">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-[#b2371f] uppercase sm:text-xs">
                ĐẠI TIỆC MÓN NGON
              </span>
              <h2 className="mt-1 text-lg font-bold leading-tight text-[#b2371f] sm:mt-2 sm:text-2xl lg:text-3xl">
                Ăn ngon mỗi ngày
                <br />
                <em className="not-italic font-extrabold text-[#ee4d2d]">FREESHIP XTRA</em>
              </h2>
              <p className="mt-1 text-[11px] text-[#8d4d3a] sm:mt-2 sm:text-sm">
                Ưu đãi giao hàng 15.000đ
              </p>
            </div>
            <div className="mt-3 sm:mt-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('Tất cả');
                  window.scrollTo({ top: 400, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#ee4d2d] px-3.5 py-1.5 text-[11px] font-bold text-white shadow transition hover:bg-[#d84023] sm:rounded-md sm:px-4 sm:py-2 sm:text-xs"
              >
                Đặt ngay
                <span aria-hidden="true" className="material-symbols-outlined text-[13px] sm:text-[15px]">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>
          <img
            src="https://huawei-food-cms.grab.com/compressed_webp/items/VNITE2023111914492527567/photo/menueditor_item_c3d3f9b6b3564c77936cb73431bfdc0b_1700405329714594563.webp"
            alt="Món ngon Freeship"
            className="absolute -right-4 top-1/2 h-36 w-36 -translate-y-1/2 rounded-full border-4 border-[#fff7ef] object-cover shadow-md sm:-right-6 sm:h-52 sm:w-52 sm:border-8"
          />
        </div>

        {/* Category Shortcuts Section */}
        <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm sm:p-4 lg:grid lg:grid-cols-3 lg:gap-3 lg:justify-items-center">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.label;
            return (
              <button
                key={cat.label}
                type="button"
                onClick={() => setSelectedCategory(cat.label)}
                className={`flex flex-col items-center gap-1.5 rounded-md p-1 transition ${
                  isSelected ? 'opacity-100 scale-105' : 'opacity-85 hover:opacity-100'
                }`}
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl sm:h-12 sm:w-12 ${cat.bg} ${cat.color} shadow-sm transition`}
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-[26px]">
                    {cat.icon}
                  </span>
                </span>
                <span
                  className={`text-[11px] sm:text-xs font-semibold ${
                    isSelected ? 'text-[#ee4d2d]' : 'text-[#444444]'
                  }`}
                >
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Mobile Pagination Indicator Dots */}
      <div className="mt-2 flex justify-center items-center gap-1 sm:hidden">
        <span className="h-1 w-3 rounded-full bg-[#ee4d2d]" />
        <span className="h-1 w-1 rounded-full bg-[#dddddd]" />
        <span className="h-1 w-1 rounded-full bg-[#dddddd]" />
      </div>

      {/* Deal Strip Section */}
      <section className="my-3 flex items-center gap-3 rounded-lg border border-[#f9dfd2] bg-[#fff5ef] px-3.5 py-2.5 shadow-sm sm:my-5 sm:px-5 sm:py-3.5">
        <span aria-hidden="true" className="material-symbols-outlined text-[22px] text-[#ee4d2d]">
          confirmation_number
        </span>
        <div className="min-w-0 flex-1">
          <b className="block text-xs font-bold text-[#222222] sm:text-sm">Freeship cho bữa ngon</b>
          <small className="block text-[10px] text-[#9b7768] sm:text-xs">
            Áp dụng trong bản trải nghiệm web
          </small>
        </div>
        <button
          type="button"
          onClick={() => setVoucherModalOpen(true)}
          className="rounded border border-[#ee4d2d] bg-white px-3 py-1 text-xs font-bold text-[#ee4d2d] transition hover:bg-[#ee4d2d] hover:text-white"
        >
          Lấy mã
        </button>
      </section>

      {/* "Hôm nay ăn gì?" Featured Section */}
      <section className="mb-6 rounded-lg bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#222222] sm:text-lg">Hôm nay ăn gì?</h2>
          <button
            type="button"
            onClick={() => setSelectedCategory('Tất cả')}
            className="flex items-center text-xs font-semibold text-[#888888] hover:text-[#ee4d2d]"
          >
            Xem tất cả
            <span aria-hidden="true" className="material-symbols-outlined text-sm">
              chevron_right
            </span>
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible sm:pb-0">
          {featuredDishes.map((dish) => (
            <Link
              key={dish.id}
              to={`/restaurants/${dish.restaurantId}`}
              className="group w-28 shrink-0 sm:w-auto"
            >
              <div className="h-24 w-28 overflow-hidden rounded-md bg-[#f5efeb] sm:h-36 sm:w-full">
                <img
                  src={dish.image}
                  alt={dish.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              </div>
              <b className="mt-2 block truncate text-xs font-semibold text-[#222222] group-hover:text-[#ee4d2d] sm:text-sm">
                {dish.name}
              </b>
              <span className="mt-0.5 block text-xs font-bold text-[#ee4d2d] sm:text-sm">
                {money(dish.price)}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* "Quán ngon dành cho bạn" Catalog Section */}
      <section className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-[#222222] sm:text-xl">Quán ngon dành cho bạn</h2>
          {(submittedKeyword || selectedCategory !== 'Tất cả') && (
            <button
              type="button"
              onClick={() => {
                setKeyword('');
                setSubmittedKeyword('');
                setSelectedCategory('Tất cả');
              }}
              className="self-start text-xs font-semibold text-[#c5371d] hover:underline sm:self-auto"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="my-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none sm:my-4">
          {(['Đề xuất', 'Gần tôi', 'Đánh giá'] as const).map((chip) => {
            const active = sortOption === chip;
            return (
              <button
                key={chip}
                type="button"
                onClick={() => setSortOption(chip)}
                className={`flex items-center gap-1 whitespace-nowrap rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'border-[#ee4d2d] bg-[#fff8f5] text-[#ee4d2d]'
                    : 'border-[#dddddd] bg-white text-[#444444] hover:border-[#ee4d2d]'
                }`}
              >
                {chip}
                {chip === 'Đề xuất' && (
                  <span aria-hidden="true" className="material-symbols-outlined text-sm">
                    tune
                  </span>
                )}
              </button>
            );
          })}
          {selectedCategory !== 'Tất cả' && (
            <button
              type="button"
              onClick={() => setSelectedCategory('Tất cả')}
              className="flex items-center gap-1 whitespace-nowrap rounded-md border border-[#ee4d2d] bg-[#fff8f5] px-3 py-1.5 text-xs font-semibold text-[#ee4d2d]"
            >
              {selectedCategory} ×
            </button>
          )}
        </div>

        {/* Catalog Query States */}
        {loading && (
          <div className="py-12 text-center text-sm text-[#777777]">
            <div className="spinner mx-auto mb-3 h-8 w-8 border-2 border-gray-200 border-t-[#ee4d2d]" />
            Đang tìm món ngon…
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void refresh()}
              className="mt-2 font-bold underline"
            >
              Thử lại
            </button>
          </div>
        )}

        {!loading && !error && displayRestaurants.length === 0 && (
          <div className="my-6 rounded-lg border border-dashed border-[#dddddd] p-10 text-center text-[#777777]">
            <span aria-hidden="true" className="material-symbols-outlined mb-2 text-4xl text-[#cccccc]">
              storefront
            </span>
            <p className="font-semibold text-[#444444]">Không tìm thấy nhà hàng phù hợp.</p>
            <p className="mt-1 text-xs text-[#888888]">Thử một tên món hoặc quán khác.</p>
            <button
              type="button"
              onClick={() => {
                setKeyword('');
                setSubmittedKeyword('');
                setSelectedCategory('Tất cả');
              }}
              className="mt-4 rounded-md bg-[#ee4d2d] px-4 py-2 text-xs font-bold text-white"
            >
              Xóa tìm kiếm
            </button>
          </div>
        )}

        {/* Restaurant Cards Grid (Matching ShopeeFood Preview Style) */}
        {!loading && !error && visibleRestaurants.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-2">
            {visibleRestaurants.map((restaurantItem) => {
              const rating =
                restaurantItem.rating && restaurantItem.rating > 0 ? restaurantItem.rating : 4.8;
              const distance = calculateDistance(restaurantItem);
              return (
                <Link
                  key={restaurantItem.id}
                  to={`/restaurants/${restaurantItem.id}`}
                  className="group flex gap-3.5 rounded-lg border border-[#f0f0f0] bg-white p-3.5 transition-all hover:border-[#ee4d2d] hover:shadow-sm"
                >
                  {/* Restaurant Photo with Fallback */}
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded bg-[#f5efeb] sm:h-24 sm:w-24">
                    {restaurantItem.image ? (
                      <img
                        src={restaurantItem.image}
                        alt={restaurantItem.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#c28c70]">
                        <span aria-hidden="true" className="material-symbols-outlined text-3xl">
                          restaurant
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Restaurant Details */}
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-sm font-bold text-[#222222] group-hover:text-[#ee4d2d] sm:text-base">
                      <span className="mr-1.5 inline-block rounded-[2px] bg-[#ee4d2d] px-1 py-0.5 align-middle text-[9px] font-bold text-white">
                        Yêu thích
                      </span>
                      {restaurantItem.name}
                    </h3>

                    <p className="mt-1 flex items-center text-[11px] text-[#777777] sm:text-xs">
                      <span className="text-[#ffb329]">★</span>
                      <span className="ml-1 font-semibold text-[#222222]">
                        {rating.toFixed(1)}
                      </span>
                      <span className="mx-1.5 text-[#dddddd]">|</span>
                      <span>{distance} km</span>
                      <span className="mx-1.5 text-[#dddddd]">|</span>
                      <span>20–30 phút</span>
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-[2px] border border-[#ee4d2d] px-1 py-0.5 text-[9px] font-medium text-[#ee4d2d]">
                        Freeship Xtra
                      </span>
                      <span className="rounded-[2px] bg-[#fff3e9] px-1 py-0.5 text-[9px] font-medium text-[#c57642]">
                        Giảm 15.000đ
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Load More Button */}
        {!loading && !error && displayRestaurants.length > visibleCount && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 12)}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#ee4d2d] bg-white px-6 py-2.5 text-xs font-bold text-[#ee4d2d] shadow-sm transition hover:bg-[#fff5ef] sm:text-sm"
            >
              Xem thêm quán ({displayRestaurants.length - visibleCount} quán khác)
              <span aria-hidden="true" className="material-symbols-outlined text-base">
                expand_more
              </span>
            </button>
          </div>
        )}
      </section>

      {/* Voucher Modal */}
      {voucherModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="voucher-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setVoucherModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#eeeeee] pb-3">
              <h2 id="voucher-title" className="text-base font-bold text-[#222222]">
                Mã ưu đãi ShopeeFood
              </h2>
              <button
                type="button"
                onClick={() => setVoucherModalOpen(false)}
                aria-label="Đóng"
                className="text-[#888888] hover:text-[#222222]"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-xl">
                  close
                </span>
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {[
                {
                  code: 'FREESHIP15',
                  name: 'Freeship Xtra',
                  desc: 'Giảm 15.000đ phí vận chuyển cho đơn từ 0đ',
                },
                {
                  code: 'BANMOI20',
                  name: 'Ưu đãi bạn mới',
                  desc: 'Giảm 20.000đ cho đơn hàng đầu tiên từ 50.000đ',
                },
                {
                  code: 'TIECMON30',
                  name: 'Đại tiệc món ngon',
                  desc: 'Giảm 30.000đ cho đơn từ 120.000đ',
                },
              ].map((v) => {
                const isSaved = savedVouchers[v.code];
                return (
                  <div
                    key={v.code}
                    className="flex items-center justify-between rounded-md border border-[#f9dfd2] bg-[#fffbf9] p-3"
                  >
                    <div>
                      <b className="text-xs font-bold text-[#ee4d2d] sm:text-sm">{v.name}</b>
                      <p className="mt-0.5 text-[11px] text-[#666666]">{v.desc}</p>
                      <small className="mt-1 block font-mono text-[10px] text-[#888888]">
                        Mã: {v.code}
                      </small>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleVoucher(v.code)}
                      className={`ml-3 shrink-0 rounded px-3 py-1.5 text-xs font-bold transition ${
                        isSaved
                          ? 'bg-[#e5e5e5] text-[#666666]'
                          : 'bg-[#ee4d2d] text-white hover:bg-[#d84023]'
                      }`}
                    >
                      {isSaved ? 'Đã lưu' : 'Lưu mã'}
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setVoucherModalOpen(false)}
              className="mt-5 w-full rounded-md bg-[#ee4d2d] py-2 text-sm font-bold text-white hover:bg-[#d84023]"
            >
              Xong
            </button>
          </div>
        </div>
      )}
    </CustomerShell>
  );
};

export default CustomerHomePage;
