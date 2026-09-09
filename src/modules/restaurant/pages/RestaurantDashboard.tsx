import { Link } from 'react-router-dom';
import RestaurantHeader from '@/components/layout/RestaurantHeader';
import RestaurantSidebar from '@/components/layout/RestaurantSidebar';
import { useRestaurant } from '../hooks/useRestaurant';
import { ROUTES } from '@/utils/constants';
import { useOptionalPortalPreview } from '@/components/navigation/usePortalPreviewNavigation';

const actions = [
  { label: 'Đơn hàng', icon: 'shopping_bag', to: ROUTES.RESTAURANT_ORDERS },
  { label: 'Thực đơn', icon: 'menu_book', to: ROUTES.RESTAURANT_MENU },
  { label: 'Hồ sơ cửa hàng', icon: 'storefront', to: ROUTES.RESTAURANT_PROFILE },
  { label: 'Đánh giá', icon: 'reviews', to: ROUTES.RESTAURANT_REVIEWS },
  { label: 'Import dữ liệu', icon: 'upload_file', to: ROUTES.RESTAURANT_CATALOG_IMPORT },
];

const RestaurantDashboard = () => {
  const { currentRestaurant } = useRestaurant();
  const preview = useOptionalPortalPreview();
  const previewPath = preview?.toPreviewPath ?? ((path: string) => path);

  return (
    <div className="flex min-h-screen min-w-0 bg-background-light dark:bg-background-dark">
      <RestaurantSidebar restaurantName={currentRestaurant?.name} restaurantImage={currentRestaurant?.image} />
      <main className="min-w-0 flex-1">
        <RestaurantHeader title="Tổng quan" subtitle={currentRestaurant?.name} />
        <section className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8">
          <div className="portal-store-summary">
            {currentRestaurant?.image && <img src={currentRestaurant.image} alt="" />}
            <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Cửa hàng của bạn</p>
            <h1 className="break-words text-2xl font-black text-gray-900 dark:text-white sm:text-3xl">
              {currentRestaurant?.name || 'Quản lý nhà hàng'}
            </h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              {currentRestaurant?.address || 'Quản lý thực đơn và theo dõi đơn hàng tại một nơi.'}
            </p>
            {currentRestaurant && <p className={`portal-store-status ${currentRestaurant.open ? 'text-green-700 dark:text-green-400' : 'text-gray-500'}`}><span aria-hidden="true" className="material-symbols-outlined">storefront</span>{currentRestaurant.open ? 'Đang mở cửa' : 'Đang đóng cửa'}{currentRestaurant.phone && ` · ${currentRestaurant.phone}`}</p>}
            </div>
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Quản lý hôm nay</h2>
          <div className="portal-store-actions grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {actions.map((action) => (
              <Link
                key={action.to}
                to={previewPath(action.to)}
                className="flex items-center gap-4 rounded-2xl border border-border-light bg-white p-5 shadow-sm transition hover:border-primary hover:shadow-md dark:border-border-dark dark:bg-surface-dark"
              >
                <span className="material-symbols-outlined text-3xl text-primary">{action.icon}</span>
                <span className="font-bold text-gray-900 dark:text-white">{action.label}<small>{action.to === ROUTES.RESTAURANT_ORDERS ? 'Tiếp nhận và xử lý đơn đặt món' : action.to === ROUTES.RESTAURANT_MENU ? 'Cập nhật món, hình ảnh và giá bán' : action.to === ROUTES.RESTAURANT_PROFILE ? 'Thông tin liên hệ và giờ mở cửa' : action.to === ROUTES.RESTAURANT_REVIEWS ? 'Xem phản hồi của khách hàng' : 'Kiểm tra và nhập danh mục'}</small></span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default RestaurantDashboard;
