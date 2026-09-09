import type { SupportChatServicePort } from '@/modules/admin/services/firebaseChatService';
import {
  normalizeSupportMessageContent,
  type SupportConversation,
  type SupportMessage,
} from '@/modules/admin/services/supportChatModel';

export const PREVIEW_CUSTOMER_CONVERSATION_ID = 'preview-conversation-customer';
const PREVIEW_STORAGE_KEY = 'delivery.preview.support-chat.v1';
const PREVIEW_CUSTOMER_PRINCIPAL_ID = 'preview-user-1001';
const PREVIEW_ADMIN_PRINCIPAL_ID = 'preview-admin-9001';

export interface PreviewSupportSnapshot {
  conversations: SupportConversation[];
  messages: Record<string, SupportMessage[]>;
}

type SnapshotListener = (snapshot: PreviewSupportSnapshot) => void;

const clone = <T,>(value: T): T => structuredClone(value);

const message = ({
  id,
  conversationId,
  senderRole,
  content,
  timestamp,
  isRead,
}: Pick<SupportMessage, 'id' | 'conversationId' | 'senderRole' | 'content' | 'timestamp' | 'isRead'>): SupportMessage => ({
  id,
  conversationId,
  principalId: PREVIEW_CUSTOMER_PRINCIPAL_ID,
  senderPrincipalId: senderRole === 'ADMIN' ? PREVIEW_ADMIN_PRINCIPAL_ID : PREVIEW_CUSTOMER_PRINCIPAL_ID,
  senderRole,
  sender: senderRole === 'ADMIN' ? 'support' : 'user',
  content,
  type: 'text',
  timestamp,
  isRead,
});

const conversation = ({
  id,
  userName,
  userEmail,
  updatedAt,
  lastMessagePreview,
  lastMessageSenderRole,
  agentUnreadCount,
  customerUnreadCount,
}: Omit<SupportConversation, 'principalId' | 'userId' | 'isSupportChat' | 'status' | 'createdAt' | 'unreadCount'> & {
  agentUnreadCount: number;
  customerUnreadCount: number;
}): SupportConversation => ({
  id,
  principalId: id === PREVIEW_CUSTOMER_CONVERSATION_ID ? PREVIEW_CUSTOMER_PRINCIPAL_ID : `preview-user-${id.slice(-3)}`,
  userId: null,
  userEmail,
  userName,
  isSupportChat: true,
  status: 'open',
  createdAt: updatedAt,
  updatedAt,
  unreadCount: agentUnreadCount + customerUnreadCount,
  customerUnreadCount,
  agentUnreadCount,
  lastMessagePreview,
  lastMessageSenderRole,
});

