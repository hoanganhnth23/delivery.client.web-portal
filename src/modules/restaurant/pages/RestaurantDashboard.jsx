/**
 * Restaurant Dashboard - Trang Dashboard của nhà hàng/merchant
 * Hiển thị đơn hàng, doanh thu, thống kê
 */
import React, { useState } from 'react'
import { Link } from 'react-router-dom'

const RestaurantDashboard = () => {
  const [activeTab, setActiveTab] = useState('pending')

  const orders = [
    {
      id: 'ORD-2024',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
      type: 'DELIVERY',
      badge: 'NEW',
      time: '2 mins ago',
      price: '$24.50',
      items: [
        { qty: 1, name: 'Grilled Chicken Rice Set' },
        { qty: 1, name: 'Iced Lemon Tea (Less Sugar)' },
        { qty: 1, name: 'Vegetable Spring Rolls (3pcs)' }
      ],
      customer: 'John Doe',
      paymentMethod: 'Credit Card',
      customerAvatar: 'https://i.pravatar.cc/150?img=12'
    },
    {
      id: 'ORD-2023',
      image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
      type: 'PICKUP',
      badge: 'NEW',
      time: '5 mins ago',
      price: '$18.00',
      items: [
        { qty: 2, name: 'Beef Noodle Soup (Spicy)' },
        { qty: 1, name: 'Fried Dumplings (6pcs)' }
      ],
      customer: 'Sarah Smith',
      paymentMethod: 'Cash on Pickup',
      customerAvatar: 'https://i.pravatar.cc/150?img=25'
    },
    {
      id: 'ORD-2022',
      image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400',
      type: 'DELIVERY',
      badge: 'NEW',
      time: '12 mins ago',
      price: '$45.20',
      items: [
        { qty: 3, name: 'Dim Sum Platter (Large)' },
        { qty: 2, name: 'Mango Sticky Rice' }
      ],
      customer: 'Michael Brown',
      paymentMethod: 'Credit Card',
      customerAvatar: 'https://i.pravatar.cc/150?img=33',
      moreItems: 2
    },
    {
      id: 'ORD-2021',
      image: 'https://images.unsplash.com/photo-1606787620819-8bdf0c44c293?w=400',
      type: 'DELIVERY',
      badge: 'DELAYED',
      time: 'Action Required: 20m ago',
      price: '$15.50',
      items: [
        { qty: 1, name: 'Crispy Pork Belly Rice' },
        { qty: 1, name: 'Coke Zero' }
      ],
      customer: 'David Wilson',
      paymentMethod: 'Credit Card',
      customerAvatar: 'https://i.pravatar.cc/150?img=68',
      isDelayed: true
    }
  ]

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col justify-between border-r border-gray-200 dark:border-gray-800 bg-card-light dark:bg-card-dark h-full flex-shrink-0 transition-colors duration-200">
        <div className="flex flex-col gap-6 p-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
              <span className="material-symbols-outlined">restaurant_menu</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold leading-none tracking-tight dark:text-white">Tasty Bites</h1>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-medium mt-1">Merchant Panel</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-2">
            <Link to="/restaurant/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
              <span className="material-symbols-outlined fill-1">dashboard</span>
              <span className="text-sm font-bold">Dashboard</span>
            </Link>
            <Link to="/restaurant/orders" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400 transition-colors">
              <span className="material-symbols-outlined">shopping_bag</span>
              <span className="text-sm font-semibold">Orders</span>
            </Link>
            <Link to="/restaurant/menu" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400 transition-colors">
              <span className="material-symbols-outlined">menu_book</span>
              <span className="text-sm font-semibold">Menu Mgmt</span>
            </Link>
            <Link to="/restaurant/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400 transition-colors">
              <span className="material-symbols-outlined">storefront</span>
              <span className="text-sm font-semibold">Profile</span>
            </Link>
            <Link to="/restaurant/analytics" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400 transition-colors">
              <span className="material-symbols-outlined">bar_chart</span>
              <span className="text-sm font-semibold">Analytics</span>
            </Link>
            <Link to="/restaurant/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400 transition-colors">
              <span className="material-symbols-outlined">settings</span>
              <span className="text-sm font-semibold">Settings</span>
            </Link>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800">
          <button className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl h-10 px-4 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 text-sm font-bold transition-colors">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-card-light/90 dark:bg-card-dark/90 px-8 backdrop-blur-md transition-colors duration-200">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">Dashboard</h2>
          </div>

          <div className="flex items-center gap-6">
            {/* Search */}
            <div className="hidden md:flex h-10 w-64 items-center rounded-full bg-gray-100 dark:bg-white/5 px-4 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
              <span className="material-symbols-outlined text-gray-400">search</span>
              <input
                className="flex-1 border-none bg-transparent px-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-0 placeholder:text-gray-400"
                placeholder="Search orders..."
                type="text"
              />
            </div>

            {/* Status Toggle */}
            <div className="flex items-center gap-3 rounded-full bg-green-100 dark:bg-green-900/30 px-4 py-1.5 border border-green-200 dark:border-green-800">
              <div className="size-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-bold text-green-700 dark:text-green-400">Open for Business</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button className="relative flex size-10 items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">notifications</span>
                <span className="absolute top-2 right-2 size-2.5 rounded-full bg-red-500 border-2 border-white dark:border-card-dark"></span>
              </button>
              <div
                className="h-10 w-10 overflow-hidden rounded-full border-2 border-gray-100 dark:border-gray-700 bg-gray-200 bg-cover bg-center"
                style={{backgroundImage: "url('https://i.pravatar.cc/150?img=8')"}}
              />
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Pending Orders */}
            <div className="group relative overflow-hidden rounded-2xl bg-card-light dark:bg-card-dark p-6 shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md">
              <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 translate-y--8 rounded-full bg-primary/10 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10 flex flex-col gap-1">
                <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Pending Orders</p>
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-extrabold text-primary">12</span>
                  <span className="mb-1 flex items-center text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">+4 new</span>
                </div>
              </div>
            </div>

            {/* Revenue */}
            <div className="group relative overflow-hidden rounded-2xl bg-card-light dark:bg-card-dark p-6 shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md">
              <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 translate-y--8 rounded-full bg-green-500/10 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10 flex flex-col gap-1">
                <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Today's Revenue</p>
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-extrabold text-text-primary-light dark:text-text-primary-dark">$450.00</span>
                  <span className="mb-1 text-xs font-bold text-green-600 flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[14px]">trending_up</span> 5%
                  </span>
                </div>
              </div>
            </div>

            {/* Total Orders */}
            <div className="group relative overflow-hidden rounded-2xl bg-card-light dark:bg-card-dark p-6 shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md">
              <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 translate-y--8 rounded-full bg-blue-500/10 transition-transform group-hover:scale-110"></div>
              <div className="relative z-10 flex flex-col gap-1">
                <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Total Orders</p>
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-extrabold text-text-primary-light dark:text-text-primary-dark">45</span>
                  <span className="mb-1 text-xs font-bold text-blue-600 flex items-center">Today</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex flex-col gap-6">
            {/* Tabs */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-1">
              <div className="flex gap-8">
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`relative pb-3 text-sm font-bold transition-colors ${
                    activeTab === 'pending' ? 'text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  Incoming / Pending (12)
                  {activeTab === 'pending' && (
                    <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary rounded-t-full"></span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('preparing')}
                  className={`relative pb-3 text-sm font-medium transition-colors ${
                    activeTab === 'preparing' ? 'text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  Preparing
                  {activeTab === 'preparing' && (
                    <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary rounded-t-full"></span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('ready')}
                  className={`relative pb-3 text-sm font-medium transition-colors ${
                    activeTab === 'ready' ? 'text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  Ready for Pickup
                  {activeTab === 'ready' && (
                    <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary rounded-t-full"></span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`relative pb-3 text-sm font-medium transition-colors ${
                    activeTab === 'history' ? 'text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  History
                  {activeTab === 'history' && (
                    <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary rounded-t-full"></span>
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2 pb-2">
                <button className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[16px]">filter_list</span> Filter
                </button>
              </div>
            </div>

            {/* Order List */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {orders.map((order) => (
                <article key={order.id} className="flex flex-col sm:flex-row gap-4 rounded-2xl bg-card-light dark:bg-card-dark p-4 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
                  {/* Image */}
                  <div className="h-40 w-full sm:w-32 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-white/5 relative">
                    <div
                      className="w-full h-full bg-cover bg-center"
                      style={{backgroundImage: `url('${order.image}')`}}
                    />
                    <div className={`absolute top-2 left-2 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                      order.type === 'DELIVERY' 
                        ? 'bg-white/90 dark:bg-black/80 text-gray-800 dark:text-gray-200'
                        : 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'
                    }`}>
                      {order.type}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark">#{order.id}</h3>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              order.badge === 'DELAYED'
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                            }`}>
                              {order.badge}
                            </span>
                          </div>
                          <p className={`text-xs font-medium flex items-center gap-1 mt-0.5 ${
                            order.isDelayed 
                              ? 'text-red-500 font-bold animate-pulse' 
                              : 'text-text-secondary-light dark:text-text-secondary-dark'
                          }`}>
                            <span className="material-symbols-outlined text-[14px]">{order.isDelayed ? 'warning' : 'schedule'}</span> 
                            {order.time}
                          </p>
                        </div>
                        <p className="font-bold text-lg text-primary">{order.price}</p>
                      </div>

                      <div className="space-y-1 mb-4">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-bold text-gray-900 dark:text-white">{item.qty}x</span>
                            <span>{item.name}</span>
                          </div>
                        ))}
                        {order.moreItems && (
                          <p className="text-xs text-gray-500 italic">+ {order.moreItems} more items</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <div
                          className="size-6 rounded-full bg-gray-200 dark:bg-gray-700 bg-cover bg-center"
                          style={{backgroundImage: `url('${order.customerAvatar}')`}}
                        />
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{order.customer}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{order.paymentMethod}</span>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-auto">
                      <button className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-white shadow-sm hover:bg-primary/90 hover:shadow transition-all flex justify-center items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        Accept
                      </button>
                      <button className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-transparent px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        Reject
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default RestaurantDashboard
