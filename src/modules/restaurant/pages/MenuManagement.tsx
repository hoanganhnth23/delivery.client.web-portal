/**
 * MenuManagement - Quản lý thực đơn nhà hàng
 * Thêm, sửa, xóa món ăn, quản lý trạng thái active/inactive
 */
import { useState, useEffect } from 'react';
import { useMenu } from '../hooks/useMenu';
import { useRestaurant } from '../hooks/useRestaurant';
import MenuItemForm from '../components/MenuItemForm';
import RestaurantSidebar from '@/components/layout/RestaurantSidebar';
import RestaurantHeader from '@/components/layout/RestaurantHeader';
import type { MenuItem } from '@/types/api.types';

const MenuManagement = () => {
  const { 
    menuItems,
    loading,
    error,
    getMyMenuItems,
    deleteMenuItem,
  } = useMenu();
  
  const { currentRestaurant } = useRestaurant();

  const [darkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load menu items khi component mount
  useEffect(() => {
    getMyMenuItems();
  }, [getMyMenuItems]);

  // Filter menu items theo search
  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [
    { id: 'all', name: 'All Items', count: menuItems.length },
    { id: 'mains', name: 'Mains', count: menuItems.filter(item => item.name.toLowerCase().includes('burger') || item.name.toLowerCase().includes('pasta')).length },
    { id: 'beverages', name: 'Beverages', count: 12 },
    { id: 'sides', name: 'Sides', count: 10 },
    { id: 'desserts', name: 'Desserts', count: 8 }
  ]

  const handleCreate = () => {
    setEditingMenuItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingMenuItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc muốn xóa món ăn này?')) {
      const result = await deleteMenuItem(id, { skipRedirect: true });
      if (result.success) {
        alert('Xóa món ăn thành công!');
        getMyMenuItems(); // Refresh list
      } else {
        alert(`Xóa thất bại: ${result.message}`);
      }
    }
  };

  const handleFormSuccess = (_data: unknown) => {
    setIsModalOpen(false);
    setEditingMenuItem(null);
    alert(editingMenuItem ? 'Cập nhật thành công!' : 'Tạo mới thành công!');
    getMyMenuItems(); // Refresh list
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex min-h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark transition-colors duration-200">
        {/* Sidebar Navigation */}
        <RestaurantSidebar 
          restaurantName={currentRestaurant?.name}
          restaurantImage={currentRestaurant?.image}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <RestaurantHeader
            title="Menu Management"
            subtitle={`${filteredMenuItems.length} món ăn`}
            showSearch={true}
            searchPlaceholder="Tìm kiếm món ăn..."
            onSearch={setSearchQuery}
            actions={
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined">add</span>
                Thêm món
              </button>
            }
          />

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 lg:px-8 py-6 flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
            {/* Filter Toolbar */}
            <div className="mt-6 bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-sm p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                  <input
                    className="pl-10 pr-4 py-2.5 w-full rounded-lg bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm text-gray-700 dark:text-gray-200"
                    placeholder="Search by name, category..."
                    type="text"
                  />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveTab(cat.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                        activeTab === cat.id
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {cat.name}
                      <span className="text-xs opacity-80">({cat.count})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mini Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="material-symbols-outlined text-primary text-2xl">restaurant</span>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">48</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Items</p>
              </div>

              <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="material-symbols-outlined text-green-600 text-2xl">check_circle</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">Active</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">42</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Active Items</p>
              </div>

              <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="material-symbols-outlined text-gray-500 text-2xl">block</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">Out</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">6</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Sold Out</p>
              </div>

              <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="material-symbols-outlined text-orange-500 text-2xl">warning</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">Low</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">2</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Low Stock</p>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-600 dark:text-red-400">error</span>
                  <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && menuItems.length === 0 && (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-gray-400 text-6xl mb-4">restaurant_menu</span>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No menu items yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">Start by adding your first menu item</p>
                <button
                  onClick={handleCreate}
                  className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors"
                >
                  Add Menu Item
                </button>
              </div>
            )}

            {/* Menu Items Grid */}
            {!loading && !error && menuItems.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                {menuItems.map((item) => (
                <div key={item.id} className="group bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col">
                  {/* Image Container */}
                  <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-full w-full bg-cover bg-center transform group-hover:scale-110 transition-transform duration-300"
                      style={{backgroundImage: `url('${item.image}')`}}
                    />
                    <div className="absolute top-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      <p className="text-primary font-bold text-sm">${item.price.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-1 p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-gray-900 dark:text-white text-base line-clamp-1">{item.name}</h3>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 flex-1">
                      {item.description}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-3 border-t border-border-light dark:border-border-dark">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary hover:text-white transition-colors text-sm font-medium">
                        <span className="material-symbols-outlined text-lg">edit</span>
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add New Dish Card */}
              <div 
                onClick={handleCreate}
                className="bg-surface-light dark:bg-surface-dark rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary shadow-sm hover:shadow-md transition-all flex items-center justify-center min-h-[400px] cursor-pointer group">
                <div className="text-center p-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <span className="material-symbols-outlined text-4xl text-primary">add_circle</span>
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">Add New Dish</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Create a new menu item</p>
                </div>
              </div>
              </div>
            )}

            {/* Footer area */}
            <div className="border-t border-border-light dark:border-border-dark pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 dark:text-gray-400 pb-4 mt-8">
              <p>© 2024 Tasty Bites. All rights reserved.</p>
              <div className="flex gap-4 mt-2 md:mt-0">
                <a className="hover:text-primary transition-colors" href="#">Support</a>
                <a className="hover:text-primary transition-colors" href="#">Documentation</a>
                <a className="hover:text-primary transition-colors" href="#">Contact</a>
              </div>
            </div>
          </div>
          </div>
        </main>

        {/* Modal for Create/Edit */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingMenuItem ? 'Chỉnh sửa món ăn' : 'Thêm món ăn mới'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <span className="material-symbols-outlined text-3xl">close</span>
                </button>
              </div>
              <div className="p-6">
                <MenuItemForm
                  menuItem={editingMenuItem as any}
                  restaurantId={currentRestaurant?.id || 0}
                  onSuccess={handleFormSuccess}
                  onCancel={() => setIsModalOpen(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MenuManagement
