import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { USER_ROLES } from '@/utils/constants';
import { buildUser } from '@/test/builders';
import { createAuthFake, createTestDependencies } from '@/test/createTestDependencies';
import { renderApp } from '@/test/renderApp';
import type { SupportChatServicePort } from '@/modules/admin/services/firebaseChatService';
import type { SupportConversation, SupportMessage } from '@/modules/admin/services/supportChatModel';

const conversation: SupportConversation = {
  id: 'conversation-1',
  principalId: '501',
  userId: 501,
  userEmail: 'customer@example.com',
  userName: 'Customer Test',
  isSupportChat: true,
  status: 'open',
  createdAt: '2026-09-09T08:00:00.000Z',
  updatedAt: '2026-09-09T08:01:00.000Z',
  unreadCount: 1,
  customerUnreadCount: 0,
  agentUnreadCount: 1,
  lastMessagePreview: 'Mình cần hỗ trợ đơn hàng #401',
  lastMessageSenderRole: 'USER',
};

const customerMessage: SupportMessage = {
  id: 'message-1',
  conversationId: conversation.id,
  principalId: conversation.principalId,
  senderPrincipalId: conversation.principalId,
  senderRole: 'USER',
  sender: 'user',
  content: 'Mình cần hỗ trợ đơn hàng #401',
  type: 'text',
  timestamp: '2026-09-09T08:01:00.000Z',
  isRead: false,
};

function adminChatDependencies(supportChat: SupportChatServicePort) {
  const admin = buildUser({ id: 900, role: USER_ROLES.ADMIN, name: 'Admin Test' });
  return createTestDependencies({
    auth: createAuthFake({
      isAuthenticated: vi.fn(() => true),
      getCurrentUser: vi.fn(() => admin),
      getProfile: vi.fn(async () => admin),
    }),
    supportChat,
  });
}

describe('admin support chat page', () => {
  it('shows realtime inbox data and sends text through the chat port', async () => {
    const user = userEvent.setup();
    const sendTextMessage = vi.fn(async () => undefined);
    const supportChat: SupportChatServicePort = {
      watchConversations: vi.fn(async (onData) => {
        onData([conversation]);
        return () => undefined;
      }),
      watchMessages: vi.fn(async (_conversationId, onData) => {
        onData([customerMessage]);
        return () => undefined;
      }),
      sendTextMessage,
      markConversationRead: vi.fn(async () => undefined),
      closeConversation: vi.fn(async () => undefined),
    };

    renderApp({ route: '/admin/chat', dependencies: adminChatDependencies(supportChat) });

    expect(await screen.findByText('Customer Test')).toBeInTheDocument();
    expect(await screen.findByText('Mình cần hỗ trợ đơn hàng #401')).toBeInTheDocument();

    const input = await screen.findByLabelText('Nội dung trả lời khách hàng');
    await user.type(input, 'Mình đang kiểm tra đơn cho bạn.');
    await user.click(screen.getByRole('button', { name: 'Gửi tin nhắn' }));

    await waitFor(() => {
      expect(sendTextMessage).toHaveBeenCalledWith(
        conversation,
        'Mình đang kiểm tra đơn cho bạn.',
      );
    });
    expect(input).toHaveValue('');
  });
});
