/**
 * ChatMessageArea Component
 * Khu vực hiển thị và gửi tin nhắn
 */

import { useState, useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';

const ChatMessageArea = () => {
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    currentConversation,
    messages,
    loading,
    sendMessage,
    closeConversation,
  } = useChat();

  // Auto scroll to bottom khi có message mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim()) return;

    const result = await sendMessage(messageText);
    
    if (result.success) {
      setMessageText('');
    }
  };

  const handleCloseConversation = async () => {
    if (window.confirm('Bạn có chắc muốn đóng cuộc hội thoại này?')) {
      const result = await closeConversation('Đã giải quyết xong');
      if (result.success) {
        alert('Đã đóng cuộc hội thoại');
      }
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!currentConversation) return null;

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-surface-light dark:bg-surface-dark">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-white font-bold text-lg">
            {currentConversation.userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">
              {currentConversation.userName}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {currentConversation.userEmail}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentConversation.status === 'active' && (
            <button
              onClick={handleCloseConversation}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-semibold rounded-lg transition-colors"
            >
              Đóng chat
            </button>
          )}
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">
              more_vert
            </span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900">
        {/* Date Separator */}
        <div className="flex justify-center">
          <span className="text-xs font-medium text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-sm">
            Today
          </span>
        </div>

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === 'restaurant' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] ${
                message.sender === 'restaurant' ? 'items-end' : 'items-start'
              } flex flex-col gap-1`}
            >
              <div
                className={`px-4 py-2.5 rounded-2xl ${
                  message.sender === 'restaurant'
                    ? 'bg-primary text-white rounded-tr-sm'
                    : message.sender === 'support'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 rounded-tl-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-sm shadow-sm'
                }`}
              >
                {message.sender === 'support' && (
                  <div className="flex items-center gap-1 mb-1">
                    <span className="material-symbols-outlined text-sm">support_agent</span>
                    <span className="text-[10px] font-semibold">Support</span>
                  </div>
                )}
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>

              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                  {formatTime(message.timestamp)}
                </span>
                {message.sender === 'restaurant' && (
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                    {message.isRead ? '✓✓' : '✓'}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {currentConversation.status === 'active' ? (
        <form
          onSubmit={handleSendMessage}
          className="px-6 py-4 bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark"
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">
                add_circle
              </span>
            </button>

            <div className="flex-1 relative">
              <input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white disabled:opacity-50"
                placeholder="Nhập tin nhắn..."
                type="text"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-xl">sentiment_satisfied</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={!messageText.trim() || loading}
              className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <span className="material-symbols-outlined">send</span>
              Gửi
            </button>
          </div>
        </form>
      ) : (
        <div className="px-6 py-4 bg-gray-100 dark:bg-gray-800 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Cuộc hội thoại đã đóng
          </p>
        </div>
      )}
    </div>
  );
};

export default ChatMessageArea;
