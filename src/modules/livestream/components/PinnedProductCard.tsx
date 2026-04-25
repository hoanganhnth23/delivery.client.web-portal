import React from 'react';
import { LiveProductPin } from '../services/livestreamRealtimeService';

interface PinnedProductCardProps {
  product: LiveProductPin | null;
  onAction?: () => void;
  isHost?: boolean;
}

const PinnedProductCard: React.FC<PinnedProductCardProps> = ({ product, onAction, isHost }) => {
  if (!product || !product.isPinned) return null;

  return (
    <div
      className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-lg border border-gray-100 animate-bounce-in max-w-xs w-full"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Product image */}
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-orange-50 shrink-0">
        <img
          src={product.image || 'https://via.placeholder.com/80'}
          alt={product.productName}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {!isHost && (
            <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">Live Now</span>
          )}
          {isHost && (
            <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">Đang ghim</span>
          )}
        </div>
        <p className="text-sm font-bold text-gray-800 truncate leading-snug">{product.productName}</p>
        <p className="text-xs text-gray-400 mb-1.5">
          {isHost ? 'Hiển thị cho người xem' : 'Limited portions available...'}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-[#f49d25]">{product.price.toLocaleString()}đ</span>
          {!isHost && (
            <button
              onClick={onAction}
              className="px-3 py-1 bg-[#f49d25] text-white text-xs font-bold rounded-full hover:bg-orange-500 transition-all active:scale-90"
            >
              Order Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PinnedProductCard;
