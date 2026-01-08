/**
 * useChat Hook
 * Custom hook quản lý chat state và actions với Firebase real-time
 */

import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import type { Conversation, Message, ChatActionResult } from '@/types/chat.types';
import * as firebaseChatService from '../services/firebaseChatService';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { USER_ROLES } from '@/utils/constants';

interface ChatContextValue {
    // States
    conversations: Conversation[];
    currentConversation: Conversation | null;
    messages: Message[];
    loading: boolean;
    error: string | null;
    unreadCount: number;

    // Actions
    getConversations: () => Promise<void>;
    getRestaurantConversations: (restaurantId?: number) => Promise<void>;
    getSupportConversations: () => Promise<void>; // NEW: Load conversations CSKH cho admin
    selectConversation: (conversationId: string) => Promise<void>;
    sendMessage: (content: string, type?: 'text' | 'image') => Promise<ChatActionResult>;
    createConversation: (userId: string, userEmail: string, userName: string, restaurantId?: number, isSupportChat?: boolean) => Promise<ChatActionResult>;
    createOrSelectSupportConversation: (userId: string, userEmail: string, userName: string, restaurantId: number) => Promise<ChatActionResult>; // NEW: Tạo hoặc chọn support conversation
    closeConversation: (reason?: string) => Promise<ChatActionResult>;
    markAsRead: (messageId: string) => Promise<void>;
    clearCurrentConversation: () => void;
}

interface ChatProviderProps {
    children: ReactNode;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export const ChatProvider = ({ children }: ChatProviderProps) => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Subscribe to conversations real-time
    // useEffect(() => {
    //     if (!user) return;

    //     const unsubscribe = firebaseChatService.subscribeToConversations(
    //         user.id.toString(),
    //         (updatedConversations) => {
    //             setConversations(updatedConversations);
    //         }
    //     );

    //     return () => unsubscribe();
    // }, [user]);

    // // Subscribe to messages real-time khi có currentConversation
    // useEffect(() => {
    //     if (!currentConversation) return;

    //     const unsubscribe = firebaseChatService.subscribeToMessages(
    //         currentConversation.id,
    //         (updatedMessages) => {
    //             setMessages(updatedMessages);
    //         }
    //     );

    //     return () => unsubscribe();
    // }, [currentConversation]);

    // Tính tổng số tin nhắn chưa đọc
    const unreadCount = useMemo(() => {
        return conversations.reduce((total, conv) => total + conv.unreadCount, 0);
    }, [conversations]);

    /**
     * Lấy danh sách conversations (Firebase tự động subscribe)
     */
    const getConversations = useCallback(async () => {
        // Firebase auto-subscribes, chỉ cần set loading
        setLoading(false);
    }, []);

    /**
     * Lấy danh sách conversations của restaurant
     */
    const getRestaurantConversations = useCallback(async (restaurantId?: number) => {
        if (!restaurantId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Subscribe to restaurant conversations real-time
            // Note: Unsubscribe sẽ được handle tự động khi component unmount
            firebaseChatService.subscribeToRestaurantConversations(
                restaurantId,
                (updatedConversations) => {
                    setConversations(updatedConversations);
                    setLoading(false);
                }
            );
        } catch (err) {
            setError((err as Error).message);
            setLoading(false);
        }
    }, []);

