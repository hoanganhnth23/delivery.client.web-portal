import {
  getAuth,
  signInWithCustomToken,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  getFirestore,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseApp } from '@/config/firebase';
import apiClient, { handleResponse } from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/services/api/endpoints';
import { TokenStorage } from '@/services/storage/localStorage';
import { USER_ROLES } from '@/utils/constants';
import type { User } from '@/types/api.types';
import {
  buildAdminMessagePayload,
  mapSupportConversation,
  mapSupportMessage,
  normalizeSupportMessageContent,
  type SupportConversation,
  type SupportMessage,
} from './supportChatModel';

interface FirebaseChatTokenResponse {
  token: string;
  expiresInSeconds: number;
  principalId: number | string;
  role: string;
}

export interface SupportChatServicePort {
  watchConversations(
    onData: (conversations: SupportConversation[]) => void,
    onError: (error: unknown) => void,
  ): Promise<Unsubscribe>;
  watchMessages(
    conversationId: string,
    onData: (messages: SupportMessage[]) => void,
    onError: (error: unknown) => void,
  ): Promise<Unsubscribe>;
  sendTextMessage(conversation: SupportConversation, content: string): Promise<void>;
  markConversationRead(conversationId: string): Promise<void>;
  closeConversation(conversationId: string, reason?: string): Promise<void>;
}

const getChatAuth = () => getAuth(getFirebaseApp());
const getChatFirestore = () => getFirestore(getFirebaseApp());

// Kept local to avoid exporting an identity that could be mistaken for an
// authorization source. The backend token and Firestore Rules remain the
// authority for the actual sender identity.
export const resolveAdminPrincipalId = (
  user: User | null,
  _legacyAccessToken?: string | null,
): string => {
  if (!user || user.role !== USER_ROLES.ADMIN) {
    throw new Error('Phiên ADMIN không hợp lệ cho chat CSKH');
  }

  if (
    typeof user.authId === 'number' &&
    Number.isSafeInteger(user.authId) &&
    user.authId > 0
  ) {
    return String(user.authId);
  }

  throw new Error('Phiên ADMIN thiếu auth id ổn định cho chat CSKH');
};

const currentAdminPrincipalId = (): string =>
  resolveAdminPrincipalId(TokenStorage.getUserInfo());

const toPrincipalId = (value: unknown): string => {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isSafeInteger(value)) return String(value);
  return '';
};

const getErrorCode = (error: unknown): string | undefined => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
};

