import { useEffect, useRef, useState } from 'react';
import { LIVE_STREAMS_DATA } from './liveStreamsData';
import { catalog, type Item, type Restaurant } from './model';
import './customerLiveStream.css';
import { formatVnd } from '@/utils/money';


interface LiveComment {
  id: string;
  name: string;
  text: string;
  isMe?: boolean;
}

const RANDOM_COMMENTS: string[] = [
  'Món này ngon lắm mọi người ơi, mình vừa đặt tuần trước!',
  'Shop ơi có freeship qua Mộ Lao Hà Đông không ạ?',
  'Vừa bấm chốt 2 phần sườn nướng rồi nha chủ quán!',
  'Trà sữa ô long giảm 50% rẻ quá, áp thêm voucher được nữa không?',
  'Món gà nướng có cay nhiều không shop?',
  'Ship về Cầu Giấy tầm mấy phút nhận được vậy ạ?',
  'Cho mình xin mã giảm giá với shop ơi!',
];

const RANDOM_USERS: string[] = [
  'Thuỳ Trang',
  'Hoàng Nam',
  'Minh Quân',
  'Ngọc Ánh',
  'Hữu Thắng',
  'Thanh Hằng',
  'Tuấn Kiệt',
];

interface FloatingHeart {
  id: number;
  x: number;
  color: string;
}

const HEART_COLORS = ['#ee4d2d', '#ff5722', '#e91e63', '#9c27b0', '#ff9800', '#ffeb3b'];

const createFloatingHeart = (customX?: number): FloatingHeart => ({
  id: Date.now() + Math.random(),
  x: customX ?? Math.floor(Math.random() * 60) + 20,
  color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
});

interface CustomerLiveStreamViewerProps {
  streamId?: string;
  onClose: () => void;
  onAddToCart: (item: Item, restaurant: Restaurant) => void;
  cartCount: number;
  onOpenCart: () => void;
}

