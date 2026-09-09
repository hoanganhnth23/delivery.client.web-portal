import { useEffect, useMemo, useRef, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useAppDependencies } from '@/app/dependencies';
import {
  getSupportChatErrorMessage,
  type SupportChatServicePort,
} from '@/modules/admin/services/firebaseChatService';
import type {
  SupportConversation,
  SupportMessage,
} from '@/modules/admin/services/supportChatModel';

const formatTime = (value: string | null): string => {
  if (!value) return 'Chưa có thời gian';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa có thời gian';
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(date);
};

const formatMessageTime = (value: string | null): string => {
  if (!value) return 'Đang gửi';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Đang gửi';
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const initials = (conversation: SupportConversation): string =>
  conversation.userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'KH';

const isUnread = (conversation: SupportConversation): boolean =>
  conversation.agentUnreadCount > 0 ||
  (conversation.unreadCount > 0 && conversation.lastMessageSenderRole === 'USER');

const subscribeToConversations = async (
  service: SupportChatServicePort,
  onData: (conversations: SupportConversation[]) => void,
  onError: (error: unknown) => void,
): Promise<() => void> => service.watchConversations(onData, onError);

const ConversationList = ({
  conversations,
  selectedId,
  loading,
  onSelect,
}: {
  conversations: SupportConversation[];
  selectedId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
}) => (
  <div className="flex min-h-0 flex-1 flex-col">
    <div className="flex items-center justify-between border-b border-border-light px-4 py-4 dark:border-border-dark">
      <div>
        <h2 className="font-bold text-gray-900 dark:text-white">Hộp thư hỗ trợ</h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {conversations.length} cuộc hội thoại đang mở
        </p>
      </div>
      <span aria-hidden="true" className="material-symbols-outlined text-primary">forum</span>
    </div>

    <div className="min-h-0 flex-1 overflow-y-auto">
      {loading && conversations.length === 0 ? (
        <div className="space-y-3 p-4" aria-label="Đang tải cuộc hội thoại" aria-busy="true">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex animate-pulse gap-3 rounded-xl p-2">
              <div className="size-10 shrink-0 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-full rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="px-6 py-14 text-center" role="status">
          <span aria-hidden="true" className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600">inbox</span>
          <p className="mt-3 font-semibold text-gray-800 dark:text-gray-200">Chưa có hội thoại mới</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Tin nhắn từ khách hàng sẽ xuất hiện tại đây.</p>
        </div>
      ) : (
        <div className="divide-y divide-border-light dark:divide-border-dark" role="list" aria-label="Các cuộc hội thoại">
          {conversations.map((conversation) => {
            const active = selectedId === conversation.id;
            return (
              <button
                key={conversation.id}
                type="button"
                role="listitem"
                onClick={() => onSelect(conversation.id)}
                aria-current={active ? 'true' : undefined}
                className={`flex w-full items-start gap-3 px-4 py-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/40 ${
                  active
                    ? 'bg-primary/10'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
                }`}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-black text-primary">
                  {initials(conversation)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className={`truncate text-sm ${isUnread(conversation) ? 'font-black text-gray-950 dark:text-white' : 'font-semibold text-gray-800 dark:text-gray-200'}`}>
                      {conversation.userName}
                    </span>
                    <span className="shrink-0 text-[11px] text-gray-400">{formatTime(conversation.updatedAt)}</span>
                  </span>
                  <span className="mt-1 flex items-center justify-between gap-2">
                    <span className={`line-clamp-2 text-xs ${isUnread(conversation) ? 'font-semibold text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                      {conversation.lastMessagePreview || 'Chưa có tin nhắn'}
                    </span>
                    {isUnread(conversation) && (
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white" aria-label="Có tin nhắn chưa đọc">
                        {Math.min(conversation.agentUnreadCount || conversation.unreadCount, 9)}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block truncate text-[11px] text-gray-400">{conversation.userEmail}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  </div>
);

const MessageBubble = ({ message }: { message: SupportMessage }) => {
  const isSupport = message.senderRole === 'ADMIN';
  return (
    <div className={`flex ${isSupport ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[84%] sm:max-w-[70%] ${isSupport ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-6 ${isSupport ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'}`}>
          {message.content}
        </div>
        <span className="mt-1 px-1 text-[11px] text-gray-400">
          {isSupport ? 'Bạn · CSKH' : 'Khách hàng'} · {formatMessageTime(message.timestamp)}
          {isSupport && message.isRead ? ' · Đã đọc' : ''}
        </span>
      </div>
    </div>
  );
};

const ConversationPanel = ({
  conversation,
  messages,
  loading,
  draft,
  sending,
  closing,
  onDraftChange,
  onSend,
  onClose,
  onBack,
}: {
  conversation: SupportConversation | null;
  messages: SupportMessage[];
  loading: boolean;
  draft: string;
  sending: boolean;
  closing: boolean;
  onDraftChange: (value: string) => void;
  onSend: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  onBack: () => void;
}) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages]);

  if (!conversation) {
    return (
      <section className="hidden min-h-[620px] flex-1 items-center justify-center rounded-2xl border border-border-light bg-white dark:border-border-dark dark:bg-surface-dark lg:flex" aria-label="Chưa chọn cuộc hội thoại">
        <div className="max-w-sm px-6 text-center">
          <span aria-hidden="true" className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600">mark_unread_chat_alt</span>
          <h2 className="mt-4 text-xl font-black text-gray-900 dark:text-white">Chọn một cuộc hội thoại</h2>
          <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">Chọn khách hàng bên trái để xem tin nhắn và phản hồi trực tiếp.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-[620px] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border-light bg-white dark:border-border-dark dark:bg-surface-dark">
      <header className="flex items-center gap-3 border-b border-border-light px-4 py-4 dark:border-border-dark sm:px-6">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:hover:bg-gray-800 lg:hidden"
          aria-label="Quay lại danh sách hội thoại"
        >
          <span aria-hidden="true" className="material-symbols-outlined">arrow_back</span>
        </button>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-black text-primary">{initials(conversation)}</span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-bold text-gray-900 dark:text-white">{conversation.userName}</h2>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{conversation.userEmail} · Đang hỗ trợ</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={closing}
          className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-red-800 dark:hover:bg-red-950/20 dark:hover:text-red-300"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-lg">check_circle</span>
          <span className="hidden sm:inline">{closing ? 'Đang đóng…' : 'Đóng hội thoại'}</span>
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col bg-gray-50/70 dark:bg-background-dark/30">
        <div ref={messagesContainerRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6" aria-live="polite" aria-label="Tin nhắn">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500" role="status">Đang tải tin nhắn…</div>
          ) : messages.length === 0 ? (
            <div className="flex h-full min-h-48 items-center justify-center text-center text-sm text-gray-500 dark:text-gray-400" role="status">
              Chưa có tin nhắn. Hãy gửi lời chào để bắt đầu hỗ trợ.
            </div>
          ) : (
            messages.map((message) => <MessageBubble key={message.id} message={message} />)
          )}
        </div>

        <form onSubmit={onSend} className="border-t border-border-light bg-white p-3 dark:border-border-dark dark:bg-surface-dark sm:p-4">
          <label htmlFor="support-chat-draft" className="sr-only">Nội dung trả lời khách hàng</label>
          <div className="flex items-end gap-2">
            <textarea
              id="support-chat-draft"
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              placeholder="Nhập tin nhắn cho khách hàng…"
              maxLength={2000}
              rows={2}
              disabled={sending || closing}
              className="min-h-11 flex-1 resize-none rounded-xl border border-border-light bg-gray-50 px-4 py-3 text-sm leading-5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-border-dark dark:bg-background-dark dark:text-white"
            />
            <button
              type="submit"
              disabled={sending || closing || draft.trim().length === 0}
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Gửi tin nhắn"
            >
              <span aria-hidden="true" className="material-symbols-outlined">send</span>
            </button>
          </div>
          <p className="mt-2 text-right text-[11px] text-gray-400">{draft.length}/2000</p>
        </form>
      </div>
    </section>
  );
};

const AdminChatPage = () => {
  const { notifications, supportChat } = useAppDependencies();
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [connectionAttempt, setConnectionAttempt] = useState(0);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  useEffect(() => {
    if (selectedId && conversations.some((conversation) => conversation.id === selectedId)) return;
    setSelectedId(conversations[0]?.id ?? null);
  }, [conversations, selectedId]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    setLoadingConversations(true);
    setError(null);

    void subscribeToConversations(
      supportChat,
      (nextConversations) => {
        if (cancelled) return;
        setConversations(nextConversations);
        setLoadingConversations(false);
      },
      (listenerError) => {
        if (cancelled) return;
        setLoadingConversations(false);
        setError(getSupportChatErrorMessage(listenerError));
      },
    )
      .then((stop) => {
        if (cancelled) stop();
        else unsubscribe = stop;
      })
      .catch((listenerError: unknown) => {
        if (cancelled) return;
        setLoadingConversations(false);
        setError(getSupportChatErrorMessage(listenerError));
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [connectionAttempt, supportChat]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    setMessages([]);
    setMessageError(null);
    if (!selectedId) {
      setLoadingMessages(false);
      return undefined;
    }

    setLoadingMessages(true);
    void supportChat.watchMessages(
      selectedId,
      (nextMessages) => {
        if (cancelled) return;
        setMessages(nextMessages);
        setLoadingMessages(false);
      },
      (listenerError) => {
        if (cancelled) return;
        setLoadingMessages(false);
        setMessageError(getSupportChatErrorMessage(listenerError));
      },
    )
      .then((stop) => {
        if (cancelled) stop();
        else unsubscribe = stop;
      })
      .catch((listenerError: unknown) => {
        if (cancelled) return;
        setLoadingMessages(false);
        setMessageError(getSupportChatErrorMessage(listenerError));
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [selectedId, supportChat]);

  useEffect(() => {
    if (!selectedId || !messages.some((message) => message.senderRole === 'USER' && !message.isRead)) return;
    void supportChat.markConversationRead(selectedId).catch((readError: unknown) => {
      setMessageError(getSupportChatErrorMessage(readError));
    });
  }, [messages, selectedId, supportChat]);

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedConversation || !draft.trim() || sending) return;
    setSending(true);
    setMessageError(null);
    try {
      await supportChat.sendTextMessage(selectedConversation, draft);
      setDraft('');
    } catch (sendError) {
      const message = getSupportChatErrorMessage(sendError);
      setMessageError(message);
      notifications.error(message);
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    if (!selectedConversation || closing) return;
    if (!window.confirm(`Đóng hội thoại với ${selectedConversation.userName}?`)) return;
    setClosing(true);
    setMessageError(null);
    try {
      await supportChat.closeConversation(selectedConversation.id, 'Closed by support agent');
      notifications.success('Đã đóng hội thoại CSKH');
      setSelectedId(null);
    } catch (closeError) {
      const message = getSupportChatErrorMessage(closeError);
      setMessageError(message);
      notifications.error(message);
    } finally {
      setClosing(false);
    }
  };

  return (
    <AdminLayout>
      <section className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Customer care</p>
            <h1 className="mt-1 text-2xl font-black text-gray-900 dark:text-white sm:text-3xl">Chat với khách hàng</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">Phản hồi realtime qua Firestore. Chỉ tài khoản ADMIN đã xác thực mới có thể đọc hoặc gửi tin nhắn.</p>
          </div>
          {error && (
            <button
              type="button"
              onClick={() => setConnectionAttempt((attempt) => attempt + 1)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-lg">refresh</span>
              Kết nối lại
            </button>
          )}
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
            <span aria-hidden="true" className="material-symbols-outlined text-xl">error</span>
            <div>
              <p className="font-bold">Không thể tải inbox CSKH</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {messageError && (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <span>{messageError}</span>
            <button type="button" onClick={() => setMessageError(null)} className="rounded p-1 hover:bg-amber-100 dark:hover:bg-amber-900/40" aria-label="Đóng thông báo lỗi">
              <span aria-hidden="true" className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        )}

        <div className="flex min-h-[620px] min-w-0 gap-4 lg:flex-row">
          <aside className={`flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border-light bg-white dark:border-border-dark dark:bg-surface-dark lg:w-[340px] lg:max-w-[360px] lg:flex-none ${selectedConversation ? 'hidden lg:flex' : 'flex'}`}>
            <ConversationList
              conversations={conversations}
              selectedId={selectedId}
              loading={loadingConversations}
              onSelect={setSelectedId}
            />
          </aside>
          <div className={`${selectedConversation ? 'flex' : 'hidden lg:flex'} min-w-0 flex-1`}>
            <ConversationPanel
              conversation={selectedConversation}
              messages={messages}
              loading={loadingMessages}
              draft={draft}
              sending={sending}
              closing={closing}
              onDraftChange={setDraft}
              onSend={(event) => void handleSend(event)}
              onClose={() => void handleClose()}
              onBack={() => setSelectedId(null)}
            />
          </div>
        </div>
      </section>
    </AdminLayout>
  );
};

export default AdminChatPage;
