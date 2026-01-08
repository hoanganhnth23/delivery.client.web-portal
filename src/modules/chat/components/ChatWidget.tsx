/**
 * ChatWidget Component
 * Floating chat widget cho Restaurant Owner - luôn ở góc phải
 * Auto-load conversation gần nhất còn hoạt động và messages của nó
 */

import { useState, useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useRestaurant } from '@/modules/restaurant/hooks/useRestaurant';
import { USER_ROLES } from '@/utils/constants';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messageText, setMessageText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { user } = useAuth();
    const { currentRestaurant } = useRestaurant();
    const {
        conversations,
        currentConversation,
        messages,
        unreadCount,
        sendMessage,
        getRestaurantConversations,
        selectConversation,
    } = useChat();

    // Chỉ hiển thị cho restaurant owner
    const isRestaurantOwner = user?.role === USER_ROLES.RESTAURANT_OWNER;

    // Load conversations của restaurant khi component mount
    useEffect(() => {
        if (isRestaurantOwner && currentRestaurant?.id) {
            getRestaurantConversations(currentRestaurant.id);
        }
    }, [isRestaurantOwner, currentRestaurant, getRestaurantConversations]);

    // Tự động chọn conversation gần nhất còn hoạt động khi conversations load xong
    useEffect(() => {
        if (conversations.length > 0 && !currentConversation) {
            // Tìm conversation gần nhất còn hoạt động (status = 'active')
            const activeConversation = conversations.find(conv => conv.status === 'active');

            // Nếu có conversation active, chọn cái đó, không thì chọn cái đầu tiên
            const conversationToSelect = activeConversation || conversations[0];

            if (conversationToSelect) {
                selectConversation(conversationToSelect.id);
            }
        }
    }, [conversations, currentConversation, selectConversation]);

    // Auto scroll to bottom khi có message mới
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Mở chat window
    const handleOpenChat = () => {
        setIsOpen(true);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!messageText.trim()) return;

        const result = await sendMessage(messageText);

        if (result.success) {
            setMessageText('');
        }
    };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Không hiển thị nếu không phải restaurant owner
    if (!isRestaurantOwner) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">
            {/* Expanded Chat Window */}
            {isOpen && (
                <div className="pointer-events-auto w-[700px] h-[650px] bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl flex overflow-hidden border border-border-light dark:border-border-dark transition-all duration-300 origin-bottom-right">
                    {/* Conversation List - Bên trái */}
                    <div className="w-[280px] border-r border-border-light dark:border-border-dark flex flex-col bg-white dark:bg-gray-900">
                        <div className="px-4 py-3 border-b border-border-light dark:border-border-dark bg-primary">
                            <h4 className="font-bold text-white text-sm">Tin nhắn</h4>
                            <p className="text-xs text-white/80">{conversations.length} cuộc hội thoại</p>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {conversations.length === 0 ? (
                                <div className="p-6 text-center">
                                    <span className="material-symbols-outlined text-4xl text-gray-400 block mb-2">
                                        chat_bubble_outline
                                    </span>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        Chưa có tin nhắn
                                    </p>
                                </div>
                            ) : (
                                conversations.map((conv) => (
                                    <button
                                        key={conv.id}
                                        onClick={() => selectConversation(conv.id)}
                                        className={`w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 ${currentConversation?.id === conv.id ? 'bg-primary/10 dark:bg-primary/20 border-l-4 border-l-primary' : ''
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                {conv.userName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                    {conv.userName}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {conv.userEmail}
                                                </p>
                                            </div>
                                            {conv.unreadCount > 0 && (
                                                <div className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full flex-shrink-0">
                                                    {conv.unreadCount}
                                                </div>
                                            )}
                                        </div>
                                        {conv.lastMessage && (
                                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate ml-[52px]">
                                                {conv.lastMessage.content}
                                            </p>
                                        )}
                                        {/* Status badge */}
                                        <div className="mt-2 ml-[52px]">
                                            <span className={`text-[9px] px-2 py-1 rounded-full font-medium ${conv.status === 'active'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                }`}>
                                                {conv.status === 'active' ? 'Hoạt động' : 'Đã đóng'}
                                            </span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Area - Bên phải */}
                    <div className="flex-1 flex flex-col">
                        {currentConversation ? (
                            <>
                                {/* Header */}
                                <div className="px-4 py-3 border-b border-border-light dark:border-border-dark bg-white dark:bg-gray-900 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-white font-bold text-sm">
                                            {currentConversation.userName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                                                {currentConversation.userName}
                                            </h4>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                {currentConversation.userEmail}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 text-xl">
                                            close
                                        </span>
                                    </button>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-gray-900">
                                    {messages.length === 0 ? (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="text-center text-gray-400">
                                                <span className="material-symbols-outlined text-5xl mb-2 block">chat_bubble_outline</span>
                                                <p className="text-sm">Chưa có tin nhắn</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Date Separator */}
                                            <div className="flex justify-center">
                                                <span className="text-xs font-medium text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full">
                                                    Today
                                                </span>
                                            </div>

                                            {/* Messages List */}
                                            {messages.map((message) => (
                                                <div
                                                    key={message.id}
                                                    className={`flex ${message.sender === 'restaurant' ? 'justify-end' : 'justify-start'
                                                        }`}
                                                >
                                                    <div className={`max-w-[70%] flex flex-col ${message.sender === 'restaurant' ? 'items-end' : 'items-start'
                                                        }`}>
                                                        {/* Sender label cho tin nhắn của khách */}
                                                        {message.sender !== 'restaurant' && (
                                                            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1 px-2">
                                                                {currentConversation.userName}
                                                            </span>
                                                        )}
                                                        <div
                                                            className={`px-4 py-2.5 rounded-2xl text-sm ${message.sender === 'restaurant'
                                                                    ? 'bg-primary text-white rounded-tr-sm'
                                                                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-sm shadow-sm'
                                                                }`}
                                                        >
                                                            {message.content}
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 mt-1 px-2">
                                                            {formatTime(message.timestamp)}
                                                            {message.sender === 'restaurant' && (
                                                                <span className="ml-1">{message.isRead ? '✓✓' : '✓'}</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}

                                            <div ref={messagesEndRef} />
                                        </>
                                    )}
                                </div>

                                {/* Input Area */}
                                {currentConversation.status === 'active' ? (
                                    <form onSubmit={handleSendMessage} className="p-3 bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark">
                                        <div className="flex items-center gap-3">
                                            <input
                                                value={messageText}
                                                onChange={(e) => setMessageText(e.target.value)}
                                                className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-gray-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
                                                placeholder="Nhập tin nhắn..."
                                                type="text"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!messageText.trim()}
                                                className="bg-primary hover:bg-primary-hover text-white p-2.5 rounded-full transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <span className="material-symbols-outlined text-xl">send</span>
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800">
                                        <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                                            <span className="material-symbols-outlined text-base">lock</span>
                                            <p className="text-xs font-medium">
                                                Cuộc hội thoại này đã được đóng
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-400">
                                <div className="text-center p-4">
                                    <span className="material-symbols-outlined text-4xl mb-2 block">chat</span>
                                    <p className="text-xs">Đang tải tin nhắn...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Collapsed Widget Trigger (FAB) */}
            <div className="pointer-events-auto relative group cursor-pointer">
                {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900 z-10 animate-bounce px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                )}
                <button
                    onClick={handleOpenChat}
                    className="w-14 h-14 bg-primary hover:bg-primary-hover text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                >
                    <span className="material-symbols-outlined text-3xl">chat_bubble</span>
                </button>

                {/* Tooltip */}
                <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Tin nhắn khách hàng ({unreadCount > 0 ? `${unreadCount} mới` : 'không có mới'})
                </div>
            </div>
        </div>
    );
};

export default ChatWidget;
