import { useEffect, useRef, useState } from 'react';
import { actions, labels, money, pickup, reasons, stops, type Status } from './shipperModel';

export const Icon = ({ name }: { name: string }) => (
  <span aria-hidden="true" className="material-symbols-outlined">{name}</span>
);

export function SwipeConfirm({
  label,
  icon = 'east',
  onConfirm,
  disabled = false,
  blocked = '',
}: {
  label: string;
  icon?: string;
  onConfirm: () => void;
  disabled?: boolean;
  blocked?: string;
}) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [hint, setHint] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const dragXRef = useRef(0);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    setConfirmed(false);
    setIsDragging(false);
    setDragX(0);
    dragXRef.current = 0;
    isDraggingRef.current = false;
  }, [label]);

  const getWidths = () => {
    const trackWidth = trackRef.current?.getBoundingClientRect().width || trackRef.current?.clientWidth || 320;
    const thumbWidth = 52;
    const max = Math.max(80, trackWidth - thumbWidth - 8);
    return { trackWidth, thumbWidth, max };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || confirmed) return;
    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {}
    setIsDragging(true);
    isDraggingRef.current = true;
    startXRef.current = e.clientX - dragXRef.current;
    setHint(false);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || disabled || confirmed) return;
    const { max } = getWidths();
    const currentX = e.clientX - startXRef.current;
    const bounded = Math.max(0, Math.min(max, currentX));
    dragXRef.current = bounded;
    setDragX(bounded);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || disabled || confirmed) return;
    setIsDragging(false);
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
    const { max } = getWidths();
    const currentDrag = dragXRef.current;
    if (currentDrag >= max * 0.7) {
      dragXRef.current = max;
      setDragX(max);
      setConfirmed(true);
      try {
        if ('vibrate' in navigator) navigator.vibrate?.([40, 30, 40]);
      } catch {}
      onConfirm();
      setTimeout(() => {
        setConfirmed(false);
        dragXRef.current = 0;
        setDragX(0);
      }, 500);
    } else {
      if (currentDrag < 8) {
        setHint(true);
        setTimeout(() => setHint(false), 1800);
      }
      dragXRef.current = 0;
      setDragX(0);
    }
  };

  const handlePointerCancel = () => {
    if (!confirmed) {
      setIsDragging(false);
      isDraggingRef.current = false;
      dragXRef.current = 0;
      setDragX(0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled || confirmed) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setConfirmed(true);
      onConfirm();
      setTimeout(() => setConfirmed(false), 500);
    }
  };

  return (
    <div className="sp-swipe-container">
      <div
        ref={trackRef}
        className={`sp-swipe ${disabled ? 'disabled' : ''} ${isDragging ? 'dragging' : ''} ${confirmed ? 'confirmed' : ''}`}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-disabled={disabled}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onKeyDown={handleKeyDown}
      >
        <div
          className="sp-swipe-fill"
          style={{ width: confirmed ? '100%' : `${dragX > 0 ? dragX + 32 : 0}px` }}
        />
        <div className="sp-swipe-track">
          <span className="sp-swipe-label">{confirmed ? 'Đã xác nhận' : label}</span>
          <span className="sp-swipe-shimmer" aria-hidden="true">»»</span>
        </div>
        <div
          className={`sp-swipe-thumb ${isDragging ? 'dragging' : ''}`}
          style={{ transform: `translateX(${dragX}px)` }}
        >
          <Icon name={confirmed ? 'check' : icon} />
        </div>
      </div>
      {hint && <p className="sp-swipe-hint">👉 Hãy vuốt sang phải để xác nhận, không bấm 1 chạm</p>}
      {blocked && <p role="alert" className="sp-warning">{blocked}</p>}
    </div>
  );
}

export function RouteStops({ index = 0, batch = false }: { index?: number; batch?: boolean }) {
  return (
    <div className="sp-stops">
      <div>
        <i>A</i>
        <section>
          <small>LẤY MÓN</small>
          <b>{pickup.name}</b>
          <p>{pickup.address}</p>
        </section>
      </div>
      {(batch ? stops : [stops[index]]).map((stop, i) => (
        <div key={stop.name}>
          <i className="drop">{batch ? i + 1 : 'B'}</i>
          <section>
            <small>GIAO ĐẾN</small>
            <b>{stop.name}</b>
            <p>{stop.address}</p>
          </section>
        </div>
      ))}
    </div>
  );
}

