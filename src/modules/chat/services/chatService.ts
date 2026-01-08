/**
 * Chat Service
 * Service xử lý các API calls liên quan đến chat
 */

import apiClient from '@/services/api/apiClient';
import { CHAT_ENDPOINTS } from '@/services/api/chatEndpoints';
import type {
  Conversation,
  Message,
  ConversationResponse,
  ConversationListResponse,
  MessageResponse,
  MessageListResponse,
  SendMessageRequest,
  CreateConversationRequest,
} from '@/types/chat.types';

/**
 * Lấy danh sách conversations của user/restaurant hiện tại
 */
export const getConversations = async (): Promise<Conversation[]> => {
  const response = await apiClient.get<ConversationListResponse>(
    CHAT_ENDPOINTS.GET_CONVERSATIONS
  );
  return response.data.data;
};

/**
 * Lấy danh sách conversations của restaurant
 */
export const getRestaurantConversations = async (): Promise<Conversation[]> => {
  const response = await apiClient.get<ConversationListResponse>(
    CHAT_ENDPOINTS.GET_RESTAURANT_CONVERSATIONS
  );
  return response.data.data;
};

/**
 * Lấy chi tiết conversation theo ID
 */
export const getConversationById = async (id: string): Promise<Conversation> => {
  const response = await apiClient.get<ConversationResponse>(
    CHAT_ENDPOINTS.GET_CONVERSATION_BY_ID(id)
  );
  return response.data.data;
};

/**
 * Tạo conversation mới
 */
export const createConversation = async (
  data: CreateConversationRequest
): Promise<Conversation> => {
  const response = await apiClient.post<ConversationResponse>(
    CHAT_ENDPOINTS.CREATE_CONVERSATION,
    data
  );
  return response.data.data;
};

/**
 * Đóng conversation
 */
export const closeConversation = async (
  id: string,
  reason?: string
): Promise<Conversation> => {
  const response = await apiClient.patch<ConversationResponse>(
    CHAT_ENDPOINTS.CLOSE_CONVERSATION(id),
    { closeReason: reason }
  );
  return response.data.data;
};

/**
 * Lấy danh sách messages của conversation
 */
export const getMessages = async (conversationId: string): Promise<Message[]> => {
  const response = await apiClient.get<MessageListResponse>(
    CHAT_ENDPOINTS.GET_MESSAGES(conversationId)
  );
  return response.data.data;
};

/**
 * Gửi message mới
 */
export const sendMessage = async (data: SendMessageRequest): Promise<Message> => {
  const response = await apiClient.post<MessageResponse>(
    CHAT_ENDPOINTS.SEND_MESSAGE,
    data
  );
  return response.data.data;
};

/**
 * Đánh dấu message đã đọc
 */
export const markMessageAsRead = async (messageId: string): Promise<Message> => {
  const response = await apiClient.patch<MessageResponse>(
    CHAT_ENDPOINTS.MARK_AS_READ(messageId)
  );
  return response.data.data;
};
