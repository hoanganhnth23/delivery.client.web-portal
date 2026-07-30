import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Order, PageData } from '@/types/api.types';
import { USER_ROLES } from '@/utils/constants';
import { buildOrder, buildUser } from '@/test/builders';
import {
  createAuthFake,
  createOrderFake,
  createRestaurantFake,
  createSessionStoreFake,
  createTestDependencies,
} from '@/test/createTestDependencies';
import { renderApp } from '@/test/renderApp';
import type { AppDependencies } from '@/app/dependencies';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

const page = (
  items: Order[],
  overrides: Partial<PageData<Order>> = {},
): PageData<Order> => ({
  items,
  page: 0,
  size: 10,
  totalItems: items.length,
  totalPages: 1,
  hasNext: false,
  ...overrides,
});

function ownerDependencies(
  order: ReturnType<typeof createOrderFake>,
  overrides: Partial<AppDependencies> = {},
) {
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
    order,
    ...overrides,
  });
}

describe('restaurant order actions', () => {
  it('loads a pending order, confirms it and converges from the refreshed page', async () => {
    const user = userEvent.setup();
    const pending = buildOrder();
    const confirmed = buildOrder({ status: 'CONFIRMED' });
    const getMyOrders = vi
      .fn()
      .mockResolvedValueOnce(page([pending]))
      .mockResolvedValue(page([confirmed]));
    const confirmOrder = vi.fn(async () => 'CONFIRMED' as const);
    const order = createOrderFake({ getMyOrders, confirmOrder });

    renderApp({
      route: '/restaurant/orders',
      dependencies: ownerDependencies(order),
    });

    expect(await screen.findByText('Đơn hàng #401')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Xác nhận đơn #401' }));

    await waitFor(() => expect(confirmOrder).toHaveBeenCalledWith(401, 201, 30));
    await waitFor(() => expect(getMyOrders).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Đã xác nhận')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Xác nhận đơn #401' }),
    ).not.toBeInTheDocument();
  });

  it('uses the injected delay while bounding an eventually-consistent refresh', async () => {
    const user = userEvent.setup();
    const pending = buildOrder();
    const getMyOrders = vi.fn(async () => page([pending]));
    const wait = vi.fn(async () => undefined);

    renderApp({
      route: '/restaurant/orders',
      dependencies: ownerDependencies(
        createOrderFake({
          getMyOrders,
          confirmOrder: vi.fn(async () => 'CONFIRMED' as const),
        }),
        { delay: { wait } },
      ),
    });

    await user.click(
      await screen.findByRole('button', { name: 'Xác nhận đơn #401' }),
    );

    await waitFor(() => expect(getMyOrders).toHaveBeenCalledTimes(4));
    expect(wait.mock.calls).toEqual([[500], [1000]]);
  });

  it('requires a rejection reason and sends the trimmed operator input', async () => {
    const user = userEvent.setup();
    const pending = buildOrder();
    const cancelled = buildOrder({ status: 'CANCELLED' });
    const getMyOrders = vi
      .fn()
      .mockResolvedValueOnce(page([pending]))
      .mockResolvedValue(page([cancelled]));
    const rejectOrder = vi.fn(async () => 'REJECTED' as const);
    const prompt = vi.spyOn(window, 'prompt').mockReturnValue('  Hết nguyên liệu  ');
    const order = createOrderFake({ getMyOrders, rejectOrder });

    renderApp({
      route: '/restaurant/orders',
      dependencies: ownerDependencies(order),
    });
    await user.click(
      await screen.findByRole('button', { name: 'Từ chối đơn #401' }),
    );

    expect(prompt).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(rejectOrder).toHaveBeenCalledWith(401, 201, 'Hết nguyên liệu');
    });
    expect(await screen.findByText('Đã hủy')).toBeInTheDocument();
  });

  it('shows mutation errors and leaves the pending actions available for retry', async () => {
    const user = userEvent.setup();
    const confirmOrder = vi.fn(async () => {
      throw { response: { data: { message: 'Đơn đã được xử lý' } } };
    });
    const order = createOrderFake({
      getMyOrders: vi.fn(async () => page([buildOrder()])),
      confirmOrder,
    });

    renderApp({
      route: '/restaurant/orders',
      dependencies: ownerDependencies(order),
    });
    await user.click(
      await screen.findByRole('button', { name: 'Xác nhận đơn #401' }),
    );

    expect(await screen.findByText('Đơn đã được xử lý')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Xác nhận đơn #401' }),
    ).toBeInTheDocument();
  });

  it('keeps an in-flight decision single-submit and visibly disabled', async () => {
    const user = userEvent.setup();
    const pendingDecision = deferred<'CONFIRMED'>();
    const pending = buildOrder();
    const confirmed = buildOrder({ status: 'CONFIRMED' });
    const getMyOrders = vi
      .fn()
      .mockResolvedValueOnce(page([pending]))
      .mockResolvedValue(page([confirmed]));
    const confirmOrder = vi.fn(() => pendingDecision.promise);

    renderApp({
      route: '/restaurant/orders',
      dependencies: ownerDependencies(createOrderFake({ getMyOrders, confirmOrder })),
    });

    const confirmButton = await screen.findByRole('button', {
      name: 'Xác nhận đơn #401',
    });
    await user.click(confirmButton);

    await waitFor(() => expect(confirmOrder).toHaveBeenCalledOnce());
    expect(confirmButton).toBeDisabled();
    await user.click(confirmButton);
    expect(confirmOrder).toHaveBeenCalledOnce();

    pendingDecision.resolve('CONFIRMED');
    expect(await screen.findByText('Đã xác nhận')).toBeInTheDocument();
  });

  it('filters locally and requests the selected backend page', async () => {
    const user = userEvent.setup();
    const getMyOrders = vi.fn(async (requestedPage = 0) => page(
      [buildOrder(), buildOrder({ id: 402, status: 'DELIVERED' })],
      { page: requestedPage, totalItems: 20, totalPages: 2, hasNext: requestedPage === 0 },
    ));
    const order = createOrderFake({ getMyOrders });

    renderApp({
      route: '/restaurant/orders',
      dependencies: ownerDependencies(order),
    });
    expect(await screen.findByText('Đơn hàng #401')).toBeInTheDocument();
    expect(screen.getByText('Đơn hàng #402')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Đã giao (1)' }));
    expect(screen.queryByText('Đơn hàng #401')).not.toBeInTheDocument();
    expect(screen.getByText('Đơn hàng #402')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Tiếp/ }));
    await waitFor(() => expect(getMyOrders).toHaveBeenLastCalledWith(1, 10));
  });
});
