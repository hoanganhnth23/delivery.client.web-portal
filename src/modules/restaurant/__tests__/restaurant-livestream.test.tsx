import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AppDependencies } from '@/app/dependencies';
import type { Livestream, LivestreamProduct } from '@/services/api/livestreamService';
import { USER_ROLES } from '@/utils/constants';
import { buildMenuItem, buildUser } from '@/test/builders';
import {
  createAuthFake,
  createLivestreamHostFake,
  createMenuFake,
  createNotificationFake,
  createRestaurantFake,
  createSessionStoreFake,
  createTestDependencies,
} from '@/test/createTestDependencies';
import { renderApp } from '@/test/renderApp';

const stream: Livestream = {
  id: '00000000-0000-4000-8000-000000000001',
  sellerId: 7,
  restaurantId: 201,
  title: 'Bếp trực tiếp',
  description: null,
  status: 'CREATED',
  streamProvider: 'AGORA',
  roomId: 'room-1',
  channelName: 'channel-1',
  startedAt: null,
  endedAt: null,
  viewCount: 0,
  createdAt: '2026-09-12T00:00:00.000Z',
  updatedAt: '2026-09-12T00:00:00.000Z',
  pinnedProducts: [],
};

const rice = buildMenuItem({ id: 301, name: 'Cơm test', price: 50_000 });
const pho = buildMenuItem({ id: 302, name: 'Phở test', price: 70_000 });

const pinnedProduct = (
  item: typeof rice,
  priceAtLive: number,
): LivestreamProduct => ({
  id: item.id + 1000,
  livestreamId: stream.id,
  productId: item.id,
  productName: item.name,
  productImage: item.image,
  restaurantId: stream.restaurantId,
  restaurantName: 'Bếp test',
  priceAtLive,
  isPinned: true,
  createdAt: '2026-09-12T00:00:00.000Z',
  pinnedAt: '2026-09-12T00:05:00.000Z',
});

function ownerDependencies(overrides: Partial<AppDependencies> = {}) {
  const owner = buildUser({ role: USER_ROLES.RESTAURANT_OWNER });
  return createTestDependencies({
    auth: createAuthFake({
      isAuthenticated: vi.fn(() => true),
      getCurrentUser: vi.fn(() => owner),
      getProfile: vi.fn(async () => owner),
    }),
    restaurant: createRestaurantFake(),
    sessionStore: createSessionStoreFake({
      hasToken: vi.fn(() => true),
      getCurrentRestaurantId: vi.fn(() => 201),
    }),
    ...overrides,
  });
}

