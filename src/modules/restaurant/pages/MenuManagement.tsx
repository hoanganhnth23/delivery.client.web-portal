import { useEffect, useState } from 'react';
import RestaurantHeader from '@/components/layout/RestaurantHeader';
import RestaurantSidebar from '@/components/layout/RestaurantSidebar';
import type { MenuItem } from '@/types/api.types';
import MenuItemForm from '../components/MenuItemForm';
import { useMenu } from '../hooks/useMenu';
import { useRestaurant } from '../hooks/useRestaurant';

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const MenuManagement = () => {
  const { menuItems, loading, error, getMyMenuItems, deleteMenuItem } = useMenu();
  const { currentRestaurant } = useRestaurant();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    void getMyMenuItems();
  }, [getMyMenuItems]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredMenuItems = menuItems.filter(
    (item) =>
      !normalizedQuery ||
      item.name.toLowerCase().includes(normalizedQuery) ||
      item.description.toLowerCase().includes(normalizedQuery),
  );

  const handleCreate = () => {
    if (!currentRestaurant) return;
    setEditingMenuItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    if (!currentRestaurant) return;
    setEditingMenuItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa món ăn này?')) return;
    const result = await deleteMenuItem(id, { skipRedirect: true });
    if (result.success) {
      window.alert('Xóa món ăn thành công!');
      await getMyMenuItems();
    } else {
      window.alert(`Xóa thất bại: ${result.message}`);
    }
  };

  const handleFormSuccess = async () => {
    setIsModalOpen(false);
    setEditingMenuItem(null);
    await getMyMenuItems();
  };

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
      <RestaurantSidebar
        restaurantName={currentRestaurant?.name}
        restaurantImage={currentRestaurant?.image}
      />

      <main className="flex flex-1 flex-col overflow-hidden">
        <RestaurantHeader
          title="Quản lý Menu"
          subtitle={`${filteredMenuItems.length}/${menuItems.length} món ăn`}
          showSearch
          searchPlaceholder="Tìm kiếm món ăn..."
          onSearch={setSearchQuery}
          actions={
            <button
              type="button"
              onClick={handleCreate}
              disabled={!currentRestaurant}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="material-symbols-outlined">add</span>
              Thêm món
            </button>
          }
        />

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 lg:px-8">
            {!currentRestaurant && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
                Tài khoản chưa được gán nhà hàng; không thể tạo hoặc sửa món ăn.
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border-light bg-surface-light p-4 shadow-sm dark:border-border-dark dark:bg-surface-dark">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Tổng món từ backend</span>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{menuItems.length}</p>
              </div>
              <div className="rounded-xl border border-border-light bg-surface-light p-4 shadow-sm dark:border-border-dark dark:bg-surface-dark">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Kết quả tìm kiếm</span>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{filteredMenuItems.length}</p>
              </div>
            </div>

            {loading && (
              <div className="flex justify-center py-12">
                <div className="size-12 animate-spin rounded-full border-b-2 border-primary" />
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}

            {!loading && !error && menuItems.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                <span className="material-symbols-outlined mb-4 text-6xl text-gray-400">restaurant_menu</span>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Chưa có món ăn nào</h3>
                <p className="mt-2">Thêm món đầu tiên sau khi tài khoản đã được gán nhà hàng.</p>
              </div>
            )}

            {!loading && !error && menuItems.length > 0 && filteredMenuItems.length === 0 && (
              <div className="py-12 text-center text-gray-500">Không có món ăn khớp từ khóa.</div>
            )}

            {!loading && !error && filteredMenuItems.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-6">
                {filteredMenuItems.map((item) => (
                  <article
                    key={item.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-border-light bg-surface-light shadow-sm dark:border-border-dark dark:bg-surface-dark"
                  >
                    <div className="relative flex h-48 items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-800">
                      {item.image?.trim() ? (
                        <img src={item.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-5xl text-gray-400">restaurant</span>
                      )}
                      <p className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-sm font-bold text-primary backdrop-blur-sm dark:bg-gray-900/90">
                        {formatMoney(item.price)}
                      </p>
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="font-bold text-gray-900 dark:text-white">{item.name}</h3>
                      <p className="mb-4 mt-2 flex-1 text-xs text-gray-600 dark:text-gray-400">
                        {item.description || 'Không có mô tả'}
                      </p>
                      <div className="flex gap-2 border-t border-border-light pt-3 dark:border-border-dark">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          disabled={!currentRestaurant}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-700 hover:bg-primary hover:text-white disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(item.id)}
                          className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                          aria-label={`Xóa ${item.name}`}
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {isModalOpen && currentRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-800">
            <header className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingMenuItem ? 'Chỉnh sửa món ăn' : 'Thêm món ăn mới'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Đóng"
              >
                <span className="material-symbols-outlined text-3xl">close</span>
              </button>
            </header>
            <div className="p-6">
              <MenuItemForm
                menuItem={editingMenuItem}
                restaurantId={currentRestaurant.id}
                onSuccess={() => void handleFormSuccess()}
                onCancel={() => setIsModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
