/**
 * LivestreamManagementPage - Quản lý danh sách livestream của seller
 * Hiển thị tất cả livestream, trạng thái, và cho phép mở/tắt
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RestaurantSidebar from '@/components/layout/RestaurantSidebar';
import RestaurantHeader from '@/components/layout/RestaurantHeader';
import { livestreamApi, LivestreamResponse, LivestreamStatus } from '../services/livestreamApi';
import TokenStorage from '@/services/storage/localStorage';
import { ROUTES } from '@/utils/constants';

const LivestreamManagementPage = () => {
  const navigate = useNavigate();
  const [livestreams, setLivestreams] = useState<LivestreamResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // ID của livestream đang thao tác

  // Lấy danh sách livestream
  useEffect(() => {
    fetchLivestreams();
  }, []);

  const fetchLivestreams = async () => {
    try {
      setLoading(true);
      setError(null);

      // Lấy sellerId từ localStorage (user ID)
      const user = TokenStorage.getUserInfo();
      if (!user?.id) {
        setError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
        return;
      }

      const data = await livestreamApi.getLivestreamsBySeller(user.id);
      setLivestreams(data);
    } catch (err) {
      setError((err as Error).message);
      console.error('Error fetching livestreams:', err);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý mở livestream (navigate đến trang livestream với ID)
  const handleOpenLivestream = (livestream: LivestreamResponse) => {
    navigate(ROUTES.RESTAURANT_LIVESTREAM_DETAIL.replace(':id', livestream.id));
  };

  // Xử lý tắt livestream
  const handleEndLivestream = async (livestreamId: string) => {
    if (!confirm('Bạn có chắc muốn kết thúc livestream này?')) {
      return;
    }

    try {
      setActionLoading(livestreamId);
      await livestreamApi.endLivestream(livestreamId);

      // Refresh danh sách
      await fetchLivestreams();
      alert('✅ Đã kết thúc livestream thành công!');
    } catch (err) {
      alert('❌ Lỗi: ' + (err as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  // Xử lý tạo livestream mới
  const handleCreateNew = () => {
    navigate(ROUTES.RESTAURANT_LIVESTREAM);
  };

  // Xử lý xem viewer page
  const handleViewAsViewer = (livestreamId: string) => {
    window.open(`/livestream/${livestreamId}`, '_blank');
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status badge
  const getStatusBadge = (status: LivestreamStatus) => {
    switch (status) {
      case LivestreamStatus.CREATED:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
            🔵 Đã tạo
          </span>
        );
      case LivestreamStatus.LIVE:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-500 text-white animate-pulse">
            🔴 ĐANG LIVE
          </span>
        );
      case LivestreamStatus.ENDED:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-700">
            ⚫ Đã kết thúc
          </span>
        );
      default:
        return null;
    }
  };

  // Get duration
  const getDuration = (startedAt?: string, endedAt?: string) => {
    if (!startedAt) return 'N/A';

    const start = new Date(startedAt).getTime();
    const end = endedAt ? new Date(endedAt).getTime() : Date.now();
    const duration = Math.floor((end - start) / 1000 / 60); // minutes

    if (duration < 1) return '< 1 phút';
    if (duration < 60) return `${duration} phút`;

    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <RestaurantSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <RestaurantHeader title="Quản lý Livestream" />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  📹 Quản lý Livestream
                </h1>
                <p className="text-gray-600 mt-2">
                  Xem và quản lý tất cả livestream của bạn
                </p>
              </div>
              <button
                onClick={handleCreateNew}
                className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined">add</span>
                <span>Tạo Livestream Mới</span>
              </button>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">❌ {error}</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && livestreams.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <div className="text-6xl mb-4">📹</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Chưa có livestream nào
                </h3>
                <p className="text-gray-500 mb-6">
                  Tạo livestream đầu tiên của bạn để bắt đầu bán hàng trực tuyến
                </p>
                <button
                  onClick={handleCreateNew}
                  className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors"
                >
                  🎬 Tạo Livestream Ngay
                </button>
              </div>
            )}

            {/* Livestream List */}
            {!loading && !error && livestreams.length > 0 && (
              <div className="grid grid-cols-1 gap-6">
                {livestreams.map((livestream) => (
                  <div
                    key={livestream.id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="p-6">
                      {/* Header Row */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-800 mb-2">
                            {livestream.title}
                          </h3>
                          {livestream.description && (
                            <p className="text-gray-600 text-sm mb-3">
                              {livestream.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3">
                            {getStatusBadge(livestream.status)}
                            <span className="text-sm text-gray-500">
                              ID: {livestream.id.substring(0, 8)}...
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          {/* Nút mở livestream - Chỉ hiện khi CREATED hoặc LIVE */}
                          {livestream.status === LivestreamStatus.CREATED && (
                            <button
                              onClick={() => handleOpenLivestream(livestream)}
                              disabled={actionLoading === livestream.id}
                              className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                              title="Mở để bắt đầu livestream"
                            >
                              <span className="material-symbols-outlined text-sm">
                                play_circle
                              </span>
                              <span>Bắt đầu Live</span>
                            </button>
                          )}

                          {/* Nút tiếp tục livestream - Khi đang LIVE */}
                          {livestream.status === LivestreamStatus.LIVE && (
                            <button
                              onClick={() => handleOpenLivestream(livestream)}
                              disabled={actionLoading === livestream.id}
                              className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 animate-pulse"
                              title="Vào phòng livestream đang phát sóng"
                            >
                              <span className="material-symbols-outlined text-sm">
                                videocam
                              </span>
                              <span>Vào Livestream</span>
                            </button>
                          )}

                          {/* Nút kết thúc livestream */}
                          {livestream.status === LivestreamStatus.LIVE && (
                            <button
                              onClick={() => handleEndLivestream(livestream.id)}
                              disabled={actionLoading === livestream.id}
                              className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                              {actionLoading === livestream.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                  <span>Đang kết thúc...</span>
                                </>
                              ) : (
                                <>
                                  <span className="material-symbols-outlined text-sm">
                                    stop_circle
                                  </span>
                                  <span>Kết thúc Live</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Nút xem như viewer */}
                          {livestream.status === LivestreamStatus.LIVE && (
                            <button
                              onClick={() => handleViewAsViewer(livestream.id)}
                              className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                              title="Xem như người xem"
                            >
                              <span className="material-symbols-outlined text-sm">
                                visibility
                              </span>
                            </button>
                          )}

                          {/* Message khi đã kết thúc */}
                          {livestream.status === LivestreamStatus.ENDED && (
                            <div className="text-sm text-gray-500 italic">
                              Livestream đã kết thúc
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Thời gian tạo</p>
                          <p className="text-sm font-semibold text-gray-800">
                            {formatDate(livestream.createdAt)}
                          </p>
                        </div>

                        {livestream.startedAt && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Bắt đầu</p>
                            <p className="text-sm font-semibold text-gray-800">
                              {formatDate(livestream.startedAt)}
                            </p>
                          </div>
                        )}

                        {livestream.status === LivestreamStatus.LIVE && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Thời lượng</p>
                            <p className="text-sm font-semibold text-green-600">
                              {getDuration(livestream.startedAt)}
                            </p>
                          </div>
                        )}

                        {livestream.endedAt && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Kết thúc</p>
                            <p className="text-sm font-semibold text-gray-800">
                              {formatDate(livestream.endedAt)}
                            </p>
                          </div>
                        )}

                        {livestream.status === LivestreamStatus.ENDED && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Thời lượng</p>
                            <p className="text-sm font-semibold text-gray-800">
                              {getDuration(livestream.startedAt, livestream.endedAt)}
                            </p>
                          </div>
                        )}

                        <div>
                          <p className="text-xs text-gray-500 mb-1">Channel</p>
                          <p className="text-sm font-mono text-gray-800 truncate">
                            {livestream.channelName}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default LivestreamManagementPage;
