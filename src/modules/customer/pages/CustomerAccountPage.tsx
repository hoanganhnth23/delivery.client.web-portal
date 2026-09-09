import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { CustomerShell } from '../components/CustomerShell';
import { ROUTES } from '@/utils/constants';

const CustomerAccountPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.HOME, { replace: true });
  };

  const signedIn = Boolean(user);

  return (
    <CustomerShell title="Tôi">
      <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
        {/* ShopeeFood Account Hero Card */}
        <section className="overflow-hidden rounded-xl bg-gradient-to-r from-[#ee4d2d] to-[#ff5e3a] p-6 text-white shadow-sm sm:p-7">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-white/80 bg-white/20 text-white shadow-inner sm:h-18 sm:w-18">
              <span className="material-symbols-outlined text-4xl sm:text-5xl" aria-hidden="true">
                person
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-bold sm:text-2xl">
                {signedIn ? (user?.name || user?.email || 'Khách hàng') : 'Chào bạn!'}
              </h2>
              <p className="mt-1 text-xs text-orange-100 sm:text-sm">
                {signedIn
                  ? (user?.email || 'Thành viên ShopeeFood DeliveryVN')
                  : 'Đăng nhập để đặt món ngon và nhận ưu đãi mỗi ngày'}
              </p>
              {!signedIn && (
                <div className="mt-3 flex gap-2">
                  <Link
                    to={ROUTES.CUSTOMER_LOGIN}
                    className="inline-flex items-center rounded-lg bg-white px-4 py-1.5 text-xs font-bold text-[#ee4d2d] shadow-sm hover:bg-orange-50 sm:text-sm"
                  >
                    Đăng nhập / Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Account Menu Links */}
        <section
          className="overflow-hidden rounded-xl border border-[#eeeeee] bg-white shadow-sm"
          aria-label="Quản lý tài khoản"
        >
          <div className="divide-y divide-[#eeeeee]">
            {/* Địa chỉ của tôi */}
            <button
              type="button"
              onClick={() => navigate(signedIn ? ROUTES.CUSTOMER_ADDRESSES : ROUTES.CUSTOMER_LOGIN)}
              className="flex w-full items-center gap-3.5 px-5 py-4 text-left transition hover:bg-gray-50"
            >
              <span className="material-symbols-outlined text-2xl text-[#ee4d2d]" aria-hidden="true">
                location_on
              </span>
              <span className="min-w-0 flex-1">
                <b className="block text-sm font-bold text-[#222222] sm:text-base">Địa chỉ của tôi</b>
                <small className="block text-xs text-[#888888]">Quản lý địa chỉ nhận món & giao hàng tận nơi</small>
              </span>
              <span className="material-symbols-outlined text-xl text-[#aaaaaa]" aria-hidden="true">
                chevron_right
              </span>
            </button>

            {/* Đơn hàng của tôi */}
            <button
              type="button"
              onClick={() => navigate(signedIn ? ROUTES.CUSTOMER_ORDERS : ROUTES.CUSTOMER_LOGIN)}
              className="flex w-full items-center gap-3.5 px-5 py-4 text-left transition hover:bg-gray-50"
            >
              <span className="material-symbols-outlined text-2xl text-[#ee4d2d]" aria-hidden="true">
                receipt_long
              </span>
              <span className="min-w-0 flex-1">
                <b className="block text-sm font-bold text-[#222222] sm:text-base">Đơn hàng của tôi</b>
                <small className="block text-xs text-[#888888]">Theo dõi tiến độ và lịch sử các đơn đã đặt</small>
              </span>
              <span className="material-symbols-outlined text-xl text-[#aaaaaa]" aria-hidden="true">
                chevron_right
              </span>
            </button>

            {/* Thông tin cá nhân */}
            <button
              type="button"
              onClick={() => {
                if (!signedIn) navigate(ROUTES.CUSTOMER_LOGIN);
                else setShowProfileModal(true);
              }}
              className="flex w-full items-center gap-3.5 px-5 py-4 text-left transition hover:bg-gray-50"
            >
              <span className="material-symbols-outlined text-2xl text-[#ee4d2d]" aria-hidden="true">
                badge
              </span>
              <span className="min-w-0 flex-1">
                <b className="block text-sm font-bold text-[#222222] sm:text-base">Thông tin cá nhân</b>
                <small className="block text-xs text-[#888888]">Xem họ tên, số điện thoại và email đăng ký</small>
              </span>
              <span className="material-symbols-outlined text-xl text-[#aaaaaa]" aria-hidden="true">
                chevron_right
              </span>
            </button>

            {/* Ví Voucher & Khuyến mãi */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.HOME)}
              className="flex w-full items-center gap-3.5 px-5 py-4 text-left transition hover:bg-gray-50"
            >
              <span className="material-symbols-outlined text-2xl text-[#ee4d2d]" aria-hidden="true">
                confirmation_number
              </span>
              <span className="min-w-0 flex-1">
                <b className="block text-sm font-bold text-[#222222] sm:text-base">Ví Voucher & Ưu đãi</b>
                <small className="block text-xs text-[#888888]">Kho voucher giảm giá món ăn và miễn phí vận chuyển</small>
              </span>
              <span className="material-symbols-outlined text-xl text-[#aaaaaa]" aria-hidden="true">
                chevron_right
              </span>
            </button>

            {/* Trung tâm trợ giúp */}
            <button
              type="button"
              onClick={() => setShowSupportModal(true)}
              className="flex w-full items-center gap-3.5 px-5 py-4 text-left transition hover:bg-gray-50"
            >
              <span className="material-symbols-outlined text-2xl text-[#ee4d2d]" aria-hidden="true">
                support_agent
              </span>
              <span className="min-w-0 flex-1">
                <b className="block text-sm font-bold text-[#222222] sm:text-base">Trung tâm trợ giúp</b>
                <small className="block text-xs text-[#888888]">Liên hệ hỗ trợ khách hàng & giải đáp thắc mắc</small>
              </span>
              <span className="material-symbols-outlined text-xl text-[#aaaaaa]" aria-hidden="true">
                chevron_right
              </span>
            </button>
          </div>
        </section>

        {/* Nút Đăng xuất */}
        {signedIn ? (
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#ee4d2d] bg-white p-3.5 font-bold text-[#ee4d2d] shadow-sm transition hover:bg-[#fff5f2]"
          >
            <span className="material-symbols-outlined text-xl" aria-hidden="true">
              logout
            </span>
            <span>Đăng xuất tài khoản</span>
          </button>
        ) : (
          <Link
            to={ROUTES.CUSTOMER_LOGIN}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ee4d2d] p-3.5 font-bold text-white shadow-sm transition hover:bg-[#d84023]"
          >
            <span>Đăng nhập ngay</span>
          </Link>
        )}

        {/* Modal Thông tin cá nhân */}
        {showProfileModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-title"
          >
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#eeeeee] pb-3">
                <h3 id="profile-title" className="text-lg font-bold text-[#222222]">
                  Thông tin cá nhân
                </h3>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="rounded-full p-1 text-[#777777] hover:bg-gray-100"
                  aria-label="Đóng"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between border-b border-[#f5f5f5] py-2">
                  <span className="text-[#777777]">Họ và tên</span>
                  <span className="font-semibold text-[#222222]">{user?.name || 'Khách hàng'}</span>
                </div>
                <div className="flex justify-between border-b border-[#f5f5f5] py-2">
                  <span className="text-[#777777]">Email</span>
                  <span className="font-semibold text-[#222222]">{user?.email || '—'}</span>
                </div>
                <div className="flex justify-between border-b border-[#f5f5f5] py-2">
                  <span className="text-[#777777]">Vai trò</span>
                  <span className="rounded-md bg-orange-50 px-2 py-0.5 font-bold text-[#ee4d2d]">Khách hàng</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="mt-6 w-full rounded-xl bg-[#ee4d2d] py-3 font-bold text-white shadow-sm hover:bg-[#d84023]"
              >
                Đóng
              </button>
            </div>
          </div>
        )}

        {/* Modal CSKH & Trợ giúp */}
        {showSupportModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-title"
          >
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#eeeeee] pb-3">
                <h3 id="support-title" className="text-lg font-bold text-[#222222]">
                  Trung tâm trợ giúp
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSupportModal(false)}
                  className="rounded-full p-1 text-[#777777] hover:bg-gray-100"
                  aria-label="Đóng"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="mt-4 space-y-3 text-sm text-[#444444]">
                <p>DeliveryVN luôn sẵn sàng hỗ trợ bạn:</p>
                <div className="rounded-lg bg-[#fff4ee] p-3 text-xs text-[#d35433]">
                  <p className="font-bold">Hotline tổng đài CSKH: 1900 2045</p>
                  <p className="mt-0.5">Giờ làm việc: 07:00 – 22:00 tất cả các ngày trong tuần.</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 text-xs text-[#555555]">
                  <p className="font-bold">Hỗ trợ qua Email: support@deliveryvn.io.vn</p>
                  <p className="mt-0.5">Phản hồi giải đáp thắc mắc trong vòng 24 giờ làm việc.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                className="mt-6 w-full rounded-xl bg-[#ee4d2d] py-3 font-bold text-white shadow-sm hover:bg-[#d84023]"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        )}
      </div>
    </CustomerShell>
  );
};

export default CustomerAccountPage;
