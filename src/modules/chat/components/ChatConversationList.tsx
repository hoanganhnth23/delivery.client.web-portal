/**
 * ChatConversationList Component
 * Danh sách các cuộc hội thoại
 */

import { useChat } from '../hooks/useChat';
import type { Conversation } from '@/types/chat.types';

interface ChatConversationListProps {
  loading?: boolean;
}

const ChatConversationList = ({ loading }: ChatConversationListProps) => {
  const { conversations, currentConversation, selectConversation } = useChat();

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
      });
    }
  };

  const getStatusBadge = (status: Conversation['status']) => {
    if (status === 'active') {
      return (
        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-semibold rounded-full">
          Active
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-semibold rounded-full">
        Closed
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">
          refresh
        </span>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Đang tải...</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center">
        <span className="material-symbols-outlined text-5xl text-gray-400 block mb-3">
          chat_bubble_outline
        </span>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Chưa có cuộc hội thoại nào
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border-light dark:divide-border-dark">
      {conversations.map((conversation) => (
        <button
          key={conversation.id}
          onClick={() => selectConversation(conversation.id)}
          className={`w-full p-4 flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left ${
            currentConversation?.id === conversation.id
              ? 'bg-primary/5 dark:bg-primary/10 border-l-4 border-primary'
              : ''
          }`}
        >
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-white font-bold text-lg">
              {conversation.userName.charAt(0).toUpperCase()}
            </div>
            {conversation.unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900">
                {conversation.unreadCount}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                {conversation.userName}
              </h4>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 ml-2 shrink-0">
                {formatTime(conversation.updatedAt)}
              </span>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 truncate">
              {conversation.userEmail}
            </p>

            {conversation.lastMessage && (
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {conversation.lastMessage.sender === 'restaurant' && (
                  <span className="text-primary font-semibold">Bạn: </span>
                )}
                {conversation.lastMessage.content}
              </p>
            )}

            <div className="mt-2 flex items-center justify-between">
              {getStatusBadge(conversation.status)}
              {conversation.restaurantName && (
                <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                  {conversation.restaurantName}
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ChatConversationList;
