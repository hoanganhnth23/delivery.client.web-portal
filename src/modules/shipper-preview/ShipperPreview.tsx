import { lazy, Suspense, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { advance, cases, labels, money, screens, stops, type Scenario, type Screen, type Status } from './shipperModel';
import { CancelForm, DeliveryPanel, Icon, OrderDetail, RouteStops, SwipeConfirm } from './ShipperDelivery';
import {
  Account,
  Debug,
  Documents,
  Earnings,
  ForgotPassword,
  History,
  IncidentReport,
  Login,
  Notifications,
  PayoutSettings,
  PermissionsRequest,
  Profile,
  Ratings,
  VehicleDetails,
} from './ShipperScreens';
import './shipperPreview.css';
const ShipperMap = lazy(() => import('./ShipperMap'));

export default function ShipperPreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const raw = location.pathname.split('/')[3] ?? 'map';
  const page: Screen = raw in screens ? (raw as Screen) : 'map';
  const scenario: Scenario =
    (query.get('case') ?? 'normal') in cases ? ((query.get('case') ?? 'normal') as Scenario) : 'normal';
  const [theme, setTheme] = useState('light');
  const [online, setOnline] = useState(false);
  const [status, setStatus] = useState<Status>('ASSIGNED');
  const [index, setIndex] = useState(0);
  const [batch, setBatch] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [near, setNear] = useState(false);
  const [seconds, setSeconds] = useState(30);
  const [cancel, setCancel] = useState(false);
  const [notice, setNotice] = useState('');
  const [detail, setDetail] = useState<{ status: Status; index: number; orderId: number } | null>(null);
  const [controls, setControls] = useState(query.get('view') !== 'phone');

  const go = (screen: Screen) => {
    setCancel(false);
    setNotice('');
    navigate('/preview/shipper/' + screen + location.search);
  };

  const chooseCase = (value: string) => {
    const q = new URLSearchParams(location.search);
    q.set('case', value);
    navigate(location.pathname + '?' + q.toString());
    setNear(false);
  };

  useEffect(() => {
    if (page !== 'offer') return;
    setSeconds(30);
    const timer = window.setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [page, scenario]);

  const isBatch = accepted ? batch : scenario === 'batch';
  const expired = scenario === 'expired' || seconds === 0;
  const offerBlocked =
    expired ||
    scenario === 'cod' ||
    scenario === 'error' ||
    scenario === 'loading' ||
    scenario === 'busy' ||
    (accepted && status !== 'DELIVERED' && status !== 'CANCELLED');
  const blocked =
    scenario === 'cod'
      ? 'Dữ liệu COD không hợp lệ. Chưa thể cập nhật chuyến.'
      : scenario === 'error'
      ? 'Mất kết nối. Chưa gửi được cập nhật.'
      : scenario === 'gps'
      ? 'Cần cấp quyền vị trí để xác nhận điểm đến.'
      : !near
      ? 'Bạn cần ở cách điểm đến dưới 200m để cập nhật.'
      : '';

  const moveNext = () => {
    const next = advance(status, near ? 50 : 450, scenario !== 'cod', scenario !== 'error' && scenario !== 'gps');
    if (next === status) return;
    if (next === 'DELIVERED' && isBatch && index === 0) {
      setIndex(1);
      setStatus('ASSIGNED');
      setNear(false);
      setNotice('Chuyến đầu hoàn tất. Tiếp tục di chuyển đến điểm giao thứ hai.');
      return;
    }
    setStatus(next);
    if (next === 'DELIVERING') setNear(false);
    if (next === 'DELIVERED') go('success');
  };

  const openOffer = () => {
    setBatch(scenario === 'batch');
    setIndex(0);
    setStatus('ASSIGNED');
    setAccepted(false);
    setNear(false);
    go('offer');
  };

  const reset = () => {
    setStatus('ASSIGNED');
    setIndex(0);
    setAccepted(false);
    setBatch(false);
    setNear(false);
    setOnline(false);
    setTheme('light');
    setDetail(null);
    navigate('/preview/shipper/map?view=workbench');
  };

  const asyncPage = ['history', 'ratings', 'notifications', 'profile', 'earnings'].includes(page);
  let content;

  if (asyncPage && ['loading', 'empty', 'error'].includes(scenario)) {
    content = (
      <section className="sp-empty" role="status">
        <Icon name={scenario === 'loading' ? 'hourglass_top' : scenario === 'error' ? 'wifi_off' : 'inbox'} />
        <h2>{scenario === 'loading' ? 'Đang tải dữ liệu…' : scenario === 'error' ? 'Không thể tải dữ liệu' : 'Chưa có dữ liệu'}</h2>
        <p>{scenario === 'error' ? 'Kiểm tra kết nối rồi thử lại.' : 'Dữ liệu sẽ hiển thị tại đây.'}</p>
        <button className="sp-secondary" onClick={() => chooseCase('normal')}>
          {scenario === 'error' ? 'Thử lại' : 'Xem dữ liệu mẫu'}
        </button>
      </section>
    );
  } else {
    switch (page) {
      case 'splash':
        content = (
          <section className="sp-empty sp-splash">
            <Icon name="delivery_dining" />
            <h2>Delivery Driver</h2>
            <p>Sẵn sàng cho hành trình mới</p>
            <button className="sp-primary" onClick={() => go('login')}>
              Tiếp tục
            </button>
          </section>
        );
        break;

      case 'login':
        content = <Login go={go} error={scenario === 'error'} />;
        break;

      case 'map':
      case 'active':
        content = (
          <>
            <div className="sp-map-top">
              <span>
                <i className={online ? 'online' : ''} />
                {online ? 'Đang hoạt động' : 'Đang nghỉ'}
              </span>
              <button
                role="switch"
                aria-checked={online}
                aria-label="Hoạt động nhận đơn"
                className={'sp-toggle ' + (online ? 'on' : '')}
                disabled={accepted && status !== 'DELIVERED' && status !== 'CANCELLED'}
                onClick={() => setOnline(!online)}
              >
                <i />
              </button>
            </div>
            <Suspense fallback={<div className="sp-map">Đang tải bản đồ…</div>}>
              <ShipperMap missing={scenario === 'map'} delivering={status === 'DELIVERING'} />
            </Suspense>
            {page === 'active' || (accepted && status !== 'DELIVERED' && status !== 'CANCELLED') ? (
              <>
                <DeliveryPanel
                  status={status}
                  index={index}
                  batch={isBatch}
                  blocked={blocked}
                  onAdvance={moveNext}
                  onDetail={() => {
                    setDetail(null);
                    go('detail');
                  }}
                  onIncident={() => go('incident')}
                />
                <div className="sp-simulator">
                  <button onClick={() => setNear(true)} disabled={scenario === 'gps' || scenario === 'far'}>
                    <Icon name="my_location" />
                    Mô phỏng đã đến điểm
                  </button>
                  <small>{near ? 'Đã cách điểm 50m (Hợp lệ để cập nhật)' : 'Đang cách điểm 450m (Cần đến gần hơn)'}</small>
                </div>
              </>
            ) : (
              <section className="sp-trip">
                <div className="sp-handle" />
                <h2>{online ? 'Sẵn sàng nhận đơn' : 'Bắt đầu ca giao hàng'}</h2>
                <p className="sp-muted">
                  {online ? 'Đang tìm chuyến phù hợp quanh Hà Đông…' : 'Bật hoạt động để nhận chuyến gần bạn.'}
                </p>
                <div className="sp-stats">
                  <span>
                    <b>18</b>Chuyến hôm nay
                  </span>
                  <span>
                    <b>426.000đ</b>Thu nhập hôm nay
                  </span>
                </div>
                {scenario === 'gps' && (
                  <div style={{ marginBottom: '8px' }}>
                    <p className="sp-warning">Chưa cấp quyền vị trí. Vui lòng cấp quyền để nhận đơn.</p>
                    <button className="sp-text" onClick={() => go('permissions')}>
                      <Icon name="security" /> Cấp quyền ngay
                    </button>
                  </div>
                )}
                <button
                  className="sp-primary"
                  disabled={scenario === 'gps'}
                  onClick={() => (online ? openOffer() : setOnline(true))}
                >
                  {online ? 'Mô phỏng đơn đến' : 'Bật hoạt động'}
                </button>
              </section>
            )}
          </>
        );
        break;

      case 'offer':
        content = (
          <section className="sp-section sp-offer">
            <div className="sp-between">
              <span className="sp-pill">{isBatch ? 'Đơn ghép · 2 điểm giao' : 'Đề nghị chuyến mới'}</span>
              <strong className="sp-countdown">{expired ? 'Hết hạn' : seconds + 's'}</strong>
            </div>
            <h2>{isBatch ? 'Hai đơn, một hành trình' : 'Một chuyến ngon đang chờ'}</h2>
            <div className="sp-offer-amount">
              <small>THU NHẬP DỰ KIẾN</small>
              <strong>{money(isBatch ? 44000 : 24000)}</strong>
              <span>{isBatch ? '5,6' : '3,2'} km · Thanh toán COD</span>
            </div>
            <RouteStops batch={isBatch} />
            <div className="sp-money">
              <span>
                Thu hộ tiền mặt<b>{money(isBatch ? 205000 : 95000)}</b>
              </span>
              <span>
                Phí nền tảng<b>{money(isBatch ? 12000 : 6000)}</b>
              </span>
            </div>
            {offerBlocked && (
              <p role="alert" className="sp-warning">
                {expired
                  ? 'Đề nghị đã hết thời gian nhận.'
                  : scenario === 'cod'
                  ? 'Chưa đủ thông tin COD.'
                  : scenario === 'loading'
                  ? 'Đang xử lý đề nghị…'
                  : scenario === 'busy' || accepted
                  ? 'Bạn đang có chuyến khác.'
                  : 'Không thể xác nhận. Kiểm tra kết nối.'}
              </p>
            )}
            <SwipeConfirm
              label={isBatch ? 'Vuốt nhận 2 đơn' : 'Vuốt để nhận đơn'}
              icon="east"
              disabled={offerBlocked}
              onConfirm={() => {
                setIndex(0);
                setNear(false);
                setOnline(true);
                setAccepted(true);
                setBatch(isBatch);
                setStatus('ASSIGNED');
                go('active');
              }}
            />
            <button
              className="sp-secondary"
              onClick={() => {
                go('map');
                setNotice('Đã từ chối đề nghị chuyến.');
              }}
            >
              Từ chối chuyến này
            </button>
            {expired && (
              <button
                className="sp-text"
                onClick={() => {
                  chooseCase('normal');
                  setSeconds(30);
                }}
              >
                Tạo đề nghị mới
              </button>
            )}
          </section>
        );
        break;

      case 'detail':
        content = cancel ? (
          <CancelForm
            onClose={() => setCancel(false)}
            onCancel={reason => {
              setStatus('CANCELLED');
              setAccepted(false);
              go('history');
              setNotice('Đã hủy chuyến: ' + reason);
            }}
          />
        ) : (
          <OrderDetail
            status={detail?.status ?? status}
            index={detail?.index ?? index}
            orderId={detail?.orderId}
            onCancel={() => setCancel(true)}
            onIncident={() => go('incident')}
          />
        );
        break;

      case 'success':
        content = (
          <section className="sp-empty sp-success">
            <Icon name="task_alt" />
            <h2>Giao hàng thành công!</h2>
            <p>Cảm ơn bạn đã hoàn tất hành trình giao món an toàn.</p>
            <small>THU NHẬP CHUYẾN</small>
            <strong>{money(isBatch ? 44000 : stops[index].earnings)}</strong>
            <p>Đơn #{2401 + index} · Đã thu tiền mặt COD</p>
            <button
              className="sp-primary"
              onClick={() => {
                setAccepted(false);
                go('map');
              }}
            >
              Tiếp tục nhận đơn
            </button>
            <button className="sp-secondary" onClick={() => go('history')}>
              Xem lịch sử chuyến
            </button>
          </section>
        );
        break;

      case 'history':
        content = (
          <History
            status={status}
            onDetail={(s, i, orderId) => {
              setDetail({ status: s, index: i, orderId });
              go('detail');
            }}
          />
        );
        break;

      case 'earnings':
        content = <Earnings go={go} />;
        break;

      case 'permissions':
        content = <PermissionsRequest go={go} />;
        break;

      case 'payout':
        content = <PayoutSettings />;
        break;

      case 'vehicle':
        content = <VehicleDetails />;
        break;

      case 'incident':
        content = (
          <IncidentReport
            onClose={() => go('active')}
            onSubmit={msg => {
              setStatus('CANCELLED');
              setAccepted(false);
              go('history');
              setNotice('Đã ghi nhận sự cố: ' + msg);
            }}
          />
        );
        break;

      case 'forgot':
        content = <ForgotPassword go={go} />;
        break;

      case 'notifications':
        content = <Notifications />;
        break;

      case 'account':
        content = <Account go={go} online={online} />;
        break;

      case 'profile':
        content = <Profile />;
        break;

      case 'documents':
        content = <Documents />;
        break;

      case 'ratings':
        content = <Ratings />;
        break;

      case 'debug':
        content = <Debug theme={theme} setTheme={setTheme} />;
        break;
    }
  }

  return (
    <div className={'sp-preview sp-' + theme}>
      <aside className={'sp-controls ' + (controls ? '' : 'collapsed')}>
        <div className="sp-between">
          <b>Shipper preview</b>
          <button aria-label="Ẩn điều khiển preview" onClick={() => setControls(false)}>
            <Icon name="close" />
          </button>
        </div>
        <p>Mobile web · dữ liệu mô phỏng đối tác giao hàng</p>
        <label>
          Màn hình
          <select value={page} onChange={e => go(e.target.value as Screen)}>
            {Object.entries(screens).map(([k, v]) => (
              <option value={k} key={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tình huống kiểm thử
          <select value={scenario} onChange={e => chooseCase(e.target.value)}>
            {Object.entries(cases).map(([k, v]) => (
              <option value={k} key={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          Trạng thái chuyến giao
          <select
            value={status}
            onChange={e => {
              setStatus(e.target.value as Status);
              setDetail(null);
              setNear(false);
            }}
          >
            {Object.entries(labels).map(([k, v]) => (
              <option value={k} key={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <p className="sp-muted">
          Chọn màn hình để preview ngay. Swipe-to-confirm áp dụng cho Nhận đơn và cập nhật tiến độ giao hàng.
        </p>
        <button className="sp-secondary" onClick={reset}>
          Đặt lại phiên
        </button>
        <button
          className="sp-preview-link"
          type="button"
          onClick={() => navigate('/preview/shopeefood/home?view=phone')}
        >
          Preview khách hàng
        </button>
        <button
          className="sp-preview-link"
          type="button"
          onClick={() => navigate('/preview/restaurant/dashboard?view=phone')}
        >
          Preview nhà hàng
        </button>
      </aside>

      <div className="sp-device">
        <header className="sp-header">
          <button
            aria-label={page === 'map' ? 'Mở danh sách màn' : 'Về bản đồ'}
            onClick={() => (page === 'map' ? setControls(true) : go('map'))}
          >
            <Icon name={page === 'map' ? 'menu' : 'arrow_back'} />
          </button>
          <h1>{page === 'map' ? 'Delivery Driver' : screens[page]}</h1>
          <button aria-label="Điều khiển preview" onClick={() => setControls(!controls)}>
            <Icon name="tune" />
          </button>
        </header>

        <main className="sp-main">
          {notice && (
            <p className="sp-notice" role="status">
              {notice}
            </p>
          )}
          {content}
        </main>

        {!['login', 'splash', 'offer', 'success', 'permissions', 'forgot', 'incident'].includes(page) && (
          <nav className="sp-nav" aria-label="Điều hướng shipper">
            {(
              [
                ['map', 'explore', 'Bản đồ'],
                ['history', 'receipt_long', 'Lịch sử'],
                ['earnings', 'payments', 'Thu nhập'],
                ['account', 'person', 'Tôi'],
              ] as [Screen, string, string][]
            ).map(([target, icon, title]) => (
              <button
                key={target}
                aria-current={page === target ? 'page' : undefined}
                onClick={() => go(target)}
              >
                <Icon name={icon} />
                <span>{title}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
