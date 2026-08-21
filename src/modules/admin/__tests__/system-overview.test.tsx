import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { USER_ROLES } from '@/utils/constants';
import { buildUser } from '@/test/builders';
import { createAuthFake, createTestDependencies } from '@/test/createTestDependencies';
import { renderApp } from '@/test/renderApp';

function adminDependencies() {
  const admin = buildUser({ role: USER_ROLES.ADMIN, name: 'Admin Test' });
  return createTestDependencies({
    auth: createAuthFake({
      isAuthenticated: vi.fn(() => true),
      getCurrentUser: vi.fn(() => admin),
      getProfile: vi.fn(async () => admin),
    }),
  });
}

describe('admin system overview', () => {
  it('keeps the architecture view Admin-only', async () => {
    const owner = buildUser();
    renderApp({
      route: '/admin/system-overview',
      dependencies: createTestDependencies({
        auth: createAuthFake({
          isAuthenticated: vi.fn(() => true),
          getCurrentUser: vi.fn(() => owner),
          getProfile: vi.fn(async () => owner),
        }),
      }),
    });

    expect(await screen.findByRole('heading', { name: 'Không có quyền truy cập' })).toBeInTheDocument();
  });

  it('renders the architecture map and exposes its Admin navigation entry', async () => {
    renderApp({
      route: '/admin/system-overview',
      dependencies: adminDependencies(),
    });

    expect(await screen.findByRole('heading', { name: 'Hiểu hệ thống Delivery' })).toBeInTheDocument();
    expect(screen.getByText('delivery_app')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /API Gateway/ })).toBeInTheDocument();
    expect(screen.getByText('Kafka')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Kiến trúc hệ thống/ })).toHaveAttribute(
      'href',
      '/admin/system-overview',
    );
  });

  it('filters map nodes and shows the selected service contract', async () => {
    const user = userEvent.setup();
    renderApp({
      route: '/admin/system-overview',
      dependencies: adminDependencies(),
    });

    await screen.findByRole('heading', { name: 'Hiểu hệ thống Delivery' });
    await user.click(screen.getByRole('button', { name: 'Backend' }));
    expect(screen.getByRole('button', { name: /order-service/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delivery_app/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /order-service/ }));
    expect(screen.getByRole('heading', { name: 'order-service' })).toBeInTheDocument();
    expect(screen.getByText('Immutable money/location snapshot')).toBeInTheDocument();
    expect(screen.getByText('order_db + transactional outbox')).toBeInTheDocument();
  });

  it('switches between the order flow and service catalog views', async () => {
    const user = userEvent.setup();
    renderApp({
      route: '/admin/system-overview',
      dependencies: adminDependencies(),
    });

    await screen.findByRole('heading', { name: 'Hiểu hệ thống Delivery' });
    await user.click(screen.getByRole('tab', { name: 'Luồng đặt hàng' }));
    expect(screen.getByRole('heading', { name: 'Từ đặt món đến đối soát COD' })).toBeInTheDocument();
    expect(screen.getByText('Khách tạo đơn')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Nhà hàng xác nhận/ }));
    expect(screen.getByRole('heading', { name: 'restaurant-service' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Service catalog' }));
    expect(screen.getByRole('heading', { name: 'Service catalog' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Hidden/Off' }));
    expect(screen.getByRole('button', { name: /promotion-service/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /order-service/ })).not.toBeInTheDocument();
  });
});
