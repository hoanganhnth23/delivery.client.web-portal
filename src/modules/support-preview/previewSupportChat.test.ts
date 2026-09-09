import { beforeEach, describe, expect, it } from 'vitest';
import {
  PREVIEW_CUSTOMER_CONVERSATION_ID,
  createPreviewSupportChatService,
  getPreviewSupportSnapshot,
  resetPreviewSupportChat,
  sendPreviewCustomerMessage,
} from './previewSupportChat';

describe('standalone support chat preview store', () => {
  beforeEach(() => {
    resetPreviewSupportChat();
  });

  it('seeds an open customer conversation and inbox-ready messages', () => {
    const snapshot = getPreviewSupportSnapshot();
    const customerConversation = snapshot.conversations.find(
      (conversation) => conversation.id === PREVIEW_CUSTOMER_CONVERSATION_ID,
    );

    expect(snapshot.conversations).toHaveLength(3);
    expect(customerConversation).toMatchObject({
      userName: 'Khách trải nghiệm',
      status: 'open',
      agentUnreadCount: 1,
      lastMessageSenderRole: 'USER',
    });
    expect(snapshot.messages[PREVIEW_CUSTOMER_CONVERSATION_ID]).toHaveLength(3);
  });

  it('shares customer messages with the admin service and updates unread state', async () => {
    const service = createPreviewSupportChatService();
    const inboxUpdates: string[][] = [];
    const stop = await service.watchConversations((conversations) => {
      inboxUpdates.push(conversations.map((item) => `${item.id}:${item.lastMessagePreview ?? ''}`));
    }, () => undefined);

    sendPreviewCustomerMessage('  Mình cần hỗ trợ đổi địa chỉ giao hàng.  ');

    const conversation = getPreviewSupportSnapshot().conversations.find(
      (item) => item.id === PREVIEW_CUSTOMER_CONVERSATION_ID,
    );
    expect(conversation).toMatchObject({
      lastMessagePreview: 'Mình cần hỗ trợ đổi địa chỉ giao hàng.',
      lastMessageSenderRole: 'USER',
      agentUnreadCount: 2,
      unreadCount: 2,
    });
    const latestInboxUpdate = inboxUpdates[inboxUpdates.length - 1] ?? [];
    expect(latestInboxUpdate.find((item: string) => item.startsWith(`${PREVIEW_CUSTOMER_CONVERSATION_ID}:`)))
      .toBe(`${PREVIEW_CUSTOMER_CONVERSATION_ID}:Mình cần hỗ trợ đổi địa chỉ giao hàng.`);

    await service.markConversationRead(PREVIEW_CUSTOMER_CONVERSATION_ID);
    expect(getPreviewSupportSnapshot().conversations.find(
      (item) => item.id === PREVIEW_CUSTOMER_CONVERSATION_ID,
    )).toMatchObject({ agentUnreadCount: 0, unreadCount: 0 });

    stop();
  });

  it('lets the admin reply and close the same conversation without Firebase', async () => {
    const service = createPreviewSupportChatService();
    const conversation = getPreviewSupportSnapshot().conversations[0];
    await service.sendTextMessage(conversation, 'Mình đã kiểm tra và đang hỗ trợ bạn nhé.');

    const messages = getPreviewSupportSnapshot().messages[conversation.id];
    expect(messages[messages.length - 1]).toMatchObject({
      senderRole: 'ADMIN',
      content: 'Mình đã kiểm tra và đang hỗ trợ bạn nhé.',
    });

    await service.closeConversation(conversation.id);
    expect(getPreviewSupportSnapshot().conversations.find((item) => item.id === conversation.id))
      .toMatchObject({ status: 'closed' });
    expect(getPreviewSupportSnapshot().conversations.filter((item) => item.status === 'open'))
      .toHaveLength(2);
  });
});
