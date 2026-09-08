import { Link, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useCustomerCart } from '../cart/useCustomerCart';
import { cartItemCount } from '../cart/cart';
import { ROUTES, USER_ROLES } from '@/utils/constants';
import CustomerMobileNav from './CustomerMobileNav';

export const CustomerShell = ({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cart } = useCustomerCart();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.HOME, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-20 font-[Arial,sans-serif] text-[#222222] md:pb-0">
      <header className="sticky top-0 z-20 border-b border-[#eeeeee] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
          <Link to={ROUTES.HOME} className="flex min-w-0 items-center gap-1.5 text-lg font-bold text-[#ee4d2d] sm:gap-2 sm:text-xl">
            <span aria-hidden="true" className="material-symbols-outlined text-[22px] sm:text-2xl">local_dining</span>
            Delivery
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-semibold text-[#666666] md:flex">
            <Link className="hover:text-[#ee4d2d]" to={ROUTES.HOME}>Nhà hàng</Link>
            <Link className="hover:text-[#ee4d2d]" to={ROUTES.CUSTOMER_ORDERS}>Đơn của tôi</Link>
            <Link className="hover:text-[#ee4d2d]" to={ROUTES.CUSTOMER_ADDRESSES}>Địa chỉ của tôi</Link>
          </nav>
          <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
            <Link
              to={ROUTES.CUSTOMER_CART}
              className="relative rounded-full border border-[#eeeeee] p-2 text-[#666666] hover:border-[#ee4d2d] hover:text-[#ee4d2d]"
              aria-label="Giỏ hàng"
            >
              <span aria-hidden="true" className="material-symbols-outlined">shopping_bag</span>
              {cartItemCount(cart) > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ee4d2d] px-1 text-xs font-bold text-white">
                  {cartItemCount(cart)}
                </span>
              )}
            </Link>
            {user?.role === USER_ROLES.USER ? (
              <div className="flex items-center gap-2">
                <span className="hidden max-w-32 truncate text-sm font-semibold sm:inline">{user.name}</span>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  aria-label="Đăng xuất"
                  className="rounded-lg px-2 py-2 text-sm font-semibold text-[#c5371d] hover:bg-[#fff3ee] sm:px-3"
                >
                  <span className="material-symbols-outlined text-[20px] sm:hidden" aria-hidden="true">logout</span>
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </div>
            ) : (
              <Link
                to={ROUTES.CUSTOMER_LOGIN}
                className="rounded-lg bg-[#ee4d2d] px-4 py-2 text-sm font-bold text-white hover:bg-[#d84023]"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </header>
      {title && (
        <div className="border-b border-[#eeeeee] bg-white">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
            <h1 className="text-xl font-bold sm:text-3xl">{title}</h1>
          </div>
        </div>
      )}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      <CustomerMobileNav cartCount={cartItemCount(cart)} />
    </div>
  );
};
