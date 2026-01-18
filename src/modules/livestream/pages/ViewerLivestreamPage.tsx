/**
 * ViewerLivestreamPage - Trang xem livestream (Viewer side)
 * Sử dụng useViewerLivestream hook để quản lý state
 */
import { useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useViewerLivestream } from '../hooks/useViewerLivestream';

const ViewerLivestreamPage = () => {
  const { livestreamId } = useParams<{ livestreamId: string }>();
  const navigate = useNavigate();
  
  const {
    status,
    loading,
    error,
    viewerCount,
    remoteUsers,
    joinLivestream,
    leaveLivestream,
  } = useViewerLivestream();

  // Ref cho remote video element
  const remoteVideoContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto-join khi vào page
  useEffect(() => {
    if (livestreamId && status === 'IDLE') {
      handleJoin();
    }
  }, [livestreamId]);

  // Play remote video khi có remote users
  useEffect(() => {
    if (remoteUsers.length > 0 && remoteVideoContainerRef.current) {
      remoteUsers.forEach(user => {
        if (user.videoTrack) {
          const videoElement = document.getElementById(`remote-video-${user.uid}`);
          if (videoElement) {
            user.videoTrack.play(videoElement as HTMLElement);
          }
        }
        if (user.audioTrack) {
          user.audioTrack.play();
        }
      });
    }
  }, [remoteUsers]);

  // ==================== HANDLERS ====================
  const handleJoin = async () => {
    if (!livestreamId) {
      alert('❌ Không tìm thấy livestream ID');
      return;
    }

    try {
      await joinLivestream(livestreamId);
    } catch (err) {
      alert('❌ Lỗi: ' + (err as Error).message);
    }
  };

  const handleLeave = async () => {
    try {
      await leaveLivestream();
      navigate('/'); // Quay về trang chủ
    } catch (err) {
      alert('❌ Lỗi: ' + (err as Error).message);
    }
  };

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Top Bar */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left: Back Button */}
          <button
            onClick={handleLeave}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="font-medium">Thoát</span>
          </button>

          {/* Center: Status Badge */}
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold ${
                status === 'IDLE'
                  ? 'bg-gray-700 text-gray-300'
                  : status === 'CONNECTING'
                  ? 'bg-yellow-500 text-white'
                  : status === 'WATCHING'
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              {status === 'IDLE' && '⚪ Chưa kết nối'}
              {status === 'CONNECTING' && '🟡 Đang kết nối...'}
              {status === 'WATCHING' && '🔴 ĐANG XEM LIVE'}
              {status === 'DISCONNECTED' && '⚫ Đã ngắt kết nối'}
            </span>

            {/* Viewer Count */}
            {status === 'WATCHING' && (
              <div className="flex items-center gap-1 text-white bg-gray-700 px-3 py-1.5 rounded-full">
                <span className="material-symbols-outlined text-sm">visibility</span>
                <span className="text-sm font-semibold">{viewerCount}</span>
              </div>
            )}
          </div>

          {/* Right: Livestream Info */}
          <div className="text-gray-400 text-sm">
            ID: {livestreamId}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg">
            <p className="text-red-200">❌ {error}</p>
          </div>
        )}

        {/* Video Player Area */}
        <div className="mb-4 bg-black rounded-xl overflow-hidden aspect-video relative">
          <div
            ref={remoteVideoContainerRef}
            className="w-full h-full"
          >
            {/* Remote Video Elements */}
            {remoteUsers.length > 0 ? (
              remoteUsers.map(user => (
                <div
                  key={user.uid}
                  id={`remote-video-${user.uid}`}
                  className="w-full h-full"
                />
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                {status === 'CONNECTING' && (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-xl">Đang kết nối...</p>
                  </div>
                )}
                {status === 'WATCHING' && (
                  <div className="text-center">
                    <p className="text-2xl mb-2">📹</p>
                    <p className="text-xl">Đang chờ host bắt đầu livestream...</p>
                  </div>
                )}
                {status === 'IDLE' && (
                  <div className="text-center">
                    <p className="text-2xl mb-2">📺</p>
                    <p className="text-xl mb-4">Livestream chưa bắt đầu</p>
                    <button
                      onClick={handleJoin}
                      disabled={loading}
                      className="px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Đang kết nối...' : '▶️ Xem Livestream'}
                    </button>
                  </div>
                )}
                {status === 'DISCONNECTED' && (
                  <div className="text-center">
                    <p className="text-2xl mb-2">⚫</p>
                    <p className="text-xl mb-4">Đã ngắt kết nối</p>
                    <button
                      onClick={handleJoin}
                      disabled={loading}
                      className="px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Đang kết nối...' : '🔄 Kết nối lại'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        {status === 'WATCHING' && (
          <div className="flex justify-center gap-4">
            <button
              onClick={handleLeave}
              disabled={loading}
              className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ⏹️ Thoát
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <span>💡</span>
            <span>Hướng dẫn:</span>
          </h3>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>Trang sẽ tự động kết nối khi vào</li>
            <li>Video sẽ hiển thị khi host bắt đầu phát sóng</li>
            <li>Audio sẽ tự động phát</li>
            <li>Nhấn "Thoát" để rời khỏi livestream</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ViewerLivestreamPage;
