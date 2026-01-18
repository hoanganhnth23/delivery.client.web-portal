/**
 * SellerLivestream Component
 * Component chính cho Seller để tạo và quản lý livestream
 * Sử dụng Agora Web SDK để stream video/audio
 */

import { useState, useEffect, useRef } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';
import { livestreamApi, CreateLivestreamRequest, StreamProvider } from '../services/livestreamApi';

// ============================================
// TYPES
// ============================================

type LivestreamStatus = 'IDLE' | 'CREATED' | 'LIVE' | 'ENDED';

interface LivestreamData {
  livestreamId: string;
  channelName: string;
  token?: string;
  uid?: number;
}

interface SellerLivestreamProps {
  title?: string;
  description?: string;
  restaurantId?: number;
  onCreateSuccess?: (livestreamId: string) => void;
  onStartSuccess?: () => void;
  onEndSuccess?: () => void;
}

// ============================================
// COMPONENT
// ============================================

const SellerLivestream = ({
  title = 'Livestream bán hàng',
  description,
  restaurantId,
  onCreateSuccess,
  onStartSuccess,
  onEndSuccess,
}: SellerLivestreamProps) => {
  // States
  const [status, setStatus] = useState<LivestreamStatus>('IDLE');
  const [livestreamData, setLivestreamData] = useState<LivestreamData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs để lưu Agora client và tracks
  const agoraClientRef = useRef<IAgoraRTCClient | null>(null);
  const videoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const audioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);

  // Ref cho video element
  const localVideoRef = useRef<HTMLDivElement>(null);

  /**
   * Cleanup: Dọn dẹp khi component unmount
   */
  useEffect(() => {
    return () => {
      handleCleanup();
    };
  }, []);

  /**
   * Dọn dẹp Agora resources
   */
  const handleCleanup = async () => {
    try {
      // Unpublish tracks nếu đang publish
      if (
        agoraClientRef.current &&
        videoTrackRef.current &&
        audioTrackRef.current
      ) {
        await agoraClientRef.current.unpublish([
          videoTrackRef.current,
          audioTrackRef.current,
        ]);
      }

      // Close tracks
      videoTrackRef.current?.close();
      audioTrackRef.current?.close();

      // Leave channel
      if (agoraClientRef.current) {
        await agoraClientRef.current.leave();
      }

      // Reset refs
      agoraClientRef.current = null;
      videoTrackRef.current = null;
      audioTrackRef.current = null;
    } catch (err) {
      console.error('Cleanup error:', err);
    }
  };

  /**
   * STEP 1: Tạo livestream (phòng logic)
   */
  const handleCreateLivestream = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate restaurantId
      if (!restaurantId) {
        throw new Error('Restaurant ID is required');
      }

      // Prepare request
      const request: CreateLivestreamRequest = {
        title,
        description,
        restaurantId,
        streamProvider: StreamProvider.AGORA,
      };

      // Gọi backend tạo livestream
      const data = await livestreamApi.createLivestream(request);

      // Lưu data vào state
      setLivestreamData({
        livestreamId: data.id,
        channelName: data.channelName,
      });

      setStatus('CREATED');
      console.log('✅ Livestream created:', data);
      
      // Callback
      if (onCreateSuccess) {
        onCreateSuccess(data.id);
      }
    } catch (err) {
      setError('Failed to create livestream');
      console.error('Create livestream error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * STEP 2: Preview camera trước khi live
   */
  const handlePreviewCamera = async () => {
    try {
      setLoading(true);

      // Tạo video track từ camera
      const videoTrack = await AgoraRTC.createCameraVideoTrack();
      videoTrackRef.current = videoTrack;

      // Play video track vào div
      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }

      console.log('✅ Camera preview started');
    } catch (err) {
      setError('Failed to access camera');
      console.error('Camera preview error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * STEP 3: Bắt đầu livestream
   */
  const handleStartLive = async () => {
    if (!livestreamData) return;

    try {
      setLoading(true);
      setError(null);

      // 1. Gọi backend để lấy token + uid
      const startData = await livestreamApi.startLivestream(
        livestreamData.livestreamId
      );

      setLivestreamData({
        ...livestreamData,
        token: startData.token,
        uid: startData.uid,
      });

      // 2. Tạo Agora client với mode "live"
      const client = AgoraRTC.createClient({
        mode: 'live', // Mode livestream
        codec: 'vp8',
      });
      agoraClientRef.current = client;

      // Set role là "host" (người phát)
      await client.setClientRole('host');

      // 3. Join channel
      await client.join(
        import.meta.env.VITE_AGORA_APP_ID, // Agora App ID từ env
        startData.channelName,
        startData.token,
        startData.uid
      );

      console.log('✅ Joined Agora channel:', startData.channelName);

      // 4. Tạo audio + video tracks
      const videoTrack = await AgoraRTC.createCameraVideoTrack();
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();

      videoTrackRef.current = videoTrack;
      audioTrackRef.current = audioTrack;

      // 5. Play video local
      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }

      // 6. Publish tracks lên channel
      await client.publish([videoTrack, audioTrack]);

      console.log('✅ Published audio + video tracks');

      setStatus('LIVE');
      
      // Callback
      if (onStartSuccess) {
        onStartSuccess();
      }
    } catch (err) {
      setError('Failed to start livestream');
      console.error('Start livestream error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * STEP 4: Kết thúc livestream
   */
  const handleEndLive = async () => {
    if (!livestreamData) return;

    try {
      setLoading(true);
      setError(null);

      // 1. Cleanup Agora
      await handleCleanup();

      // 2. Gọi backend kết thúc livestream
      await livestreamApi.endLivestream(livestreamData.livestreamId);

      console.log('✅ Livestream ended');

      setStatus('ENDED');
      
      // Callback
      if (onEndSuccess) {
        onEndSuccess();
      }
    } catch (err) {
      setError('Failed to end livestream');
      console.error('End livestream error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Livestream Bán Hàng
          </h1>

          {/* Status Badge */}
          <div
            className={`px-4 py-2 rounded-full text-sm font-bold ${
              status === 'IDLE'
                ? 'bg-gray-200 text-gray-700'
                : status === 'CREATED'
                ? 'bg-blue-100 text-blue-700'
                : status === 'LIVE'
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-gray-400 text-white'
            }`}
          >
            {status === 'IDLE' && 'Chưa tạo phòng'}
            {status === 'CREATED' && 'Đã tạo phòng'}
            {status === 'LIVE' && '🔴 ĐANG LIVE'}
            {status === 'ENDED' && 'Đã kết thúc'}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Video Preview Area */}
        <div className="mb-6 bg-black rounded-lg overflow-hidden aspect-video">
          <div
            ref={localVideoRef}
            className="w-full h-full flex items-center justify-center"
          >
            {status === 'IDLE' && (
              <p className="text-gray-400 text-lg">
                Camera chưa được bật
              </p>
            )}
          </div>
        </div>

        {/* Livestream Info */}
        {livestreamData && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <strong>Livestream ID:</strong> {livestreamData.livestreamId}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <strong>Channel:</strong> {livestreamData.channelName}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          {/* Create Livestream Button */}
          {status === 'IDLE' && (
            <button
              onClick={handleCreateLivestream}
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang tạo...' : 'Tạo phòng Livestream'}
            </button>
          )}

          {/* Preview Camera Button */}
          {status === 'CREATED' && (
            <>
              <button
                onClick={handlePreviewCamera}
                disabled={loading}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Đang bật...' : 'Xem trước Camera'}
              </button>

              <button
                onClick={handleStartLive}
                disabled={loading}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Đang kết nối...' : 'Bắt đầu Live'}
              </button>
            </>
          )}

          {/* End Live Button */}
          {status === 'LIVE' && (
            <button
              onClick={handleEndLive}
              disabled={loading}
              className="flex-1 bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Đang kết thúc...' : 'Kết thúc Live'}
            </button>
          )}

          {/* Reset Button */}
          {status === 'ENDED' && (
            <button
              onClick={() => {
                setStatus('IDLE');
                setLivestreamData(null);
                setError(null);
              }}
              className="flex-1 bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Tạo phòng mới
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerLivestream;
