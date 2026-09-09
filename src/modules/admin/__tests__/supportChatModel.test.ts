import { describe, expect, it } from 'vitest';
import {
  buildAdminMessagePayload,
  mapSupportConversation,
  mapSupportMessage,
} from '@/modules/admin/services/supportChatModel';

describe('support chat Firestore contract', () => {
  it('maps a conversation without trusting missing or malformed display fields', () => {
    const conversation = mapSupportConversation('conversation-1', {
      principalId: 501,
      userId: 501,
      userEmail: 'customer@example.com',
      userName: 'Customer Test',
      status: 'open',
      isSupportChat: true,
      updatedAt: { toDate: () => new Date('2026-09-09T08:00:00.000Z') },
      unreadCount: 2,
      customerUnreadCount: 1,
      agentUnreadCount: 1,
      lastMessage: { content: 'Xin chào CSKH', senderRole: 'USER' },
    });

    expect(conversation).toMatchObject({
      id: 'conversation-1',
      principalId: '501',
      userEmail: 'customer@example.com',
      userName: 'Customer Test',
      status: 'open',
      updatedAt: '2026-09-09T08:00:00.000Z',
      unreadCount: 2,
      lastMessagePreview: 'Xin chào CSKH',
    });
  });

  it('maps sender role and read state from canonical message fields', () => {
    const message = mapSupportMessage('message-1', {
      conversationId: 'conversation-1',
      principalId: '501',
      senderPrincipalId: '900',
      senderRole: 'ADMIN',
      sender: 'support',
      content: 'CSKH đây, mình hỗ trợ bạn nhé.',
      type: 'text',
      timestamp: { toDate: () => new Date('2026-09-09T08:01:00.000Z') },
      isRead: true,
    });

    expect(message).toEqual({
      id: 'message-1',
      conversationId: 'conversation-1',
      principalId: '501',
      senderPrincipalId: '900',
      senderRole: 'ADMIN',
      sender: 'support',
      content: 'CSKH đây, mình hỗ trợ bạn nhé.',
      type: 'text',
      timestamp: '2026-09-09T08:01:00.000Z',
      isRead: true,
    });
  });

  it('builds an ADMIN text message with conversation ownership separate from sender identity', () => {
    const payload = buildAdminMessagePayload({
      conversationId: 'conversation-1',
      conversationPrincipalId: '501',
      senderPrincipalId: '900',
      content: '  Mình kiểm tra đơn cho bạn nhé.  ',
      messageId: 'message-2',
      timestamp: 'server-timestamp-sentinel',
    });

    expect(payload).toEqual({
      conversationId: 'conversation-1',
      principalId: '501',
      senderPrincipalId: '900',
      senderRole: 'ADMIN',
      sender: 'support',
      content: 'Mình kiểm tra đơn cho bạn nhé.',
      type: 'text',
      timestamp: 'server-timestamp-sentinel',
      isRead: false,
      readAt: null,
    });
    expect(payload.principalId).not.toBe(payload.senderPrincipalId);
  });
});
