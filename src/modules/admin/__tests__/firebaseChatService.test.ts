import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USER_ROLES } from '@/utils/constants';

const state = vi.hoisted(() => ({
  auth: { currentUser: null as { uid: string } | null },
  firestore: {},
  post: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  onSnapshot: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  commit: vi.fn(),
  update: vi.fn(),
  batchSet: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => state.auth),
  signInWithCustomToken: state.signIn,
  signOut: state.signOut,
}));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db, name) => ({ type: 'collection', name })),
  doc: vi.fn((_db, collectionOrPath, id) => ({ type: 'doc', collection: collectionOrPath, id: id ?? 'generated-id' })),
  getFirestore: vi.fn(() => state.firestore),
  getDoc: state.getDoc,
  getDocs: state.getDocs,
  increment: vi.fn((value) => ({ increment: value })),
  limit: vi.fn((value) => ({ limit: value })),
  onSnapshot: state.onSnapshot,
  orderBy: vi.fn((field, direction) => ({ orderBy: [field, direction] })),
  query: vi.fn((...args) => ({ args })),
  serverTimestamp: vi.fn(() => 'server-time'),
  updateDoc: state.update,
  where: vi.fn((field, op, value) => ({ where: [field, op, value] })),
  writeBatch: vi.fn(() => ({ set: state.batchSet, update: state.update, commit: state.commit })),
}));
vi.mock('@/config/firebase', () => ({ getFirebaseApp: vi.fn(() => ({ app: true })) }));
vi.mock('@/services/api/apiClient', () => ({ default: { post: state.post }, handleResponse: (response: { data: unknown }) => response.data }));
vi.mock('@/services/storage/localStorage', () => ({ TokenStorage: { getUserInfo: vi.fn() } }));

import service, {
  getSupportChatErrorMessage,
  resolveAdminPrincipalId,
} from '../services/firebaseChatService';
import { TokenStorage } from '@/services/storage/localStorage';

const admin = { id: 1, authId: 7001, email: 'a@test', name: 'Admin', role: USER_ROLES.ADMIN };
const conversation = { id: 'c1', principalId: '501', userId: 4, userEmail: 'u@test', userName: 'User', isSupportChat: true, status: 'open' as const, createdAt: null, updatedAt: null, unreadCount: 0, customerUnreadCount: 0, agentUnreadCount: 0, lastMessagePreview: null, lastMessageSenderRole: null };

beforeEach(() => {
  vi.clearAllMocks();
  state.auth.currentUser = null;
  vi.mocked(TokenStorage.getUserInfo).mockReturnValue(admin);
  state.post.mockResolvedValue({ data: { token: 'firebase-token', principalId: 7001, role: USER_ROLES.ADMIN, expiresInSeconds: 300 } });
  state.signIn.mockResolvedValue({ user: { uid: '7001' } });
  state.signOut.mockResolvedValue(undefined);
  state.onSnapshot.mockReturnValue(vi.fn());
  state.getDoc.mockResolvedValue({ exists: () => true, id: 'c1', data: () => ({ ...conversation }) });
  state.getDocs.mockResolvedValue({ docs: [] });
  state.commit.mockResolvedValue(undefined);
  state.update.mockReset();
});