const seedSnapshot = (): PreviewSupportSnapshot => {
  const customerConversation = conversation({
    id: PREVIEW_CUSTOMER_CONVERSATION_ID,
    userName: 'Khách trải nghiệm',
    userEmail: 'customer.preview@delivery.local',
    updatedAt: '2026-09-09T09:37:00.000Z',
    lastMessagePreview: 'Mình cần hỗ trợ đơn hàng #1001',
    lastMessageSenderRole: 'USER',
    agentUnreadCount: 1,
    customerUnreadCount: 0,
  });
  const minhAnhConversation = conversation({
    id: 'preview-conversation-002',
    userName: 'Nguyễn Minh Anh',
    userEmail: 'minhanh@example.local',
    updatedAt: '2026-09-09T09:29:00.000Z',
    lastMessagePreview: 'Đơn #2401 của mình đang ở đâu rồi ạ?',
    lastMessageSenderRole: 'USER',
    agentUnreadCount: 1,
    customerUnreadCount: 0,
  });
  const thuHaConversation = conversation({
    id: 'preview-conversation-003',
    userName: 'Lê Thu Hà',
    userEmail: 'thuha@example.local',
    updatedAt: '2026-09-09T09:24:00.000Z',
    lastMessagePreview: 'Mình đã gửi lại ảnh biên nhận cho bạn rồi nhé.',
    lastMessageSenderRole: 'ADMIN',
    agentUnreadCount: 0,
    customerUnreadCount: 1,
  });

  return {
    conversations: [customerConversation, minhAnhConversation, thuHaConversation],
    messages: {
      [customerConversation.id]: [
        message({
          id: 'preview-message-customer-001',
          conversationId: customerConversation.id,
          senderRole: 'ADMIN',
          content: 'Xin chào, CSKH Delivery có thể hỗ trợ bạn về đơn hàng, thanh toán hoặc địa chỉ giao hàng.',
          timestamp: '2026-09-09T09:31:00.000Z',
          isRead: true,
        }),
        message({
          id: 'preview-message-customer-002',
          conversationId: customerConversation.id,
          senderRole: 'USER',
          content: 'Mình đặt món ở Quán Test HÀ ĐÔNG nhưng muốn kiểm tra lại thời gian giao.',
          timestamp: '2026-09-09T09:35:00.000Z',
          isRead: true,
        }),
        message({
          id: 'preview-message-customer-003',
          conversationId: customerConversation.id,
          senderRole: 'USER',
          content: 'Mình cần hỗ trợ đơn hàng #1001',
          timestamp: '2026-09-09T09:37:00.000Z',
          isRead: false,
        }),
      ],
      [minhAnhConversation.id]: [
        message({
          id: 'preview-message-002-001',
          conversationId: minhAnhConversation.id,
          senderRole: 'USER',
          content: 'Đơn #2401 của mình đang ở đâu rồi ạ?',
          timestamp: '2026-09-09T09:29:00.000Z',
          isRead: false,
        }),
      ],
      [thuHaConversation.id]: [
        message({
          id: 'preview-message-003-001',
          conversationId: thuHaConversation.id,
          senderRole: 'USER',
          content: 'Mình đã gửi ảnh biên nhận, nhờ CSKH kiểm tra giúp.',
          timestamp: '2026-09-09T09:22:00.000Z',
          isRead: true,
        }),
        message({
          id: 'preview-message-003-002',
          conversationId: thuHaConversation.id,
          senderRole: 'ADMIN',
          content: 'Mình đã gửi lại ảnh biên nhận cho bạn rồi nhé.',
          timestamp: '2026-09-09T09:24:00.000Z',
          isRead: false,
        }),
      ],
    },
  };
};

const isSnapshot = (value: unknown): value is PreviewSupportSnapshot => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<PreviewSupportSnapshot>;
  return Array.isArray(candidate.conversations)
    && typeof candidate.messages === 'object'
    && candidate.messages !== null;
};

const readSnapshot = (): PreviewSupportSnapshot | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PREVIEW_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isSnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

let snapshot = readSnapshot() ?? seedSnapshot();
const listeners = new Set<SnapshotListener>();
let messageSequence = 0;

const persistSnapshot = (): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // A private browsing policy can reject storage. In-memory preview still works.
  }
};

const notify = (): void => {
  const next = getPreviewSupportSnapshot();
  listeners.forEach((listener) => listener(next));
};

const commit = (update: (current: PreviewSupportSnapshot) => PreviewSupportSnapshot): void => {
  snapshot = update(getPreviewSupportSnapshot());
  persistSnapshot();
  notify();
};

const compareUpdatedAt = (left: SupportConversation, right: SupportConversation): number => {
  const leftTime = left.updatedAt ? Date.parse(left.updatedAt) : 0;
  const rightTime = right.updatedAt ? Date.parse(right.updatedAt) : 0;
  return rightTime - leftTime;
};

const openConversations = (current: PreviewSupportSnapshot): SupportConversation[] =>
  current.conversations.filter((item) => item.status === 'open').sort(compareUpdatedAt);

const nextMessageId = (role: 'USER' | 'ADMIN'): string => {
  messageSequence += 1;
  return `preview-message-${role.toLowerCase()}-${Date.now()}-${messageSequence}`;
};

const appendMessage = (
  conversationId: string,
  senderRole: 'USER' | 'ADMIN',
  content: string,
): void => {
  const normalizedContent = normalizeSupportMessageContent(content);
  const target = snapshot.conversations.find((item) => item.id === conversationId);
  if (!target || target.status !== 'open') throw new Error('Cuộc hội thoại preview đã đóng');

  const timestamp = new Date().toISOString();
  const nextMessage = message({
    id: nextMessageId(senderRole),
    conversationId,
    senderRole,
    content: normalizedContent,
    timestamp,
    isRead: false,
  });

  commit((current) => {
    const currentConversation = current.conversations.find((item) => item.id === conversationId);
    if (!currentConversation || currentConversation.status !== 'open') {
      throw new Error('Cuộc hội thoại preview đã đóng');
    }
    const currentMessages = current.messages[conversationId] ?? [];
    const agentUnreadCount = senderRole === 'USER'
      ? currentConversation.agentUnreadCount + 1
      : currentConversation.agentUnreadCount;
    const customerUnreadCount = senderRole === 'ADMIN'
      ? currentConversation.customerUnreadCount + 1
      : currentConversation.customerUnreadCount;
    const nextConversation: SupportConversation = {
      ...currentConversation,
      updatedAt: timestamp,
      lastMessagePreview: normalizedContent,
      lastMessageSenderRole: senderRole,
      agentUnreadCount,
      customerUnreadCount,
      unreadCount: agentUnreadCount + customerUnreadCount,
    };
    return {
      conversations: current.conversations.map((item) => item.id === conversationId ? nextConversation : item),
      messages: {
        ...current.messages,
        [conversationId]: [...currentMessages, nextMessage],
      },
    };
  });
};

