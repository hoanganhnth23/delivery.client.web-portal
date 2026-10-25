import { useCallback, useEffect, useState } from 'react';
import RestaurantSidebar from '@/components/layout/RestaurantSidebar';
import RestaurantHeader from '@/components/layout/RestaurantHeader';
import { useRestaurant } from '../hooks/useRestaurant';
import type { RestaurantRating } from '../services/restaurantService';
import { useAppDependencies } from '@/app/dependencies';
import { formatDateTime } from '@/utils/dateTime';

const RestaurantReviewsPage = () => {
  const { restaurant: restaurantService, notifications } = useAppDependencies();
  const { currentRestaurant } = useRestaurant();
  const [reviews, setReviews] = useState<RestaurantRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    if (!currentRestaurant?.id) return;
    setLoading(true);
    setError(null);
    try {
      setReviews(await restaurantService.getRestaurantRatings(currentRestaurant.id));
    } catch {
      setError('Không thể tải danh sách đánh giá.');
      notifications.error('Lỗi khi tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  }, [currentRestaurant, notifications, restaurantService]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return formatDateTime(dateString);
  };

  return (
    <div className="flex h-screen w-full min-w-0 overflow-hidden bg-background-light dark:bg-background-dark">
      <RestaurantSidebar
        restaurantName={currentRestaurant?.name}
        restaurantImage={currentRestaurant?.image}
      />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <RestaurantHeader
          title="Đánh giá từ khách hàng"
          subtitle="Xem phản hồi và đánh giá về nhà hàng của bạn"
        />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:gap-6">
            {/* Summary Card */}
            <div className="rounded-2xl border border-gray-100 bg-card-light p-4 shadow-sm dark:border-gray-800 dark:bg-card-dark sm:p-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Đánh giá trung bình</h3>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-extrabold text-primary">{currentRestaurant?.rating?.toFixed(1) || '0.0'}</span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <span 
                          key={i} 
                          className={`material-symbols-outlined text-lg ${i < Math.round(currentRestaurant?.rating || 0) ? 'text-amber-400 fill-1' : 'text-gray-300'}`}
                        >
                          star
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">{currentRestaurant?.ratingCount || 0} lượt đánh giá</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews List */}
            <div className="flex flex-col gap-4">
              {loading ? (
                <div className="text-center py-12 text-gray-500">Đang tải đánh giá...</div>
              ) : error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center" role="alert">
                  <p className="text-red-700">{error}</p>
                  <button
                    type="button"
                    onClick={() => void loadReviews()}
                    className="mt-4 rounded-lg bg-primary px-4 py-2 font-semibold text-white"
                  >
                    Thử lại
                  </button>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-surface-dark rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-gray-500">
                  Chưa có đánh giá nào được duyệt hiển thị.
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="bg-card-light dark:bg-card-dark p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {review.customerId.toString().slice(-2)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">Khách hàng #{review.customerId}</h4>
                          <span className="text-[11px] text-gray-400">{formatDate(review.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <span 
                            key={i} 
                            className={`material-symbols-outlined text-base ${i < review.rating ? 'text-amber-400 fill-1' : 'text-gray-300'}`}
                          >
                            star
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-white/5 p-3 rounded-xl">
                      {review.comment || <span className="italic opacity-50">Không có bình luận</span>}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RestaurantReviewsPage;
