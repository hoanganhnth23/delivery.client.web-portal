import React, { useState, useEffect } from 'react';
import { getMenuItemsByRestaurant } from '@/modules/restaurant/services/menuService';
import { livestreamRealtimeService, LiveProductPin } from '../services/livestreamRealtimeService';
import apiClient, { handleResponse } from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/services/api/endpoints';
import type { MenuItem } from '@/types/api.types';

interface LiveProductListProps {
  restaurantId: number;
  livestreamId: string;
}

const LiveProductList: React.FC<LiveProductListProps> = ({ restaurantId, livestreamId }) => {
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pinnedId, setPinnedId] = useState<number | null>(null);
  const [pinLoading, setPinLoading] = useState<number | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!restaurantId) return;
      setLoading(true);
      try {
        const response = await getMenuItemsByRestaurant(restaurantId);
        setProducts(response.data);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [restaurantId]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePin = async (product: MenuItem) => {
    if (!livestreamId) {
      alert('Livestream chưa sẵn sàng');
      return;
    }

    setPinLoading(product.id);
    try {
      // 1. Call backend API to persist the pin
      await apiClient.post(API_ENDPOINTS.LIVESTREAM.PIN_PRODUCT(livestreamId), {
        productId: product.id,
        priceAtLive: product.price,
        productName: product.name,
        productImage: product.image,
        restaurantId: restaurantId,
        restaurantName: '', // Will be set by context if available
      });

      // 2. Update Firebase Firestore for real-time viewer notification
      const pinData: LiveProductPin = {
        productId: product.id,
        productName: product.name,
        price: product.price,
        image: product.image,
        isPinned: true,
        updatedAt: new Date(),
      };
      await livestreamRealtimeService.pinProduct(livestreamId, pinData);

      setPinnedId(product.id);
      console.log('✅ Product pinned via API + Firebase:', product.name);
    } catch (err) {
      console.error('Failed to pin product:', err);
      alert('❌ Ghim sản phẩm thất bại: ' + (err as Error).message);
    } finally {
      setPinLoading(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
        <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-orange-500">inventory_2</span>
          Thực đơn của bạn
        </h3>
      </div>

      <div className="p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-sm">search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm sản phẩm..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center text-gray-400 py-10 text-xs italic">
            Không tìm thấy sản phẩm nào.
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div 
              key={product.id} 
              className={`flex items-center gap-3 p-2 rounded-lg border transition-all ${
                pinnedId === product.id 
                  ? 'border-primary bg-primary/5 shadow-sm' 
                  : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <img 
                src={product.image || 'https://via.placeholder.com/100'} 
                alt={product.name}
                className="w-12 h-12 rounded object-cover shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-gray-800 dark:text-white truncate">{product.name}</h4>
                <p className="text-xs text-primary font-semibold">{product.price.toLocaleString()}đ</p>
              </div>
              <button
                onClick={() => handlePin(product)}
                disabled={pinLoading === product.id}
                className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all disabled:opacity-50 ${
                  pinnedId === product.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {pinLoading === product.id ? '...' : pinnedId === product.id ? 'Đang ghim' : 'Ghim'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LiveProductList;
