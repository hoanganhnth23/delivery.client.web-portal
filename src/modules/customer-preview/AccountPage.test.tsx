import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AccountPage from './AccountPage';
describe('preview account menu', () => {
  it('keeps personal data behind its own row', () => {
    const navigate = vi.fn();
    render(<AccountPage signedIn navigate={navigate} logout={vi.fn()} />);
    expect(screen.queryByText('0900000000')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Thông tin cá nhân/ }));
    expect(navigate).toHaveBeenCalledWith('account/profile');
  });
  it('exposes settings and routes anonymous users to login', () => {
    const navigate = vi.fn();
    render(<AccountPage signedIn={false} navigate={navigate} logout={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Cài đặt/ }));
    expect(navigate).toHaveBeenCalledWith('login');
    expect(screen.queryByRole('button', { name: 'Đăng xuất' })).not.toBeInTheDocument();
  });
});
