import { useState } from 'react';
import { Icon } from './ShipperDelivery';
import { labels, money, type Screen, type Status } from './shipperModel';

export function Account({ go, online }: { go: (screen: Screen) => void; online: boolean }) {
  return (
    <>
      <section className="sp-identity">
        <div className="sp-avatar">B</div>
        <h2>Nguyễn Văn Bình</h2>
        <p>Đối tác giao hàng · ID 700</p>
        <span className="sp-pill">{online ? 'Đang hoạt động' : 'Đang nghỉ'}</span>
        <div className="sp-stats">
          <span>
            <b>4,9</b>Đánh giá
          </span>
          <span>
            <b>328</b>Chuyến đã giao
          </span>
          <span>
            <b>850k</b>Số dư ví
          </span>
        </div>
      </section>

      <section className="sp-section">
        {(
          [
            ['earnings', 'payments', 'Thu nhập & Ví tài khoản'],
            ['payout', 'account_balance', 'Cài đặt thanh toán ngân hàng'],
            ['vehicle', 'two_wheeler', 'Thông tin phương tiện'],
            ['documents', 'badge', 'Giấy tờ & hồ sơ tài xế'],
            ['permissions', 'security', 'Quyền truy cập ứng dụng'],
            ['notifications', 'notifications', 'Thông báo hệ thống'],
            ['ratings', 'star', 'Đánh giá từ khách hàng'],
            ['debug', 'settings', 'Cài đặt & debug tools'],
          ] as [Screen, string, string][]
        ).map(([page, icon, title]) => (
          <button key={page} className="sp-row" onClick={() => go(page)}>
            <Icon name={icon} />
            <span>{title}</span>
            <Icon name="chevron_right" />
          </button>
        ))}
        <button className="sp-secondary" onClick={() => go('login')}>
          Đăng xuất
        </button>
      </section>
    </>
  );
}

