/**
 * RestaurantListPage - Trang danh sách và quản lý nhà hàng
 * CRUD: Create, Read, Update, Delete
 */

import { useState, useEffect } from 'react';
import { useRestaurant } from '../hooks/useRestaurant';
import RestaurantForm from '../components/RestaurantForm';
import type { Restaurant } from '@/types/api.types';

const RestaurantListPage = () => {
  const { 
    restaurants, 
    loading, 
    error,
    getAllRestaurants,
    deleteRestaurant,
    searchRestaurants 
  } = useRestaurant();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  // Load danh sách nhà hàng khi component mount
  useEffect(() => {
    getAllRestaurants();
  }, [getAllRestaurants]);

  const handleCreate = () => {
    setEditingRestaurant(null);
    setIsModalOpen(true);
  };

  const handleEdit = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc muốn xóa nhà hàng này?')) {
      const result = await deleteRestaurant(id, { skipRedirect: true });
      if (result.success) {
        alert('Xóa nhà hàng thành công!');
      } else {
        alert(`Xóa thất bại: ${result.message}`);
      }
    }
  };

  const handleFormSuccess = (_data: unknown) => {
    setIsModalOpen(false);
    setEditingRestaurant(null);
    alert(editingRestaurant ? 'Cập nhật thành công!' : 'Tạo mới thành công!');
    getAllRestaurants(); // Refresh list
  };

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      await searchRestaurants({ keyword: searchKeyword });
    } else {
      await getAllRestaurants();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Quản lý nhà hàng
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Tạo, sửa, xóa nhà hàng trong hệ thống
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined">add</span>
            Thêm nhà hàng
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm kiếm nhà hàng..."
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-xl transition-colors"
            >
              <span className="material-symbols-outlined">search</span>
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">
              refresh
            </span>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Đang tải...</p>
          </div>
        )}

        {/* Restaurant List */}
        {!loading && restaurants.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-gray-400">
              restaurant
            </span>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Chưa có nhà hàng nào
            </p>
          </div>
        )}

        {!loading && restaurants.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* Image */}
                <div className="aspect-video bg-gray-200 dark:bg-gray-700 relative">
                  {restaurant.image ? (
                    <img
                      src={restaurant.image}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-6xl text-gray-400">
                        restaurant
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {restaurant.name}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-lg">location_on</span>
                      <span>{restaurant.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">phone</span>
                      <span>{restaurant.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">schedule</span>
                      <span>{restaurant.openingHour} - {restaurant.closingHour}</span>
                    </div>
                  </div>

                  {restaurant.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                      {restaurant.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(restaurant)}
                      className="flex-1 px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold rounded-lg transition-colors"
                    >
                      <span className="flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-lg">edit</span>
                        Sửa
                      </span>
                    </button>
                    <button
                      onClick={() => handleDelete(restaurant.id)}
                      className="flex-1 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold rounded-lg transition-colors"
                    >
                      <span className="flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-lg">delete</span>
                        Xóa
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingRestaurant ? 'Chỉnh sửa nhà hàng' : 'Thêm nhà hàng mới'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <span className="material-symbols-outlined text-3xl">close</span>
                </button>
              </div>
              <div className="p-6">
                <RestaurantForm
                  restaurant={editingRestaurant}
                  onSuccess={handleFormSuccess}
                  onCancel={() => setIsModalOpen(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantListPage;