const markRead = (conversationId: string, readerRole: 'USER' | 'ADMIN'): void => {
  commit((current) => {
    const target = current.conversations.find((item) => item.id === conversationId);
    if (!target) return current;
    const messages = (current.messages[conversationId] ?? []).map((item) => (
      item.senderRole !== readerRole && !item.isRead ? { ...item, isRead: true } : item
    ));
    const agentUnreadCount = readerRole === 'ADMIN' ? 0 : target.agentUnreadCount;
    const customerUnreadCount = readerRole === 'USER' ? 0 : target.customerUnreadCount;
    return {
      conversations: current.conversations.map((item) => item.id === conversationId
        ? { ...item, agentUnreadCount, customerUnreadCount, unreadCount: agentUnreadCount + customerUnreadCount }
        : item),
      messages: { ...current.messages, [conversationId]: messages },
    };
  });
};

const closeConversation = (conversationId: string): void => {
  commit((current) => ({
    ...current,
    conversations: current.conversations.map((item) => item.id === conversationId
      ? { ...item, status: 'closed', updatedAt: new Date().toISOString() }
      : item),
  }));
};

export const getPreviewSupportSnapshot = (): PreviewSupportSnapshot => clone(snapshot);

export const subscribePreviewSupport = (listener: SnapshotListener): (() => void) => {
  listeners.add(listener);
  listener(getPreviewSupportSnapshot());
  return () => listeners.delete(listener);
};

export const sendPreviewCustomerMessage = (content: string): void => {
  appendMessage(PREVIEW_CUSTOMER_CONVERSATION_ID, 'USER', content);
};

export const markPreviewCustomerRead = (): void => {
  markRead(PREVIEW_CUSTOMER_CONVERSATION_ID, 'USER');
};

export const reopenPreviewCustomerConversation = (): void => {
  commit((current) => ({
    ...current,
    conversations: current.conversations.map((item) => item.id === PREVIEW_CUSTOMER_CONVERSATION_ID
      ? { ...item, status: 'open', updatedAt: new Date().toISOString() }
      : item),
  }));
};

export const closePreviewCustomerConversation = (): void => {
  closeConversation(PREVIEW_CUSTOMER_CONVERSATION_ID);
};

export const resetPreviewSupportChat = (): void => {
  snapshot = seedSnapshot();
  messageSequence = 0;
  persistSnapshot();
  notify();
};

export const createPreviewSupportChatService = (): SupportChatServicePort => ({
  async watchConversations(onData) {
    const unsubscribe = subscribePreviewSupport((current) => onData(openConversations(current)));
    return unsubscribe;
  },
  async watchMessages(conversationId, onData) {
    const emitMessages = (current: PreviewSupportSnapshot) => onData(clone(current.messages[conversationId] ?? []));
    const unsubscribe = subscribePreviewSupport(emitMessages);
    return unsubscribe;
  },
  async sendTextMessage(selectedConversation, content) {
    appendMessage(selectedConversation.id, 'ADMIN', content);
  },
  async markConversationRead(conversationId) {
    markRead(conversationId, 'ADMIN');
  },
  async closeConversation(conversationId) {
    closeConversation(conversationId);
  },
});

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== PREVIEW_STORAGE_KEY || !event.newValue) return;
    try {
      const parsed: unknown = JSON.parse(event.newValue);
      if (!isSnapshot(parsed)) return;
      snapshot = parsed;
      notify();
    } catch {
      // Ignore malformed storage events; the current tab keeps its valid state.
    }
  });
  persistSnapshot();
}
