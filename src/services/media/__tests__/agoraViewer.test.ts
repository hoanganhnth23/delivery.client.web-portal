import { expect, it, vi, beforeEach } from 'vitest';
import { createAgoraViewer } from '../agoraViewer';
const sdk = vi.hoisted(() => ({
  on: vi.fn(), removeAllListeners: vi.fn(), setClientRole: vi.fn(async () => undefined),
  join: vi.fn(async () => 12), leave: vi.fn(async () => undefined),
  renewToken: vi.fn(async (..._args: unknown[]): Promise<void> => undefined),
  subscribe: vi.fn(async (..._args: unknown[]): Promise<void> => undefined), remoteUsers: [],
}));
vi.mock('agora-rtc-sdk-ng', () => ({ default: {
  createClient: () => sdk, setLogLevel: vi.fn(), disableLogUpload: vi.fn(),
} }));
beforeEach(() => {
  vi.resetAllMocks();
  sdk.setClientRole.mockResolvedValue(undefined);
  sdk.join.mockResolvedValue(12);
  sdk.leave.mockResolvedValue(undefined);
  sdk.renewToken.mockResolvedValue(undefined);
  sdk.subscribe.mockResolvedValue(undefined);
});

it('renews the Agora token before its privilege expires', async () => {
  const renewToken = vi.fn(async () => 'renewed-viewer-token');
  const viewer = createAgoraViewer('a'.repeat(32), document.createElement('div'), vi.fn());
  await viewer.start({ ...session, renewToken });

  const expiring = sdk.on.mock.calls.find(([event]) => event === 'token-privilege-will-expire')?.[1];
  expect(expiring).toBeTypeOf('function');
  expiring();

  await vi.waitFor(() => expect(sdk.renewToken).toHaveBeenCalledWith('renewed-viewer-token'));
  expect(renewToken).toHaveBeenCalledTimes(1);
  await viewer.stop();
});
const session = { channelName: 'room', token: 'synthetic-token', uid: 12 };
it('joins as audience with server credentials and leaves on disposal', async () => {
  const viewer = createAgoraViewer('a'.repeat(32), document.createElement('div'), vi.fn());
  await viewer.start(session);
  expect(sdk.setClientRole).toHaveBeenCalledWith('audience');
  expect(sdk.join).toHaveBeenCalledWith('a'.repeat(32), 'room', 'synthetic-token', 12);
  await viewer.stop();
  expect(sdk.leave).toHaveBeenCalled();
});
it('missing configuration fails before joining', async () => {
  const viewer = createAgoraViewer('', document.createElement('div'), vi.fn());
  await expect(viewer.start(session)).rejects.toThrow('App ID');
  expect(sdk.join).not.toHaveBeenCalled();
});
it('disposal before SDK loading completes prevents joining', async () => {
  const viewer = createAgoraViewer('a'.repeat(32), document.createElement('div'), vi.fn());
  const starting = viewer.start(session);
  await viewer.stop();
  await starting;
  expect(sdk.join).not.toHaveBeenCalled();
});

it('never plays a subscription that completes after unpublish', async () => {
  let resolve: (() => void) | undefined;
  sdk.subscribe.mockImplementationOnce(() => new Promise<void>((done) => { resolve = done; }));
  const viewer = createAgoraViewer('a'.repeat(32), document.createElement('div'), vi.fn());
  await viewer.start(session);
  const user = { uid: 7, videoTrack: { play: vi.fn(), stop: vi.fn() } };
  const published = sdk.on.mock.calls.find(([event]) => event === 'user-published')?.[1];
  const unpublished = sdk.on.mock.calls.find(([event]) => event === 'user-unpublished')?.[1];
  expect(unpublished).toBeTypeOf('function');
  published(user, 'video');
  unpublished(user, 'video');
  resolve?.();
  await Promise.resolve();
  expect(user.videoTrack.play).not.toHaveBeenCalled();
  await viewer.stop();
});

it('subscribes once per event and stops tracks on unpublish', async () => {
  const target = document.createElement('div');
  const viewer = createAgoraViewer('a'.repeat(32), target, vi.fn());
  await viewer.start(session);
  const user = { uid: 7, videoTrack: { play: vi.fn(), stop: vi.fn() } };
  const published = sdk.on.mock.calls.find(([event]) => event === 'user-published')?.[1];
  published(user, 'video');
  await Promise.resolve();
  expect(sdk.subscribe).toHaveBeenCalledWith(user, 'video');
  expect(user.videoTrack.play).toHaveBeenCalledWith(target);
  const unpublished = sdk.on.mock.calls.find(([event]) => event === 'user-unpublished')?.[1];
  expect(unpublished).toBeTypeOf('function');
  unpublished(user, 'video');
  expect(user.videoTrack.stop).toHaveBeenCalled();
  await viewer.stop();
});
