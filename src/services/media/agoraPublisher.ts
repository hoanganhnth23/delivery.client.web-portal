import type {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';
import type { ViewerSession } from './agoraViewer';

export interface LivestreamPublisher {
  start(session: ViewerSession): Promise<void>;
  setMicrophoneEnabled(enabled: boolean): Promise<void>;
  setCameraEnabled(enabled: boolean): Promise<void>;
  stop(): Promise<void>;
}

// API reference: https://api-ref.agora.io/en/video-sdk/web/4.x/interfaces/iagorartcclient.html
// Track lifecycle: https://api-ref.agora.io/en/video-sdk/web/4.x/interfaces/ilocalvideotrack.html
export function createAgoraPublisher(
  appId: string,
  target: HTMLElement,
  onError: (message: string) => void,
): LivestreamPublisher {
  let disposed = false;
  let client: IAgoraRTCClient | undefined;
  let audioTrack: IMicrophoneAudioTrack | undefined;
  let videoTrack: ICameraVideoTrack | undefined;
  let joining: Promise<unknown> | undefined;
  let publishing: Promise<void> | undefined;
  let renewing: Promise<void> | undefined;
  let joined = false;
  let published = false;
  let cleanup: Promise<void> | undefined;

  const closeTracks = () => {
    videoTrack?.stop();
    audioTrack?.close();
    videoTrack?.close();
    audioTrack = undefined;
    videoTrack = undefined;
  };

  const stop = () => {
    disposed = true;
    if (!cleanup) {
      cleanup = (async () => {
        if (joining) {
          try { await joining; } catch { /* Continue releasing local resources. */ }
        }
        if (publishing) {
          try { await publishing; } catch { /* Failed publication still needs cleanup. */ }
        }
        client?.removeAllListeners();
        if (published && client && audioTrack && videoTrack) {
          try { await client.unpublish([audioTrack, videoTrack]); } catch { /* Best-effort teardown. */ }
        }
        closeTracks();
        if (joined && client) {
          try { await client.leave(); } catch { /* The session is already locally disposed. */ }
        }
      })();
    }
    return cleanup;
  };

  return {
    stop,
    async start(session) {
      if (disposed) return;
      if (!/^[a-f0-9]{32}$/i.test(appId)) throw new Error('Thiếu Agora App ID');
      try {
        const { default: agora } = await import('agora-rtc-sdk-ng');
        if (disposed) return;
        agora.setLogLevel(4);
        agora.disableLogUpload();
        client = agora.createClient({ mode: 'live', codec: 'vp8' });
        const active = client;
        active.on('token-privilege-did-expire', () => {
          if (!disposed) onError('Phiên phát sóng hết hạn. Vui lòng kết nối lại.');
          void stop();
        });
        active.on('token-privilege-will-expire', () => {
          if (disposed || renewing) return;
          const operation = (async () => {
            try {
              if (!session.renewToken) throw new Error('Token renewal is unavailable');
              const token = await session.renewToken();
              if (disposed || client !== active) return;
              await active.renewToken(token);
            } catch {
              if (!disposed) {
                onError('Không thể gia hạn phiên phát. Vui lòng kết nối lại.');
                void stop();
              }
            } finally {
              renewing = undefined;
            }
          })();
          renewing = operation;
        });
        await active.setClientRole('host');
        if (disposed) return;
        joining = active.join(appId, session.channelName, session.token, session.uid);
        await joining;
        joined = true;
        if (disposed) {
          await stop();
          return;
        }

        const [createdAudioTrack, createdVideoTrack] = await agora.createMicrophoneAndCameraTracks();
        if (disposed) {
          createdVideoTrack.stop();
          createdAudioTrack.close();
          createdVideoTrack.close();
          return;
        }
        audioTrack = createdAudioTrack;
        videoTrack = createdVideoTrack;
        videoTrack.play(target);
        publishing = active.publish([audioTrack, videoTrack]);
        await publishing;
        published = true;
      } catch {
        await stop();
        throw new Error('Không thể kết nối camera và micro để phát livestream.');
      }
    },
    async setMicrophoneEnabled(enabled) {
      if (disposed || !audioTrack) throw new Error('Micro chưa sẵn sàng.');
      await audioTrack.setEnabled(enabled);
    },
    async setCameraEnabled(enabled) {
      if (disposed || !videoTrack) throw new Error('Camera chưa sẵn sàng.');
      await videoTrack.setEnabled(enabled);
    },
  };
}