export default function CustomerLiveStreamViewer({
  streamId,
  onClose,
  onAddToCart,
  cartCount,
  onOpenCart,
}: CustomerLiveStreamViewerProps) {
  const selectedStream =
    LIVE_STREAMS_DATA.find((s) => s.id === streamId) ?? LIVE_STREAMS_DATA[0];

  const matchedRestaurant: Restaurant =
    catalog.find((r) => r.id === selectedStream.restaurantId) ?? catalog[0];

  const [isFollowing, setIsFollowing] = useState(false);
  const [heartsCount, setHeartsCount] = useState(selectedStream.hearts);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [comments, setComments] = useState<LiveComment[]>([
    { id: '1', name: 'ShopeeFood Live', text: 'Chào mừng bạn đến với phiên Live! Chạm đúp vào màn hình để thả tim ủng hộ quán nhé ❤️' },
    { id: '2', name: 'Quỳnh Nga', text: 'Chào chủ quán, cơm sườn hôm nay có kèm canh không ạ?' },
  ]);
  const [inputText, setInputText] = useState('');
  const [showBag, setShowBag] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll comments
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  // Periodic random viewer comments
  useEffect(() => {
    const interval = window.setInterval(() => {
      const randomText = RANDOM_COMMENTS[Math.floor(Math.random() * RANDOM_COMMENTS.length)];
      const randomName = RANDOM_USERS[Math.floor(Math.random() * RANDOM_USERS.length)];
      setComments((prev) => [
        ...prev.slice(-20),
        {
          id: String(Date.now() + Math.random()),
          name: randomName,
          text: randomText,
        },
      ]);
    }, 3800);
    return () => window.clearInterval(interval);
  }, []);

  // Periodic heart increments
  useEffect(() => {
    const interval = window.setInterval(() => {
      setHeartsCount((prev) => prev + Math.floor(Math.random() * 5) + 1);
    }, 2000);
    return () => window.clearInterval(interval);
  }, []);

  // Spawn floating heart
  const triggerHeart = (customX?: number) => {
    setHeartsCount((prev) => prev + 1);
    const newHeart = createFloatingHeart(customX);
    setFloatingHearts((prev) => [...prev.slice(-15), newHeart]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1800);
  };

  // Handle double tap anywhere on video stream
  const handleDoubleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = Math.min(Math.max(((e.clientX - rect.left) / rect.width) * 100, 10), 85);
    triggerHeart(xPercent);
  };

  // Submit my comment
  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setComments((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: 'Bạn',
        text: inputText.trim(),
        isMe: true,
      },
    ]);
    setInputText('');
    triggerHeart();
  };

  // Add pinned dish to cart
  const handleAddPinnedDish = (dish: Item) => {
    // Create live discounted item
    const discountedItem: Item = {
      ...dish,
      price: selectedStream.discountPrice,
    };
    onAddToCart(discountedItem, matchedRestaurant);
    setToastMessage(`Đã thêm "${dish.name}" vào giỏ hàng!`);
    setTimeout(() => setToastMessage(null), 2500);
    triggerHeart(40);
  };

  return (
    <div className="sf-live-viewer-root">
      {/* Background Simulated Video Stream Viewport */}
      <div
        className="sf-live-video-viewport"
        onDoubleClick={handleDoubleTap}
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.85) 100%), url(${selectedStream.thumbnail})`,
        }}
      >
        {/* Floating animated hearts container */}
        <div className="sf-live-floating-hearts" aria-hidden="true">
          {floatingHearts.map((heart) => (
            <span
              key={heart.id}
              className="sf-live-heart-bubble"
              style={{
                left: `${heart.x}%`,
                color: heart.color,
              }}
            >
              ♥
            </span>
          ))}
        </div>

        {/* Top Header Bar */}
        <header className="sf-live-top-bar">
          <div className="sf-live-host-badge">
            <img
              src={selectedStream.restaurantImage}
              alt={selectedStream.restaurantName}
              className="sf-live-host-avatar"
            />
            <div className="sf-live-host-meta">
              <strong className="truncate">{selectedStream.restaurantName}</strong>
              <small className="sf-live-viewer-count">
                <span className="sf-live-pulse-dot" />
                {selectedStream.viewers.toLocaleString()} người xem
              </small>
            </div>
            <button
              type="button"
              onClick={() => setIsFollowing(!isFollowing)}
              className={`sf-live-follow-btn ${isFollowing ? 'following' : ''}`}
            >
              {isFollowing ? 'Đã theo dõi' : '+ Theo dõi'}
            </button>
          </div>

          <div className="sf-live-top-actions">
            <button
              type="button"
              className="sf-live-cart-badge-btn"
              onClick={onOpenCart}
              aria-label="Xem giỏ hàng"
            >
              <span className="material-symbols-outlined">shopping_bag</span>
              {cartCount > 0 && <span className="sf-live-cart-count">{cartCount}</span>}
            </button>
            <button
              type="button"
              className="sf-live-close-btn"
              onClick={onClose}
              aria-label="Đóng livestream"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </header>

        {/* Studio Live Banner Overlay */}
        <div className="sf-live-banner-tag">
          <span className="sf-live-shopee-icon">ShopeeFood Live</span>
          <span className="sf-live-deal-text">{selectedStream.dealTag}</span>
        </div>

        {/* Middle Live Content Info */}
        <div className="sf-live-title-box">
          <h2>{selectedStream.title}</h2>
        </div>

        {/* Bottom Overlay Section */}
        <div className="sf-live-bottom-container">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="sf-live-toast" role="status">
              <span className="material-symbols-outlined">check_circle</span>
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Pinned Flash Sale Product Card */}
          <div className="sf-live-pinned-card">
            <div className="sf-live-pinned-tag">
              <span className="material-symbols-outlined">local_fire_department</span>
              <span>DEAL ĐANG LIVE</span>
            </div>
            <div className="sf-live-pinned-content">
              <img
                src={selectedStream.dish.image}
                alt={selectedStream.dish.name}
                className="sf-live-pinned-img"
              />
              <div className="sf-live-pinned-info">
                <h3 className="truncate">{selectedStream.dish.name}</h3>
                <div className="sf-live-pinned-pricing">
                  <strong className="sf-live-price">
                    {formatVnd(selectedStream.discountPrice)}
                  </strong>
                  <span className="sf-live-original-price">
                    {formatVnd(selectedStream.dish.price)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="sf-live-buy-btn"
                onClick={() => handleAddPinnedDish(selectedStream.dish)}
              >
                + Giỏ hàng
              </button>
            </div>
          </div>

          {/* Live Chat Comments Feed */}
          <div className="sf-live-chat-box">
            <div className="sf-live-chat-scroll">
              {comments.map((msg) => (
                <div
                  key={msg.id}
                  className={`sf-live-chat-item ${msg.isMe ? 'is-me' : ''}`}
                >
                  <span className="sf-live-chat-user">{msg.name}:</span>
                  <span className="sf-live-chat-text">{msg.text}</span>
                </div>
              ))}
              <div ref={commentsEndRef} />
            </div>
          </div>

          {/* Chat Bar & Action Controls */}
          <div className="sf-live-action-bar">
            {/* Shopping Bag Button */}
            <button
              type="button"
              className="sf-live-bag-btn"
              onClick={() => setShowBag(true)}
              aria-label="Danh sách món trên live"
            >
              <span className="material-symbols-outlined">storefront</span>
            </button>

            {/* Comment Form */}
            <form onSubmit={handleSendComment} className="sf-live-input-form">
              <input
                type="text"
                placeholder="Nhập bình luận của bạn..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="sf-live-comment-input"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="sf-live-send-btn"
                aria-label="Gửi bình luận"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </form>

            {/* Like Heart Button */}
            <button
              type="button"
              className="sf-live-heart-btn"
              onClick={() => triggerHeart()}
              aria-label="Thả tim"
            >
              <span className="material-symbols-outlined">favorite</span>
              <span className="sf-live-hearts-label">
                {(heartsCount / 1000).toFixed(1)}k
              </span>
            </button>
          </div>
        </div>

        {/* Live Shopping Bag Drawer Modal */}
        {showBag && (
          <div className="sf-live-bag-backdrop" onClick={() => setShowBag(false)}>
            <div
              className="sf-live-bag-sheet"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sf-live-bag-header">
                <h3>Món ăn trợ giá trên Live ({matchedRestaurant.items.length})</h3>
                <button
                  type="button"
                  onClick={() => setShowBag(false)}
                  aria-label="Đóng"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="sf-live-bag-list">
                {matchedRestaurant.items.map((item, idx) => {
                  const dealPrice = Math.round(item.price * 0.75);
                  return (
                    <div key={item.id} className="sf-live-bag-item">
                      <span className="sf-live-bag-rank">0{idx + 1}</span>
                      <img src={item.image} alt={item.name} className="sf-live-bag-thumb" />
                      <div className="sf-live-bag-item-info">
                        <h4>{item.name}</h4>
                        <div className="sf-live-bag-prices">
                          <strong>{formatVnd(dealPrice)}</strong>
                          <span>{formatVnd(item.price)}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="sf-live-bag-add-btn"
                        onClick={() => {
                          onAddToCart({ ...item, price: dealPrice }, matchedRestaurant);
                          setToastMessage(`Đã thêm "${item.name}" vào giỏ!`);
                          setTimeout(() => setToastMessage(null), 2000);
                        }}
                      >
                        Thêm
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
