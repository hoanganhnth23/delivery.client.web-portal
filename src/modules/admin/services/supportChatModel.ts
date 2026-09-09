export type SupportChatRole = 'USER' | 'ADMIN';
export type SupportMessageSender = 'user' | 'support';
export type SupportConversationStatus = 'open' | 'closed';

export interface SupportConversation {
  id: string;
  principalId: string;
  userId: number | string | null;
  userEmail: string;
  userName: string;
  isSupportChat: boolean;
  status: SupportConversationStatus;
  createdAt: string | null;
  updatedAt: string | null;
  unreadCount: number;
  customerUnreadCount: number;
  agentUnreadCount: number;
  lastMessagePreview: string | null;
  lastMessageSenderRole: SupportChatRole | null;
}

export interface SupportMessage {
  id: string;
  conversationId: string;
  principalId: string;
  senderPrincipalId: string;
  senderRole: SupportChatRole;
  sender: SupportMessageSender;
  content: string;
  type: 'text';
  timestamp: string | null;
  isRead: boolean;
}

export interface AdminMessagePayload {
  conversationId: string;
  principalId: string;
  senderPrincipalId: string;
  senderRole: 'ADMIN';
  sender: 'support';
  content: string;
  type: 'text';
  timestamp: unknown;
  isRead: false;
  readAt: null;
}

type FirestoreData = Record<string, unknown>;

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const asPrincipalId = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isSafeInteger(value)) return String(value);
  return '';
};

const asNullableUserId = (value: unknown): number | string | null => {
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value;
  if (typeof value === 'string' && value.trim()) return value.trim();
  return null;
};

const asCount = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.trunc(value)
    : 0;

const asDateLike = (value: unknown): Date | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof value.toDate === 'function'
  ) {
    const date = value.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }
  return null;
};

export const timestampToIso = (value: unknown): string | null =>
  asDateLike(value)?.toISOString() ?? null;

const asMessageRole = (data: FirestoreData): SupportChatRole =>
  data.senderRole === 'ADMIN' || data.sender === 'support' ? 'ADMIN' : 'USER';

const asMessageSender = (role: SupportChatRole): SupportMessageSender =>
  role === 'ADMIN' ? 'support' : 'user';

export const normalizeSupportMessageContent = (content: string): string => {
  const normalized = content.trim();
  if (normalized.length === 0 || normalized.length > 2_000) {
    throw new Error('Tin nhắn phải có từ 1 đến 2000 ký tự');
  }
  return normalized;
};

export const mapSupportConversation = (
  id: string,
  data: FirestoreData,
): SupportConversation => {
  const lastMessage =
    typeof data.lastMessage === 'object' && data.lastMessage !== null
      ? (data.lastMessage as FirestoreData)
      : null;
  const lastMessageSenderRole = lastMessage
    ? lastMessage.senderRole === 'ADMIN' || lastMessage.sender === 'support'
      ? 'ADMIN'
      : 'USER'
    : null;

  return {
    id,
    principalId: asPrincipalId(data.principalId),
    userId: asNullableUserId(data.userId),
    userEmail: asString(data.userEmail, 'Khách hàng chưa có email'),
    userName: asString(data.userName, 'Khách hàng'),
    isSupportChat: data.isSupportChat === true,
    status: data.status === 'closed' ? 'closed' : 'open',
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
    unreadCount: asCount(data.unreadCount),
    customerUnreadCount: asCount(data.customerUnreadCount),
    agentUnreadCount: asCount(data.agentUnreadCount),
    lastMessagePreview: lastMessage ? asString(lastMessage.content) || null : null,
    lastMessageSenderRole,
  };
};

export const mapSupportMessage = (
  id: string,
  data: FirestoreData,
): SupportMessage => {
  const senderRole = asMessageRole(data);
  return {
    id,
    conversationId: asString(data.conversationId),
    principalId: asPrincipalId(data.principalId),
    senderPrincipalId: asPrincipalId(data.senderPrincipalId),
    senderRole,
    sender: asMessageSender(senderRole),
    content: asString(data.content),
    type: 'text',
    timestamp: timestampToIso(data.timestamp),
    isRead: data.isRead === true,
  };
};

export const buildAdminMessagePayload = ({
  conversationId,
  conversationPrincipalId,
  senderPrincipalId,
  content,
  messageId: _messageId,
  timestamp,
}: {
  conversationId: string;
  conversationPrincipalId: string;
  senderPrincipalId: string;
  content: string;
  messageId: string;
  timestamp: unknown;
}): AdminMessagePayload => ({
  conversationId,
  // The owner of the conversation is not necessarily the ADMIN who sends it.
  principalId: conversationPrincipalId,
  senderPrincipalId,
  senderRole: 'ADMIN',
  sender: 'support',
  content: normalizeSupportMessageContent(content),
  type: 'text',
  timestamp,
  isRead: false,
  readAt: null,
});
