import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import PortalPreview from './PortalPreview';
import { resetPreviewSupportChat } from '../support-preview/previewSupportChat';

const renderPreview = (path: string) => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="*" element={<PortalPreview />} />
    </Routes>
  </MemoryRouter>,
);

describe('production portal preview', () => {
  beforeEach(() => {
    resetPreviewSupportChat();
  });

  it('renders the real Admin dashboard with fixture-backed dependencies', async () => {
    renderPreview('/preview/admin/dashboard?view=phone');

    expect(await screen.findByRole('heading', { name: 'Quản trị hệ thống' })).toBeInTheDocument();
    expect(screen.getByText('1.248')).toBeInTheDocument();
    expect(screen.getByText('Xu hướng kinh doanh')).toBeInTheDocument();
    expect(screen.getByText('Quán Test HÀ ĐÔNG')).toBeInTheDocument();
  });

  it('renders the real Restaurant dashboard with the Hanoi fixture', async () => {
    renderPreview('/preview/restaurant/dashboard?view=phone');

    expect(await screen.findByRole('heading', { name: 'Tổng quan' })).toBeInTheDocument();
    expect(screen.getAllByText('Quán Test HÀ ĐÔNG').length).toBeGreaterThan(0);
    expect(screen.getByText('12 Trần Phú, Hà Đông, Hà Nội')).toBeInTheDocument();
    expect(screen.getByText(/Đang mở cửa/)).toHaveTextContent('0901234567');
  });

  it('keeps real portal links inside the preview and preserves phone mode', async () => {
    renderPreview('/preview/admin/dashboard?view=phone');

    const ordersLinks = await screen.findAllByRole('link', { name: /Đơn hàng/ });
    fireEvent.click(ordersLinks[0]);

    expect(await screen.findByRole('heading', { name: 'Đơn hàng' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Dashboard/ })).toHaveAttribute(
      'href',
      '/preview/admin/dashboard?view=phone',
    );
  });

  it('lets admin open a selected restaurant from the restaurant list', async () => {
    renderPreview('/preview/admin/restaurants?view=phone');

    expect((await screen.findAllByRole('heading', { name: 'Quản lý nhà hàng' })).length).toBeGreaterThan(0);
    expect(screen.queryByText('Cổng nhà hàng')).not.toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Mở cổng nhà hàng Phở Lý Quốc Sư - 25 Phủ Doãn' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mở cổng nhà hàng Phở Lý Quốc Sư - 25 Phủ Doãn' }));

    expect(await screen.findByRole('heading', { name: 'Tổng quan' })).toBeInTheDocument();
    expect(screen.getAllByText('Phở Lý Quốc Sư - 25 Phủ Doãn').length).toBeGreaterThan(0);
    const orderLinks = screen.getAllByRole('link', { name: /Đơn hàng/ });
    expect(orderLinks.some((link) => link.getAttribute('href') === '/preview/restaurant/orders?view=phone')).toBe(true);
  });

  it('keeps the admin order filters separate from batch actions and search', async () => {
    renderPreview('/preview/admin/orders?view=responsive');

    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Lọc trạng thái đơn hàng' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'PENDING' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('searchbox', { name: 'Tìm kiếm đơn hàng' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Xác nhận tất cả đơn chờ/ })).toBeInTheDocument();
  });

  it('renders the real admin support inbox with the local preview chat adapter', async () => {
    const user = userEvent.setup();
    renderPreview('/preview/admin/chat?view=workbench');

    const runtime = document.querySelector('.portal-preview-runtime');
    expect(runtime).toHaveClass('portal-preview-mode-workbench');
    expect(runtime).not.toHaveClass('portal-preview-toolbar');
    expect(screen.getByRole('region', { name: 'Điều khiển preview' })).toHaveClass('portal-preview-toolbar');

    expect((await screen.findAllByText('Khách trải nghiệm')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('Mình cần hỗ trợ đơn hàng #1001')).length).toBeGreaterThan(0);

    const input = await screen.findByLabelText('Nội dung trả lời khách hàng');
    await user.type(input, 'Mình đã tiếp nhận yêu cầu của bạn.');
    await user.click(screen.getByRole('button', { name: 'Gửi tin nhắn' }));

    expect((await screen.findAllByText('Mình đã tiếp nhận yêu cầu của bạn.')).length).toBeGreaterThan(0);
  });

  it('exposes the same status filter semantics for restaurant orders', async () => {
    renderPreview('/preview/restaurant/orders?view=responsive');

    expect(await screen.findByRole('heading', { name: 'Quản lý đơn hàng' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Lọc trạng thái đơn hàng' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Chờ xác nhận/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('uses the real menu page and form dialog for the restaurant preview', async () => {
    renderPreview('/preview/restaurant/menu?view=phone');

    expect(await screen.findByRole('heading', { name: 'Quản lý Menu' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Sửa Hủ tiếu khô' })).toBeInTheDocument();
    expect(document.querySelector('img[src*="grab.com"]')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Sửa Hủ tiếu khô' }));
    expect(screen.getByRole('dialog', { name: 'Chỉnh sửa món ăn' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Chỉnh sửa món ăn' })).not.toBeInTheDocument();
  });

  it('uses the real mobile drawer and closes it with Escape', async () => {
    renderPreview('/preview/admin/shippers?view=phone');

    fireEvent.click(await screen.findByRole('button', { name: 'Mở menu' }));
    expect(screen.getByRole('dialog', { name: 'Delivery Admin' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Delivery Admin' })).not.toBeInTheDocument();
  });
});
