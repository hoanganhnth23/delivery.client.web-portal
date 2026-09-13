import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { it, expect, vi } from 'vitest';
import { renderApp } from '@/test/renderApp';
import { createTestDependencies, createAuthFake, createLivestreamHostFake } from '@/test/createTestDependencies';
import { buildUser } from '@/test/builders';
import { USER_ROLES } from '@/utils/constants';
import type { Livestream } from '@/services/api/livestreamService';
import type { LivestreamMediaPort } from '@/services/media/livestreamMedia';
import type { ViewerSession } from '@/services/media/agoraViewer';

const room: Livestream = {
  id: '00000000-0000-4000-8000-000000000001', restaurantId: 42, sellerId: 7,
  title: 'Bếp thật từ API', status: 'LIVE', streamProvider: 'AGORA',
  roomId: 'room', channelName: 'channel', description: null, viewCount: 8,
  createdAt: '2026-09-13T01:00:00Z', updatedAt: '2026-09-13T01:00:00Z',
  startedAt: '2026-09-13T01:00:00Z', endedAt: null, pinnedProducts: [],
};
const customer = buildUser({ role: USER_ROLES.USER });
function deps(host: ReturnType<typeof createLivestreamHostFake>) {
  return createTestDependencies({
    auth: createAuthFake({ isAuthenticated: () => true, getCurrentUser: () => customer, getProfile: async () => customer }),
    livestreamHost: host,
  });
}
it('loads real list, retries errors and opens server detail', async () => {
  const user = userEvent.setup();
  const getActive = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([room]);
  const getById = vi.fn(async () => room);
  renderApp({ route: '/customer/livestreams', dependencies: deps(createLivestreamHostFake({ getActive, getById })) });
  expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải');
  expect(screen.queryByText('Trà Sữa Xiang Cha')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Thử lại' }));
  await user.click(await screen.findByRole('link', { name: 'Bếp thật từ API' }));
  expect(await screen.findByRole('heading', { name: room.title })).toBeInTheDocument();
  expect(getById).toHaveBeenCalledWith(room.id);
});
it('shows empty active list without inventing rooms', async () => {
  renderApp({ route: '/customer/livestreams', dependencies: deps(createLivestreamHostFake({ getActive: async () => [] })) });
  expect(await screen.findByText('Chưa có phiên đang phát.')).toBeInTheDocument();
});
it('does not load livestream data for a signed-out user', async () => {
  const getActive = vi.fn(async () => [room]);
  renderApp({ route: '/customer/livestreams', dependencies: createTestDependencies({
    auth: createAuthFake({ isAuthenticated: () => false, getCurrentUser: () => null }),
    livestreamHost: createLivestreamHostFake({ getActive }),
  }) });
  expect(await screen.findByRole('button', { name: 'Đăng nhập' })).toBeInTheDocument();
  expect(getActive).not.toHaveBeenCalled();
});

it('joins viewer media with a validated server token renewal callback', async () => {
  const session = {
    livestreamId: room.id,
    channelName: room.channelName,
    title: room.title,
    restaurantId: room.restaurantId,
    token: 'viewer-token',
    uid: 101,
    tokenExpiresAt: '2026-09-13T02:00:00Z',
    sellerId: room.sellerId,
    startedAt: room.startedAt!,
    currentViewers: null,
  };
  const viewerStart = vi.fn(async (_session: ViewerSession) => undefined);
  const viewer = { start: viewerStart, stop: vi.fn(async () => undefined) };
  const media: LivestreamMediaPort = {
    mode: 'runtime',
    createViewer: vi.fn(() => viewer),
    createPublisher: vi.fn(() => ({
      start: vi.fn(async () => undefined),
      setMicrophoneEnabled: vi.fn(async () => undefined),
      setCameraEnabled: vi.fn(async () => undefined),
      stop: vi.fn(async () => undefined),
    })),
  };
  const renewToken = vi.fn(async () => 'renewed-viewer-token');
  renderApp({
    route: `/customer/livestreams/${room.id}`,
    dependencies: {
      ...deps(createLivestreamHostFake({
        getById: vi.fn(async () => room),
        join: vi.fn(async () => session),
        renewToken,
      })),
      livestreamMedia: media,
    },
  });

  await waitFor(() => expect(viewerStart).toHaveBeenCalledWith(expect.objectContaining(session)));
  const mediaSession = viewerStart.mock.calls[0][0];
  await expect(mediaSession.renewToken!()).resolves.toBe('renewed-viewer-token');
  expect(renewToken).toHaveBeenCalledWith(room.id, {
    channelName: session.channelName,
    uid: session.uid,
    role: 'VIEWER',
  });
});
