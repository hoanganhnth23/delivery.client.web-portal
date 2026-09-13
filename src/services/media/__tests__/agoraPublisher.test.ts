import { beforeEach, expect, it, vi } from 'vitest';
import { createAgoraPublisher } from '../agoraPublisher';

const audioTrack = vi.hoisted(() => ({
  setEnabled: vi.fn(async (..._args: unknown[]): Promise<void> => undefined),
  close: vi.fn(),
}));
const videoTrack = vi.hoisted(() => ({
  play: vi.fn(),
  stop: vi.fn(),
  setEnabled: vi.fn(async (..._args: unknown[]): Promise<void> => undefined),
  close: vi.fn(),
}));
const sdk = vi.hoisted(() => ({
  on: vi.fn(),
  removeAllListeners: vi.fn(),
  setClientRole: vi.fn(async (..._args: unknown[]): Promise<void> => undefined),
  join: vi.fn(async () => 7),
  renewToken: vi.fn(async (..._args: unknown[]): Promise<void> => undefined),
  publish: vi.fn(async (..._args: unknown[]): Promise<void> => undefined),
  unpublish: vi.fn(async (..._args: unknown[]): Promise<void> => undefined),
  leave: vi.fn(async (): Promise<void> => undefined),
}));
const agora = vi.hoisted(() => ({
  createClient: vi.fn(() => sdk),
  createMicrophoneAndCameraTracks: vi.fn(async () => [audioTrack, videoTrack]),
  setLogLevel: vi.fn(),
  disableLogUpload: vi.fn(),
}));

vi.mock('agora-rtc-sdk-ng', () => ({ default: agora }));

beforeEach(() => {
  vi.resetAllMocks();
  sdk.setClientRole.mockResolvedValue(undefined);
  sdk.join.mockResolvedValue(7);
  sdk.publish.mockResolvedValue(undefined);
  sdk.renewToken.mockResolvedValue(undefined);
  sdk.unpublish.mockResolvedValue(undefined);
  sdk.leave.mockResolvedValue(undefined);
  agora.createClient.mockReturnValue(sdk);
  agora.createMicrophoneAndCameraTracks.mockResolvedValue([audioTrack, videoTrack]);
  audioTrack.setEnabled.mockResolvedValue(undefined);
  videoTrack.setEnabled.mockResolvedValue(undefined);
});

it('renews the Agora token before its privilege expires', async () => {
  const renewToken = vi.fn(async () => 'renewed-host-token');
  const publisher = createAgoraPublisher('a'.repeat(32), document.createElement('div'), vi.fn());
  await publisher.start({ ...session, renewToken });

  const expiring = sdk.on.mock.calls.find(([event]) => event === 'token-privilege-will-expire')?.[1];
  expect(expiring).toBeTypeOf('function');
  expiring();

  await vi.waitFor(() => expect(sdk.renewToken).toHaveBeenCalledWith('renewed-host-token'));
  expect(renewToken).toHaveBeenCalledTimes(1);
  await publisher.stop();
});

const session = { channelName: 'restaurant-live', token: 'synthetic-host-token', uid: 7 };

it('joins as host, previews the camera, and publishes both local tracks', async () => {
  const target = document.createElement('div');
  const publisher = createAgoraPublisher('a'.repeat(32), target, vi.fn());

  await publisher.start(session);

  expect(sdk.setClientRole).toHaveBeenCalledWith('host');
  expect(sdk.join).toHaveBeenCalledWith('a'.repeat(32), session.channelName, session.token, session.uid);
  expect(videoTrack.play).toHaveBeenCalledWith(target);
  expect(sdk.publish).toHaveBeenCalledWith([audioTrack, videoTrack]);
});

it('controls the actual microphone and camera tracks', async () => {
  const publisher = createAgoraPublisher('a'.repeat(32), document.createElement('div'), vi.fn());
  await publisher.start(session);

  await publisher.setMicrophoneEnabled(false);
  await publisher.setCameraEnabled(false);

  expect(audioTrack.setEnabled).toHaveBeenCalledWith(false);
  expect(videoTrack.setEnabled).toHaveBeenCalledWith(false);
});

it('unpublishes, releases devices, and leaves only once', async () => {
  const publisher = createAgoraPublisher('a'.repeat(32), document.createElement('div'), vi.fn());
  await publisher.start(session);

  await Promise.all([publisher.stop(), publisher.stop()]);

  expect(sdk.unpublish).toHaveBeenCalledTimes(1);
  expect(sdk.unpublish).toHaveBeenCalledWith([audioTrack, videoTrack]);
  expect(audioTrack.close).toHaveBeenCalledTimes(1);
  expect(videoTrack.stop).toHaveBeenCalledTimes(1);
  expect(videoTrack.close).toHaveBeenCalledTimes(1);
  expect(sdk.leave).toHaveBeenCalledTimes(1);
});

it('reports token expiry and releases the live session', async () => {
  const onError = vi.fn();
  const publisher = createAgoraPublisher('a'.repeat(32), document.createElement('div'), onError);
  await publisher.start(session);

  const expired = sdk.on.mock.calls.find(([event]) => event === 'token-privilege-did-expire')?.[1];
  expect(expired).toBeTypeOf('function');
  expired();
  await vi.waitFor(() => expect(sdk.leave).toHaveBeenCalledTimes(1));
  expect(onError).toHaveBeenCalledWith('Phiên phát sóng hết hạn. Vui lòng kết nối lại.');
});

it('does not request devices after disposal during lazy SDK loading', async () => {
  const publisher = createAgoraPublisher('a'.repeat(32), document.createElement('div'), vi.fn());
  const starting = publisher.start(session);
  await publisher.stop();
  await starting;

  expect(agora.createMicrophoneAndCameraTracks).not.toHaveBeenCalled();
  expect(sdk.join).not.toHaveBeenCalled();
});