describe('Firebase support chat service', () => {
  it('validates admin identity and maps friendly errors', () => {
    expect(resolveAdminPrincipalId(admin)).toBe('7001');
    expect(() => resolveAdminPrincipalId(null)).toThrow('không hợp lệ');
    expect(() => resolveAdminPrincipalId({ ...admin, role: USER_ROLES.USER })).toThrow('không hợp lệ');
    expect(() => resolveAdminPrincipalId({ ...admin, authId: 0 })).toThrow('thiếu auth id');
    expect(getSupportChatErrorMessage({ code: 'permission-denied' })).toContain('Rules');
    expect(getSupportChatErrorMessage({ code: 'PERMISSION_DENIED' })).toContain('Rules');
    expect(getSupportChatErrorMessage({ code: 'failed-precondition' })).toContain('index');
    expect(getSupportChatErrorMessage(new Error('custom'))).toBe('custom');
    expect(getSupportChatErrorMessage({})).toContain('Không thể kết nối');
  });

  it('authenticates, watches conversation and message snapshots', async () => {
    const conversationData = vi.fn();
    const messageData = vi.fn();
    await service.watchConversations(conversationData, vi.fn());
    await service.watchMessages('c1', messageData, vi.fn());
    expect(state.post).toHaveBeenCalledTimes(2);
    expect(state.onSnapshot).toHaveBeenCalledTimes(2);
    const conversationSnapshot = state.onSnapshot.mock.calls[0][1];
    conversationSnapshot({ docs: [{ id: 'c1', data: () => ({ isSupportChat: true, status: 'open', principalId: 1 }) }] });
    expect(conversationData).toHaveBeenCalledWith([expect.objectContaining({ id: 'c1', isSupportChat: true })]);
    const messageSnapshot = state.onSnapshot.mock.calls[1][1];
    messageSnapshot({ docs: [{ id: 'm1', data: () => ({ conversationId: 'c1', senderRole: 'ADMIN', senderPrincipalId: 7001, content: 'hi' }) }] });
    expect(messageData).toHaveBeenCalledWith([expect.objectContaining({ sender: 'support' })]);
  });

  it('reuses matching auth, signs out mismatched auth, and rejects bad token identities', async () => {
    state.auth.currentUser = { uid: '7001' };
    await service.watchMessages('c1', vi.fn(), vi.fn());
    expect(state.post).not.toHaveBeenCalled();
    state.auth.currentUser = { uid: 'other' };
    await service.watchMessages('c1', vi.fn(), vi.fn());
    expect(state.signOut).toHaveBeenCalled();
    state.auth.currentUser = null;
    state.post.mockResolvedValueOnce({ data: { token: '', principalId: 7001, role: USER_ROLES.ADMIN } });
    await expect(service.watchMessages('c1', vi.fn(), vi.fn())).rejects.toThrow('không hợp lệ');
    state.post.mockResolvedValueOnce({ data: { token: 'token', principalId: 999, role: USER_ROLES.ADMIN } });
    await expect(service.watchMessages('c1', vi.fn(), vi.fn())).rejects.toThrow('không hợp lệ');
    state.post.mockResolvedValueOnce({ data: { token: 'token', principalId: 7001, role: USER_ROLES.USER } });
    await expect(service.watchMessages('c1', vi.fn(), vi.fn())).rejects.toThrow('không hợp lệ');
    state.post.mockResolvedValueOnce({ data: { token: 'token', principalId: 7001, role: USER_ROLES.ADMIN } });
    state.signIn.mockResolvedValueOnce({ user: { uid: 'wrong' } });
    await expect(service.watchMessages('c1', vi.fn(), vi.fn())).rejects.toThrow('không khớp');
  });

  it('sends text only to an open support conversation', async () => {
    await service.sendTextMessage(conversation, ' hello ');
    expect(state.batchSet).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ principalId: '501', senderPrincipalId: '7001', content: 'hello' }));
    expect(state.commit).toHaveBeenCalled();
    state.getDoc.mockResolvedValueOnce({ exists: () => false });
    await expect(service.sendTextMessage(conversation, 'hello')).rejects.toThrow('không còn mở');
    state.getDoc.mockResolvedValueOnce({ exists: () => true, id: 'c1', data: () => ({ ...conversation, status: 'closed' }) });
    await expect(service.sendTextMessage(conversation, 'hello')).rejects.toThrow('không còn mở');
    await expect(service.sendTextMessage(conversation, ' '.repeat(2))).rejects.toThrow('1 đến 2000');
  });

  it('marks unread user messages read and closes conversations', async () => {
    state.getDocs.mockResolvedValueOnce({ docs: [
      { id: 'm1', ref: { id: 'm1' }, data: () => ({ senderRole: 'USER', isRead: false }) },
      { id: 'm2', ref: { id: 'm2' }, data: () => ({ senderRole: 'ADMIN', isRead: true }) },
    ] });
    await service.markConversationRead('c1');
    expect(state.update).toHaveBeenCalledWith(expect.objectContaining({ id: 'm1' }), expect.objectContaining({ isRead: true }));
    expect(state.commit).toHaveBeenCalled();
    await service.closeConversation('c1', '  resolved  ');
    expect(state.update).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1' }), expect.objectContaining({ status: 'closed', closeReason: 'resolved', closedBy: '7001' }));
    await service.closeConversation('c1', '   ');
    expect(state.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ closeReason: null }));
  });
});
