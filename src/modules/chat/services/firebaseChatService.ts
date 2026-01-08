/**
 * Firebase Chat Service
 * Service xử lý real-time chat với Firebase Firestore
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Conversation, Message } from '@/types/chat.types';

/**
 * Tạo conversation mới
 */
export const createConversation = async (
  userId: string,
  userEmail: string,
  userName: string,
  restaurantId?: number,
  isSupportChat?: boolean
): Promise<string> => {
  const conversationData = {
    userId,
    userEmail,
    userName,
    restaurantId: restaurantId || null,
    restaurantName: null,
    isSupportChat: isSupportChat || false,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    unreadCount: 0,
    closedAt: null,
    closedBy: null,
    closeReason: null,
  };

  const docRef = await addDoc(collection(db, 'conversations'), conversationData);
  return docRef.id;
};

/**
 * Gửi message mới
 */
export const sendMessage = async (
  conversationId: string,
  content: string,
  sender: 'user' | 'restaurant' | 'support',
  type: 'text' | 'image' = 'text'
): Promise<string> => {
  const messageData = {
    conversationId,
    content,
    type,
    sender,
    timestamp: serverTimestamp(),
    isRead: false,
  };

  // Thêm message vào collection messages
  const messageRef = await addDoc(collection(db, 'messages'), messageData);

  // Cập nhật lastMessage trong conversation
  const conversationRef = doc(db, 'conversations', conversationId);
  await updateDoc(conversationRef, {
    updatedAt: serverTimestamp(),
    lastMessage: {
      id: messageRef.id,
      content,
      type,
      sender,
      timestamp: Timestamp.now(),
      isRead: false,
    },
  });

  return messageRef.id;
};

/**
 * Đánh dấu message đã đọc
 */
export const markMessageAsRead = async (messageId: string): Promise<void> => {
  const messageRef = doc(db, 'messages', messageId);
  await updateDoc(messageRef, {
    isRead: true,
  });
};

/**
 * Đóng conversation
 */
export const closeConversation = async (
  conversationId: string,
  closedBy: string,
  closeReason?: string
): Promise<void> => {
  const conversationRef = doc(db, 'conversations', conversationId);
  await updateDoc(conversationRef, {
    status: 'closed',
    closedAt: serverTimestamp(),
    closedBy,
    closeReason: closeReason || null,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Lắng nghe conversations real-time
 */
export const subscribeToConversations = (
  userId: string,
  callback: (conversations: Conversation[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, 'conversations'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const conversations: Conversation[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      conversations.push({
        id: doc.id,
        userId: data.userId,
        userEmail: data.userEmail,
        userName: data.userName,
        userAvatar: data.userAvatar,
        restaurantId: data.restaurantId,
        restaurantName: data.restaurantName,
        isSupportChat: data.isSupportChat || false,
        status: data.status,
        createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString(),
        unreadCount: data.unreadCount || 0,
        closedAt: data.closedAt?.toDate().toISOString() || null,
        closedBy: data.closedBy || null,
        closeReason: data.closeReason || null,
        lastMessage: data.lastMessage ? {
          ...data.lastMessage,
          timestamp: data.lastMessage.timestamp?.toDate().toISOString() || new Date().toISOString(),
        } : undefined,
      });
    });
    callback(conversations);
  });
};

/**
 * Lắng nghe conversations của restaurant real-time
 */
export const subscribeToRestaurantConversations = (
  restaurantId: number,
  callback: (conversations: Conversation[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, 'conversations'),
    where('restaurantId', '==', restaurantId),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const conversations: Conversation[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      conversations.push({
        id: doc.id,
        userId: data.userId,
        userEmail: data.userEmail,
        userName: data.userName,
        userAvatar: data.userAvatar,
        restaurantId: data.restaurantId,
        restaurantName: data.restaurantName,
        isSupportChat: data.isSupportChat || false,
        status: data.status,
        createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString(),
        unreadCount: data.unreadCount || 0,
        closedAt: data.closedAt?.toDate().toISOString() || null,
        closedBy: data.closedBy || null,
        closeReason: data.closeReason || null,
        lastMessage: data.lastMessage ? {
          ...data.lastMessage,
          timestamp: data.lastMessage.timestamp?.toDate().toISOString() || new Date().toISOString(),
        } : undefined,
      });
    });
    callback(conversations);
  });
};

