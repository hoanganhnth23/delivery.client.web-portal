import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '@/test/renderApp';
import { flowDataIntegrity, getFlow } from '@/modules/system-handbook/data/flowExplorerData';

describe('public system handbook flow explorer', () => {
  it('renders the flow-first public handbook without authentication', async () => {
    renderApp({ route: '/system-overview' });

    expect(await screen.findByRole('heading', { name: 'Hiểu hệ thống qua một luồng liên kết' })).toBeInTheDocument();
    expect(screen.getByText('Delivery System Handbook')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Mục lục handbook' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Flow Explorer/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Đăng xuất' })).not.toBeInTheDocument();
  });

  it('explores COD happy path, step inspector and failure branches', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/system-overview/workflows/cod-order' });

    expect(await screen.findByRole('heading', { name: 'Flow Explorer' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'COD order → delivery' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Tạo order immutable/ }));
    expect(screen.getAllByText('/api/orders').length).toBeGreaterThan(0);
    expect(screen.getByText('order.created')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Failure & recovery' }));
    expect(screen.getByText('Không tìm thấy shipper')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Không tìm thấy shipper/ }));
    expect(screen.getAllByText('Candidates/retries exhausted hoặc deadline matching hết hạn.').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Giữ terminal reason SHIPPER_NOT_FOUND và phát refund-eligible snapshot.').length).toBeGreaterThan(0);
  });

  it('supports deep links to service and API inspector context', async () => {
    const serviceView = renderApp({ route: '/system-overview/services/order-service' });
    expect(await screen.findByRole('heading', { name: 'Services & Contracts' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'order-service' })).toBeInTheDocument();
    serviceView.unmount();

    renderApp({ route: '/system-overview/apis?operation=order-service:OrderController.createOrder:POST:/api/orders' });
    expect(await screen.findByRole('heading', { name: 'Services & Contracts' })).toBeInTheDocument();
    expect(screen.getAllByText('/api/orders').length).toBeGreaterThan(0);
  });

  it('keeps every flow reference linked to a known API/event/step', () => {
    expect(flowDataIntegrity()).toEqual([]);
    expect(getFlow('cod-order').steps).toHaveLength(10);
  });
});
