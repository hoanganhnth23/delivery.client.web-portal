/**
 * Admin Dashboard - Trang quản trị ShopeeFood Admin
 * Quản lý nhà hàng, menu, categories, users
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';

const AdminDashboard = () => {
  const [darkMode] = useState(false);

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
    {
      id: 3,
      name: 'Taco Bell',
      logo: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200',
      dateJoined: 'Oct 21, 2023',
      owner: 'Carlos M',
      status: 'Rejected'
    },
    {
      id: 4,
      name: 'Subway',
      logo: 'https://images.unsplash.com/photo-1579631542720-3a87824fff86?w=200',
      dateJoined: 'Oct 20, 2023',
      owner: 'Sarah L',
      status: 'Pending'
    }
  ]

  const foodCategories = [
    { id: 1, name: 'Fast Food', items: 324, icon: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100' },
    { id: 2, name: 'Healthy', items: 156, icon: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=100' },
    { id: 3, name: 'Drinks', items: 89, icon: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=100' },
    { id: 4, name: 'Desserts', items: 112, icon: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=100' }
  ]

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex min-h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark transition-colors duration-200">
        {/* Sidebar Navigation */}
        <aside className="hidden lg:flex flex-col w-72 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex-shrink-0 transition-colors duration-200">
          <div className="flex h-full flex-col justify-between p-6">
            <div className="flex flex-col gap-8">
              {/* Logo / User */}
              <div className="flex items-center gap-4 px-2">
                <div
                  className="bg-center bg-no-repeat bg-cover rounded-full size-12 shadow-sm border-2 border-primary"
                  style={{backgroundImage: "url('https://i.pravatar.cc/150?img=5')"}}
                />
                <div className="flex flex-col">
                  <h1 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-tight">ShopeeFood Admin</h1>
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Super Admin</p>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col gap-2">
                <Link to={ROUTES.ADMIN_DASHBOARD} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary group transition-all hover:bg-primary/20">
                  <span className="material-symbols-outlined icon-filled">dashboard</span>
                  <span className="text-sm font-bold">Dashboard</span>
                </Link>
                <Link to={ROUTES.ADMIN_RESTAURANTS} className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <span className="material-symbols-outlined">storefront</span>
                  <span className="text-sm font-medium">Restaurants</span>
                </Link>
                <Link to={ROUTES.ADMIN_MENUS} className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <span className="material-symbols-outlined">restaurant_menu</span>
                  <span className="text-sm font-medium">Menus</span>
                </Link>
                <Link to={ROUTES.ADMIN_CATEGORIES} className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <span className="material-symbols-outlined">category</span>
                  <span className="text-sm font-medium">Categories</span>
                </Link>
                <Link to={ROUTES.ADMIN_USERS} className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <span className="material-symbols-outlined">group</span>
                  <span className="text-sm font-medium">Users</span>
                </Link>
                <div className="h-px bg-border-light dark:bg-border-dark my-2 mx-4"></div>
                <Link to={ROUTES.ADMIN_SETTINGS} className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <span className="material-symbols-outlined">settings</span>
                  <span className="text-sm font-medium">Settings</span>
                </Link>
                <Link to={ROUTES.LOGIN} className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <span className="material-symbols-outlined">logout</span>
                  <span className="text-sm font-medium">Logout</span>
                </Link>
              </nav>
            </div>

            {/* Bottom Graphic */}
            <div className="rounded-xl bg-gradient-to-br from-primary to-orange-600 p-4 text-white relative overflow-hidden">
              <div className="absolute -right-2 -top-2 opacity-20 transform rotate-12">
                <span className="material-symbols-outlined text-6xl">analytics</span>
              </div>
              <p className="text-xs font-medium opacity-80 mb-1">System Status</p>
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
                <p className="font-bold text-sm">All Systems Operational</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-screen overflow-y-auto">
          {/* Desktop Header / Top Bar */}
          <header className="hidden lg:flex items-center justify-between px-8 py-5 bg-background-light dark:bg-background-dark/50 backdrop-blur-sm sticky top-0 z-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
                <input
                  className="pl-10 pr-4 py-2.5 w-64 rounded-full bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-gray-700 dark:text-gray-200 shadow-sm transition-all"
                  placeholder="Search restaurants, menus..."
                  type="text"
                />
              </div>
              <button className="relative p-2.5 rounded-full bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark text-gray-600 dark:text-gray-400 hover:text-primary transition-colors shadow-sm">
                <span className="material-symbols-outlined icon-filled">notifications</span>
                <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-surface-dark"></span>
              </button>
            </div>
          </header>

          <div className="px-4 lg:px-8 pb-8 flex flex-col gap-8 max-w-[1400px] mx-auto w-full">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mt-6">
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
              <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                <div className="absolute right-0 top-0 w-16 h-16 bg-primary/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600">
                    <span className="material-symbols-outlined text-2xl">pending_actions</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">Action Needed</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1 relative z-10">Pending Approvals</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white relative z-10">15</h3>
              </div>

              {/* Stat Card 3 */}
              <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600">
                    <span className="material-symbols-outlined text-2xl">restaurant</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">+3%</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Total Menu Items</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">8,500</h3>
              </div>

              {/* Stat Card 4 */}
              <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-600">
                    <span className="material-symbols-outlined text-2xl">payments</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">+8%</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Total Revenue</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">$45,230</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
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
                                {restaurant.status === 'Pending' ? (
                                  <>
                                    <button className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 dark:text-green-400 transition-colors" title="Approve">
                                      <span className="material-symbols-outlined text-xl">check</span>
                                    </button>
                                    <button className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 transition-colors" title="Reject">
                                      <span className="material-symbols-outlined text-xl">close</span>
                                    </button>
                                  </>
                                ) : (
                                  <button className="p-2 rounded-lg text-gray-400 hover:text-primary transition-colors" title="View Details">
                                    <span className="material-symbols-outlined text-xl">visibility</span>
                                  </button>
                                )}
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

            {/* Footer area */}
            <div className="border-t border-border-light dark:border-border-dark pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 dark:text-gray-400 pb-4">
              <p>© 2024 ShopeeFood Admin. All rights reserved.</p>
              <div className="flex gap-4 mt-2 md:mt-0">
                <a className="hover:text-primary" href="#">Privacy Policy</a>
                <a className="hover:text-primary" href="#">Terms of Service</a>
                <a className="hover:text-primary" href="#">Help Center</a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard
