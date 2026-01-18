/**
 * useViewerLivestream Hook
 * Quản lý state và logic cho Viewer xem livestream
 * Pattern: Context API + Custom Hook
 */
import { createContext, useContext, useState, useMemo, useCallback, useRef, ReactNode, useEffect } from 'react';
import AgoraRTC, { 
  IAgoraRTCClient, 
  IAgoraRTCRemoteUser
} from 'agora-rtc-sdk-ng';
import { livestreamApi } from '../services/livestreamApi';

// ==================== TYPES ====================
export type ViewerStatus = 'IDLE' | 'CONNECTING' | 'WATCHING' | 'DISCONNECTED';

interface ViewerContextValue {
  // States
  status: ViewerStatus;
  loading: boolean;
  error: string | null;
  viewerCount: number;
  
  // Agora refs
  agoraClient: IAgoraRTCClient | null;
  remoteUsers: IAgoraRTCRemoteUser[];
  
  // Actions
  joinLivestream: (livestreamId: string) => Promise<void>;
  leaveLivestream: () => Promise<void>;
  cleanup: () => Promise<void>;
}

interface ViewerProviderProps {
  children: ReactNode;
}

// ==================== CONTEXT ====================
const ViewerContext = createContext<ViewerContextValue | null>(null);

// ==================== PROVIDER ====================
export const ViewerProvider = ({ children }: ViewerProviderProps) => {
  // States
  const [status, setStatus] = useState<ViewerStatus>('IDLE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);

  // Agora refs
  const agoraClientRef = useRef<IAgoraRTCClient | null>(null);

  // Agora App ID from environment
  const VITE_AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID;

  // ==================== ACTIONS ====================

  /**
   * Join livestream channel (as audience)
   */
  const joinLivestream = useCallback(async (livestreamId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      setStatus('CONNECTING');

      // 1. Gọi backend để lấy token (với role audience)
      const data = await livestreamApi.joinLivestream(livestreamId);
      const { token, uid, channelName } = data;

      // 2. Tạo Agora client (mode: 'live', role: 'audience')
      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
      agoraClientRef.current = client;

      // 3. Set role là 'audience' (người xem)
      await client.setClientRole('audience');

      // 4. Subscribe to remote users
      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        console.log('✅ Subscribed to user:', user.uid, mediaType);

        // Update remote users list
        setRemoteUsers(prev => {
          const exists = prev.find(u => u.uid === user.uid);
          if (!exists) {
            return [...prev, user];
          }
          return prev;
        });

        // Auto-play remote video
        if (mediaType === 'video') {
          const remoteVideoTrack = user.videoTrack;
          const videoElement = document.getElementById(`remote-video-${user.uid}`);
          if (remoteVideoTrack && videoElement) {
            remoteVideoTrack.play(videoElement as HTMLElement);
          }
        }

        // Auto-play remote audio
        if (mediaType === 'audio') {
          const remoteAudioTrack = user.audioTrack;
          if (remoteAudioTrack) {
            remoteAudioTrack.play();
          }
        }
      });

      client.on('user-unpublished', (user, mediaType) => {
        console.log('❌ User unpublished:', user.uid, mediaType);
      });

      client.on('user-left', (user) => {
        console.log('👋 User left:', user.uid);
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      });

      // 5. Join channel với token từ backend
      await client.join(VITE_AGORA_APP_ID, channelName, token, uid);
      console.log('✅ Joined Agora channel as audience:', channelName);

      // 6. Update viewer count (mock - thực tế lấy từ backend hoặc Agora API)
      const remoteUsersInChannel = client.remoteUsers;
      setViewerCount(remoteUsersInChannel.length + 1); // +1 for self

      setStatus('WATCHING');
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      setStatus('DISCONNECTED');
      console.error('Error joining livestream:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [VITE_AGORA_APP_ID]);

  /**
   * Leave livestream
   */
  const leaveLivestream = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Leave channel
      if (agoraClientRef.current) {
        await agoraClientRef.current.leave();
        console.log('✅ Left Agora channel');
      }

      // Reset state
      setStatus('DISCONNECTED');
      setRemoteUsers([]);
      setViewerCount(0);
      agoraClientRef.current = null;

      console.log('✅ Livestream disconnected');
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      console.error('Error leaving livestream:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cleanup Agora resources (khi unmount component)
   */
  const cleanup = useCallback(async (): Promise<void> => {
    try {
      // Leave channel
      if (agoraClientRef.current) {
        await agoraClientRef.current.leave();
      }

      // Reset refs
      agoraClientRef.current = null;

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
  const value = useMemo<ViewerContextValue>(
    () => ({
      status,
      loading,
      error,
      viewerCount,
      agoraClient: agoraClientRef.current,
      remoteUsers,
      joinLivestream,
      leaveLivestream,
      cleanup,
    }),
    [status, loading, error, viewerCount, remoteUsers, joinLivestream, leaveLivestream, cleanup]
  );

  return (
    <ViewerContext.Provider value={value}>
      {children}
    </ViewerContext.Provider>
  );
};

// ==================== CUSTOM HOOK ====================
/**
 * Custom hook để sử dụng Viewer context
 * @throws Error nếu sử dụng ngoài ViewerProvider
 */
export const useViewerLivestream = (): ViewerContextValue => {
  const context = useContext(ViewerContext);
  if (!context) {
    throw new Error('useViewerLivestream must be used within ViewerProvider');
  }
  return context;
};
