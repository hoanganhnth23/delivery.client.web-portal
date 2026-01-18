/**
 * Livestream Page - Trang livestream bán hàng (Seller side)
 * Sử dụng useLivestream hook để quản lý state
 */
import { useRef, useEffect, useState } from 'react';
import RestaurantSidebar from '@/components/layout/RestaurantSidebar';
import RestaurantHeader from '@/components/layout/RestaurantHeader';
import { useLivestream, StreamProvider } from '../hooks/useLivestream';
import { useRestaurant } from '@/modules/restaurant/hooks/useRestaurant';
import TokenStorage from '@/services/storage/localStorage';

const LivestreamPage = () => {
  const {
    status,
    livestreamData,
    loading,
    error,
    videoTrack,
    createRoom,
    previewCamera,
    startLive,
    endLive,
  } = useLivestream();

  const { currentRestaurant } = useRestaurant();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Ref cho video element
  const localVideoRef = useRef<HTMLDivElement>(null);

  // Play video track khi có
  useEffect(() => {
    if (videoTrack && localVideoRef.current) {
      videoTrack.play(localVideoRef.current);
    }
  }, [videoTrack]);

  // ==================== HANDLERS ====================
  const handleCreateRoom = async () => {
    // Validation
    if (!title.trim()) {
      alert('❌ Vui lòng nhập tiêu đề livestream');
      return;
    }

    // Lấy restaurantId từ currentRestaurant hoặc storage
    let restaurantId = currentRestaurant?.id;
    
    if (!restaurantId) {
      // Thử lấy từ localStorage
      const savedRestaurantId = TokenStorage.getCurrentRestaurantId();
      if (savedRestaurantId) {
        restaurantId = savedRestaurantId;
      } else {
        alert('❌ Không tìm thấy thông tin nhà hàng. Vui lòng đăng nhập lại.');
        return;
      }
    }

    try {
      await createRoom({
        title: title.trim(),
        description: description.trim() || undefined,
        restaurantId,
        streamProvider: StreamProvider.AGORA,
      });
      alert('✅ Tạo phòng livestream thành công!');
    } catch (err) {
      alert('❌ Lỗi: ' + (err as Error).message);
    }
  };

  const handlePreview = async () => {
    try {
      await previewCamera();
    } catch (err) {
      alert('❌ Lỗi: ' + (err as Error).message);
    }
  };

  const handleStartLive = async () => {
    try {
      await startLive();
      alert('✅ Đã bắt đầu livestream!');
    } catch (err) {
      alert('❌ Lỗi: ' + (err as Error).message);
    }
  };

  const handleEndLive = async () => {
    try {
      await endLive();
      alert('✅ Đã kết thúc livestream!');
    } catch (err) {
      alert('❌ Lỗi: ' + (err as Error).message);
    }
  };

  // ==================== RENDER ====================
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <RestaurantSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <RestaurantHeader title="Livestream Bán Hàng" />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800">
                📹 Livestream Bán Hàng
              </h1>
              <p className="text-gray-600 mt-2">
                Tạo và quản lý livestream để bán hàng trực tiếp cho khách hàng
              </p>
            </div>

            {/* Status Badge */}
            <div className="mb-4">
              <span
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                  status === 'IDLE'
                    ? 'bg-gray-100 text-gray-700'
                    : status === 'CREATED'
                    ? 'bg-blue-100 text-blue-700'
                    : status === 'LIVE'
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {status === 'IDLE' && '⚪ Chưa tạo phòng'}
                {status === 'CREATED' && '🔵 Đã tạo phòng'}
                {status === 'LIVE' && '🔴 ĐANG LIVE'}
                {status === 'ENDED' && '⚫ Đã kết thúc'}
              </span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">❌ {error}</p>
              </div>
            )}

            {/* Video Preview Area */}
            <div className="mb-6 bg-black rounded-xl overflow-hidden aspect-video">
              <div
                ref={localVideoRef}
                id="local-video"
                className="w-full h-full flex items-center justify-center text-white text-lg"
              >
                {!videoTrack && (
                  <div className="text-center">
                    <p className="text-2xl mb-2">📹</p>
                    <p>Chưa có video</p>
                  </div>
                )}
              </div>
            </div>

            {/* Livestream Info */}
            {livestreamData.livestreamId && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Thông tin Livestream:
                </h3>
                <p className="text-blue-800">
                  <strong>ID:</strong> {livestreamData.livestreamId}
                </p>
                <p className="text-blue-800">
                  <strong>Channel:</strong> {livestreamData.channelName}
                </p>
              </div>
            )}

            {/* Form Tạo Livestream - Hiện khi status = IDLE */}
            {status === 'IDLE' && (
              <div className="mb-6 p-6 bg-white rounded-lg border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  📝 Thông tin Livestream
                </h3>

                {/* Title Input */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tiêu đề <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Sale 50% tất cả món ăn hôm nay"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {title.length}/200 ký tự
                  </p>
                </div>

                {/* Description Textarea */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mô tả (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả chi tiết về livestream của bạn..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    maxLength={1000}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {description.length}/1000 ký tự
                  </p>
                </div>

                {/* Restaurant Info */}
                {currentRestaurant && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Nhà hàng:</strong> {currentRestaurant.name}
                    </p>
                  </div>
                )}

                {/* Stream Provider Info */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Provider:</strong> Agora RTC
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {/* Tạo Livestream */}
              {status === 'IDLE' && (
                <button
                  onClick={handleCreateRoom}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Đang tạo...' : '🎬 Tạo Livestream'}
                </button>
              )}

              {/* Xem trước Camera */}
              {status === 'CREATED' && !videoTrack && (
                <button
                  onClick={handlePreview}
                  disabled={loading}
                  className="px-6 py-3 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Đang mở camera...' : '📷 Xem trước Camera'}
                </button>
              )}

              {/* Bắt đầu Live */}
              {status === 'CREATED' && (
                <button
                  onClick={handleStartLive}
                  disabled={loading}
                  className="px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Đang kết nối...' : '🔴 Bắt đầu Live'}
                </button>
              )}

              {/* Kết thúc Live */}
              {status === 'LIVE' && (
                <button
                  onClick={handleEndLive}
                  disabled={loading}
                  className="px-6 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Đang kết thúc...' : '⏹️ Kết thúc Live'}
                </button>
              )}

              {/* Tạo mới sau khi kết thúc */}
              {status === 'ENDED' && (
                <button
                  onClick={handleCreateRoom}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Đang tạo...' : '🎬 Tạo Livestream Mới'}
                </button>
              )}
            </div>

            {/* Instructions */}
            <div className="mt-8 p-6 bg-white rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span>💡</span>
                <span>Hướng dẫn sử dụng:</span>
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Nhấn <strong>"Tạo Livestream"</strong> để tạo phòng mới</li>
                <li>
                  (Optional) Nhấn <strong>"Xem trước Camera"</strong> để kiểm tra hình ảnh
                </li>
                <li>Nhấn <strong>"Bắt đầu Live"</strong> để phát sóng</li>
                <li>Khi xong, nhấn <strong>"Kết thúc Live"</strong></li>
              </ol>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LivestreamPage;
