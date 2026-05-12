import React, { useState, useEffect, useCallback } from 'react';
import { getMenuItemsByRestaurant } from '@/modules/restaurant/services/menuService';
import { livestreamApi, LivestreamProductResponse } from '../services/livestreamApi';
import { livestreamRealtimeService, LiveProductPin } from '../services/livestreamRealtimeService';
import type { MenuItem } from '@/types/api.types';

interface LiveProductListProps {
  restaurantId: number;
  livestreamId: string;
  restaurantName?: string;
  isLive?: boolean; // true = đang LIVE, false = đang chuẩn bị (CREATED)
}

const LiveProductList: React.FC<LiveProductListProps> = ({
  restaurantId,
  livestreamId,
  restaurantName = '',
  isLive = false,
}) => {
  const [menuProducts, setMenuProducts] = useState<MenuItem[]>([]);
  const [addedProducts, setAddedProducts] = useState<LivestreamProductResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<'added' | 'menu'>('added');

  // Fetch menu items from restaurant
  useEffect(() => {
    const fetchMenuProducts = async () => {
      if (!restaurantId) return;
      setLoading(true);
      try {
        const response = await getMenuItemsByRestaurant(restaurantId);
        setMenuProducts(response.data);
      } catch (err) {
        console.error('Failed to fetch menu products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenuProducts();
  }, [restaurantId]);

  // Fetch already-added products from livestream
  const fetchAddedProducts = useCallback(async () => {
    if (!livestreamId) return;
    try {
      const products = await livestreamApi.getProducts(livestreamId);
      setAddedProducts(products);
    } catch (err) {
      console.error('Failed to fetch livestream products:', err);
    }
  }, [livestreamId]);

  useEffect(() => {
    fetchAddedProducts();
  }, [fetchAddedProducts]);

  const addedProductIds = new Set(addedProducts.map(p => p.productId));

  const filteredMenuProducts = menuProducts.filter(
    p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) && !addedProductIds.has(p.id)
  );

  const handleAddProduct = async (product: MenuItem) => {
    if (!livestreamId) return;
    setActionLoading(product.id);
    try {
      await livestreamApi.pinProduct(livestreamId, {
        productId: product.id,
        priceAtLive: product.price,
        productName: product.name,
        productImage: product.image,
        restaurantId,
        restaurantName,
      });

      // Also sync to Firebase for real-time viewer notification (only if LIVE)
      if (isLive) {
        const pinData: LiveProductPin = {
          productId: product.id,
          productName: product.name,
          price: product.price,
          image: product.image,
          isPinned: true,
          updatedAt: new Date(),
        };
        await livestreamRealtimeService.pinProduct(livestreamId, pinData);
      }

      await fetchAddedProducts();
      console.log('✅ Product added:', product.name);
    } catch (err) {
      console.error('Failed to add product:', err);
      alert('❌ Thêm sản phẩm thất bại: ' + (err as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveProduct = async (product: LivestreamProductResponse) => {
    if (!livestreamId) return;
    setActionLoading(product.productId);
    try {
      await livestreamApi.removeProduct(livestreamId, product.productId);
      
      // Sync to Firebase if it was pinned
      if (isLive && product.isPinned) {
         const pinData: LiveProductPin = {
          productId: product.productId,
          productName: product.productName,
          price: product.priceAtLive,
          image: product.productImage,
          isPinned: false,
          updatedAt: new Date(),
        };
        await livestreamRealtimeService.pinProduct(livestreamId, pinData);
      }

      await fetchAddedProducts();
      console.log('✅ Product removed:', product.productName);
    } catch (err) {
      console.error('Failed to remove product:', err);
      alert('❌ Xóa sản phẩm thất bại: ' + (err as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTogglePin = async (product: LivestreamProductResponse) => {
    if (!livestreamId || !isLive) return;
    setActionLoading(product.productId);
    try {
      if (product.isPinned) {
        await livestreamApi.unpinProduct(livestreamId, product.productId);
        
        // Sync unpin to Firebase
        const pinData: LiveProductPin = {
          productId: product.productId,
          productName: product.productName,
          price: product.priceAtLive,
          image: product.productImage,
          isPinned: false,
          updatedAt: new Date(),
        };
        await livestreamRealtimeService.pinProduct(livestreamId, pinData);
      } else {
        await livestreamApi.pinProduct(livestreamId, {
          productId: product.productId,
          priceAtLive: product.priceAtLive,
          productName: product.productName,
          productImage: product.productImage,
          restaurantId: product.restaurantId,
          restaurantName: product.restaurantName,
        });

        // Sync pin to Firebase for viewer
        const pinData: LiveProductPin = {
          productId: product.productId,
          productName: product.productName,
          price: product.priceAtLive,
          image: product.productImage,
          isPinned: true,
          updatedAt: new Date(),
        };
        await livestreamRealtimeService.pinProduct(livestreamId, pinData);
      }
      await fetchAddedProducts();
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
        <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-orange-500">inventory_2</span>
          Sản phẩm Livestream
        </h3>
        <span className="text-xs text-gray-400 font-medium">
          {addedProducts.length} sản phẩm
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 shrink-0">
        <button
          onClick={() => setActiveView('added')}
          className={`flex-1 py-2.5 text-xs font-bold tracking-wide transition-all border-b-2 ${
            activeView === 'added'
              ? 'border-orange-400 text-orange-500'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Đã thêm ({addedProducts.length})
        </button>
        <button
          onClick={() => setActiveView('menu')}
          className={`flex-1 py-2.5 text-xs font-bold tracking-wide transition-all border-b-2 ${
            activeView === 'menu'
              ? 'border-orange-400 text-orange-500'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Thực đơn
        </button>
      </div>

      {/* Search (only visible on menu tab) */}
      {activeView === 'menu' && (
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
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {activeView === 'added' ? (
          // === ADDED PRODUCTS VIEW ===
          addedProducts.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-orange-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-orange-400 text-2xl">add_shopping_cart</span>
              </div>
              <p className="text-gray-500 text-sm font-medium mb-1">Chưa có sản phẩm nào</p>
              <p className="text-gray-400 text-xs">
                Chuyển sang tab "Thực đơn" để thêm sản phẩm vào livestream
              </p>
            </div>
          ) : (
            addedProducts.map((product) => (
              <div
                key={product.id}
                className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                  product.isPinned
                    ? 'border-orange-300 bg-orange-50/50 shadow-sm'
                    : 'border-gray-100 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <img
                  src={product.productImage || 'https://via.placeholder.com/100'}
                  alt={product.productName}
                  className="w-12 h-12 rounded-lg object-cover shadow-sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-gray-800 dark:text-white truncate">{product.productName}</h4>
                    {product.isPinned && (
                      <span className="text-[9px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full shrink-0">
                        📌 Đang ghim
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-orange-500 font-semibold">{product.priceAtLive.toLocaleString()}đ</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Pin/Unpin button (only during LIVE) */}
                  {isLive && (
                    <button
                      onClick={() => handleTogglePin(product)}
                      disabled={actionLoading === product.productId}
                      className={`p-1.5 rounded-lg transition-all disabled:opacity-50 ${
                        product.isPinned
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : 'bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-500'
                      }`}
                      title={product.isPinned ? 'Bỏ ghim' : 'Ghim sản phẩm'}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" />
                      </svg>
                    </button>
                  )}
                  {/* Remove button */}
                  <button
                    onClick={() => handleRemoveProduct(product)}
                    disabled={actionLoading === product.productId}
                    className="p-1.5 rounded-lg bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all disabled:opacity-50"
                    title="Xóa khỏi livestream"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )
        ) : (
          // === MENU PRODUCTS VIEW ===
          loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : filteredMenuProducts.length === 0 ? (
            <div className="text-center text-gray-400 py-10 text-xs italic">
              {searchTerm
                ? 'Không tìm thấy sản phẩm nào.'
                : 'Tất cả sản phẩm đã được thêm vào livestream.'}
            </div>
          ) : (
            filteredMenuProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-orange-200 hover:bg-orange-50/30 transition-all"
              >
                <img
                  src={product.image || 'https://via.placeholder.com/100'}
                  alt={product.name}
                  className="w-12 h-12 rounded-lg object-cover shadow-sm"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-gray-800 dark:text-white truncate">{product.name}</h4>
                  <p className="text-xs text-orange-500 font-semibold">{product.price.toLocaleString()}đ</p>
                </div>
                <button
                  onClick={() => handleAddProduct(product)}
                  disabled={actionLoading === product.id}
                  className="px-3 py-1.5 text-[10px] font-bold rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center gap-1"
                >
                  {actionLoading === product.id ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Thêm
                    </>
                  )}
                </button>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};

export default LiveProductList;
