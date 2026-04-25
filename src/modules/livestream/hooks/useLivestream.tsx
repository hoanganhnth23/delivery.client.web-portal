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
export type LivestreamStatus = 'IDLE' | 'LOADING' | 'CREATED' | 'LIVE' | 'ENDED';

interface LivestreamData {
  livestreamId: string | null;
  channelName: string | null;
  title: string | null;
  description: string | null;
  token: string | null;
  uid: number | null;
  status: LivestreamStatus;
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
  loadExistingLivestream: (livestreamId: string) => void;
  previewCamera: () => Promise<void>;
  startLive: () => Promise<void>;
  joinLive: () => Promise<void>;
  endLive: () => Promise<void>;
  cleanup: () => Promise<void>;
  resetContext: () => void;
}

interface LivestreamProviderProps {
  children: ReactNode;
}

// ==================== CONTEXT ====================
const LivestreamContext = createContext<LivestreamContextValue | null>(null);

// ==================== PROVIDER ====================
export const LivestreamProvider = ({ children }: LivestreamProviderProps) => {
  // States
  const [livestreamData, setLivestreamData] = useState<LivestreamData>({
    livestreamId: null,
    channelName: null,
    title: null,
    description: null,
    token: null,
    uid: null,
    status: 'IDLE',
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
      setLivestreamData(prev => ({ ...prev, status: 'LOADING' }));

      const data = await livestreamApi.createLivestream(request);

      setLivestreamData({
        livestreamId: data.id,
        channelName: data.channelName,
        title: request.title,
        description: request.description || null,
        token: null,
        uid: null,
        status: data.status || 'CREATED',
      });
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
   * Load existing livestream (khi mở livestream đã tạo từ danh sách)
   */
  const loadExistingLivestream = useCallback(async (livestreamId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      setLivestreamData(prev => ({ ...prev, status: 'LOADING' }));
      // Lấy chi tiết livestream từ server để lấy status và channelName
      const detail = await livestreamApi.getLivestreamDetail(livestreamId);
      setLivestreamData({
        livestreamId,
        channelName: detail.channelName,
        title: detail.title,
        description: detail.description || null,
        token: null,
        uid: null,
        status: detail.status || 'CREATED',
      });
    } catch (err) {
      setError((err as Error).message);
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
  // Join lại livestream đang LIVE (không gọi startLivestream API)
  const joinLive = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      if (!livestreamData.livestreamId) {
        throw new Error('Không có livestream để join');
      }

      // 1. Gọi backend để lấy lại token, uid, channelName (dùng joinLivestream, không phải startLivestream)
      const data = await livestreamApi.joinLivestream(livestreamData.livestreamId);
      const { token, uid, channelName } = data;

      // 2. Tạo Agora client (mode: 'live', role: 'host')
      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
      agoraClientRef.current = client;

      // 3. Set role là 'host'
      await client.setClientRole('host');

      // 4. Join channel
      await client.join(VITE_AGORA_APP_ID, channelName, token, uid);
      console.log('✅ Re-joined Agora channel:', channelName);

      // 5. Nếu chưa có tracks thì tạo mới
      if (!videoTrackRef.current) {
        videoTrackRef.current = await AgoraRTC.createCameraVideoTrack();
      }
      if (!audioTrackRef.current) {
        audioTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack();
      }

      // 6. Publish tracks
      await client.publish([videoTrackRef.current, audioTrackRef.current]);
      console.log('✅ Published audio + video tracks');

      // 7. Update state
      setLivestreamData(prev => ({
        ...prev,
        token,
        uid,
        status: 'LIVE',
      }));
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      console.error('Error re-joining live:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [livestreamData.livestreamId, VITE_AGORA_APP_ID]);

  /**
   * Bắt đầu livestream (join Agora channel)
   * Nếu đã LIVE thì chỉ join lại, không gọi API start lại
   */
  const startLive = useCallback(async (): Promise<void> => {
    if (livestreamData.status === 'LIVE') {
      // Nếu đã LIVE thì chỉ join lại
      await joinLive();
      return;
    }
    try {
      setLoading(true);
      setError(null);

      if (!livestreamData.livestreamId) {
        throw new Error('Chưa tạo phòng livestream');
      }

      // 1. Gọi backend để bắt đầu và lấy Agora token
      let data;
      try {
        data = await livestreamApi.startLivestream(livestreamData.livestreamId);
      } catch (err: any) {
        // If backend says it is already LIVE, gracefully fall back to joinLive
        if (err.message && err.message.toUpperCase().includes('LIVE')) {
           setLoading(false);
           await joinLive();
           return;
        }
        throw err;
      }
      
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
        status: 'LIVE',
      }));
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      console.error('Error starting live:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [status, livestreamData.livestreamId, VITE_AGORA_APP_ID, joinLive]);

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
      setLivestreamData(prev => ({
        ...prev,
        status: 'ENDED',
      }));
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

  /**
   * Reset context (clear old stream data)
   */
  const resetContext = useCallback(() => {
    setLivestreamData({
      livestreamId: null,
      channelName: null,
      title: null,
      description: null,
      token: null,
      uid: null,
      status: 'IDLE',
    });
    setError(null);
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
      status: livestreamData.status,
      livestreamData,
      loading,
      error,
      agoraClient: agoraClientRef.current,
      videoTrack: videoTrackRef.current,
      audioTrack: audioTrackRef.current,
      createRoom,
      loadExistingLivestream,
      previewCamera,
      startLive,
      joinLive,
      endLive,
      cleanup,
      resetContext,
    }),
    [livestreamData, loading, error, createRoom, loadExistingLivestream, previewCamera, startLive, joinLive, endLive, cleanup, resetContext]
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
