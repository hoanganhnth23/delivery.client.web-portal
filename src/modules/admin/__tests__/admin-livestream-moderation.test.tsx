import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { USER_ROLES } from '@/utils/constants';
import { buildUser } from '@/test/builders';
import { createAuthFake, createLivestreamHostFake, createTestDependencies } from '@/test/createTestDependencies';
import { renderApp } from '@/test/renderApp';
import type { Livestream } from '@/services/api/livestreamService';
import type { LivestreamMediaPort } from '@/services/media/livestreamMedia';
import type { ViewerSession } from '@/services/media/agoraViewer';
const room: Livestream = {
  id: '00000000-0000-4000-8000-000000000002', sellerId: 7, restaurantId: 42,
  title: 'Phiên từ server', status: 'LIVE', streamProvider: 'AGORA',
  description: null, roomId: 'room', channelName: 'channel', viewCount: 3,
  createdAt: '2026-09-13T01:00:00Z', updatedAt: '2026-09-13T01:00:00Z',
  startedAt: '2026-09-13T01:00:00Z', endedAt: null, pinnedProducts: [],
};
const list = async () => ({ content: [room], page: 0, size: 20, totalElements: 1, totalPages: 1 });

it('joins and plays the selected live room for admin monitoring, then stops on close', async () => {
  const user = userEvent.setup();
  const admin = buildUser({ id: 900, role: USER_ROLES.ADMIN });
  const session = {
    livestreamId: room.id, channelName: room.channelName, title: room.title,
    restaurantId: room.restaurantId, token: 'admin-viewer-token', uid: 900,
    tokenExpiresAt: '2026-09-13T02:00:00Z', sellerId: room.sellerId,
    startedAt: room.startedAt!, currentViewers: null,
  };
  const viewerStart = vi.fn(async (_session: ViewerSession) => undefined);
  const viewer = { start: viewerStart, stop: vi.fn(async () => undefined) };
  const media: LivestreamMediaPort = {
    mode: 'runtime',
    createViewer: vi.fn(() => viewer),
    createPublisher: vi.fn(() => ({
      start: vi.fn(async () => undefined), setMicrophoneEnabled: vi.fn(async () => undefined),
      setCameraEnabled: vi.fn(async () => undefined), stop: vi.fn(async () => undefined),
    })),
  };
  const join = vi.fn(async () => session);
  const renewToken = vi.fn(async () => 'renewed-admin-viewer-token');

  renderApp({ route: '/admin/livestreams', dependencies: createTestDependencies({
    auth: createAuthFake({ isAuthenticated: () => true, getCurrentUser: () => admin, getProfile: async () => admin }),
    livestreamModeration: { moderate: vi.fn(), list },
    livestreamHost: createLivestreamHostFake({ join, renewToken }),
    livestreamMedia: media,
  }) });

  await user.click(await screen.findByTestId('btn-monitor-' + room.id));
  await waitFor(() => expect(viewerStart).toHaveBeenCalledWith(expect.objectContaining(session)));
  expect(join).toHaveBeenCalledWith(room.id);
  const mediaSession = viewerStart.mock.calls[0][0];
  await expect(mediaSession.renewToken!()).resolves.toBe('renewed-admin-viewer-token');
  expect(renewToken).toHaveBeenCalledWith(room.id, {
    channelName: session.channelName,
    uid: session.uid,
    role: 'VIEWER',
  });
  expect(media.createViewer).toHaveBeenCalled();
  await user.click(within(screen.getByRole('dialog', { name: /Giám sát:/ })).getByRole('button', { name: 'Đóng giám sát' }));
  await waitFor(() => expect(viewer.stop).toHaveBeenCalledTimes(1));
});

it('unpins only the selected product after audited success, keeping others', async () => {
  const user = userEvent.setup();
  const admin = buildUser({ id: 900, role: USER_ROLES.ADMIN });
  const pins = [10, 11].map((productId) => ({
    id: productId, livestreamId: room.id, productId, productName: 'Món ' + productId,
    productImage: null, restaurantId: 42, restaurantName: null, priceAtLive: 40000,
    isPinned: true, createdAt: room.createdAt, pinnedAt: room.startedAt,
  }));
  const moderate = vi.fn().mockRejectedValueOnce(new Error('offline'))
    .mockImplementationOnce(async (id, request) => ({
      auditId: 12, livestreamId: id, action: request.action,
      productId: request.productId, appliedAt: room.createdAt,
    }));
  renderApp({ route: '/admin/livestreams', dependencies: createTestDependencies({
    auth: createAuthFake({ isAuthenticated: () => true, getCurrentUser: () => admin, getProfile: async () => admin }),
    livestreamModeration: { moderate, list: async () => ({ ...(await list()), content: [{ ...room, pinnedProducts: pins }] }) },
  }) });
  await user.click(await screen.findByTestId('btn-monitor-' + room.id));
  const monitor = screen.getByRole('dialog', { name: /Giám sát:/ });
  await user.click(within(monitor).getByRole('button', { name: 'Gỡ ghim Món 11' }));
  const confirm = screen.getByRole('dialog', { name: 'Gỡ món ghim' });
  await user.type(within(confirm).getByLabelText('Lý do gỡ món'), 'Sai thông tin');
  await user.click(within(confirm).getByRole('button', { name: 'Xác nhận gỡ món' }));
  expect(await within(confirm).findByRole('alert')).toHaveTextContent('Không thể gỡ');
  await user.click(within(confirm).getByRole('button', { name: 'Xác nhận gỡ món' }));
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Gỡ món ghim' })).not.toBeInTheDocument());
  expect(moderate).toHaveBeenLastCalledWith(room.id, { action: 'UNPIN', productId: 11, reason: 'Sai thông tin' });
  expect(within(monitor).getByRole('button', { name: 'Gỡ ghim Món 10' })).toBeInTheDocument();
  expect(within(monitor).queryByRole('button', { name: 'Gỡ ghim Món 11' })).not.toBeInTheDocument();
});


