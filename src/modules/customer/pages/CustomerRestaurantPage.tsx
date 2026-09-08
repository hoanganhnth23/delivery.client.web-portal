import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppDependencies } from '@/app/dependencies';
import type { MenuItem, Restaurant } from '@/types/api.types';
import { CustomerShell } from '../components/CustomerShell';
import { useCustomerCart } from '../cart/useCustomerCart';
import { formatCurrency, getErrorMessage } from '../utils';
import { ROUTES } from '@/utils/constants';

const CustomerRestaurantPage = () => {
  const { restaurant: restaurantService, menu: menuService } = useAppDependencies();
  const { restaurantId } = useParams();
  const { cart, add, clear } = useCustomerCart();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const id = Number(restaurantId);
    if (!Number.isSafeInteger(id) || id <= 0) {
      setError('Nhà hàng không hợp lệ');
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const [restaurantData, menuData] = await Promise.all([
          restaurantService.getRestaurantById(id),
          menuService.getMenuItemsByRestaurant(id),
        ]);
        setRestaurant(restaurantData);
        setMenu(menuData);
      } catch (caught) {
        setError(getErrorMessage(caught, 'Không thể tải thông tin nhà hàng'));
      } finally {
        setLoading(false);
      }
    })();
  }, [menuService, restaurantId, restaurantService]);

  const addItem = (item: MenuItem) => {
    if (!restaurant) return;
    const result = add(restaurant, item);
    if (result.requiresRestaurantConfirmation) {
      const confirmed = window.confirm('Giỏ hàng đang có món của nhà hàng khác. Xóa giỏ cũ để tiếp tục?');
      if (!confirmed) return;
      clear();
      add(restaurant, item);
    }
    setNotice(`Đã thêm ${item.name} vào giỏ`);
    window.setTimeout(() => setNotice(null), 1800);
  };

  return (
    <CustomerShell>
      <div className="mb-4 text-xs text-[#777777] sm:mb-5 sm:text-sm"><Link to={ROUTES.HOME} className="font-semibold text-[#c5371d]">Nhà hàng</Link> <span className="mx-2">/</span> Menu</div>
      {loading && <p>Đang tải menu…</p>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">{error}</div>}
      {!loading && !error && restaurant && (
        <>
          <section className="overflow-hidden rounded-lg border border-[#eeeeee] bg-white sm:rounded-lg">
            <div className="h-44 bg-[#f5efeb] sm:h-72">
              {restaurant.image ? <img src={restaurant.image} alt="" fetchPriority="high" decoding="async" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[#b88d7a]"><span aria-hidden="true" className="material-symbols-outlined text-7xl">restaurant</span></div>}
            </div>
            <div className="p-4 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
                <div>
                  <h1 className="break-words text-2xl font-bold sm:text-3xl">{restaurant.name}</h1>
                  <p className="mt-2 text-sm text-[#777777] sm:text-base">{restaurant.address}</p>
                </div>
                <span className={`rounded-full px-3 py-1.5 text-xs font-bold sm:py-2 sm:text-sm ${restaurant.open ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {restaurant.open ? 'Đang mở cửa' : 'Đã đóng cửa'}
                </span>
              </div>
              <p className="mt-4 max-w-3xl text-sm text-[#777777] sm:text-base">{restaurant.description}</p>
            </div>
          </section>

          {notice && <div role="status" className="fixed bottom-24 right-4 z-30 max-w-[calc(100vw-2rem)] rounded-md bg-[#222222] px-4 py-3 text-sm font-semibold text-white shadow-xl sm:bottom-5 sm:right-5 sm:max-w-none sm:px-5">{notice}</div>}
          <section className="mt-6 sm:mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold sm:text-2xl">Menu hôm nay</h2>
              {cart?.restaurantId === restaurant.id && <Link to={ROUTES.CUSTOMER_CART} className="font-bold text-[#c5371d]">Xem giỏ hàng →</Link>}
            </div>
            {menu.length === 0 && <p className="mt-5 text-[#777777]">Nhà hàng chưa có món đang bán.</p>}
            <div className="mt-4 grid gap-3 sm:mt-5 sm:gap-4 md:grid-cols-2">
              {menu.map((item) => (
                <article key={item.id} className="flex gap-3 rounded-lg border border-[#eeeeee] bg-white p-3 sm:gap-4 sm:p-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-[#f5efeb] sm:h-24 sm:w-24">
                    {item.image ? <img src={item.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[#b88d7a]"><span aria-hidden="true" className="material-symbols-outlined text-3xl">restaurant_menu</span></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold">{item.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-[#777777]">{item.description}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-[#ee4d2d]">{formatCurrency(item.price)}</span>
                      <button type="button" onClick={() => addItem(item)} disabled={!restaurant.open} className="min-h-10 shrink-0 rounded-lg bg-[#ee4d2d] px-3 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300">Thêm món</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </CustomerShell>
  );
};

export default CustomerRestaurantPage;
