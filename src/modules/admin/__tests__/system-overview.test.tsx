import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '@/test/renderApp';
import { flowDataIntegrity, getFlow } from '@/modules/system-handbook/data/flowExplorerData';
import MarkdownDocument from '@/modules/system-handbook/components/MarkdownDocument';

describe('public system handbook flow explorer', () => {
  it('presents the overview as a capability map with linked paths', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/system-overview' });

    expect(await screen.findByRole('heading', { name: 'Hệ thống Delivery có những chức năng gì?' }, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Các tính năng chính' })).toBeInTheDocument();
    expect(screen.getByText('Đặt món COD')).toBeInTheDocument();
    expect(screen.getAllByText('order-service').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Khách hàng', { exact: true }).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Xem luồng Đặt món COD' }));
    expect(await screen.findByRole('heading', { name: 'Flow Explorer' }, { timeout: 3000 })).toBeInTheDocument();
  });

  it('keeps overview copy and metadata readable', async () => {
    renderApp({ route: '/system-overview' });

    expect(await screen.findByRole('heading', { name: 'Đặt món COD' }, { timeout: 3000 })).toHaveClass('text-base');
    expect(screen.getByText('Giỏ hàng, báo giá, tạo đơn có idempotency và theo dõi trạng thái đơn.')).toHaveClass('text-sm', 'text-slate-600');
    expect(screen.getAllByText('Ai sử dụng')[0]).toHaveClass('text-xs');
    expect(screen.getByRole('tab', { name: /Nghiệp vụ chính/ })).toHaveClass('text-sm');
  });

  it('renders each actor as a complete readable label', async () => {
    renderApp({ route: '/system-overview' });

    const orderingCard = (await screen.findByRole('heading', { name: 'Tài khoản & phiên đăng nhập' }, { timeout: 3000 })).closest('article');
    expect(orderingCard).not.toBeNull();
    expect(within(orderingCard as HTMLElement).getByText('Người giao hàng', { exact: true })).toBeInTheDocument();
  });

  it('renders the flow-first public handbook without authentication', async () => {
    renderApp({ route: '/system-overview' });

    expect(await screen.findByRole('heading', { name: 'Hệ thống Delivery có những chức năng gì?' }, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText('Delivery System Handbook')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Mục lục handbook' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Flow Explorer/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Đăng xuất' })).not.toBeInTheDocument();
  });

  it('explores COD happy path, step inspector and failure branches', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/system-overview/workflows/cod-order' });

    expect(await screen.findByRole('heading', { name: 'Flow Explorer' }, { timeout: 3000 })).toBeInTheDocument();
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
    expect(await screen.findByRole('heading', { name: 'Services & Contracts' }, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'order-service' })).toBeInTheDocument();
    serviceView.unmount();

    renderApp({ route: '/system-overview/apis?operation=order-service:OrderController.createOrder:POST:/api/orders' });
    expect(await screen.findByRole('heading', { name: 'Services & Contracts' }, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getAllByText('/api/orders').length).toBeGreaterThan(0);
  });

  it('explores architecture nodes and communication edges', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/system-overview/architecture' });

    expect(await screen.findByRole('heading', { name: 'Bối cảnh hệ thống' }, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText('HTTPS / REST')).toBeInTheDocument();
    expect(screen.getByText('Kafka / Event')).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Chọn góc nhìn kiến trúc' }), 'runtime');
    await user.click(await screen.findByRole('button', { name: /order-service.*Checkout/i }, { timeout: 3000 }));
    expect((await screen.findAllByRole('heading', { name: 'order-service' })).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Checkout + order state').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Trách nhiệm cốt lõi').length).toBeGreaterThan(0);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Chọn flow để highlight' }), 'cod-order');
    await screen.findByText('Đang highlight: COD order → delivery', { exact: true });
    const desktopEdgeLabel = (await screen.findAllByRole('button', { name: /delivery_app.*API Gateway.*HTTPS REST/i }))
      .find((button) => button.closest('.react-flow__edgelabel-renderer'));
    expect(desktopEdgeLabel).toBeDefined();
    await user.click(desktopEdgeLabel as HTMLElement);
    expect(screen.getAllByText('Communication edge', { exact: true }).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bearer token qua public Gateway origin').length).toBeGreaterThan(0);
  });

  it('selects a highlighted connection from its desktop edge label', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/system-overview/architecture' });

    await screen.findByRole('heading', { name: 'Bối cảnh hệ thống' }, { timeout: 3000 });
    await user.selectOptions(screen.getByRole('combobox', { name: 'Chọn flow để highlight' }), 'cod-order');
    await screen.findByText('Đang highlight: COD order → delivery', { exact: true });
    const edgeLabels = await screen.findAllByRole('button', { name: /delivery_app.*API Gateway.*HTTPS REST/i });
    const desktopEdgeLabel = edgeLabels.find((button) => button.closest('.react-flow__edgelabel-renderer')) || edgeLabels[0];
    expect(desktopEdgeLabel).toBeDefined();
    expect(screen.queryByText('Communication edge', { exact: true })).not.toBeInTheDocument();

    await user.click(desktopEdgeLabel as HTMLElement);
    expect(screen.getAllByText('Communication edge', { exact: true }).length).toBeGreaterThan(0);
  });

  it('fits the full architecture graph after the async layout settles', async () => {
    renderApp({ route: '/system-overview/architecture' });

    await screen.findByRole('heading', { name: 'Bối cảnh hệ thống' }, { timeout: 3000 });
    await waitFor(() => {
      const transform = document.querySelector('.xyflow__viewport')?.getAttribute('style') ?? '';
      expect(transform).toMatch(/scale\(0\./);
    }, { timeout: 3000 });
  });

  it('does not activate a flow lens from an unknown deep link', async () => {
    renderApp({ route: '/system-overview/architecture?flow=not-a-real-flow' });

    await screen.findByRole('heading', { name: 'Bối cảnh hệ thống' }, { timeout: 3000 });
    expect(screen.getByText('Không dùng flow làm sơ đồ chính', { exact: true })).toBeInTheDocument();
    expect(screen.queryByText(/Đang highlight:/)).not.toBeInTheDocument();
  });

  it('uses the mobile list without mounting the desktop canvas on narrow viewports', async () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    const view = renderApp({ route: '/system-overview/architecture' });

    try {
      expect(await screen.findByRole('heading', { name: 'Danh sách theo lớp' }, { timeout: 3000 })).toBeInTheDocument();
      expect(screen.queryByRole('application')).not.toBeInTheDocument();
    } finally {
      view.unmount();
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth });
    }
  });

  it('keeps every flow reference linked to a known API/event/step', () => {
    expect(flowDataIntegrity()).toEqual([]);
    expect(getFlow('cod-order').steps).toHaveLength(10);
  });

  it('serves the searchable docs portal without authentication and supports a document deep link', async () => {
    const user = userEvent.setup();
    renderApp({ route: '/system-overview/docs' });

    expect(await screen.findByRole('heading', { name: 'Tài liệu hệ thống' }, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText(/77 tài liệu/)).toBeInTheDocument();
    expect(within(screen.getByRole('navigation', { name: 'Mục lục handbook' })).getByRole('button', { name: /Tài liệu.*Markdown canonical corpus/ })).toHaveAttribute('aria-current', 'page');

    const search = screen.getByRole('textbox', { name: 'Tìm tài liệu' });
    await user.type(search, 'service-catalog.md');
    expect(screen.getByRole('button', { name: /service-catalog/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /service-catalog/ }));
    expect((await screen.findAllByText('backend_delivery/docs/platform/system/service-catalog.md')).length).toBeGreaterThanOrEqual(2);
    expect((await screen.findAllByRole('heading', { name: /Service Catalog and Ownership/i })).length).toBeGreaterThanOrEqual(2);
  });

  it('renders Markdown safely and maps internal links to the handbook', () => {
    render(
      <MarkdownDocument
        source="backend_delivery/docs/platform/system/README.md"
        documents={[{
          id: 'doc-service-catalog',
          source: 'backend_delivery/docs/platform/system/service-catalog.md',
          title: 'Service catalog',
        }]}
        content={'# Heading\n\n| Name | Value |\n| --- | --- |\n| Gateway | :8079 |\n\n```bash\ncurl /health\n```\n\n[Service catalog](./service-catalog.md) · [Unsafe](javascript:alert(1))'}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Heading' })).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('curl /health')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Service catalog' })).toHaveAttribute('href', '/system-overview/docs/doc-service-catalog');
    expect(screen.queryByRole('link', { name: 'Unsafe' })).not.toBeInTheDocument();
    expect(screen.getByText('Unsafe')).toBeInTheDocument();
  });
});
