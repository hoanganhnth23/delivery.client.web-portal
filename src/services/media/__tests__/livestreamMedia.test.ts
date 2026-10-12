import { describe, expect, it, vi } from 'vitest';
import { agoraLivestreamMedia, previewLivestreamMedia } from '../livestreamMedia';

describe('preview livestream media', () => {
  it('provides no-op viewer and publisher ports for previews', async () => {
    const viewer = previewLivestreamMedia.createViewer(document.createElement('div'), vi.fn());
    await viewer.start({ channelName: 'preview', token: '', uid: 1 });
    await viewer.stop();
    const publisher = previewLivestreamMedia.createPublisher(document.createElement('div'), vi.fn());
    await publisher.start({ channelName: 'preview', token: '', uid: 1 });
    await publisher.setMicrophoneEnabled(false);
    await publisher.setCameraEnabled(false);
    await publisher.stop();
    expect(previewLivestreamMedia.mode).toBe('preview');
  });

  it('creates runtime ports with the configured application id', () => {
    const target = document.createElement('div');
    expect(agoraLivestreamMedia.mode).toBe('runtime');
    expect(agoraLivestreamMedia.createViewer(target, vi.fn())).toHaveProperty('start');
    expect(agoraLivestreamMedia.createPublisher(target, vi.fn())).toHaveProperty('start');
  });
});
