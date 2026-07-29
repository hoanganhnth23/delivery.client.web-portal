import { Link } from 'react-router-dom';
import RestaurantHeader from '@/components/layout/RestaurantHeader';
import RestaurantSidebar from '@/components/layout/RestaurantSidebar';
import { useRestaurant } from '../hooks/useRestaurant';
import { ROUTES } from '@/utils/constants';

const actions = [
  { label: 'Đơn hàng', icon: 'shopping_bag', to: ROUTES.RESTAURANT_ORDERS },
  { label: 'Thực đơn', icon: 'menu_book', to: ROUTES.RESTAURANT_MENU },
  { label: 'Hồ sơ cửa hàng', icon: 'storefront', to: ROUTES.RESTAURANT_PROFILE },
  { label: 'Đánh giá', icon: 'reviews', to: ROUTES.RESTAURANT_REVIEWS },
];

const RestaurantDashboard = () => {
  const { currentRestaurant } = useRestaurant();

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
      <RestaurantSidebar restaurantName={currentRestaurant?.name} restaurantImage={currentRestaurant?.image} />
      <main className="min-w-0 flex-1">
        <RestaurantHeader title="Tổng quan" subtitle={currentRestaurant?.name} />
        <section className="flex flex-col gap-6 p-6 lg:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">MVP Console</p>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">
              {currentRestaurant?.name || 'Quản lý nhà hàng'}
            </h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Analytics, livestream, settlement và công cụ campaign của merchant chưa mở trong MVP.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {actions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="flex items-center gap-4 rounded-2xl border border-border-light bg-white p-5 shadow-sm transition hover:border-primary hover:shadow-md dark:border-border-dark dark:bg-surface-dark"
              >
                <span className="material-symbols-outlined text-3xl text-primary">{action.icon}</span>
                <span className="font-bold text-gray-900 dark:text-white">{action.label}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default RestaurantDashboard;
