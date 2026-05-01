/**
 * Admin Dashboard - Trang quản trị ShopeeFood Admin
 * Quản lý nhà hàng, menu, categories, users
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';
import AdminLayout from '@/components/layouts/AdminLayout';
import adminService from '@/services/api/adminService';

const AdminDashboard = () => {
  const [revenue, setRevenue] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [orderCount, setOrderCount] = useState<number>(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load revenue
      const rev = await adminService.fetchPlatformRevenue();
      setRevenue(rev || 0);

      // Load pending withdrawals
      const pending = await adminService.fetchPendingWithdrawals();
      setPendingCount(pending?.length || 0);

      // Load orders
      const orders = await adminService.fetchAllOrders();
      setOrderCount(orders?.length || 0);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const restaurantRequests = [
    {
      id: 1,
      name: 'Burger King',
      logo: 'https://images.unsplash.com/photo-1571091655789-405eb7a3a3a8?w=200',
      dateJoined: 'Oct 24, 2023',
      owner: 'John Doe',
      status: 'Pending'
    },
    {
      id: 2,
      name: 'Sushi Tei',
      logo: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=200',
      dateJoined: 'Oct 23, 2023',
      owner: 'Kenji Tanaka',
      status: 'Pending'
    },
  ];

  const foodCategories = [
    { id: 1, name: 'Fast Food', items: 324, icon: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100' },
    { id: 2, name: 'Healthy', items: 156, icon: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=100' },
  ];

  return (
    <AdminLayout>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mt-2">
        {/* Stat Card 1 */}
        <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-primary">
              <span className="material-symbols-outlined text-2xl">storefront</span>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">+12%</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Total Restaurants</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">1,240</h3>
        </div>

        {/* Stat Card 2 */}
        <Link to={ROUTES.ADMIN_WITHDRAWALS} className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden block">
          <div className="absolute right-0 top-0 w-16 h-16 bg-primary/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600">
              <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
            </div>
            {pendingCount > 0 && (
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">Cần xử lý</span>
            )}
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1 relative z-10">Yêu cầu rút tiền</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white relative z-10">{pendingCount}</h3>
        </Link>

        {/* Stat Card 3 */}
        <Link to={ROUTES.ADMIN_ORDERS} className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark shadow-sm hover:shadow-md transition-shadow group block">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600">
              <span className="material-symbols-outlined text-2xl">receipt_long</span>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">+3%</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Tổng Đơn hàng</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{orderCount}</h3>
        </Link>

        {/* Stat Card 4 */}
        <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-600">
              <span className="material-symbols-outlined text-2xl">payments</span>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">+8%</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Doanh thu nền tảng</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(revenue)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-4">
        {/* Table Section: Pending Requests */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pending Restaurant Requests</h2>
            <Link to={ROUTES.ADMIN_RESTAURANTS} className="text-sm font-semibold text-primary hover:text-orange-600 transition-colors flex items-center gap-1">
              View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-border-light dark:border-border-dark">
                    <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Restaurant</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Date Joined</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Owner</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                  {restaurantRequests.map((restaurant) => (
                    <tr key={restaurant.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700 bg-cover bg-center"
                            style={{backgroundImage: `url('${restaurant.logo}')`}}
                          />
                          <div>
                            <p className="font-semibold text-sm text-gray-900 dark:text-white">{restaurant.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">{restaurant.dateJoined}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">{restaurant.dateJoined}</td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">{restaurant.owner}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          restaurant.status === 'Pending'
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${restaurant.status === 'Pending' ? 'bg-orange-500' : 'bg-red-500'}`}></span>
                          {restaurant.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 dark:text-green-400 transition-colors" title="Approve">
                            <span className="material-symbols-outlined text-xl">check</span>
                          </button>
                          <button className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 transition-colors" title="Reject">
                            <span className="material-symbols-outlined text-xl">close</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Category Manager Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Food Categories</h2>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm shadow-orange-200 dark:shadow-none">
              <span className="material-symbols-outlined text-lg">add</span>
              Add New
            </button>
          </div>

          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm p-4 flex flex-col gap-4 h-full">
            {foodCategories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border border-transparent hover:border-border-light dark:hover:border-border-dark cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div
                    className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-700 bg-cover bg-center"
                    style={{backgroundImage: `url('${category.icon}')`}}
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{category.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{category.items} items</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">edit</span>
              </div>
            ))}

            <button className="mt-auto w-full py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-primary hover:text-primary transition-colors text-sm font-medium flex justify-center items-center gap-2">
              View All Categories
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard

