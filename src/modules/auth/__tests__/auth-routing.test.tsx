import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { USER_ROLES } from '@/utils/constants';
import { buildUser } from '@/test/builders';
import {
  createAuthFake,
  createRestaurantFake,
  createTestDependencies,
} from '@/test/createTestDependencies';
import { renderApp } from '@/test/renderApp';

describe('authentication and role routing journey', () => {
  it('redirects unauthenticated users to the matching portal login', async () => {
    renderApp({ route: '/restaurant/dashboard' });
    expect(
      await screen.findByRole('heading', { name: 'Đăng nhập nhà hàng' }),
    ).toBeInTheDocument();

    renderApp({ route: '/admin/dashboard' });
    expect(
      await screen.findByRole('heading', { name: 'Đăng nhập quản trị' }),
    ).toBeInTheDocument();
  });

  it('redirects an authenticated owner away from admin routes', async () => {
    const owner = buildUser();
    const auth = createAuthFake({
      isAuthenticated: vi.fn(() => true),
      getCurrentUser: vi.fn(() => owner),
      getProfile: vi.fn(async () => owner),
    });

    renderApp({
      route: '/admin/dashboard',
      dependencies: createTestDependencies({ auth }),
    });

    expect(
      await screen.findByRole('heading', { name: 'Không có quyền truy cập' }),
    ).toBeInTheDocument();
  });

  it('keeps the order-management page admin-only', async () => {
    const owner = buildUser();
    const auth = createAuthFake({
      isAuthenticated: vi.fn(() => true),
      getCurrentUser: vi.fn(() => owner),
      getProfile: vi.fn(async () => owner),
    });

    renderApp({
      route: '/admin/orders',
      dependencies: createTestDependencies({ auth }),
    });

    expect(
      await screen.findByRole('heading', { name: 'Không có quyền truy cập' }),
    ).toBeInTheDocument();
  });

  it('validates and completes the restaurant owner login journey', async () => {
    const user = userEvent.setup();
    const owner = buildUser();
    const auth = createAuthFake({
      login: vi.fn(async () => ({
        accessToken: 'owner.access.token',
        refreshToken: 'owner.refresh.token',
        user: owner,
      })),
      getProfile: vi.fn(async () => owner),
    });
    const restaurant = createRestaurantFake();
    renderApp({
      route: '/login',
      dependencies: createTestDependencies({ auth, restaurant }),
    });

    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(auth.login).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Email'), 'owner@test.dev');
    await user.type(screen.getByLabelText('Mật khẩu'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(
      await screen.findByRole('heading', { name: 'Tổng quan' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Bếp test')).not.toHaveLength(0);
    expect(auth.login).toHaveBeenCalledWith({
      email: 'owner@test.dev',
      password: 'secret123',
      role: USER_ROLES.RESTAURANT_OWNER,
    });
    expect(auth.getProfile).toHaveBeenCalledOnce();
    expect(restaurant.getMyRestaurants).toHaveBeenCalledOnce();
  });

  it('shows backend login failures and clears the partial session', async () => {
    const user = userEvent.setup();
    const auth = createAuthFake({
      login: vi.fn(async () => {
        throw new Error('Sai tài khoản hoặc mật khẩu');
      }),
    });
    renderApp({
      route: '/login',
      dependencies: createTestDependencies({ auth }),
    });

    await user.type(screen.getByLabelText('Email'), 'owner@test.dev');
    await user.type(screen.getByLabelText('Mật khẩu'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByText('Sai tài khoản hoặc mật khẩu')).toBeInTheDocument();
    expect(auth.logout).toHaveBeenCalledOnce();
  });

  it('logs an admin in and out through rendered controls', async () => {
    const user = userEvent.setup();
    const admin = buildUser({
      id: 102,
      email: 'admin@test.dev',
      name: 'Admin Test',
      role: USER_ROLES.ADMIN,
    });
    const auth = createAuthFake({
      login: vi.fn(async () => ({
        accessToken: 'admin.access.token',
        refreshToken: 'admin.refresh.token',
        user: admin,
      })),
      getProfile: vi.fn(async () => admin),
    });
    renderApp({
      route: '/admin/login',
      dependencies: createTestDependencies({ auth }),
    });

    await user.type(screen.getByLabelText('Email'), 'admin@test.dev');
    await user.type(screen.getByLabelText('Mật khẩu'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập admin' }));

    expect(
      await screen.findByRole('heading', { name: 'Quản trị hệ thống' }),
    ).toBeInTheDocument();
    expect(auth.login).toHaveBeenCalledWith({
      email: 'admin@test.dev',
      password: 'secret123',
      role: USER_ROLES.ADMIN,
    });

    await user.click(screen.getByRole('button', { name: 'Đăng xuất' }));
    await waitFor(() => expect(auth.logout).toHaveBeenCalledOnce());
    expect(
      await screen.findByRole('heading', { name: 'Đăng nhập quản trị' }),
    ).toBeInTheDocument();
  });

  it('restores a valid cached session and refreshes profile identity', async () => {
    const admin = buildUser({
      id: 102,
      email: 'admin@test.dev',
      role: USER_ROLES.ADMIN,
    });
    const auth = createAuthFake({
      isAuthenticated: vi.fn(() => true),
      getCurrentUser: vi.fn(() => admin),
      getProfile: vi.fn(async () => ({ ...admin, name: 'Admin Fresh' })),
    });

    renderApp({ dependencies: createTestDependencies({ auth }) });

    expect(
      await screen.findByRole('heading', { name: 'Quản trị hệ thống' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Admin Fresh')).toBeInTheDocument();
    expect(auth.getProfile).toHaveBeenCalledOnce();
  });

  it('restores a stored session even when the access token is already expired', async () => {
    const admin = buildUser({
      id: 102,
      email: 'admin@test.dev',
      role: USER_ROLES.ADMIN,
    });
    const restoreSession = vi.fn(async () => admin);
    const auth = createAuthFake({
      isAuthenticated: vi.fn(() => false),
      hasStoredSession: vi.fn(() => true),
      restoreSession,
    });

    renderApp({ dependencies: createTestDependencies({ auth }) });

    expect(await screen.findByRole('heading', { name: 'Quản trị hệ thống' })).toBeInTheDocument();
    expect(restoreSession).toHaveBeenCalledOnce();
  });

  it('keeps a session and retries bootstrap after a transient network failure', async () => {
    const user = userEvent.setup();
    const admin = buildUser({ role: USER_ROLES.ADMIN });
    const restoreSession = vi
      .fn()
      .mockRejectedValueOnce(new Error('Không thể kết nối đến server'))
      .mockResolvedValueOnce(admin);
    const auth = createAuthFake({
      isAuthenticated: vi.fn(() => true),
      hasStoredSession: vi.fn(() => true),
      restoreSession,
    });

    renderApp({
      route: '/admin/dashboard',
      dependencies: createTestDependencies({ auth }),
    });

    expect(await screen.findByRole('heading', { name: 'Không thể khôi phục phiên' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByRole('heading', { name: 'Quản trị hệ thống' })).toBeInTheDocument();
    expect(auth.logout).not.toHaveBeenCalled();
  });

  it('opens the admin mobile navigation and closes it after navigation', async () => {
    const user = userEvent.setup();
    const admin = buildUser({ role: USER_ROLES.ADMIN });
    const auth = createAuthFake({
      isAuthenticated: vi.fn(() => true),
      hasStoredSession: vi.fn(() => true),
      getCurrentUser: vi.fn(() => admin),
      getProfile: vi.fn(async () => admin),
    });

    renderApp({
      route: '/admin/dashboard',
      dependencies: createTestDependencies({ auth }),
    });

    await screen.findByRole('heading', { name: 'Quản trị hệ thống' });
    await user.click(screen.getByRole('button', { name: 'Mở menu' }));
    expect(screen.getByRole('dialog', { name: 'Delivery Admin' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Đơn hàng' }));
    expect(await screen.findByRole('heading', { name: 'Đơn hàng' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Delivery Admin' })).not.toBeInTheDocument();
  });

  it('does not expose a customer checkout surface in the admin/restaurant portal', async () => {
    const owner = buildUser();
    const auth = createAuthFake({
      isAuthenticated: vi.fn(() => true),
      getCurrentUser: vi.fn(() => owner),
      getProfile: vi.fn(async () => owner),
    });
    const restaurant = createRestaurantFake();

    renderApp({
      route: '/checkout',
      dependencies: createTestDependencies({ auth, restaurant }),
    });

    expect(
      await screen.findByRole('heading', { name: 'Tổng quan' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Chọn voucher')).not.toBeInTheDocument();
  });
});
