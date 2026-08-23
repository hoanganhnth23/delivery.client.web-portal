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
      <div className="mb-5 text-sm text-[#806c57]"><Link to={ROUTES.HOME} className="font-semibold text-[#a85d0c]">Nhà hàng</Link> <span className="mx-2">/</span> Menu</div>
      {loading && <p>Đang tải menu…</p>}
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">{error}</div>}
      {!loading && !error && restaurant && (
        <>
          <section className="overflow-hidden rounded-3xl border border-[#eadfce] bg-white">
            <div className="h-56 bg-[#f6ead9] sm:h-72">
              {restaurant.image ? <img src={restaurant.image} alt="" fetchPriority="high" decoding="async" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-7xl">🍲</div>}
            </div>
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-black">{restaurant.name}</h1>
                  <p className="mt-2 text-[#806c57]">{restaurant.address}</p>
                </div>
                <span className={`rounded-full px-3 py-2 text-sm font-bold ${restaurant.open ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {restaurant.open ? 'Đang mở cửa' : 'Đã đóng cửa'}
                </span>
              </div>
              <p className="mt-4 max-w-3xl text-[#806c57]">{restaurant.description}</p>
            </div>
          </section>

          {notice && <div role="status" className="fixed bottom-5 right-5 z-30 rounded-xl bg-[#2d2116] px-5 py-3 font-semibold text-white shadow-xl">{notice}</div>}
          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">Menu hôm nay</h2>
              {cart?.restaurantId === restaurant.id && <Link to={ROUTES.CUSTOMER_CART} className="font-bold text-[#a85d0c]">Xem giỏ hàng →</Link>}
            </div>
            {menu.length === 0 && <p className="mt-5 text-[#806c57]">Nhà hàng chưa có món đang bán.</p>}
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {menu.map((item) => (
                <article key={item.id} className="flex gap-4 rounded-2xl border border-[#eadfce] bg-white p-4">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[#f6ead9]">
                    {item.image ? <img src={item.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-3xl">🍱</div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-black">{item.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-[#806c57]">{item.description}</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="font-black text-[#ed8a16]">{formatCurrency(item.price)}</span>
                      <button type="button" onClick={() => addItem(item)} disabled={!restaurant.open} className="rounded-lg bg-[#ed8a16] px-3 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300">Thêm món</button>
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
