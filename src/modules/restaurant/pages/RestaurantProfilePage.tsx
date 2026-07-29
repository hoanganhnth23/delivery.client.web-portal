import { useEffect } from 'react';
import RestaurantHeader from '@/components/layout/RestaurantHeader';
import RestaurantSidebar from '@/components/layout/RestaurantSidebar';
import RestaurantForm from '../components/RestaurantForm';
import { useRestaurant } from '../hooks/useRestaurant';

const RestaurantProfilePage = () => {
  const { currentRestaurant, loading, error, getMyRestaurants } = useRestaurant();

  useEffect(() => {
    void getMyRestaurants();
  }, [getMyRestaurants]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
      <RestaurantSidebar
        restaurantName={currentRestaurant?.name}
        restaurantImage={currentRestaurant?.image}
      />

      <main className="flex flex-1 flex-col overflow-hidden">
        <RestaurantHeader
          title="Hồ sơ cửa hàng"
          subtitle="Thông tin được lưu theo contract nhà hàng của backend"
          showSearch={false}
        />

        <div className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-900">
            {loading && !currentRestaurant ? (
              <p className="text-center text-gray-500">Đang tải hồ sơ nhà hàng…</p>
            ) : error ? (
              <div className="text-center">
                <p className="text-red-600">{error}</p>
                <button
                  type="button"
                  onClick={() => void getMyRestaurants()}
                  className="mt-4 rounded-lg bg-primary px-4 py-2 font-semibold text-white"
                >
                  Thử lại
                </button>
              </div>
            ) : currentRestaurant ? (
              <RestaurantForm
                restaurant={currentRestaurant}
                onSuccess={() => void getMyRestaurants()}
                onCancel={() => void getMyRestaurants()}
              />
            ) : (
              <p className="text-center text-gray-500">
                Tài khoản chưa được gán nhà hàng. Vui lòng liên hệ quản trị viên.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RestaurantProfilePage;
