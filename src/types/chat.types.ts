/**
 * Chat Type Definitions
 * Định nghĩa types cho module chat
 */

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  type: 'text' | 'image';
  sender: 'user' | 'restaurant' | 'support';
  timestamp: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userAvatar?: string;
  restaurantId?: number;
  restaurantName?: string;
  status: 'active' | 'closed';
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
  closedAt: string | null;
  closedBy: string | null;
  closeReason: string | null;
  lastMessage?: {
    id: string;
    content: string;
    type: 'text' | 'image';
    sender: 'user' | 'restaurant' | 'support';
    timestamp: string;
    isRead: boolean;
  };
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  type?: 'text' | 'image';
}

export interface CreateConversationRequest {
  userId: string;
  userEmail: string;
  userName: string;
  restaurantId?: number;
}

export interface ConversationResponse {
  status: number;
  data: Conversation;
  message: string;
}

export interface ConversationListResponse {
  status: number;
  data: Conversation[];
  message: string;
}

export interface MessageResponse {
  status: number;
  data: Message;
  message: string;
}

export interface MessageListResponse {
  status: number;
  data: Message[];
  message: string;
}

export interface ChatActionResult {
  success: boolean;
  data?: Conversation | Message;
  message?: string;
}