    /**
     * Lấy danh sách support conversations cho Admin (CSKH)
     */
    const getSupportConversations = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Subscribe to support conversations real-time
            firebaseChatService.subscribeToSupportConversations(
                (updatedConversations) => {
                    setConversations(updatedConversations);
                    setLoading(false);
                }
            );
        } catch (err) {
            setError((err as Error).message);
            setLoading(false);
        }
    }, []);

    /**
     * Chọn conversation và load messages (Firebase auto-subscribes)
     */
    const selectConversation = useCallback(async (conversationId: string) => {
        try {
            setLoading(true);
            setError(null);

            // Load conversation details
            const conversation = await firebaseChatService.getConversationById(conversationId);
            if (conversation) {
                setCurrentConversation(conversation);
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Gửi message (Firebase real-time update)
     */
    const sendMessage = useCallback(async (
        content: string,
        type: 'text' | 'image' = 'text'
    ): Promise<ChatActionResult> => {
        if (!currentConversation || !user) {
            return { success: false, message: 'Chưa chọn conversation hoặc chưa đăng nhập' };
        }

        try {
            setLoading(true);

            // Xác định sender type dựa vào role
            const sender: 'user' | 'restaurant' | 'support' =
                user.role === USER_ROLES.RESTAURANT_OWNER ? 'restaurant' :
                    user.role === USER_ROLES.ADMIN ? 'support' : 'user';

            await firebaseChatService.sendMessage(
                currentConversation.id,
                content,
                sender,
                type
            );

            setLoading(false);
            return { success: true, message: 'Gửi tin nhắn thành công' };
        } catch (err) {
            setLoading(false);
            return { success: false, message: (err as Error).message };
        }
    }, [currentConversation, user]);

    /**
     * Tạo conversation mới (Firebase)
     */
    const createConversation = useCallback(async (
        userId: string,
        userEmail: string,
        userName: string,
        restaurantId?: number,
        isSupportChat?: boolean
    ): Promise<ChatActionResult> => {
        try {
            setLoading(true);

            const conversationId = await firebaseChatService.createConversation(
                userId,
                userEmail,
                userName,
                restaurantId,
                isSupportChat
            );

            // Load conversation vừa tạo
            const conversation = await firebaseChatService.getConversationById(conversationId);
            if (conversation) {
                setCurrentConversation(conversation);
            }

            setLoading(false);
            return { success: true, message: 'Tạo cuộc hội thoại thành công' };
        } catch (err) {
            setLoading(false);
            return { success: false, message: (err as Error).message };
        }
    }, []);

    /**
     * Tạo hoặc chọn support conversation (chỉ cho phép 1 conversation CSKH active)
     */
    const createOrSelectSupportConversation = useCallback(async (
        userId: string,
        userEmail: string,
        userName: string,
        restaurantId: number
    ): Promise<ChatActionResult> => {
        try {
            setLoading(true);

            // Kiểm tra xem đã có support conversation active chưa
            const existingConversation = await firebaseChatService.getActiveSupportConversation(restaurantId);

            if (existingConversation) {
                // Nếu đã có rồi thì chọn conversation đó
                setCurrentConversation(existingConversation);
                setLoading(false);
                return {
                    success: true,
                    message: 'Đã chọn cuộc hội thoại CSKH hiện có',
                    data: existingConversation
                };
            }

            // Nếu chưa có thì tạo mới
            const conversationId = await firebaseChatService.createConversation(
                userId,
                userEmail,
                userName,
                restaurantId,
                true // isSupportChat = true
            );

            // Load conversation vừa tạo
            const conversation = await firebaseChatService.getConversationById(conversationId);
            if (conversation) {
                setCurrentConversation(conversation);
            }

            setLoading(false);
            return { success: true, message: 'Tạo cuộc hội thoại CSKH mới thành công' };
        } catch (err) {
            setLoading(false);
            return { success: false, message: (err as Error).message };
        }
    }, []);

    /**
     * Đóng conversation (Firebase)
     */
    const closeConversation = useCallback(async (
        reason?: string
    ): Promise<ChatActionResult> => {
        if (!currentConversation || !user) {
            return { success: false, message: 'Chưa chọn conversation hoặc chưa đăng nhập' };
        }

        try {
            setLoading(true);

            await firebaseChatService.closeConversation(
                currentConversation.id,
                user.email,
                reason
            );

            setLoading(false);
            return { success: true, message: 'Đã đóng cuộc hội thoại' };
        } catch (err) {
            setLoading(false);
            return { success: false, message: (err as Error).message };
        }
    }, [currentConversation, user]);

    /**
     * Đánh dấu message đã đọc (Firebase)
     */
    const markAsRead = useCallback(async (messageId: string) => {
        try {
            await firebaseChatService.markMessageAsRead(messageId);
            // Firebase auto-updates via subscription
        } catch (err) {
            console.error('Mark as read error:', err);
        }
    }, []);

    /**
     * Clear current conversation
     */
    const clearCurrentConversation = useCallback(() => {
        setCurrentConversation(null);
        setMessages([]);
    }, []);

    // Context value với useMemo
    const value = useMemo<ChatContextValue>(() => ({
        conversations,
        currentConversation,
        messages,
        loading,
        error,
        unreadCount,
        getConversations,
        getRestaurantConversations,
        getSupportConversations,
        selectConversation,
        sendMessage,
        createConversation,
        createOrSelectSupportConversation,
        closeConversation,
        markAsRead,
        clearCurrentConversation,
    }), [
        conversations,
        currentConversation,
        messages,
        loading,
        error,
        unreadCount,
        getConversations,
        getRestaurantConversations,
        getSupportConversations,
        selectConversation,
        sendMessage,
        createConversation,
        createOrSelectSupportConversation,
        closeConversation,
        markAsRead,
        clearCurrentConversation,
    ]);

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = (): ChatContextValue => {
    const context = useContext(ChatContext);
    if (!context) throw new Error('useChat must be used within ChatProvider');
    return context;
};
