import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useLivestreamPublisher } from '../useLivestreamPublisher';
import type { LivestreamMediaPort } from '../livestreamMedia';

const session = {
  livestreamId: 'live-1', channelName: 'room', token: 'token', uid: 4,
  status: 'LIVE' as const, role: 'HOST' as const, tokenExpiresAt: '2026-10-12T00:00:00Z',
  title: 'Test live', restaurantId: 1, startedAt: '2026-10-12T00:00:00Z',
};
const makePort = (start = vi.fn(async () => undefined)) => {
  const publisher = {
    start,
    stop: vi.fn(async () => undefined),
    setMicrophoneEnabled: vi.fn(async () => undefined),
    setCameraEnabled: vi.fn(async () => undefined),
  };
  return { publisher, port: { mode: 'preview', createPublisher: vi.fn(() => publisher) } as unknown as LivestreamMediaPort };
};

describe('useLivestreamPublisher', () => {
  it('connects, controls, and disconnects the current publisher', async () => {
    const { publisher, port } = makePort();
    const { result } = renderHook(() => useLivestreamPublisher(port));
    const target = document.createElement('div');
    result.current.targetRef.current = target;
    await act(() => result.current.connect(session));
    expect(result.current.status).toBe('connected');
    expect(result.current.streamId).toBe('live-1');
    await act(() => result.current.setMicrophoneEnabled(false));
    await act(() => result.current.setCameraEnabled(false));
    expect(result.current.microphoneEnabled).toBe(false);
    expect(result.current.cameraEnabled).toBe(false);
    await act(() => result.current.disconnect());
    expect(publisher.stop).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('idle');
    await expect(result.current.setCameraEnabled(true)).rejects.toThrow('Studio chưa kết nối');
  });

  it('rejects without a target and maps start failures to error state', async () => {
    const { port } = makePort();
    const first = renderHook(() => useLivestreamPublisher(port));
    await expect(act(async () => { await first.result.current.connect(session); })).rejects.toThrow('Khung xem trước');
    first.unmount();

    const failure = vi.fn(async () => { throw new Error('camera denied'); });
    const { port: failingPort } = makePort(failure);
    const { result } = renderHook(() => useLivestreamPublisher(failingPort));
    result.current.targetRef.current = document.createElement('div');
    await act(async () => { await result.current.connect(session).catch(() => undefined); });
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('camera denied');
  });

  it('ignores stale publisher errors and replaces a previous publisher', async () => {
    const firstError = vi.fn();
    const firstPublisher = { start: vi.fn(async () => undefined), stop: vi.fn(async () => undefined), setMicrophoneEnabled: vi.fn(async () => undefined), setCameraEnabled: vi.fn(async () => undefined) };
    const secondPublisher = { start: vi.fn(async () => undefined), stop: vi.fn(async () => undefined), setMicrophoneEnabled: vi.fn(async () => undefined), setCameraEnabled: vi.fn(async () => undefined) };
    const port = { mode: 'preview', createPublisher: vi.fn()
      .mockReturnValueOnce(firstPublisher)
      .mockReturnValueOnce(secondPublisher) } as unknown as LivestreamMediaPort;
    const { result } = renderHook(() => useLivestreamPublisher(port));
    result.current.targetRef.current = document.createElement('div');
    await act(() => result.current.connect(session));
    await act(() => result.current.connect({ ...session, livestreamId: 'live-2' }));
    expect(firstPublisher.stop).toHaveBeenCalled();
    expect(result.current.streamId).toBe('live-2');
    // The callback is only stateful for the currently installed publisher.
    expect(firstError).not.toHaveBeenCalled();
  });
});
