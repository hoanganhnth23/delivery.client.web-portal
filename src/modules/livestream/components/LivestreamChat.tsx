import React, { useState, useEffect, useRef } from 'react';
import { livestreamRealtimeService, LiveMessage } from '../services/livestreamRealtimeService';
import { useAuth } from '@/modules/auth/hooks/useAuth';

interface LivestreamChatProps {
  livestreamId: string;
  role: 'host' | 'viewer';
}

const AVATAR_COLORS = ['#f49d25', '#22c55e', '#8b5cf6', '#3b82f6', '#ef4444', '#ec4899'];
const getColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const getInitials = (name: string) => name.slice(0, 2).toUpperCase();

const LivestreamChat: React.FC<LivestreamChatProps> = ({ livestreamId, role }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!livestreamId) return;
    const unsubscribe = livestreamRealtimeService.subscribeToMessages(livestreamId, setMessages);
    return () => unsubscribe();
  }, [livestreamId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user) return;
    try {
      await livestreamRealtimeService.sendMessage(livestreamId, {
        livestreamId,
        senderId: user.id.toString(),
        senderName: user.name || user.email,
        senderRole: role,
        content: inputValue.trim(),
      });
      setInputValue('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
        <h3 className="font-bold text-[#1c160d] text-sm">Chat trực tiếp</h3>
        <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{messages.length} tin nhắn</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mb-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f49d25" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            </div>
            <p className="text-gray-400 text-sm">Chưa có tin nhắn nào</p>
            <p className="text-gray-300 text-xs mt-1">Hãy bắt đầu trò chuyện!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-2.5">
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold"
                style={{ background: getColor(msg.senderName) }}
              >
                {getInitials(msg.senderName)}
              </div>
              {/* Bubble */}
              <div className="flex-1 min-w-0">
                <div className="bg-gray-50 rounded-2xl rounded-tl-none px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="text-xs font-bold"
                      style={{ color: getColor(msg.senderName) }}
                    >
                      {msg.senderName}
                    </span>
                    {msg.senderRole === 'host' && (
                      <span className="text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full leading-none">HOST</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 leading-snug break-words">{msg.content}</p>
                </div>
                <p className="text-[10px] text-gray-300 mt-1 ml-2">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="px-4 py-4 border-t border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Say something..."
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 placeholder:text-gray-300"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="w-10 h-10 flex items-center justify-center bg-[#f49d25] text-white rounded-full hover:bg-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default LivestreamChat;
