import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SupportChatPage from './SupportChatPage';
import {
  getPreviewSupportSnapshot,
  PREVIEW_CUSTOMER_CONVERSATION_ID,
  resetPreviewSupportChat,
} from '../support-preview/previewSupportChat';

describe('customer support chat preview', () => {
  beforeEach(() => {
    resetPreviewSupportChat();
  });

  it('shows the support status and the seeded conversation', () => {
    renderChat();

    expect(screen.getByRole('heading', { name: 'Hỗ trợ CSKH' })).toBeInTheDocument();
    expect(screen.getByText('CSKH đang trực tuyến')).toBeInTheDocument();
    expect(screen.getByText('Mình cần hỗ trợ đơn hàng #1001')).toBeInTheDocument();
  });

  it('sends a customer message into the shared preview conversation', async () => {
    const user = userEvent.setup();
    renderChat();

    const input = screen.getByRole('textbox', { name: 'Tin nhắn cho CSKH' });
    await user.type(input, 'Mình muốn đổi địa chỉ giao hàng.');
    await user.click(screen.getByRole('button', { name: 'Gửi tin nhắn' }));

    expect(screen.getByText('Mình muốn đổi địa chỉ giao hàng.')).toBeInTheDocument();
    expect(input).toHaveValue('');
    const messages = getPreviewSupportSnapshot().messages[PREVIEW_CUSTOMER_CONVERSATION_ID];
    expect(messages[messages.length - 1])
      .toMatchObject({ senderRole: 'USER', content: 'Mình muốn đổi địa chỉ giao hàng.' });
  });
});

function renderChat() {
  return render(<SupportChatPage onBack={vi.fn()} />);
}
