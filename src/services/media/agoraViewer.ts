import type { IAgoraRTCClient, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';

export interface ViewerSession {
  channelName: string;
  token: string;
  uid: number;
  renewToken?: () => Promise<string>;
}
export interface LivestreamViewer {
  start(session: ViewerSession): Promise<void>;
  stop(): Promise<void>;
}
// API reference: https://api-ref.agora.io/en/video-sdk/web/4.x/interfaces/iagorartcclient.html
export function createAgoraViewer(appId: string, target: HTMLElement, onError: (message: string) => void): LivestreamViewer {
  let disposed = false;
  let client: IAgoraRTCClient | undefined;
  let joining: Promise<unknown> | undefined;
  let renewing: Promise<void> | undefined;
  let cleanup: Promise<void> | undefined;
  const publicationVersions = new Map<string, number>();
  const publicationKey = (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') =>
    `${typeof user.uid}:${user.uid}:${mediaType}`;
  const stop = () => {
    disposed = true;
    if (!cleanup) cleanup = (async () => {
      if (joining) { try { await joining; } catch { /* Join failure still needs cleanup. */ } }
      client?.removeAllListeners();
      for (const user of client?.remoteUsers ?? []) {
        user.videoTrack?.stop(); user.audioTrack?.stop();
      }
      if (client) await client.leave();
    })();
    return cleanup;
  };
  return {
    stop,
    async start(session) {
      if (disposed) return;
      if (!/^[a-f0-9]{32}$/i.test(appId)) throw new Error('Thiếu Agora App ID');
      const { default: agora } = await import('agora-rtc-sdk-ng');
      if (disposed) return;
      agora.setLogLevel(4);
      agora.disableLogUpload();
      client = agora.createClient({ mode: 'live', codec: 'vp8' });
      const active = client;
      active.on('user-published', (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
        const key = publicationKey(user, mediaType);
        const version = (publicationVersions.get(key) ?? 0) + 1;
        publicationVersions.set(key, version);
        void (async () => {
          try {
            await active.subscribe(user, mediaType);
            if (disposed || publicationVersions.get(key) !== version) return;
            if (mediaType === 'video') user.videoTrack?.play(target);
            else user.audioTrack?.play();
          } catch {
            if (!disposed) onError('Không thể phát livestream. Vui lòng kết nối lại.');
          }
        })();
      });
      active.on('user-unpublished', (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
        const key = publicationKey(user, mediaType);
        publicationVersions.set(key, (publicationVersions.get(key) ?? 0) + 1);
        if (mediaType === 'video') user.videoTrack?.stop();
        else user.audioTrack?.stop();
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
              onError('Không thể gia hạn phiên xem. Vui lòng kết nối lại.');
              void stop().catch(() => undefined);
            }
          } finally {
            renewing = undefined;
          }
        })();
        renewing = operation;
      });
      active.on('token-privilege-did-expire', () => {
        if (!disposed) onError('Phiên xem hết hạn. Vui lòng kết nối lại.');
        void stop().catch(() => undefined);
      });
      try {
        await active.setClientRole('audience');
        if (disposed) return;
        joining = active.join(appId, session.channelName, session.token, session.uid);
        await joining;
      } catch {
        await stop();
        throw new Error('Không thể kết nối video livestream.');
      }
    },
  };
}
