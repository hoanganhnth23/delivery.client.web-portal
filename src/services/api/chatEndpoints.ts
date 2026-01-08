/**
 * Chat API Endpoints
 * Định nghĩa các endpoints cho chat API
 */

export const CHAT_ENDPOINTS = {
  // Conversations
  GET_CONVERSATIONS: '/api/chat/conversations',
  GET_CONVERSATION_BY_ID: (id: string) => `/api/chat/conversations/${id}`,
  CREATE_CONVERSATION: '/api/chat/conversations',
  CLOSE_CONVERSATION: (id: string) => `/api/chat/conversations/${id}/close`,
  
  // Messages
  GET_MESSAGES: (conversationId: string) => `/api/chat/conversations/${conversationId}/messages`,
  SEND_MESSAGE: '/api/chat/messages',
  MARK_AS_READ: (messageId: string) => `/api/chat/messages/${messageId}/read`,
  
  // Restaurant specific
  GET_RESTAURANT_CONVERSATIONS: '/api/chat/restaurant/conversations',
  GET_SUPPORT_CONVERSATIONS: '/api/chat/support/conversations',
} as const;
