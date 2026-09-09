import { useEffect, useMemo, useRef, useState } from 'react';
import type { SupportConversation, SupportMessage } from '@/modules/admin/services/supportChatModel';
import {
  closePreviewCustomerConversation,
  getPreviewSupportSnapshot,
  markPreviewCustomerRead,
  PREVIEW_CUSTOMER_CONVERSATION_ID,
  reopenPreviewCustomerConversation,
  sendPreviewCustomerMessage,
  subscribePreviewSupport,
  type PreviewSupportSnapshot,
} from '../support-preview/previewSupportChat';

type Props = { onBack: () => void };

const Icon = ({ name }: { name: string }) => (
  <span aria-hidden="true" className="material-symbols-outlined">{name}</span>
);

const formatTime = (value: string | null): string => {
  if (!value) return 'Đang gửi';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Đang gửi';
  return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(date);
};

const MessageBubble = ({ message }: { message: SupportMessage }) => {
  const isCustomer = message.senderRole === 'USER';
  return (
    <div className={`sf-support-message ${isCustomer ? 'is-customer' : 'is-support'}`}>
      <div className="sf-support-message-meta">
        <span>{isCustomer ? 'Bạn' : 'CSKH Delivery'}</span>
        <time dateTime={message.timestamp ?? undefined}>{formatTime(message.timestamp)}</time>
      </div>
      <p>{message.content}</p>
    </div>
  );
};

const conversationForCustomer = (snapshot: PreviewSupportSnapshot): SupportConversation | null =>
  snapshot.conversations.find((item) => item.id === PREVIEW_CUSTOMER_CONVERSATION_ID) ?? null;

export default function SupportChatPage({ onBack }: Props) {
  const [snapshot, setSnapshot] = useState(getPreviewSupportSnapshot);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => subscribePreviewSupport(setSnapshot), []);

  const conversation = useMemo(() => conversationForCustomer(snapshot), [snapshot]);
  const messages = snapshot.messages[PREVIEW_CUSTOMER_CONVERSATION_ID] ?? [];
  const isClosed = conversation?.status === 'closed';

  useEffect(() => {
    if (conversation?.customerUnreadCount) markPreviewCustomerRead();
  }, [conversation?.customerUnreadCount]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages.length]);

  const sendMessage = () => {
    if (!draft.trim() || isClosed) return;
    try {
      sendPreviewCustomerMessage(draft);
      setDraft('');
      setError(null);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Không thể gửi tin nhắn.');
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage();
  };

  const handleQuickReply = (reply: string) => {
    if (isClosed) return;
    setDraft(reply);
    inputRef.current?.focus();
  };

  return (
    <section className="sf-support-chat" aria-label="Trò chuyện với chăm sóc khách hàng">
      <header className="sf-support-chat-header">
        <button type="button" aria-label="Quay lại tài khoản" onClick={onBack}>
          <Icon name="arrow_back" />
        </button>
        <div className="sf-support-avatar"><Icon name="support_agent" /></div>
        <div className="sf-support-chat-title">
          <h1>Hỗ trợ CSKH</h1>
          <p><span className="sf-support-online-dot" />CSKH đang trực tuyến</p>
        </div>
        <button
          type="button"
          className="sf-support-more"
          aria-label={isClosed ? 'Mở lại cuộc trò chuyện' : 'Kết thúc cuộc trò chuyện'}
          onClick={isClosed ? reopenPreviewCustomerConversation : closePreviewCustomerConversation}
        >
          <Icon name={isClosed ? 'refresh' : 'more_vert'} />
        </button>
      </header>

      <div className="sf-support-intro">
        <div className="sf-support-intro-icon"><Icon name="verified_user" /></div>
        <div>
          <b>Delivery luôn sẵn sàng hỗ trợ</b>
          <p>Thường phản hồi trong vài phút. Bạn có thể hỏi về đơn hàng, thanh toán hoặc địa chỉ giao hàng.</p>
        </div>
      </div>

      <div ref={messagesContainerRef} className="sf-support-chat-scroll" aria-live="polite" aria-label="Tin nhắn CSKH">
        <div className="sf-support-day">Hôm nay</div>
        {messages.map((item) => <MessageBubble key={item.id} message={item} />)}
        {isClosed && (
          <div className="sf-support-closed" role="status">
            <Icon name="lock" />
            <span>Cuộc trò chuyện đã kết thúc. Bấm biểu tượng phía trên để mở lại.</span>
          </div>
        )}
      </div>

      {!isClosed && (
        <div className="sf-support-quick-replies" aria-label="Gợi ý câu hỏi">
          <button type="button" onClick={() => handleQuickReply('Mình muốn kiểm tra trạng thái đơn hàng.')}>Trạng thái đơn</button>
          <button type="button" onClick={() => handleQuickReply('Mình muốn đổi địa chỉ giao hàng.')}>Đổi địa chỉ</button>
          <button type="button" onClick={() => handleQuickReply('Mình cần hỗ trợ về thanh toán.')}>Thanh toán</button>
        </div>
      )}

      {error && <p className="sf-support-error" role="alert">{error}</p>}
      <form className="sf-support-composer" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="preview-support-message">Tin nhắn cho CSKH</label>
        <textarea
          ref={inputRef}
          id="preview-support-message"
          aria-label="Tin nhắn cho CSKH"
          placeholder={isClosed ? 'Cuộc trò chuyện đã kết thúc' : 'Nhập tin nhắn…'}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={2000}
          rows={1}
          disabled={isClosed}
        />
        <button type="submit" aria-label="Gửi tin nhắn" disabled={isClosed || !draft.trim()}>
          <Icon name="send" />
        </button>
      </form>
    </section>
  );
}