export function Profile() {
  return (
    <section className="sp-section">
      <div className="sp-avatar">B</div>
      <h2>Thông tin cá nhân</h2>
      <dl>
        {[
          ['Họ tên', 'Nguyễn Văn Bình'],
          ['Số điện thoại', '0987 654 321'],
          ['Email', 'binh.preview@delivery.local'],
          ['Mã đối tác', 'SH-700'],
          ['Khu vực hoạt động', 'Hà Đông - Thanh Xuân, Hà Nội'],
          ['Ngày tham gia', '15/03/2024'],
          ['Trạng thái tài khoản', 'Đã xác minh đầy đủ'],
        ].map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function Documents() {
  const [saved, setSaved] = useState(false);
  return (
    <form
      className="sp-section"
      onSubmit={e => {
        e.preventDefault();
        setSaved(true);
      }}
    >
      <h2>Giấy tờ của tôi</h2>
      <p className="sp-muted">Thông tin định danh CCCD và giấy phép lái xe</p>
      {['Số căn cước công dân (CCCD)', 'Số giấy phép lái xe (GPLX)', 'Biển số đăng ký xe'].map(
        (name, i) => (
          <label key={name}>
            {name}
            <input
              required
              defaultValue={['001000123456', '010000123456', '29-A1 123.45'][i]}
              onChange={() => setSaved(false)}
            />
          </label>
        )
      )}
      {['Mặt trước CCCD', 'Mặt sau CCCD', 'Mặt trước GPLX', 'Cà vẹt đăng ký xe'].map(name => (
        <label className="sp-upload" key={name}>
          <Icon name="add_photo_alternate" />
          <b>{name}</b>
          <input type="file" accept="image/*" onChange={() => setSaved(false)} />
        </label>
      ))}
      {saved && <p role="status" className="sp-notice">Đã lưu hồ sơ giấy tờ thành công.</p>}
      <button className="sp-primary">Lưu giấy tờ</button>
    </form>
  );
}

export function Notifications() {
  const [items, setItems] = useState([
    {
      id: 1,
      title: 'Đơn hàng đã hoàn tất',
      body: 'Đơn #2398 đã giao thành công. Thu nhập chuyến 24.000đ.',
      time: '10:30 Hôm nay',
      read: false,
    },
    {
      id: 2,
      title: 'Thưởng đạt mốc ngày',
      body: 'Chúc mừng bạn đã hoàn thành 15 đơn trong ngày. Nhận thưởng thêm 30.000đ!',
      time: '09:15 Hôm nay',
      read: false,
    },
    {
      id: 3,
      title: 'Thông tin vận hành khu vực',
      body: 'Mưa lớn tại khu vực Hà Đông, thưởng chuyến tăng thêm 5.000đ/đơn từ 11:00 đến 14:00.',
      time: '08:00 Hôm nay',
      read: false,
    },
    {
      id: 4,
      title: 'Cập nhật hồ sơ thành công',
      body: 'Thông tin phương tiện xe máy 29-A1 123.45 đã được kiểm duyệt hợp lệ.',
      time: 'Hôm qua',
      read: true,
    },
  ]);
  const [unread, setUnread] = useState(false);

  return (
    <section className="sp-section">
      <div className="sp-tabs">
        <button aria-pressed={!unread} onClick={() => setUnread(false)}>
          Tất cả
        </button>
        <button aria-pressed={unread} onClick={() => setUnread(true)}>
          Chưa đọc ({items.filter(i => !i.read).length})
        </button>
      </div>
      <button
        className="sp-text"
        onClick={() => setItems(items.map(i => ({ ...i, read: true })))}
      >
        Đánh dấu tất cả đã đọc
      </button>
      {items
        .filter(i => !unread || !i.read)
        .map(item => (
          <article className={'sp-notification ' + (item.read ? '' : 'unread')} key={item.id}>
            <button
              onClick={() =>
                setItems(items.map(i => (i.id === item.id ? { ...i, read: true } : i)))
              }
            >
              <Icon name="notifications" />
              <span>
                <b>{item.title}</b>
                <p>{item.body}</p>
                <small>{item.time}</small>
              </span>
            </button>
            <button
              aria-label={'Xóa ' + item.title}
              onClick={() => setItems(items.filter(i => i.id !== item.id))}
            >
              <Icon name="close" />
            </button>
          </article>
        ))}
      {!items.some(i => !unread || !i.read) && <p className="sp-empty">Không có thông báo nào.</p>}
    </section>
  );
}

export function Ratings() {
  return (
    <>
      <section className="sp-identity">
        <strong className="sp-rating">
          4,9<small>/ 5</small>
        </strong>
        <div className="sp-stars" aria-label="5 sao">
          ★★★★★
        </div>
        <p>128 lượt đánh giá tích cực từ khách hàng</p>
      </section>
      <section className="sp-section">
        {[
          {
            text: 'Tài xế giao cực kỳ nhanh, đồ ăn vẫn còn nóng hổi. Cảm ơn anh!',
            order: 2401,
            time: '08/09/2026 · 10:45',
          },
          {
            text: 'Giao hàng cẩn thận, không bị đổ nước canh, gọi điện báo trước rất chu đáo.',
            order: 2398,
            time: '08/09/2026 · 09:30',
          },
          {
            text: 'Lịch sự, nhiệt tình, tiền thừa trả lại nhanh gọn.',
            order: 2392,
            time: '07/09/2026 · 19:15',
          },
          {
            text: 'Mưa to nhưng anh shipper vẫn giao đúng giờ. Cho 5 sao ủng hộ!',
            order: 2385,
            time: '07/09/2026 · 12:20',
          },
        ].map(item => (
          <article className="sp-review" key={item.order}>
            <div className="sp-between">
              <b>Đơn #{item.order}</b>
              <span className="sp-stars">★★★★★</span>
            </div>
            <p>{item.text}</p>
            <small>{item.time}</small>
          </article>
        ))}
      </section>
    </>
  );
}

export function History({
  status,
  onDetail,
}: {
  status: Status;
  onDetail: (status: Status, index: number, orderId: number) => void;
}) {
  const [filter, setFilter] = useState('all');
  const rows: { id: number; status: Status; earnings: number; time: string; address: string }[] = [
    {
      id: 2401,
      status,
      earnings: 24000,
      time: '10:24 · COD',
      address: '12 Trần Phú → 35 Lê Văn Lương',
    },
    {
      id: 2398,
      status: 'DELIVERED',
      earnings: 20000,
      time: '09:12 · Online',
      address: '12 Trần Phú → 28 Nguyễn Trãi',
    },
    {
      id: 2395,
      status: 'DELIVERED',
      earnings: 28000,
      time: '08:30 · COD',
      address: '50 Quang Trung → 102 Trần Phú',
    },
    {
      id: 2394,
      status: 'CANCELLED',
      earnings: 0,
      time: '07:45 · Hủy đơn',
      address: 'Quán bún bò → KĐT Mỗ Lao',
    },
  ];

  return (
    <>
      <section className="sp-section">
        <small>LỊCH SỬ CHUYẾN</small>
        <h2>Hôm nay, 08/09</h2>
        <div className="sp-tabs">
          {[
            ['all', 'Tất cả'],
            ['DELIVERED', 'Đã giao'],
            ['CANCELLED', 'Đã hủy'],
          ].map(([value, label]) => (
            <button
              key={value}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>
      <section className="sp-section">
        {rows
          .filter(r => filter === 'all' || r.status === filter)
          .map(row => (
            <button
              className="sp-history"
              key={row.id}
              onClick={() => onDetail(row.status, row.id === 2398 ? 1 : 0, row.id)}
            >
              <div className="sp-between">
                <b>#{row.id}</b>
                <span className="sp-pill">{labels[row.status]}</span>
              </div>
              <p>Quán Hà Đông</p>
              <small>{row.address}</small>
              <div className="sp-between">
                <small>{row.time}</small>
                <b>{money(row.status === 'DELIVERED' ? row.earnings : 0)}</b>
              </div>
            </button>
          ))}
        {!rows.some(r => filter === 'all' || r.status === filter) && (
          <p className="sp-empty-text">Chưa có chuyến trong mục này.</p>
        )}
      </section>
    </>
  );
}

export function Login({ go, error }: { go: (screen: Screen) => void; error: boolean }) {
  return (
    <form
      className="sp-login"
      onSubmit={e => {
        e.preventDefault();
        if (!error) go('map');
      }}
    >
      <div className="sp-logo">
        <Icon name="delivery_dining" />
      </div>
      <h2>
        Cùng Delivery
        <br />
        giao những điều ngon
      </h2>
      <p>Đăng nhập tài khoản đối tác giao hàng</p>
      <label>
        Email hoặc Số điện thoại
        <input
          type="text"
          required
          defaultValue="binh.preview@delivery.local"
          autoComplete="off"
        />
      </label>
      <label>
        Mật khẩu
        <input type="password" required defaultValue="preview-only" autoComplete="off" />
      </label>
      <div style={{ textAlign: 'right', marginTop: '4px' }}>
        <button
          type="button"
          className="sp-text"
          style={{ padding: 0, minHeight: '32px', fontSize: '13px' }}
          onClick={() => go('forgot')}
        >
          Quên mật khẩu?
        </button>
      </div>
      {error && (
        <p role="alert" className="sp-warning">
          Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.
        </p>
      )}
      <button className="sp-primary">Đăng nhập</button>
      <button
        type="button"
        className="sp-secondary"
        style={{ marginTop: '8px' }}
        onClick={() => go('permissions')}
      >
        Đăng ký đối tác mới
      </button>
      <small>Tài khoản mẫu · không kết nối máy chủ thật</small>
    </form>
  );
}

export function Debug({
  theme,
  setTheme,
}: {
  theme: string;
  setTheme: (theme: string) => void;
}) {
  const [notice, setNotice] = useState('');
  const [logs, setLogs] = useState(true);
  return (
    <section className="sp-section">
      <h2>Cài đặt & debug</h2>
      <label>
        Giao diện
        <select value={theme} onChange={e => setTheme(e.target.value)}>
          <option value="light">Sáng (Light)</option>
          <option value="dark">Tối (Dark)</option>
        </select>
      </label>
      <form
        onSubmit={e => {
          e.preventDefault();
          setNotice('Đã lưu cấu hình gateway mẫu; preview đang dùng mock offline.');
        }}
      >
        <label>
          Gateway origin
          <input type="url" defaultValue="http://localhost:8079" required />
        </label>
        <button className="sp-secondary">Lưu gateway mẫu</button>
      </form>
      {notice && <p role="status" className="sp-notice">{notice}</p>}
      <h2>Nhật ký hoạt động</h2>
      {logs ? (
        <pre>
          10:24:00 · Kết nối WebSocket: OK{'\n'}
          10:24:01 · Khôi phục chuyến giao #2401{'\n'}
          10:24:02 · GPS Accuracy: 12m (Good){'\n'}
          10:24:05 · Đồng bộ ví đối tác thành công
        </pre>
      ) : (
        <p className="sp-muted">Nhật ký trống.</p>
      )}
      <button className="sp-secondary" onClick={() => setLogs(false)}>
        Xóa nhật ký
      </button>
    </section>
  );
}

/* =========================================================================
   6 MÀN HÌNH MỚI BỔ SUNG
   ========================================================================= */

// 1. EARNINGS - MÀN HÌNH THU NHẬP
export function Earnings({ go }: { go: (screen: Screen) => void }) {
  const [tab, setTab] = useState<'day' | 'week' | 'month'>('day');

  const stats = {
    day: { total: 426000, trips: 18, tips: 45000, fee: 54000, cod: 1850000, period: 'Hôm nay, 08/09' },
    week: { total: 2850000, trips: 112, tips: 320000, fee: 360000, cod: 12400000, period: '02/09 - 08/09' },
    month: { total: 11420000, trips: 460, tips: 1250000, fee: 1440000, cod: 48900000, period: 'Tháng 09/2026' },
  }[tab];

  const chartBars = [
    { day: 'T2', val: 380, label: '380k' },
    { day: 'T3', val: 420, label: '420k' },
    { day: 'T4', val: 310, label: '310k' },
    { day: 'T5', val: 490, label: '490k' },
    { day: 'T6', val: 520, label: '520k' },
    { day: 'T7', val: 610, label: '610k' },
    { day: 'CN', val: 426, label: '426k', active: true },
  ];

  return (
    <>
      <section className="sp-section sp-earnings-hero">
        <small>TỔNG QUAN THU NHẬP</small>
        <div className="sp-tabs">
          {(
            [
              ['day', 'Hôm nay'],
              ['week', 'Tuần này'],
              ['month', 'Tháng này'],
            ] as const
          ).map(([t, label]) => (
            <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>
              {label}
            </button>
          ))}
        </div>

        <div className="sp-earnings-total">
          <small>{stats.period}</small>
          <h2>{money(stats.total)}</h2>
          <span className="sp-pill">+{tab === 'day' ? '12%' : '8%'} so với kỳ trước</span>
        </div>

        <div className="sp-stats-grid">
          <div className="sp-stat-box">
            <small>Số chuyến</small>
            <b>{stats.trips}</b>
          </div>
          <div className="sp-stat-box">
            <small>Tiền tip & thưởng</small>
            <b>{money(stats.tips)}</b>
          </div>
          <div className="sp-stat-box">
            <small>Phí nền tảng</small>
            <b style={{ color: '#888' }}>-{money(stats.fee)}</b>
          </div>
          <div className="sp-stat-box">
            <small>Tiền COD đã thu</small>
            <b>{money(stats.cod)}</b>
          </div>
        </div>
      </section>

      <section className="sp-section">
        <div className="sp-between">
          <h2>Biểu đồ tuần này</h2>
          <small className="sp-muted">Trung bình 450k/ngày</small>
        </div>
        <div className="sp-chart">
          {chartBars.map(b => (
            <div key={b.day} className="sp-chart-col">
              <span className="sp-chart-val">{b.label}</span>
              <div
                className={`sp-chart-bar ${b.active ? 'active' : ''}`}
                style={{ height: `${(b.val / 650) * 100}%` }}
              />
              <span className="sp-chart-day">{b.day}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="sp-section sp-wallet-card">
        <div className="sp-between">
          <div>
            <small>VÍ ĐỐI TÁC KHẢ DỤNG</small>
            <h2 style={{ margin: '4px 0', color: 'var(--sp-brand)' }}>850.000đ</h2>
          </div>
          <button className="sp-primary" style={{ width: 'auto', padding: '8px 16px', minHeight: '40px' }} onClick={() => go('payout')}>
            Rút tiền
          </button>
        </div>
        <p className="sp-muted" style={{ fontSize: '12px', marginTop: '8px' }}>
          Lịch thanh toán: Tự động chuyển về Vietcombank vào 15:00 Thứ 6 hàng tuần.
        </p>
        <button className="sp-row" style={{ marginTop: '12px' }} onClick={() => go('payout')}>
          <Icon name="account_balance" />
          <span>Tài khoản ngân hàng liên kết</span>
          <Icon name="chevron_right" />
        </button>
      </section>
    </>
  );
}

// 2. PERMISSIONS REQUEST - YÊU CẦU QUYỀN ONBOARDING
export function PermissionsRequest({ go }: { go: (screen: Screen) => void }) {
  const [granted, setGranted] = useState(false);

  const handleGrant = () => {
    setGranted(true);
    setTimeout(() => {
      go('map');
    }, 600);
  };

  return (
    <section className="sp-section sp-permissions">
      <div className="sp-perm-header">
        <div className="sp-perm-badge">
          <Icon name="near_me" />
        </div>
        <h2>Cấp quyền để nhận đơn</h2>
        <p className="sp-muted">
          Để định vị chuẩn xác, dẫn đường chính xác và không bỏ lỡ chuyến mới, ứng dụng cần các quyền sau:
        </p>
      </div>

      <div className="sp-perm-list">
        <div className="sp-permission-item">
          <span className="sp-permission-icon">
            <Icon name="location_on" />
          </span>
          <div>
            <b>Vị trí chính xác (GPS)</b>
            <p>Xác định bạn đang ở gần quán ăn nào để ưu tiên nổ đơn và tính quãng đường chính xác dưới 200m.</p>
            <span className="sp-perm-tag">Bắt buộc</span>
          </div>
        </div>

        <div className="sp-permission-item">
          <span className="sp-permission-icon">
            <Icon name="notifications_active" />
          </span>
          <div>
            <b>Thông báo âm thanh nổi</b>
            <p>Phát chuông thông báo ngay khi có đề nghị chuyến mới, giúp bạn kịp thời nhận đơn trong 30 giây.</p>
            <span className="sp-perm-tag">Bắt buộc</span>
          </div>
        </div>

        <div className="sp-permission-item">
          <span className="sp-permission-icon">
            <Icon name="layers" />
          </span>
          <div>
            <b>Hiển thị trên ứng dụng khác</b>
            <p>Bong bóng dẫn đường nổi trên màn hình khi bạn chuyển qua Google Maps hoặc gọi điện cho khách.</p>
            <span className="sp-perm-tag opt">Khuyên dùng</span>
          </div>
        </div>
      </div>

      {granted && (
        <p role="status" className="sp-notice">
          ✓ Đã cấp toàn bộ quyền thành công! Đang chuyển về bản đồ…
        </p>
      )}

      <button className="sp-primary" onClick={handleGrant}>
        <Icon name="check_circle" /> Cho phép tất cả quyền
      </button>
      <button className="sp-secondary" onClick={() => go('map')}>
        Để sau và tiếp tục
      </button>
    </section>
  );
}

// 3. PAYOUT SETTINGS - CÀI ĐẶT THANH TOÁN
export function PayoutSettings() {
  const [bank, setBank] = useState('VCB');
  const [accountNo, setAccountNo] = useState('0011004567890');
  const [accountName, setAccountName] = useState('NGUYEN VAN BINH');
  const [schedule, setSchedule] = useState('friday');
  const [saved, setSaved] = useState(false);

  const banks = [
    { code: 'VCB', name: 'Vietcombank - TMCP Ngoại Thương VN' },
    { code: 'MB', name: 'MB Bank - TMCP Quân Đội' },
    { code: 'TCB', name: 'Techcombank - TMCP Kỹ Thương' },
    { code: 'BIDV', name: 'BIDV - Đầu Tư & Phát Triển VN' },
    { code: 'CTG', name: 'VietinBank - Công Thương VN' },
    { code: 'VPB', name: 'VPBank - TMCP Việt Nam Thịnh Vượng' },
    { code: 'ACB', name: 'ACB - TMCP Á Châu' },
  ];

  return (
    <form
      className="sp-section"
      onSubmit={e => {
        e.preventDefault();
        setSaved(true);
      }}
    >
      <h2>Cài đặt thanh toán</h2>
      <p className="sp-muted">Thu nhập của bạn sẽ được chuyển tự động vào tài khoản này</p>

      <label>
        Ngân hàng thụ hưởng
        <select value={bank} onChange={e => { setBank(e.target.value); setSaved(false); }}>
          {banks.map(b => (
            <option value={b.code} key={b.code}>
              {b.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Số tài khoản ngân hàng
        <input
          type="text"
          required
          value={accountNo}
          onChange={e => { setAccountNo(e.target.value); setSaved(false); }}
        />
      </label>

      <label>
        Tên chủ tài khoản (in hoa không dấu)
        <input
          type="text"
          required
          value={accountName}
          onChange={e => { setAccountName(e.target.value.toUpperCase()); setSaved(false); }}
        />
      </label>

      <div style={{ margin: '20px 0 10px' }}>
        <b>Chu kỳ quyết toán</b>
        <label className="sp-choice" style={{ marginTop: '8px' }}>
          <input
            type="radio"
            name="payoutSchedule"
            checked={schedule === 'friday'}
            onChange={() => { setSchedule('friday'); setSaved(false); }}
          />
          <span>
            <b>Thứ 6 hàng tuần</b> (Miễn phí chuyển khoản)
          </span>
        </label>
        <label className="sp-choice">
          <input
            type="radio"
            name="payoutSchedule"
            checked={schedule === 'daily'}
            onChange={() => { setSchedule('daily'); setSaved(false); }}
          />
          <span>
            <b>Hàng ngày sau 22:00</b> (Phí 3.300đ/lần rút)
          </span>
        </label>
      </div>

      <div className="sp-verified-badge">
        <Icon name="verified" />
        <div>
          <b>Trạng thái: Đã liên kết & xác minh</b>
          <small>Tên chủ TK trùng khớp với CCCD của tài xế</small>
        </div>
      </div>

      {saved && <p role="status" className="sp-notice">✓ Đã lưu thông tin tài khoản ngân hàng thành công!</p>}

      <button className="sp-primary">Lưu cài đặt thanh toán</button>
    </form>
  );
}

// 4. VEHICLE DETAILS - THÔNG TIN PHƯƠNG TIỆN
export function VehicleDetails() {
  const [vehicleType, setVehicleType] = useState('gas_moto');
  const [plate, setPlate] = useState('29-A1 123.45');
  const [model, setModel] = useState('Honda Wave Alpha 110cc');
  const [color, setColor] = useState('Đỏ - Đen');
  const [saved, setSaved] = useState(false);

  return (
    <form
      className="sp-section"
      onSubmit={e => {
        e.preventDefault();
        setSaved(true);
      }}
    >
      <h2>Thông tin phương tiện</h2>
      <p className="sp-muted">Phương tiện dùng để giao hàng phải khớp với đăng kiểm</p>

      <label>
        Loại phương tiện
        <select value={vehicleType} onChange={e => { setVehicleType(e.target.value); setSaved(false); }}>
          <option value="gas_moto">Xe máy xăng</option>
          <option value="electric_moto">Xe máy điện (VinFast, Dat Bike...)</option>
          <option value="electric_bike">Xe đạp điện</option>
        </select>
      </label>

      <label>
        Hãng & Dòng xe
        <input
          type="text"
          required
          value={model}
          onChange={e => { setModel(e.target.value); setSaved(false); }}
        />
      </label>

      <label>
        Biển kiểm soát (Biển số xe)
        <input
          type="text"
          required
          value={plate}
          onChange={e => { setPlate(e.target.value); setSaved(false); }}
        />
      </label>

      <label>
        Màu sơn xe
        <input
          type="text"
          required
          value={color}
          onChange={e => { setColor(e.target.value); setSaved(false); }}
        />
      </label>

      <div style={{ marginTop: '16px' }}>
        <b>Hình ảnh xe & Cà vẹt xe</b>
        <label className="sp-upload">
          <Icon name="add_a_photo" />
          <b>Ảnh toàn thân xe (rõ biển số)</b>
          <input type="file" accept="image/*" onChange={() => setSaved(false)} />
        </label>
        <label className="sp-upload">
          <Icon name="badge" />
          <b>Giấy chứng nhận đăng ký xe (Cà vẹt)</b>
          <input type="file" accept="image/*" onChange={() => setSaved(false)} />
        </label>
      </div>

      <div className="sp-verified-badge">
        <Icon name="check_circle" />
        <div>
          <b>Phương tiện đã được kiểm duyệt</b>
          <small>Hợp lệ để hoạt động nhận đơn trên toàn hệ thống</small>
        </div>
      </div>

      {saved && <p role="status" className="sp-notice">✓ Đã cập nhật thông tin phương tiện.</p>}

      <button className="sp-primary">Lưu thông tin phương tiện</button>
    </form>
  );
}

// 5. INCIDENT REPORT - BÁO CÁO SỰ CỐ
export function IncidentReport({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [type, setType] = useState('breakdown');
  const [detail, setDetail] = useState('');
  const [photo, setPhoto] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reasonsList = [
    { id: 'breakdown', title: 'Xe gặp sự cố (hỏng hóc, thủng lốp, chết máy)' },
    { id: 'customer_unreachable', title: 'Khách không nghe máy sau 3 lần gọi (15 phút)' },
    { id: 'restaurant_closed', title: 'Quán ăn đóng cửa hoặc hết sạch món' },
    { id: 'bad_weather', title: 'Thời tiết ngập lụt, mưa bão nguy hiểm không đi được' },
    { id: 'wrong_address', title: 'Khách báo sai địa chỉ / yêu cầu đổi vị trí quá xa' },
    { id: 'other', title: 'Lý do khẩn cấp khác' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const selected = reasonsList.find(r => r.id === type)?.title || 'Sự cố phát sinh';
    setTimeout(() => {
      onSubmit(selected + (detail ? `: ${detail}` : ''));
    }, 800);
  };

  return (
    <form className="sp-section sp-incident" onSubmit={handleSubmit}>
      <div className="sp-between">
        <h2>Báo cáo sự cố</h2>
        <button type="button" className="sp-text" onClick={onClose}>
          Đóng
        </button>
      </div>
      <p className="sp-muted">
        Gửi sự cố để tổng đài hỗ trợ và cập nhật trạng thái đơn hàng an toàn cho bạn.
      </p>

      <div style={{ margin: '14px 0' }}>
        <b>Chọn sự cố gặp phải</b>
        {reasonsList.map(r => (
          <label className="sp-choice" key={r.id}>
            <input
              type="radio"
              name="incidentType"
              checked={type === r.id}
              onChange={() => setType(r.id)}
            />
            <span>{r.title}</span>
          </label>
        ))}
      </div>

      <label>
        Mô tả chi tiết sự việc
        <textarea
          rows={3}
          placeholder="Ví dụ: Xe bị thủng săm tại đường Nguyễn Trãi, đang chờ thợ sửa..."
          value={detail}
          onChange={e => setDetail(e.target.value)}
        />
      </label>

      <label className="sp-upload">
        <Icon name="add_a_photo" />
        <b>{photo ? '✓ Đã đính kèm ảnh minh chứng' : 'Đính kèm ảnh minh chứng (chụp màn hình / hiện trường)'}</b>
        <input type="file" accept="image/*" onChange={() => setPhoto(true)} />
      </label>

      <div className="sp-hotline-box">
        <Icon name="headset_mic" />
        <div>
          <b>Cần hỗ trợ điều phối khẩn cấp?</b>
          <p>Gọi ngay hotline tài xế: <b>1900 6868 (Nhánh 1)</b></p>
        </div>
      </div>

      {submitted && (
        <p role="status" className="sp-notice">
          ✓ Đã gửi báo cáo sự cố thành công. Điều phối viên đang xử lý.
        </p>
      )}

      <button className="sp-primary" style={{ background: '#d9534f', borderColor: '#d9534f' }}>
        Gửi báo cáo sự cố
      </button>
      <button type="button" className="sp-secondary" onClick={onClose}>
        Tiếp tục chuyến giao
      </button>
    </form>
  );
}

// 6. FORGOT PASSWORD - QUÊN MẬT KHẨU
export function ForgotPassword({ go }: { go: (screen: Screen) => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('binh.preview@delivery.local');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [done, setDone] = useState(false);

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val.slice(-1);
    const next = [...otp];
    next[index] = val;
    setOtp(next);
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass && confirmPass && newPass !== confirmPass) return;
    setDone(true);
    setTimeout(() => {
      go('login');
    }, 1200);
  };

  return (
    <div className="sp-section sp-forgot">
      <h2>Khôi phục mật khẩu</h2>
      <p className="sp-muted">Dành cho đối tác giao hàng</p>

      {/* Stepper indicator */}
      <div className="sp-stepper">
        <i className={step >= 1 ? 'done' : ''}>1</i>
        <span className={step >= 2 ? 'done' : ''} />
        <i className={step >= 2 ? 'done' : ''}>2</i>
        <span className={step >= 3 ? 'done' : ''} />
        <i className={step >= 3 ? 'done' : ''}>3</i>
      </div>

      {step === 1 && (
        <form
          onSubmit={e => {
            e.preventDefault();
            setStep(2);
          }}
        >
          <p>Nhập địa chỉ Email hoặc Số điện thoại đã đăng ký tài xế:</p>
          <label>
            Email / SĐT
            <input
              type="text"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </label>
          <button className="sp-primary">Gửi mã xác thực OTP</button>
          <button type="button" className="sp-secondary" onClick={() => go('login')}>
            Quay lại đăng nhập
          </button>
        </form>
      )}

      {step === 2 && (
        <form
          onSubmit={e => {
            e.preventDefault();
            setStep(3);
          }}
        >
          <p>
            Mã OTP 4 số đã được gửi đến: <b>{email}</b>
          </p>
          <div className="sp-otp">
            {[0, 1, 2, 3].map(i => (
              <input
                key={i}
                type="text"
                maxLength={1}
                inputMode="numeric"
                defaultValue={['8', '9', '2', '6'][i]}
                onChange={e => handleOtpChange(i, e.target.value)}
              />
            ))}
          </div>
          <small style={{ display: 'block', textAlign: 'center', margin: '8px 0 16px', color: '#777' }}>
            Không nhận được mã? Gửi lại sau 45s
          </small>
          <button className="sp-primary">Xác nhận OTP</button>
          <button type="button" className="sp-secondary" onClick={() => setStep(1)}>
            Đổi email khác
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleFinish}>
          <p>Tạo mật khẩu mới cho tài khoản của bạn:</p>
          <label>
            Mật khẩu mới
            <input
              type="password"
              required
              placeholder="Tối thiểu 8 ký tự"
              defaultValue="Delivery2026@"
              onChange={e => setNewPass(e.target.value)}
            />
          </label>
          <label>
            Xác nhận lại mật khẩu
            <input
              type="password"
              required
              placeholder="Nhập lại mật khẩu mới"
              defaultValue="Delivery2026@"
              onChange={e => setConfirmPass(e.target.value)}
            />
          </label>
          {done && (
            <p role="status" className="sp-notice">
              ✓ Đổi mật khẩu thành công! Đang chuyển về đăng nhập…
            </p>
          )}
          <button className="sp-primary">Đặt lại mật khẩu</button>
        </form>
      )}
    </div>
  );
}