/**
 * Lắng nghe tất cả support conversations cho Admin real-time
 */
export const subscribeToSupportConversations = (
  callback: (conversations: Conversation[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, 'conversations'),
    where('isSupportChat', '==', true),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const conversations: Conversation[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      conversations.push({
        id: doc.id,
        userId: data.userId,
        userEmail: data.userEmail,
        userName: data.userName,
        userAvatar: data.userAvatar,
        restaurantId: data.restaurantId,
        restaurantName: data.restaurantName,
        isSupportChat: data.isSupportChat || false,
        status: data.status,
        createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString(),
        unreadCount: data.unreadCount || 0,
        closedAt: data.closedAt?.toDate().toISOString() || null,
        closedBy: data.closedBy || null,
        closeReason: data.closeReason || null,
        lastMessage: data.lastMessage ? {
          ...data.lastMessage,
          timestamp: data.lastMessage.timestamp?.toDate().toISOString() || new Date().toISOString(),
        } : undefined,
      });
    });
    callback(conversations);
  });
};

/**
 * Lắng nghe messages real-time
 */
export const subscribeToMessages = (
  conversationId: string,
  callback: (messages: Message[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, 'messages'),
    where('conversationId', '==', conversationId),
    orderBy('timestamp', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        conversationId: data.conversationId,
        content: data.content,
        type: data.type,
        sender: data.sender,
        timestamp: data.timestamp?.toDate().toISOString() || new Date().toISOString(),
        isRead: data.isRead || false,
      });
    });
    callback(messages);
  });
};

/**
 * Lấy conversation theo ID
 */
export const getConversationById = async (conversationId: string): Promise<Conversation | null> => {
  const docRef = doc(db, 'conversations', conversationId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    userId: data.userId,
    userEmail: data.userEmail,
    userName: data.userName,
    userAvatar: data.userAvatar,
    restaurantId: data.restaurantId,
    restaurantName: data.restaurantName,
    status: data.status,
    createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString(),
    unreadCount: data.unreadCount || 0,
    closedAt: data.closedAt?.toDate().toISOString() || null,
    closedBy: data.closedBy || null,
    closeReason: data.closeReason || null,
    lastMessage: data.lastMessage ? {
      ...data.lastMessage,
      timestamp: data.lastMessage.timestamp?.toDate().toISOString() || new Date().toISOString(),
    } : undefined,
  };
};

/**
 * Lấy messages của conversation
 */
export const getMessages = async (conversationId: string): Promise<Message[]> => {
  const q = query(
    collection(db, 'messages'),
    where('conversationId', '==', conversationId),
    orderBy('timestamp', 'asc')
  );

  const snapshot = await getDocs(q);
  const messages: Message[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    messages.push({
      id: doc.id,
      conversationId: data.conversationId,
      content: data.content,
      type: data.type,
      sender: data.sender,
      timestamp: data.timestamp?.toDate().toISOString() || new Date().toISOString(),
      isRead: data.isRead || false,
    });
  });

  return messages;
};

/**
 * Kiểm tra xem restaurant đã có support conversation active chưa
 */
export const getActiveSupportConversation = async (restaurantId: number): Promise<Conversation | null> => {
  const q = query(
    collection(db, 'conversations'),
    where('restaurantId', '==', restaurantId),
    // where('isSupportChat', '==', true),
    where('status', '==', 'active')
  );

  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }

  // Lấy conversation đầu tiên (mới nhất)
  const doc = snapshot.docs[0];
  const data = doc.data();
  
  return {
    id: doc.id,
    userId: data.userId,
    userEmail: data.userEmail,
    userName: data.userName,
    userAvatar: data.userAvatar,
    restaurantId: data.restaurantId,
    restaurantName: data.restaurantName,
    isSupportChat: data.isSupportChat || false,
    status: data.status,
    createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString(),
    unreadCount: data.unreadCount || 0,
    closedAt: data.closedAt?.toDate().toISOString() || null,
    closedBy: data.closedBy || null,
    closeReason: data.closeReason || null,
    lastMessage: data.lastMessage ? {
      ...data.lastMessage,
      timestamp: data.lastMessage.timestamp?.toDate().toISOString() || new Date().toISOString(),
    } : undefined,
  };
};
