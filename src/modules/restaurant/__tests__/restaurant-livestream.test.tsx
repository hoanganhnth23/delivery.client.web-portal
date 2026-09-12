import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AppDependencies } from '@/app/dependencies';
import type { Livestream } from '@/services/api/livestreamService';
import { USER_ROLES } from '@/utils/constants';
import { buildUser } from '@/test/builders';
import {
  createAuthFake,
  createLivestreamHostFake,
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
});
