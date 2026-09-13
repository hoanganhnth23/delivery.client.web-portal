import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import PortalPreview from './PortalPreview';

function setup() {
  render(<MemoryRouter initialEntries={['/preview/admin/livestreams']}><PortalPreview /></MemoryRouter>);
  return userEvent.setup();
}

describe('livestream responsive workspace', () => {
  it('trims search and keeps a clear empty-state recovery', async () => {
    const user = setup();
    const search = await screen.findByRole('searchbox', { name: 'Tìm livestream' });
    await user.type(search, ' Trà Sữa Xiang Cha ');
    expect(screen.getByRole('heading', { name: 'Trà Sữa Xiang Cha' })).toBeInTheDocument();
    await user.clear(search);
    await user.type(search, 'khong-ton-tai');
    expect(screen.getByText('Không tìm thấy phòng livestream nào phù hợp.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }));
    expect(screen.getByRole('heading', { name: 'Trà Sữa Xiang Cha' })).toBeInTheDocument();
  });

  it('closes only the top dialog on Escape and preserves moderation', async () => {
    const user = setup();
    await user.click(await screen.findByTestId('btn-monitor-00000000-0000-4000-8000-000000000002'));
    const monitor = screen.getByRole('dialog', { name: /Giám sát: Trà Sữa/ });
    expect(within(monitor).getByText('Khung giám sát preview')).toBeInTheDocument();
    await user.click(within(monitor).getByRole('button', { name: 'Gửi cảnh báo đến Host' }));
    expect(screen.getByRole('dialog', { name: /Cảnh báo kiểm duyệt/ })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: /Cảnh báo kiểm duyệt/ })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /Giám sát: Trà Sữa/ })).toBeInTheDocument();
    expect(within(monitor).getByRole('button', { name: 'Gửi cảnh báo đến Host' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('btn-monitor-00000000-0000-4000-8000-000000000002')).toHaveFocus();
  });

  it('preserves warning, unpin and stop controls in preview', async () => {
    const user = setup();
    await user.click(await screen.findByTestId('btn-monitor-00000000-0000-4000-8000-000000000002'));
    const monitor = screen.getByRole('dialog', { name: /Giám sát: Trà Sữa/ });
    await user.click(within(monitor).getByRole('button', { name: 'Gỡ món ghim vi phạm' }));
    expect(within(monitor).getByText('Đã gỡ món vi phạm')).toBeInTheDocument();
    await user.click(within(monitor).getByRole('button', { name: 'Gửi cảnh báo đến Host' }));
    const warning = screen.getByRole('dialog', { name: 'Cảnh báo kiểm duyệt' });
    expect(within(warning).getByRole('button', { name: 'Gửi cảnh báo' })).toBeDisabled();
    await user.type(within(warning).getByLabelText('Lý do cảnh báo'), 'Kiểm tra thông tin món');
    await user.click(within(warning).getByRole('button', { name: 'Gửi cảnh báo' }));
    expect(within(monitor).getByText('Kiểm tra thông tin món')).toBeInTheDocument();
    await user.click(within(monitor).getByRole('button', { name: 'Dừng phát sóng khẩn cấp' }));
    const stop = screen.getByRole('dialog', { name: 'Dừng phát sóng' });
    await user.type(within(stop).getByLabelText('Lý do dừng'), 'Kiểm thử kiểm duyệt');
    await user.click(within(stop).getByRole('button', { name: 'Xác nhận dừng' }));
    expect(await within(monitor).findByText('Đã kết thúc')).toBeInTheDocument();
    expect(within(monitor).queryByRole('button', { name: 'Dừng phát sóng khẩn cấp' })).not.toBeInTheDocument();
  });
});
