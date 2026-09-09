import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ShipperPreview from './ShipperPreview';
import { advance } from './shipperModel';

vi.mock('./ShipperMap', () => ({ default: () => <div>Bản đồ mẫu</div> }));

function open(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <ShipperPreview />
    </MemoryRouter>
  );
}

function swipe(element: HTMLElement) {
  fireEvent.pointerDown(element, { clientX: 0, pointerId: 1 });
  fireEvent.pointerMove(element, { clientX: 300, pointerId: 1 });
  fireEvent.pointerUp(element, { clientX: 300, pointerId: 1 });
}

describe('shipper delivery preview', () => {
  it('guards canonical COD, connection and strict proximity at 200m', () => {
    expect(advance('ASSIGNED', 200, true, true)).toBe('ASSIGNED');
    expect(advance('ASSIGNED', 50, false, true)).toBe('ASSIGNED');
    expect(advance('ASSIGNED', 50, true, false)).toBe('ASSIGNED');
    expect(advance('ASSIGNED', 199, true, true)).toBe('PICKED_UP');
    expect(advance('DELIVERED', 50, true, true)).toBe('DELIVERED');
  });

  it('completes the delivery only after pickup and arrival at the customer via swipe', async () => {
    open('/preview/shipper/offer?view=phone');
    swipe(screen.getByRole('button', { name: /nhận đơn/i }));
    const pickup = await screen.findByRole('button', { name: /xác nhận đã lấy hàng/i });
    expect(pickup).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(screen.getByRole('button', { name: /mô phỏng đã đến điểm/i }));
    swipe(pickup);
    swipe(screen.getByRole('button', { name: /bắt đầu giao hàng/i }));
    expect(screen.getByRole('button', { name: /giao hàng thành công/i })).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(screen.getByRole('button', { name: /mô phỏng đã đến điểm/i }));
    swipe(screen.getByRole('button', { name: /giao hàng thành công/i }));
    expect(screen.getByRole('heading', { name: 'Giao hàng thành công!' })).toBeInTheDocument();
  });

  it('blocks expired offers', () => {
    open('/preview/shipper/offer?case=expired');
    expect(screen.getByRole('button', { name: /nhận đơn/i })).toHaveAttribute('aria-disabled', 'true');
  });

  it('blocks accepting while another trip is active', () => {
    open('/preview/shipper/offer?case=busy');
    expect(screen.getByRole('button', { name: /nhận đơn/i })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('chuyến khác');
  });

  it('keeps a batch active after the first delivery and finishes after both', async () => {
    open('/preview/shipper/offer?case=batch&view=phone');
    swipe(screen.getByRole('button', { name: /nhận 2 đơn/i }));
    for (let index = 0; index < 2; index++) {
      const pickup = await screen.findByRole('button', { name: /xác nhận đã lấy hàng/i });
      fireEvent.click(screen.getByRole('button', { name: /mô phỏng đã đến điểm/i }));
      swipe(pickup);
      swipe(screen.getByRole('button', { name: /bắt đầu giao hàng/i }));
      fireEvent.click(screen.getByRole('button', { name: /mô phỏng đã đến điểm/i }));
      swipe(screen.getByRole('button', { name: /giao hàng thành công/i }));
      if (index === 0) expect(screen.queryByRole('heading', { name: 'Giao hàng thành công!' })).not.toBeInTheDocument();
    }
    expect(screen.getByRole('heading', { name: 'Giao hàng thành công!' })).toBeInTheDocument();
    expect(screen.getByText('44.000đ')).toBeInTheDocument();
  });

  it('requires a reason before cancellation', () => {
    open('/preview/shipper/detail');
    fireEvent.click(screen.getByRole('button', { name: 'Hủy chuyến này' }));
    expect(screen.getByRole('button', { name: 'Xác nhận hủy chuyến' })).toBeDisabled();
    fireEvent.click(screen.getByLabelText('Xe gặp sự cố'));
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận hủy chuyến' }));
    expect(screen.getByRole('status')).toHaveTextContent('Xe gặp sự cố');
  });

  it('renders earnings screen with tabs and breakdown', () => {
    open('/preview/shipper/earnings');
    expect(screen.getByText('TỔNG QUAN THU NHẬP')).toBeInTheDocument();
    expect(screen.getByText('426.000đ')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tuần này' }));
    expect(screen.getByText('2.850.000đ')).toBeInTheDocument();
  });

  it('renders permissions onboarding and allows granting', () => {
    open('/preview/shipper/permissions');
    expect(screen.getByText('Cấp quyền để nhận đơn')).toBeInTheDocument();
    expect(screen.getByText(/Vị trí chính xác/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /cho phép tất cả quyền/i }));
    expect(screen.getByRole('status')).toHaveTextContent('Đã cấp toàn bộ quyền');
  });

  it('renders payout settings and allows saving bank account', () => {
    open('/preview/shipper/payout');
    expect(screen.getByRole('heading', { level: 2, name: 'Cài đặt thanh toán' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Lưu cài đặt thanh toán' }));
    expect(screen.getByRole('status')).toHaveTextContent('Đã lưu thông tin');
  });

  it('renders vehicle details and supports saving', () => {
    open('/preview/shipper/vehicle');
    expect(screen.getByRole('heading', { level: 2, name: 'Thông tin phương tiện' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thông tin phương tiện' }));
    expect(screen.getByRole('status')).toHaveTextContent('Đã cập nhật thông tin phương tiện');
  });

  it('renders incident report and allows submission', () => {
    open('/preview/shipper/incident');
    expect(screen.getAllByText('Báo cáo sự cố')[0]).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Gửi báo cáo sự cố' }));
    expect(screen.getByRole('status')).toHaveTextContent('Đã gửi báo cáo sự cố');
  });

  it('supports forgot password 3-step wizard', () => {
    open('/preview/shipper/forgot');
    expect(screen.getByText('Khôi phục mật khẩu')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Gửi mã xác thực OTP' }));
    expect(screen.getByText(/Mã OTP 4 số đã được gửi đến/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận OTP' }));
    expect(screen.getByText('Tạo mật khẩu mới cho tài khoản của bạn:')).toBeInTheDocument();
  });
});