export function DeliveryPanel({
  status,
  index,
  batch,
  blocked,
  onAdvance,
  onDetail,
  onIncident,
}: {
  status: Status;
  index: number;
  batch: boolean;
  blocked: string;
  onAdvance: () => void;
  onDetail: () => void;
  onIncident?: () => void;
}) {
  return (
    <section className="sp-trip">
      <div className="sp-handle" />
      <div className="sp-between">
        <span className="sp-pill">{labels[status]}</span>
        <button className="sp-text" onClick={onDetail}>
          #{2401 + index} <Icon name="chevron_right" />
        </button>
      </div>
      <h2>{status === 'DELIVERING' ? 'Giao món đến khách' : 'Đến quán nhận món'}</h2>
      <p className="sp-muted">
        {batch ? 'Đơn ghép · Điểm giao ' + (index + 1) + '/2' : 'DeliveryFood'} · Khoảng 12 phút
      </p>

      <RouteStops index={index} />

      <div className="sp-contacts">
        <a href="tel:0901234567" className="sp-contact-btn">
          <Icon name="call" />
          <span>Gọi khách</span>
        </a>
        <button type="button" className="sp-contact-btn" onClick={onDetail}>
          <Icon name="chat" />
          <span>Nhắn tin</span>
        </button>
        <a
          href="https://maps.google.com"
          target="_blank"
          rel="noreferrer"
          className="sp-contact-btn"
        >
          <Icon name="near_me" />
          <span>Google Map</span>
        </a>
        {onIncident && (
          <button type="button" className="sp-contact-btn sp-contact-warning" onClick={onIncident}>
            <Icon name="report_problem" />
            <span>Báo sự cố</span>
          </button>
        )}
      </div>

      <div className="sp-money">
        <span>
          Thu tiền mặt từ khách<b>{money(stops[index].cod)}</b>
        </span>
        <span>
          Thu nhập chuyến<b>{money(stops[index].earnings)}</b>
        </span>
      </div>

      {actions[status] && (
        <SwipeConfirm
          key={status}
          label={actions[status]!}
          onConfirm={onAdvance}
          disabled={!!blocked}
          blocked={blocked}
        />
      )}
    </section>
  );
}

export function CancelForm({
  onCancel,
  onClose,
}: {
  onCancel: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [other, setOther] = useState('');
  return (
    <section className="sp-section">
      <h2>Lý do hủy chuyến</h2>
      <p>Đơn chưa lấy hàng. Chọn lý do để xác nhận.</p>
      {reasons.map(value => (
        <label className="sp-choice" key={value}>
          <input
            type="radio"
            name="cancelReason"
            checked={reason === value}
            onChange={() => setReason(value)}
          />
          {value}
        </label>
      ))}
      {reason === reasons[4] && (
        <label>
          Mô tả lý do
          <textarea value={other} onChange={e => setOther(e.target.value)} />
        </label>
      )}
      <button
        className="sp-primary"
        disabled={!reason || (reason === reasons[4] && !other.trim())}
        onClick={() => onCancel(reason === reasons[4] ? other : reason)}
      >
        Xác nhận hủy chuyến
      </button>
      <button className="sp-secondary" onClick={onClose}>
        Tiếp tục giao
      </button>
    </section>
  );
}

export function OrderDetail({
  status,
  index,
  orderId,
  onCancel,
  onIncident,
}: {
  status: Status;
  index: number;
  orderId?: number;
  onCancel: () => void;
  onIncident?: () => void;
}) {
  return (
    <>
      <section className="sp-section">
        <div className="sp-between">
          <h2>Đơn #{orderId ?? 2401 + index}</h2>
          <span className="sp-pill">{labels[status]}</span>
        </div>
        <p className="sp-muted">Hôm nay · 10:24 · Thanh toán COD</p>
      </section>
      <section className="sp-section">
        <RouteStops index={index} />
        <p className="sp-warning">Ghi chú: Gọi khách trước khi giao đến sảnh.</p>
      </section>
      <section className="sp-section">
        <h2>Thanh toán chuyến</h2>
        <dl>
          <div>
            <dt>Phí vận chuyển</dt>
            <dd>{money(stops[index].earnings + 6000)}</dd>
          </div>
          <div>
            <dt>Phí nền tảng</dt>
            <dd>6.000đ</dd>
          </div>
          <div>
            <dt>Thu nhập</dt>
            <dd>{money(stops[index].earnings)}</dd>
          </div>
          <div>
            <dt>Tiền mặt thu khách</dt>
            <dd>{money(stops[index].cod)}</dd>
          </div>
        </dl>
      </section>
      <section className="sp-section">
        <h2>Hành trình đơn hàng</h2>
        <ol className="sp-timeline">
          {(['ASSIGNED', 'PICKED_UP', 'DELIVERING', 'DELIVERED'] as Status[]).map((s, i, all) => (
            <li className={all.indexOf(status) >= i ? 'done' : ''} key={s}>
              {labels[s]}
              <small>{all.indexOf(status) >= i ? 'Đã cập nhật' : 'Chưa thực hiện'}</small>
            </li>
          ))}
        </ol>
        {status === 'CANCELLED' && <p className="sp-warning">Chuyến đã hủy</p>}
        {status === 'ASSIGNED' && (
          <button className="sp-secondary" onClick={onCancel}>
            Hủy chuyến này
          </button>
        )}
        {status !== 'DELIVERED' && status !== 'CANCELLED' && onIncident && (
          <button
            className="sp-text"
            style={{ color: '#d9534f', marginTop: '12px' }}
            onClick={onIncident}
          >
            <Icon name="report_problem" /> Báo sự cố chuyến giao này
          </button>
        )}
      </section>
    </>
  );
}
