import { Link, useLocation } from 'react-router-dom';
import { restaurantNavigation as navigation } from '@/components/navigation/portalNavigation';

interface RestaurantSidebarProps {
  restaurantName?: string;
  restaurantImage?: string;
}

const RestaurantSidebar = ({ restaurantName, restaurantImage }: RestaurantSidebarProps) => {
  const location = useLocation();
  const identity = restaurantName?.trim() || 'Nhà hàng chưa được gán';

  return (
    <aside className="hidden w-72 flex-shrink-0 flex-col border-r border-border-light bg-surface-light p-6 dark:border-border-dark dark:bg-surface-dark lg:flex">
      <div className="flex items-center gap-4 px-2">
        {restaurantImage?.trim() ? (
          <img
            src={restaurantImage}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-12 rounded-full border-2 border-primary object-cover"
          />
        ) : (
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="material-symbols-outlined">restaurant</span>
          </div>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-gray-900 dark:text-white">{identity}</h1>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Quản lý cửa hàng
          </p>
        </div>
      </div>

      <nav className="mt-8 flex flex-col gap-2">
        {navigation.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                active
                  ? 'bg-primary/10 font-bold text-primary'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default RestaurantSidebar;
