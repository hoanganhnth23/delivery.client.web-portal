import { createAgoraPublisher, type LivestreamPublisher } from './agoraPublisher';
import { createAgoraViewer, type LivestreamViewer } from './agoraViewer';

export interface LivestreamMediaPort {
  readonly mode: 'runtime' | 'preview';
  createViewer(target: HTMLElement, onError: (message: string) => void): LivestreamViewer;
  createPublisher(target: HTMLElement, onError: (message: string) => void): LivestreamPublisher;
}

export const agoraLivestreamMedia: LivestreamMediaPort = {
  mode: 'runtime',
  createViewer: (target, onError) =>
    createAgoraViewer(import.meta.env.VITE_AGORA_APP_ID ?? '', target, onError),
  createPublisher: (target, onError) =>
    createAgoraPublisher(import.meta.env.VITE_AGORA_APP_ID ?? '', target, onError),
};

export const previewLivestreamMedia: LivestreamMediaPort = {
  mode: 'preview',
  createViewer: () => ({ start: async () => undefined, stop: async () => undefined }),
  createPublisher: () => ({
    start: async () => undefined,
    setMicrophoneEnabled: async () => undefined,
    setCameraEnabled: async () => undefined,
    stop: async () => undefined,
  }),
};
