import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { USER_ROLES, ROUTES } from '@/utils/constants';
import { buildUser } from '@/test/builders';
import { createAuthFake, createTestDependencies } from '@/test/createTestDependencies';
import { renderApp } from '@/test/renderApp';
import { writeCustomerCart } from '../cart/cart';

const customer = buildUser({ id: 101, email: 'customer@test.dev', name: 'Customer Test', role: USER_ROLES.USER });

const customerDependencies = () => createTestDependencies({
  auth: createAuthFake({
    isAuthenticated: vi.fn(() => true),
    hasStoredSession: vi.fn(() => true),
    getCurrentUser: vi.fn(() => customer),
    getProfile: vi.fn(async () => customer),
    restoreSession: vi.fn(async () => customer),
  }),
});

describe('customer ordering journey', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('redirects an anonymous customer checkout attempt to customer login', async () => {
    renderApp({ route: ROUTES.CUSTOMER_CHECKOUT });
    expect(await screen.findByRole('heading', { name: 'Đăng nhập để đặt món' })).toBeInTheDocument();
  });

  it('renders public catalog without a customer session', async () => {
    renderApp({ route: ROUTES.HOME });
    expect(await screen.findByRole('heading', { name: 'Nhà hàng gần bạn' })).toBeInTheDocument();
    expect(await screen.findByText('Bếp test')).toBeInTheDocument();
  });

  it('previews and creates a COD order with one idempotency key', async () => {
    const user = userEvent.setup();
    const dependencies = customerDependencies();
    writeCustomerCart({
      restaurantId: 201,
      restaurantName: 'Bếp test',
      items: [{ menuItemId: 301, restaurantId: 201, restaurantName: 'Bếp test', menuItemName: 'Cơm test', price: 50_000, quantity: 1 }],
    });
    renderApp({ route: ROUTES.CUSTOMER_CHECKOUT, dependencies });

    expect(await screen.findByRole('heading', { name: 'Xác nhận đơn hàng' })).toBeInTheDocument();
    expect(await screen.findByText('Tổng COD')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Đặt đơn COD' }));

    await waitFor(() => expect(dependencies.order.createCustomerOrder).toHaveBeenCalledOnce());
    expect(dependencies.order.checkoutPreview).toHaveBeenCalledOnce();
    expect(dependencies.order.createCustomerOrder).toHaveBeenCalledWith(
      expect.objectContaining({ paymentMethod: 'COD', quoteId: expect.any(String) }),
      expect.stringMatching(/^[0-9a-f-]{36}$/),
    );
    expect(await screen.findByRole('heading', { name: 'Chi tiết đơn hàng' })).toBeInTheDocument();
  });

  it('reuses the same idempotency key when the backend reports an in-progress request', async () => {
    const user = userEvent.setup();
    const inProgress = Object.assign(new Error('Đang xử lý'), { code: 'IDEMPOTENCY_IN_PROGRESS' });
    const createCustomerOrder = vi.fn().mockRejectedValue(inProgress);
    const dependencies = createTestDependencies({
      ...customerDependencies(),
      order: {
        ...customerDependencies().order,
        createCustomerOrder,
      },
    });
    writeCustomerCart({
      restaurantId: 201,
      restaurantName: 'Bếp test',
      items: [{ menuItemId: 301, restaurantId: 201, restaurantName: 'Bếp test', menuItemName: 'Cơm test', price: 50_000, quantity: 1 }],
    });
    renderApp({ route: ROUTES.CUSTOMER_CHECKOUT, dependencies });
    await screen.findByRole('heading', { name: 'Xác nhận đơn hàng' });
    const button = await screen.findByRole('button', { name: 'Đặt đơn COD' });
    await user.click(button);
    await waitFor(() => expect(createCustomerOrder).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole('button', { name: 'Đặt đơn COD' }));
    await waitFor(() => expect(createCustomerOrder).toHaveBeenCalledTimes(2));
    expect(createCustomerOrder.mock.calls[0][1]).toBe(createCustomerOrder.mock.calls[1][1]);
  });
});
