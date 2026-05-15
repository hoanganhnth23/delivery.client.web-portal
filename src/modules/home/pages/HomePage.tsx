/**
 * Home Page - Trang chủ cho người dùng
 * Hiển thị danh sách nhà hàng, categories, flash sale
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { ROUTES } from '@/utils/constants';
import { flashSalePublicService, FlashSaleCampaign, FlashSaleItem } from '@/services/api/flashSaleService';

const HomePage = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const [activeCampaigns, setActiveCampaigns] = useState<FlashSaleCampaign[]>([]);
  const [flashSaleItems, setFlashSaleItems] = useState<FlashSaleItem[]>([]);
  const [loadingFS, setLoadingFS] = useState(false);

  useEffect(() => {
    const fetchFlashSale = async () => {
      setLoadingFS(true);
      try {
        const campaigns = await flashSalePublicService.getActiveCampaigns();
        setActiveCampaigns(campaigns);
        if (campaigns.length > 0) {
          const items = await flashSalePublicService.getCampaignItems(campaigns[0].id);
          setFlashSaleItems(items);
        }
      } catch (error) {
        console.error('Error fetching flash sale:', error);
      } finally {
        setLoadingFS(false);
      }
    };
    fetchFlashSale();
  }, []);

  const categories = [

  const popularRestaurants = [
    {
      id: 5,
      name: 'Green Salad Co.',
      category: 'Healthy, Salads, Vegan',
      rating: 4.7,
      deliveryTime: '20 min',
      distance: '1.5km',
      deliveryFee: 'Free Delivery',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
    },
    {
      id: 6,
      name: 'Sushi Master',
      category: 'Japanese, Sushi, Asian',
      rating: 4.8,
      deliveryTime: '45 min',
      distance: '5km',
      deliveryFee: '$3.99',
      image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400',
    },
    {
      id: 7,
      name: 'Fresh Greens',
      category: 'Salads, Healthy, Vegetarian',
      rating: 4.6,
      deliveryTime: '25 min',
      distance: '2km',
      deliveryFee: 'Free Delivery',
      image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400',
    },
    {
      id: 8,
      name: 'Tokyo Bites',
      category: 'Japanese, Bento, Asian',
      rating: 4.1,
      deliveryTime: '50 min',
      distance: '6km',
      deliveryFee: '$4.99',
      image: 'https://images.unsplash.com/photo-1617196034183-421b4917c92d?w=400',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-surface-light dark:bg-surface-dark border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 cursor-pointer">
              <div className="text-primary p-1">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  lunch_dining
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white hidden sm:block">
                Foodie
              </h1>
            </Link>

            {/* Location Selector (Desktop) */}
            <div className="hidden md:flex items-center gap-2 bg-background-light dark:bg-background-dark py-2 px-4 rounded-full max-w-xs truncate cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <span className="material-symbols-outlined text-primary text-xl">location_on</span>
              <span className="text-sm font-medium truncate dark:text-gray-200">
                Delivering to: <span className="text-gray-900 dark:text-white font-bold">New York, NY</span>
              </span>
              <span className="material-symbols-outlined text-gray-400 text-lg">expand_more</span>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <nav className="hidden lg:flex items-center gap-6">
                <Link
                  to="/"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
                >
                  Home
                </Link>
                <Link
                  to="/favorites"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
                >
                  Favorites
                </Link>
                <Link
                  to="/orders"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
                >
                  Orders
                </Link>
              </nav>
              <div className="flex items-center gap-3">
                <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                  <span className="material-symbols-outlined">shopping_cart</span>
                  <span className="absolute top-1 right-1 size-2 bg-primary rounded-full ring-2 ring-white dark:ring-surface-dark"></span>
                </button>
                {isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:block text-sm text-gray-700 dark:text-gray-300">
                      {user?.email}
                    </span>
                    <button
                      onClick={logout}
                      className="hidden sm:flex items-center justify-center h-10 px-6 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm font-bold transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <Link
                    to={ROUTES.LOGIN}
                    className="hidden sm:flex items-center justify-center h-10 px-6 rounded-full bg-primary hover:bg-primary-dark text-white text-sm font-bold transition-colors shadow-md shadow-orange-200 dark:shadow-none"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
        {/* Hero Section */}
        <section className="@container">
          <div className="flex flex-col-reverse lg:flex-row items-center gap-8 lg:gap-12 bg-surface-light dark:bg-surface-dark rounded-2xl p-6 lg:p-10 shadow-sm border border-gray-100 dark:border-gray-700">
            {/* Text Content */}
            <div className="flex flex-col gap-6 w-full lg:w-1/2 items-start text-left">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-primary text-xs font-bold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                    local_fire_department
                  </span>
                  Limited Offer
                </div>
                <h2 className="text-4xl sm:text-5xl font-black leading-[1.1] tracking-tight text-gray-900 dark:text-white">
                  Hungry? We've got <span className="text-primary">food</span> covered.
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md">
                  Order from your favorite restaurants and get free delivery on your first order.
                </p>
              </div>

              {/* Main Search Bar */}
              <div className="w-full max-w-lg relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors">
                    search
                  </span>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full h-14 pl-12 pr-32 rounded-xl border-gray-200 dark:border-gray-700 bg-background-light dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary focus:ring-primary sm:text-base shadow-sm"
                  placeholder="Search for food, drinks, etc..."
                />
                <div className="absolute inset-y-0 right-1.5 flex items-center">
                  <button className="h-11 px-6 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold text-sm transition-all">
                    Search
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex gap-8 pt-2">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">5k+</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Restaurants</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">500+</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Daily Deals</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">15min</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Fastest Delivery</p>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="w-full lg:w-1/2 relative">
              <div className="aspect-[4/3] w-full rounded-2xl bg-gray-100 dark:bg-gray-800 overflow-hidden relative shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800"
                  alt="Delicious food spread"
                  className="absolute inset-0 w-full h-full object-cover transition-transform hover:scale-105 duration-700"
                />
                <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-black/80 backdrop-blur-sm p-4 rounded-xl shadow-lg max-w-[200px]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-yellow-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                    <span className="font-bold text-sm dark:text-white">4.9 Excellent</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">"The best burger I've had in years!"</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Categories</h3>
            <a href="#" className="text-primary text-sm font-semibold hover:underline">
              View All
            </a>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className="flex flex-col items-center gap-2 min-w-[80px] group cursor-pointer"
              >
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:-translate-y-1 ${
                    selectedCategory === category.id
                      ? 'bg-primary text-white shadow-orange-200 dark:shadow-none'
                      : 'bg-surface-light dark:bg-surface-dark border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 group-hover:border-primary/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-3xl">{category.icon}</span>
                </div>
                <span
                  className={`text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'text-primary'
                      : 'text-gray-600 dark:text-gray-400 group-hover:text-primary'
                  }`}
                >
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Flash Sale Section */}
        {activeCampaigns.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-3xl animate-pulse">flash_on</span>
                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white italic tracking-tighter">FLASH SALE</h3>
              </div>
              <div className="flex items-center gap-2 bg-primary text-white px-3 py-1 rounded-md text-sm font-mono font-bold shadow-lg shadow-orange-200 dark:shadow-none">
                <CountdownTimer targetDate={activeCampaigns[0].endTime} />
              </div>
            </div>
            
            {loadingFS ? (
              <div className="flex justify-center py-12">
                <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {flashSaleItems.map((item) => (
                  <FlashSaleItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Promo Banner */}
        <section className="w-full rounded-2xl overflow-hidden bg-gradient-to-r from-orange-400 to-red-500 relative shadow-md">
          <div className="flex flex-col md:flex-row items-center justify-between p-8 md:p-12 relative z-10">
            <div className="text-white space-y-4 max-w-lg text-center md:text-left">
              <h3 className="text-3xl md:text-4xl font-black tracking-tight">Become a Pro Member</h3>
              <p className="text-orange-50 font-medium">
                Get unlimited free delivery and exclusive discounts for just $9.99/month.
              </p>
              <button className="bg-white text-red-500 px-8 py-3 rounded-full font-bold shadow-lg hover:bg-gray-50 transition-colors">
                Join Now
              </button>
            </div>
            <div className="hidden md:block absolute right-10 top-1/2 -translate-y-1/2 opacity-20 rotate-12">
              <span className="material-symbols-outlined text-[200px]">verified</span>
            </div>
          </div>
        </section>

        {/* Popular Nearby Section */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Popular Nearby</h3>
            <div className="flex gap-2">
              <button className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors">
                <span className="material-symbols-outlined text-lg">arrow_back</span>
              </button>
              <button className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors shadow-md">
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularRestaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-surface-dark border-t border-gray-100 dark:border-gray-700 pt-12 pb-6 mt-12">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  lunch_dining
                </span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">Foodie</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Order your favorites, explore new flavors, and enjoy free delivery on your first order.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <a href="#" className="hover:text-primary">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary">
                    Blog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <a href="#" className="hover:text-primary">
                    Help & Support
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary">
                    Partner with us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary">
                    Ride with us
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Install App</h4>
              <div className="flex flex-col gap-2">
                <button className="bg-black dark:bg-gray-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <span className="material-symbols-outlined">android</span>
                  <div className="text-left leading-none">
                    <div className="text-[10px]">GET IT ON</div>
                    <div className="text-xs font-bold">Google Play</div>
                  </div>
                </button>
                <button className="bg-black dark:bg-gray-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <span className="material-symbols-outlined">ad_units</span>
                  <div className="text-left leading-none">
                    <div className="text-[10px]">Download on the</div>
                    <div className="text-xs font-bold">App Store</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 dark:border-gray-800 pt-6 text-center text-sm text-gray-400">
            © 2024 Foodie Technologies Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

// Restaurant Card Component
interface RestaurantCardProps {
  restaurant: {
    id: number;
    name: string;
    image: string;
    rating: number;
    category: string;
    deliveryTime: string;
    deliveryFee: string;
    distance?: string;
    discount?: string;
  };
  showDiscount?: boolean;
}

const RestaurantCard = ({ restaurant, showDiscount = false }: RestaurantCardProps) => {
  return (
    <div className="group flex flex-col bg-surface-light dark:bg-surface-dark rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
      <div className="relative h-48 overflow-hidden">
        {showDiscount && restaurant.discount && (
          <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            {restaurant.discount}
          </div>
        )}
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <button className="absolute bottom-3 right-3 bg-white dark:bg-gray-800 p-2 rounded-full shadow-md text-gray-400 hover:text-red-500 transition-colors">
          <span className="material-symbols-outlined text-[20px] block">favorite</span>
        </button>
      </div>
      <div className="p-4 flex flex-col flex-grow gap-2">
        <div className="flex justify-between items-start">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{restaurant.name}</h4>
          <div
            className={`flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded ${
              restaurant.rating >= 4.5
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
            }`}
          >
            {restaurant.rating}{' '}
            <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              star
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{restaurant.category}</p>
        <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="material-symbols-outlined text-sm">schedule</span> {restaurant.deliveryTime} •{' '}
            {restaurant.distance}
          </div>
          <span
            className={`text-sm font-bold ${
              restaurant.deliveryFee === 'Free Delivery' ? 'text-primary' : 'text-gray-400'
            }`}
          >
            {restaurant.deliveryFee}
          </span>
        </div>
      </div>
    </div>
  );
};

// Countdown Timer Component
const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const pad = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="flex gap-1">
      <span>{pad(timeLeft.hours)}</span>:
      <span>{pad(timeLeft.minutes)}</span>:
      <span>{pad(timeLeft.seconds)}</span>
    </div>
  );
};

// Flash Sale Item Card Component
const FlashSaleItemCard = ({ item }: { item: FlashSaleItem }) => {
  const discount = Math.round((1 - item.flashSalePrice / item.originalPrice) * 100);
  const isSoldOut = item.soldQuantity >= item.stockQuantity;
  const progress = (item.soldQuantity / item.stockQuantity) * 100;

  return (
    <div className="group flex flex-col bg-surface-light dark:bg-surface-dark rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
      <div className="relative h-48 overflow-hidden">
        <div className="absolute top-3 left-3 z-10 bg-red-600 text-white text-xs font-black px-2 py-1 rounded-md shadow-lg flex items-center gap-1">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
          {discount}% OFF
        </div>
        
        <img
          src={`https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80`}
          alt={item.menuItemName}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${isSoldOut ? 'grayscale opacity-60' : ''}`}
        />
        
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="bg-black/70 text-white px-4 py-2 rounded-full font-black text-sm uppercase tracking-widest border-2 border-white/20 backdrop-blur-sm">
              SOLD OUT
            </div>
          </div>
        )}

        <button className="absolute bottom-3 right-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-2 rounded-full shadow-md text-gray-400 hover:text-red-500 transition-colors">
          <span className="material-symbols-outlined text-[20px] block">favorite</span>
        </button>
      </div>

      <div className="p-4 flex flex-col flex-grow gap-2">
        <h4 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-primary transition-colors">
          {item.menuItemName}
        </h4>
        
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-black text-red-600">
            ${item.flashSalePrice.toLocaleString()}
          </span>
          <span className="text-sm text-gray-400 line-through">
            ${item.originalPrice.toLocaleString()}
          </span>
        </div>

        <div className="mt-2 space-y-1.5">
          <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider">
            <span className={isSoldOut ? 'text-gray-400' : 'text-orange-600'}>
              {isSoldOut ? 'Fully Sold' : `Selling Fast: ${item.soldQuantity} sold`}
            </span>
            <span className="text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out ${isSoldOut ? 'bg-gray-400' : 'bg-gradient-to-r from-orange-400 to-red-600'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <button 
          disabled={isSoldOut}
          className={`mt-4 w-full py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
            isSoldOut 
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed' 
              : 'bg-primary hover:bg-primary-dark text-white shadow-orange-100 dark:shadow-none hover:shadow-lg'
          }`}
        >
          {isSoldOut ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default HomePage;