export const getSupportChatErrorMessage = (error: unknown): string => {
  const code = getErrorCode(error);
  if (code === 'permission-denied' || code === 'PERMISSION_DENIED') {
    return 'Firebase Rules chưa cấp quyền cho tài khoản ADMIN này.';
  }
  if (code === 'failed-precondition') {
    return 'Firestore đang thiếu index cho inbox CSKH. Hãy deploy firestore.indexes.json.';
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Không thể kết nối trung tâm CSKH. Vui lòng thử lại.';
};

const ensureFirebaseSession = async (): Promise<string> => {
  const expectedPrincipalId = currentAdminPrincipalId();
  const auth = getChatAuth();
  if (auth.currentUser?.uid === expectedPrincipalId) return expectedPrincipalId;

  if (auth.currentUser) await signOut(auth);

  const response = await apiClient.post(API_ENDPOINTS.AUTH.FIREBASE_CHAT_TOKEN);
  const tokenResponse = handleResponse<FirebaseChatTokenResponse>(response);
  if (
    typeof tokenResponse?.token !== 'string' ||
    tokenResponse.token.trim() === '' ||
    toPrincipalId(tokenResponse.principalId) !== expectedPrincipalId ||
    tokenResponse.role !== USER_ROLES.ADMIN
  ) {
    throw new Error('Backend trả về Firebase chat token không hợp lệ');
  }

  const credential = await signInWithCustomToken(auth, tokenResponse.token);
  if (credential.user.uid !== expectedPrincipalId) {
    await signOut(auth);
    throw new Error('Firebase identity không khớp với phiên ADMIN');
  }
  return expectedPrincipalId;
};

const mapConversationSnapshot = (snapshot: {
  id: string;
  data(): DocumentData;
}): SupportConversation => mapSupportConversation(snapshot.id, snapshot.data());

const mapMessageSnapshot = (snapshot: {
  id: string;
  data(): DocumentData;
}): SupportMessage => mapSupportMessage(snapshot.id, snapshot.data());

const firebaseSupportChatService: SupportChatServicePort = {
  async watchConversations(onData, onError) {
    await ensureFirebaseSession();
    const firestore = getChatFirestore();
    const conversationsQuery = query(
      collection(firestore, 'conversations'),
      where('isSupportChat', '==', true),
      where('status', '==', 'open'),
      orderBy('updatedAt', 'desc'),
      limit(50),
    );

    return onSnapshot(
      conversationsQuery,
      (snapshot) => onData(snapshot.docs.map(mapConversationSnapshot)),
      onError,
    );
  },

  async watchMessages(conversationId, onData, onError) {
    await ensureFirebaseSession();
    const firestore = getChatFirestore();
    const messagesQuery = query(
      collection(firestore, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc'),
      limit(450),
    );

    return onSnapshot(
      messagesQuery,
      (snapshot) => onData(snapshot.docs.map(mapMessageSnapshot)),
      onError,
    );
  },

  async sendTextMessage(conversation, content) {
    const normalizedContent = normalizeSupportMessageContent(content);
    const senderPrincipalId = await ensureFirebaseSession();
    const firestore = getChatFirestore();
    const conversationReference = doc(firestore, 'conversations', conversation.id);
    const conversationSnapshot = await getDoc(conversationReference);
    const conversationData = conversationSnapshot.exists()
      ? mapConversationSnapshot(conversationSnapshot)
      : null;

    if (
      !conversationData ||
      !conversationData.isSupportChat ||
      conversationData.status !== 'open' ||
      !conversationData.principalId
    ) {
      throw new Error('Cuộc hội thoại không còn mở');
    }

    const messageReference = doc(collection(firestore, 'messages'));
    const timestamp = serverTimestamp();
    const messagePayload = buildAdminMessagePayload({
      conversationId: conversation.id,
      conversationPrincipalId: conversationData.principalId,
      senderPrincipalId,
      content: normalizedContent,
      messageId: messageReference.id,
      timestamp,
    });
    const batch = writeBatch(firestore);
    batch.set(messageReference, messagePayload as DocumentData);
    batch.update(conversationReference, {
      updatedAt: timestamp,
      lastMessage: {
        id: messageReference.id,
        content: normalizedContent,
        type: 'text',
        sender: 'support',
        senderRole: 'ADMIN',
        timestamp,
      },
      customerUnreadCount: increment(1),
      unreadCount: increment(1),
    });
    await batch.commit();
  },

  async markConversationRead(conversationId) {
    await ensureFirebaseSession();
    const firestore = getChatFirestore();
    const messagesQuery = query(
      collection(firestore, 'messages'),
      where('conversationId', '==', conversationId),
      limit(450),
    );
    const snapshot = await getDocs(messagesQuery);
    const batch = writeBatch(firestore);
    for (const messageSnapshot of snapshot.docs) {
      const message = mapMessageSnapshot(messageSnapshot);
      if (message.senderRole === 'USER' && !message.isRead) {
        batch.update(messageSnapshot.ref, {
          isRead: true,
          readAt: serverTimestamp(),
        });
      }
    }
    batch.update(doc(firestore, 'conversations', conversationId), {
      updatedAt: serverTimestamp(),
      agentUnreadCount: 0,
      unreadCount: 0,
    });
    await batch.commit();
  },

  async closeConversation(conversationId, reason) {
    const principalId = await ensureFirebaseSession();
    const firestore = getChatFirestore();
    await updateDoc(doc(firestore, 'conversations', conversationId), {
      status: 'closed',
      closedAt: serverTimestamp(),
      closedBy: principalId,
      closeReason: reason?.trim() || null,
      updatedAt: serverTimestamp(),
    });
  },
};

export default firebaseSupportChatService;
