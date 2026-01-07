/**
 * RestaurantSidebar Component
 * Sidebar chung cho tất cả các trang Restaurant/Merchant
 */

import { Link, useLocation } from 'react-router-dom';

interface MenuItem {
  icon: string;
  label: string;
  to: string;
  badge?: string;
}

interface RestaurantSidebarProps {
  restaurantName?: string;
  restaurantImage?: string;
}

const RestaurantSidebar = ({ 
  restaurantName = 'Tasty Bites',
  restaurantImage = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200'
}: RestaurantSidebarProps) => {
  const location = useLocation();

  const menuItems: MenuItem[] = [
    { icon: 'dashboard', label: 'Dashboard', to: '/restaurant/dashboard' },
    { icon: 'shopping_bag', label: 'Orders', to: '/restaurant/orders', badge: '12' },
    { icon: 'menu_book', label: 'Menu Management', to: '/restaurant/menu' },
    { icon: 'storefront', label: 'Profile', to: '/restaurant/profile' },
    { icon: 'bar_chart', label: 'Analytics', to: '/restaurant/analytics' },
    { icon: 'reviews', label: 'Reviews', to: '/restaurant/reviews' },
    { icon: 'settings', label: 'Settings', to: '/restaurant/settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="hidden lg:flex flex-col w-72 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex-shrink-0 transition-colors duration-200">
      <div className="flex h-full flex-col justify-between p-6">
        <div className="flex flex-col gap-8">
          {/* Logo / Restaurant Info */}
          <div className="flex items-center gap-4 px-2">
            <div
              className="bg-center bg-no-repeat bg-cover rounded-full size-12 shadow-sm border-2 border-primary"
              style={{ backgroundImage: `url('${restaurantImage}')` }}
            />
            <div className="flex flex-col">
              <h1 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-tight">
                {restaurantName}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">
                Merchant Panel
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            {menuItems.map((item) => {
              const active = isActive(item.to);
              
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`
                    flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all
                    ${active 
                      ? 'bg-primary/10 text-primary group' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-xl ${active ? 'fill-1' : ''}`}>
                      {item.icon}
                    </span>
                    <span className={`text-sm ${active ? 'font-bold' : 'font-semibold'}`}>
                      {item.label}
                    </span>
                  </div>
                  
                  {item.badge && (
                    <span className="flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-primary text-white text-xs font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            
            {/* Divider */}
            <div className="h-px bg-border-light dark:bg-border-dark my-2 mx-4"></div>
            
            {/* Logout */}
            <Link
              to="/login"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
              <span className="text-sm font-semibold">Logout</span>
            </Link>
          </nav>
        </div>

        {/* Bottom Help Card */}
        <div className="rounded-xl bg-gradient-to-br from-primary to-orange-600 p-4 text-white relative overflow-hidden">
          <div className="absolute -right-2 -top-2 opacity-20 transform rotate-12">
            <span className="material-symbols-outlined text-6xl">restaurant</span>
          </div>
          <p className="text-xs font-medium opacity-80 mb-1">Need Help?</p>
          <p className="font-bold text-sm mb-2">Contact Support</p>
          <button className="text-xs bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-lg font-medium transition-colors">
            Get Help
          </button>
        </div>
      </div>
    </aside>
  );
};

export default RestaurantSidebar;