it('keeps the warning form on audit failure and only closes after success', async () => {
  const user = userEvent.setup();
  const admin = buildUser({ id: 900, role: USER_ROLES.ADMIN });
  const moderate = vi.fn()
    .mockRejectedValueOnce(new Error('offline'))
    .mockImplementationOnce(async (id, request) => ({
      auditId: 8, livestreamId: id, action: request.action,
      productId: null, appliedAt: '2026-09-13T01:00:00Z',
    }));
  renderApp({ route: '/admin/livestreams', dependencies: createTestDependencies({
    auth: createAuthFake({
      isAuthenticated: () => true, getCurrentUser: () => admin, getProfile: async () => admin,
    }),
    livestreamModeration: { moderate, list },
  }) });
  await user.click((await screen.findAllByRole('button', { name: 'Cảnh báo' }))[0]);
  const dialog = screen.getByRole('dialog', { name: 'Cảnh báo kiểm duyệt' });
  await user.type(within(dialog).getByLabelText('Lý do cảnh báo'), 'Thông tin sai');
  await user.click(within(dialog).getByRole('button', { name: 'Gửi cảnh báo' }));
  expect(await within(dialog).findByRole('alert')).toHaveTextContent('Không thể lưu cảnh báo');
  expect(moderate).toHaveBeenCalledWith(expect.any(String), { action: 'WARN', reason: 'Thông tin sai' });
  await user.click(within(dialog).getByRole('button', { name: 'Gửi cảnh báo' }));
  expect(screen.queryByRole('dialog', { name: 'Cảnh báo kiểm duyệt' })).not.toBeInTheDocument();
});

it('requires a reason and an audit acknowledgement before force-ending a room', async () => {
  const user = userEvent.setup();
  const admin = buildUser({ id: 900, role: USER_ROLES.ADMIN });
  const moderate = vi.fn().mockRejectedValueOnce(new Error('offline'))
    .mockImplementationOnce(async (id, request) => ({
      auditId: 9, livestreamId: id, action: request.action, productId: null,
      appliedAt: '2026-09-13T01:00:00Z',
    }));
  renderApp({ route: '/admin/livestreams', dependencies: createTestDependencies({
    auth: createAuthFake({ isAuthenticated: () => true, getCurrentUser: () => admin, getProfile: async () => admin }),
    livestreamModeration: { moderate, list },
  }) });
  const id = '00000000-0000-4000-8000-000000000002';
  await user.click(await screen.findByTestId('btn-monitor-' + id));
  const monitor = screen.getByRole('dialog', { name: /Giám sát: Nhà hàng #42/ });
  await user.click(within(monitor).getByRole('button', { name: 'Dừng phát sóng khẩn cấp' }));
  const confirm = screen.getByRole('dialog', { name: 'Dừng phát sóng' });
  expect(moderate).not.toHaveBeenCalled();
  expect(within(confirm).getByRole('button', { name: 'Xác nhận dừng' })).toBeDisabled();
  await user.type(within(confirm).getByLabelText('Lý do dừng'), 'Nội dung vi phạm');
  await user.click(within(confirm).getByRole('button', { name: 'Xác nhận dừng' }));
  expect(await within(confirm).findByRole('alert')).toHaveTextContent('Không thể dừng');
  expect(within(monitor).getByText('Đang phát')).toBeInTheDocument();
  await user.click(within(confirm).getByRole('button', { name: 'Xác nhận dừng' }));
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Dừng phát sóng' })).not.toBeInTheDocument());
  expect(moderate).toHaveBeenLastCalledWith(id, { action: 'FORCE_END', reason: 'Nội dung vi phạm' });
  expect(within(monitor).getByText('Đã kết thúc')).toBeInTheDocument();
});

it('shows error without fixture rooms then recovers via retry', async () => {
  const user = userEvent.setup();
  const admin = buildUser({ id: 900, role: USER_ROLES.ADMIN });
  const load = vi.fn().mockRejectedValueOnce(new Error('offline')).mockImplementationOnce(list);
  renderApp({ route: '/admin/livestreams', dependencies: createTestDependencies({
    auth: createAuthFake({ isAuthenticated: () => true, getCurrentUser: () => admin, getProfile: async () => admin }),
    livestreamModeration: { list: load, moderate: vi.fn() },
  }) });
  expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải');
  expect(screen.queryByText('Quán Test HÀ ĐÔNG')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Cảnh báo' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Thử lại' }));
  expect(await screen.findByText('Phiên từ server')).toBeInTheDocument();
  expect(load).toHaveBeenLastCalledWith(0, 20);
});
