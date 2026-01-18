/**
 * useLivestream Hook
 * Quản lý state và logic cho Livestream module
 * Pattern: Context API + Custom Hook
 */
import { createContext, useContext, useState, useMemo, useCallback, useRef, ReactNode, useEffect } from 'react';
import AgoraRTC, { 
  IAgoraRTCClient, 
  ICameraVideoTrack, 
  IMicrophoneAudioTrack 
} from 'agora-rtc-sdk-ng';
import { livestreamApi, CreateLivestreamRequest, StreamProvider } from '../services/livestreamApi';

// Re-export StreamProvider for convenience
export { StreamProvider };

// ==================== TYPES ====================
export type LivestreamStatus = 'IDLE' | 'CREATED' | 'LIVE' | 'ENDED';

interface LivestreamData {
  livestreamId: string | null;
  channelName: string | null;
  token: string | null;
  uid: number | null;
}

interface LivestreamContextValue {
  // States
  status: LivestreamStatus;
  livestreamData: LivestreamData;
  loading: boolean;
  error: string | null;
  
  // Agora refs
  agoraClient: IAgoraRTCClient | null;
  videoTrack: ICameraVideoTrack | null;
  audioTrack: IMicrophoneAudioTrack | null;
  
  // Actions
  createRoom: (request: CreateLivestreamRequest) => Promise<void>;
  previewCamera: () => Promise<void>;
  startLive: () => Promise<void>;
  endLive: () => Promise<void>;
  cleanup: () => Promise<void>;
}

interface LivestreamProviderProps {
  children: ReactNode;
}

// ==================== CONTEXT ====================
const LivestreamContext = createContext<LivestreamContextValue | null>(null);

// ==================== PROVIDER ====================
export const LivestreamProvider = ({ children }: LivestreamProviderProps) => {
  // States
  const [status, setStatus] = useState<LivestreamStatus>('IDLE');
  const [livestreamData, setLivestreamData] = useState<LivestreamData>({
    livestreamId: null,
    channelName: null,
    token: null,
    uid: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Agora refs
  const agoraClientRef = useRef<IAgoraRTCClient | null>(null);
  const videoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const audioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);

  // Agora App ID from environment
  const VITE_AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID;

  // ==================== ACTIONS ====================

  /**
   * Tạo phòng livestream mới
   * @param request - Thông tin livestream (title, description, restaurantId, streamProvider)
   */
  const createRoom = useCallback(async (request: CreateLivestreamRequest): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const data = await livestreamApi.createLivestream(request);
      
      setLivestreamData({
        livestreamId: data.id,
        channelName: data.channelName,
        token: null,
        uid: null,
      });
      setStatus('CREATED');
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      console.error('Error creating livestream:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Xem trước camera (không join channel)
   */
  const previewCamera = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Tạo video track để preview
      const videoTrack = await AgoraRTC.createCameraVideoTrack();
      videoTrackRef.current = videoTrack;

      // Tạo audio track (mute tạm thời)
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      audioTrackRef.current = audioTrack;

      console.log('✅ Camera preview ready');
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      console.error('Error previewing camera:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Bắt đầu livestream (join Agora channel)
   */
  const startLive = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      if (!livestreamData.livestreamId) {
        throw new Error('Chưa tạo phòng livestream');
      }

      // 1. Gọi backend để bắt đầu và lấy Agora token
      const data = await livestreamApi.startLivestream(livestreamData.livestreamId);
      const { token, uid, channelName } = data;

      // 2. Tạo Agora client (mode: 'live', role: 'host')
      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
      agoraClientRef.current = client;

      // 3. Set role là 'host' (người phát sóng)
      await client.setClientRole('host');

      // 4. Join channel với token từ backend
      await client.join(VITE_AGORA_APP_ID, channelName, token, uid);
      console.log('✅ Joined Agora channel:', channelName);

      // 5. Nếu chưa có tracks thì tạo mới
      if (!videoTrackRef.current) {
        videoTrackRef.current = await AgoraRTC.createCameraVideoTrack();
      }
      if (!audioTrackRef.current) {
        audioTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack();
      }

      // 6. Publish audio + video tracks lên channel
      await client.publish([videoTrackRef.current, audioTrackRef.current]);
      console.log('✅ Published audio + video tracks');

      // 7. Update state
      setLivestreamData(prev => ({
        ...prev,
        token,
        uid,
      }));
      setStatus('LIVE');
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      console.error('Error starting live:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [livestreamData.livestreamId, VITE_AGORA_APP_ID]);

  /**
   * Kết thúc livestream
   */
  const endLive = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      if (!livestreamData.livestreamId) {
        throw new Error('Không có livestream đang hoạt động');
      }

      // 1. Unpublish tracks
      if (agoraClientRef.current && videoTrackRef.current && audioTrackRef.current) {
        await agoraClientRef.current.unpublish([
          videoTrackRef.current,
          audioTrackRef.current,
        ]);
        console.log('✅ Unpublished tracks');
      }

      // 2. Leave channel
      if (agoraClientRef.current) {
        await agoraClientRef.current.leave();
        console.log('✅ Left Agora channel');
      }

      // 3. Đóng tracks
      videoTrackRef.current?.close();
      audioTrackRef.current?.close();

      // 4. Thông báo backend kết thúc
      await livestreamApi.endLivestream(livestreamData.livestreamId);

      // 5. Reset state
      setStatus('ENDED');
      agoraClientRef.current = null;
      videoTrackRef.current = null;
      audioTrackRef.current = null;

      console.log('✅ Livestream ended successfully');
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      console.error('Error ending live:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [livestreamData.livestreamId]);

  /**
   * Cleanup Agora resources (khi unmount component)
   */
  const cleanup = useCallback(async (): Promise<void> => {
    try {
      // Unpublish nếu đang publish
      if (agoraClientRef.current && videoTrackRef.current && audioTrackRef.current) {
        await agoraClientRef.current.unpublish([
          videoTrackRef.current,
          audioTrackRef.current,
        ]);
      }

      // Leave channel
      if (agoraClientRef.current) {
        await agoraClientRef.current.leave();
      }

      // Close tracks
      videoTrackRef.current?.close();
      audioTrackRef.current?.close();

      // Reset refs
      agoraClientRef.current = null;
      videoTrackRef.current = null;
      audioTrackRef.current = null;

      console.log('✅ Cleanup completed');
    } catch (err) {
      console.error('Error during cleanup:', err);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // ==================== CONTEXT VALUE ====================
  const value = useMemo<LivestreamContextValue>(
    () => ({
      status,
      livestreamData,
      loading,
      error,
      agoraClient: agoraClientRef.current,
      videoTrack: videoTrackRef.current,
      audioTrack: audioTrackRef.current,
      createRoom,
      previewCamera,
      startLive,
      endLive,
      cleanup,
    }),
    [status, livestreamData, loading, error, createRoom, previewCamera, startLive, endLive, cleanup]
  );

  return (
    <LivestreamContext.Provider value={value}>
      {children}
    </LivestreamContext.Provider>
  );
};

// ==================== CUSTOM HOOK ====================
/**
 * Custom hook để sử dụng Livestream context
 * @throws Error nếu sử dụng ngoài LivestreamProvider
 */
export const useLivestream = (): LivestreamContextValue => {
  const context = useContext(LivestreamContext);
  if (!context) {
    throw new Error('useLivestream must be used within LivestreamProvider');
  }
  return context;
};