describe('restaurant livestream controls', () => {
  it('inspects, creates, starts, and ends a stream through injected Gateway actions', async () => {
    const user = userEvent.setup();
    const createdStream = { ...stream, id: '00000000-0000-4000-8000-000000000002' };
    const inspect = vi.fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ ...createdStream, status: 'LIVE' as const }])
      .mockResolvedValueOnce([{ ...createdStream, status: 'ENDED' as const }]);
    const create = vi.fn(async (request) => ({ ...createdStream, title: request.title }));
    const start = vi.fn(async () => ({
      livestreamId: createdStream.id,
      channelName: createdStream.channelName,
      status: 'LIVE' as const,
      token: 'test-host-token',
      uid: 7,
      role: 'HOST' as const,
      tokenExpiresAt: '2026-09-12T01:00:00.000Z',
      title: createdStream.title,
      restaurantId: createdStream.restaurantId,
      startedAt: '2026-09-12T00:00:00.000Z',
    }));
    const end = vi.fn(async () => ({ ...createdStream, status: 'ENDED' as const }));

    renderApp({
      route: '/restaurant/livestream',
      dependencies: ownerDependencies({
        livestreamHost: createLivestreamHostFake({ inspect, create, start, end }),
      }),
    });

    expect(await screen.findByRole('heading', { name: 'Livestream' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('Tiêu đề livestream'), 'New show');
    await user.click(screen.getByRole('button', { name: 'Tạo livestream' }));
    await waitFor(() => expect(create).toHaveBeenCalledWith({
      restaurantId: 201,
      title: 'New show',
      streamProvider: 'AGORA',
    }));
    expect(await screen.findByText('New show')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Bắt đầu' }));
    await waitFor(() => expect(start).toHaveBeenCalledWith(createdStream.id));
    await user.click(screen.getByRole('button', { name: 'Kết thúc' }));
    await waitFor(() => expect(end).toHaveBeenCalledWith(createdStream.id));
  });

  it('shows a recoverable inspect error and retries', async () => {
    const user = userEvent.setup();
    const inspect = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([]);

    renderApp({
      route: '/restaurant/livestream',
      dependencies: ownerDependencies({
        livestreamHost: createLivestreamHostFake({ inspect }),
      }),
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải livestream.');
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    await waitFor(() => expect(inspect).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Chưa có livestream.')).toBeInTheDocument();
  });

  it('pins multiple real menu items with host-entered prices and unpins one', async () => {
    const user = userEvent.setup();
    const pinProduct = vi.fn(async (_streamId: string, request: { productId: number; priceAtLive: number }) => {
      const item = request.productId === rice.id ? rice : pho;
      return pinnedProduct(item, request.priceAtLive);
    });
    const unpinProduct = vi.fn(async () => undefined);

    renderApp({
      route: '/restaurant/livestream',
      dependencies: ownerDependencies({
        menu: createMenuFake({ getMyMenuItems: vi.fn(async () => [rice, pho]) }),
        livestreamHost: createLivestreamHostFake({
          inspect: vi.fn(async () => [stream]),
          listPinnedProducts: vi.fn(async () => []),
          pinProduct,
          unpinProduct,
        }),
      }),
    });

    await user.type(await screen.findByLabelText('Giá live cho Cơm test'), '45000');
    await user.click(screen.getByRole('button', { name: 'Ghim Cơm test' }));
    await user.type(screen.getByLabelText('Giá live cho Phở test'), '62000');
    await user.click(screen.getByRole('button', { name: 'Ghim Phở test' }));

    await waitFor(() => expect(pinProduct).toHaveBeenNthCalledWith(1, stream.id, {
      productId: rice.id,
      priceAtLive: 45_000,
    }));
    expect(pinProduct).toHaveBeenNthCalledWith(2, stream.id, {
      productId: pho.id,
      priceAtLive: 62_000,
    });
    expect(screen.getByText('2 món đang ghim')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Bỏ ghim Cơm test' }));
    await waitFor(() => expect(unpinProduct).toHaveBeenCalledWith(stream.id, rice.id));
    expect(screen.getByRole('button', { name: 'Ghim Cơm test' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bỏ ghim Phở test' })).toBeInTheDocument();
  });

  it('preserves pin state when pin or unpin requests fail', async () => {
    const user = userEvent.setup();
    const notifications = createNotificationFake();
    const existingPin = pinnedProduct(rice, 45_000);
    const pinProduct = vi.fn(async () => { throw new Error('pin failed'); });
    const unpinProduct = vi.fn(async () => { throw new Error('unpin failed'); });

    renderApp({
      route: '/restaurant/livestream',
      dependencies: ownerDependencies({
        menu: createMenuFake({ getMyMenuItems: vi.fn(async () => [rice, pho]) }),
        notifications,
        livestreamHost: createLivestreamHostFake({
          inspect: vi.fn(async () => [stream]),
          listPinnedProducts: vi.fn(async () => [existingPin]),
          pinProduct,
          unpinProduct,
        }),
      }),
    });

    await user.click(await screen.findByRole('button', { name: 'Bỏ ghim Cơm test' }));
    await waitFor(() => expect(unpinProduct).toHaveBeenCalledWith(stream.id, rice.id));
    expect(screen.getByRole('button', { name: 'Bỏ ghim Cơm test' })).toBeInTheDocument();

    await user.type(screen.getByLabelText('Giá live cho Phở test'), '62000');
    await user.click(screen.getByRole('button', { name: 'Ghim Phở test' }));
    await waitFor(() => expect(pinProduct).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Ghim Phở test' })).toBeInTheDocument();
    expect(notifications.error).toHaveBeenCalledTimes(2);
  });

  it('loads pins for the selected room and retries a failed pin list', async () => {
    const user = userEvent.setup();
    const secondStream: Livestream = {
      ...stream,
      id: '00000000-0000-4000-8000-000000000002',
      title: 'Bếp tối',
      roomId: 'room-2',
      channelName: 'channel-2',
    };
    const listPinnedProducts = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([pinnedProduct(rice, 45_000)])
      .mockResolvedValueOnce([{ ...pinnedProduct(pho, 62_000), livestreamId: secondStream.id }]);

    renderApp({
      route: '/restaurant/livestream',
      dependencies: ownerDependencies({
        menu: createMenuFake({ getMyMenuItems: vi.fn(async () => [rice, pho]) }),
        livestreamHost: createLivestreamHostFake({
          inspect: vi.fn(async () => [stream, secondStream]),
          listPinnedProducts,
        }),
      }),
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải món ghim.');
    await user.click(screen.getByRole('button', { name: 'Thử tải món ghim' }));
    expect(await screen.findByRole('button', { name: 'Bỏ ghim Cơm test' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Xem Studio' }));
    await waitFor(() => expect(listPinnedProducts).toHaveBeenLastCalledWith(secondStream.id));
    expect(await screen.findByRole('button', { name: 'Bỏ ghim Phở test' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ghim Cơm test' })).toBeInTheDocument();
  });
});
