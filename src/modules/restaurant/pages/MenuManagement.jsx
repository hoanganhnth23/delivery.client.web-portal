/**
 * Menu Management - Quản lý thực đơn nhà hàng
 * Thêm, sửa, xóa món ăn, quản lý trạng thái active/inactive
 */
import React, { useState } from 'react'
import { Link } from 'react-router-dom'

const MenuManagement = () => {
  const [darkMode, setDarkMode] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  const menuItems = [
    {
      id: 1,
      name: 'Signature Beef Burger',
      price: 12.50,
      category: 'Burgers',
      type: 'Main Course',
      description: 'Juicy grilled beef patty with fresh lettuce, tomato, and special sauce on a toasted bun',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
      status: 'active',
      stock: 'available'
    },
    {
      id: 2,
      name: 'Iced Lemon Tea',
      price: 4.00,
      category: 'Beverages',
      type: 'Cold Drinks',
      description: 'Refreshing cold tea with freshly squeezed lemon juice and a hint of mint',
      image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400',
      status: 'soldout',
      stock: 'out'
    },
    {
      id: 3,
      name: 'Spicy Chicken Wings',
      price: 8.90,
      category: 'Sides',
      type: 'Appetizers',
      description: 'Crispy fried chicken wings tossed in our signature spicy sauce with sesame seeds',
      image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400',
      status: 'active',
      stock: 'available'
    },
    {
      id: 4,
      name: 'Seafood Pasta',
      price: 15.00,
      category: 'Mains',
      type: 'Italian',
      description: 'Fresh linguine with shrimp, mussels, and calamari in a rich tomato cream sauce',
      image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400',
      status: 'active',
      stock: 'available'
    },
    {
      id: 5,
      name: 'Caesar Salad',
      price: 9.50,
      category: 'Sides',
      type: 'Healthy',
      description: 'Crisp romaine lettuce, parmesan cheese, croutons, and creamy caesar dressing',
      image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
      status: 'active',
      stock: 'available'
    },
    {
      id: 6,
      name: 'Mango Sticky Rice',
      price: 6.00,
      category: 'Desserts',
      type: 'Thai',
      description: 'Sweet glutinous rice with fresh mango slices and coconut cream topping',
      image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
      status: 'inactive',
      stock: 'low'
    }
  ]

  const categories = [
    { id: 'all', name: 'All Items', count: 48 },
    { id: 'mains', name: 'Mains', count: 18 },
    { id: 'beverages', name: 'Beverages', count: 12 },
    { id: 'sides', name: 'Sides', count: 10 },
    { id: 'desserts', name: 'Desserts', count: 8 }
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
                  style={{backgroundImage: "url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200')"}}
                />
                <div className="flex flex-col">
                  <h1 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-tight">Tasty Bites</h1>
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Merchant Panel</p>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col gap-2">
                <Link to="/restaurant/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <span className="material-symbols-outlined">dashboard</span>
                  <span className="text-sm font-medium">Dashboard</span>
                </Link>
                <Link to="/restaurant/menu" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary group transition-all hover:bg-primary/20">
                  <span className="material-symbols-outlined icon-filled">restaurant_menu</span>
                  <span className="text-sm font-bold">Menu Management</span>
                </Link>
                <Link to="/restaurant/orders" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <span className="material-symbols-outlined">receipt_long</span>
                  <span className="text-sm font-medium">Orders History</span>
                </Link>
                <Link to="/restaurant/reviews" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <span className="material-symbols-outlined">star</span>
                  <span className="text-sm font-medium">Reviews</span>
                </Link>
                <Link to="/restaurant/analytics" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <span className="material-symbols-outlined">analytics</span>
                  <span className="text-sm font-medium">Analytics</span>
                </Link>
                <div className="h-px bg-border-light dark:bg-border-dark my-2 mx-4"></div>
                <Link to="/restaurant/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <span className="material-symbols-outlined">settings</span>
                  <span className="text-sm font-medium">Settings</span>
                </Link>
                <Link to="/login" className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <span className="material-symbols-outlined">logout</span>
                  <span className="text-sm font-medium">Logout</span>
                </Link>
              </nav>
            </div>

            {/* Bottom Graphic */}
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

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-screen overflow-y-auto">
          {/* Desktop Header / Top Bar */}
          <header className="hidden lg:flex items-center justify-between px-8 py-5 bg-background-light dark:bg-background-dark/50 backdrop-blur-sm sticky top-0 z-10 border-b border-border-light dark:border-border-dark">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Menu Management</h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
                <input
                  className="pl-10 pr-4 py-2.5 w-64 rounded-full bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-gray-700 dark:text-gray-200 shadow-sm transition-all"
                  placeholder="Search menu items..."
                  type="text"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark text-gray-700 dark:text-gray-200 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm">
                <span className="material-symbols-outlined text-lg">upload</span>
                Import
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-orange-600 transition-colors shadow-md shadow-orange-200 dark:shadow-none">
                <span className="material-symbols-outlined text-lg">add</span>
                Add New Item
              </button>
            </div>
          </header>

          <div className="px-4 lg:px-8 pb-8 flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
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

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {menuItems.map((item) => (
                <div key={item.id} className="group bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col">
                  {/* Image Container */}
                  <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-full w-full bg-cover bg-center transform group-hover:scale-110 transition-transform duration-300"
                      style={{backgroundImage: `url('${item.image}')`}}
                    />
                    {item.status === 'soldout' && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-white font-bold text-lg">SOLD OUT</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      <p className="text-primary font-bold text-sm">${item.price.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-1 p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-gray-900 dark:text-white text-base line-clamp-1">{item.name}</h3>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          defaultChecked={item.status === 'active'}
                        />
                        <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-1 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-medium">{item.category}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">{item.type}</span>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 flex-1">
                      {item.description}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-3 border-t border-border-light dark:border-border-dark">
                      <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary hover:text-white transition-colors text-sm font-medium">
                        <span className="material-symbols-outlined text-lg">edit</span>
                        Edit
                      </button>
                      <button className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add New Dish Card */}
              <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary shadow-sm hover:shadow-md transition-all flex items-center justify-center min-h-[400px] cursor-pointer group">
                <div className="text-center p-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <span className="material-symbols-outlined text-4xl text-primary">add_circle</span>
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">Add New Dish</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Create a new menu item</p>
                </div>
              </div>
            </div>

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
        </main>
      </div>
    </div>
  )
}

export default MenuManagement
