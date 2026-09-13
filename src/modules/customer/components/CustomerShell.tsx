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

  const count = cartItemCount(cart);

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-20 font-[Arial,sans-serif] text-[#222222] md:pb-0">
      {/* Header Bar: Desktop only */}
      <header className="sticky top-0 z-30 hidden border-b border-[#eeeeee] bg-white/95 backdrop-blur md:block">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-3 sm:gap-6 sm:px-6 sm:py-4 lg:px-8">
          {/* ShopeeFood Brand Logo */}
          <Link
            to={ROUTES.HOME}
            className="flex shrink-0 items-center text-xl font-bold tracking-tight text-[#ee4d2d] sm:text-2xl"
          >
            Shopee<span className="font-normal">Food</span>
          </Link>

          {/* Delivery Address Selector */}
          <Link
            to={ROUTES.CUSTOMER_ADDRESSES}
            className="hidden items-center gap-2 rounded-md border border-[#e5e5e5] bg-[#fafafa] px-3 py-1.5 text-left transition hover:border-[#ee4d2d] sm:flex max-w-xs"
            title="Địa chỉ giao hàng"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-[#ee4d2d]">
              location_on
            </span>
            <div className="min-w-0 flex-1">
              <small className="block text-[10px] text-[#888888]">Giao đến</small>
              <b className="block truncate text-xs font-medium text-[#222222]">
                Toà nhà Keangnam, Mễ Trì, Nam Từ Liêm
              </b>
            </div>
            <span aria-hidden="true" className="material-symbols-outlined text-sm text-[#999999]">
              expand_more
            </span>
          </Link>

          {/* Desktop Navigation */}
          <Link className="hidden min-h-11 items-center text-sm font-semibold text-primary md:inline-flex" to={ROUTES.CUSTOMER_LIVESTREAMS}>Livestream</Link>
          <nav className="ml-2 hidden items-center gap-5 text-sm font-semibold text-[#555555] md:flex">
            <Link className="transition hover:text-[#ee4d2d]" to={ROUTES.HOME}>
              Nhà hàng
            </Link>
            <Link className="transition hover:text-[#ee4d2d]" to={ROUTES.CUSTOMER_ORDERS}>
              Đơn của tôi
            </Link>
            <Link className="transition hover:text-[#ee4d2d]" to={ROUTES.CUSTOMER_ADDRESSES}>
              Địa chỉ của tôi
            </Link>
            <Link className="transition hover:text-[#ee4d2d]" to={ROUTES.CUSTOMER_ACCOUNT}>
              Tôi
            </Link>
          </nav>

          {/* Header Right Actions */}
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <Link
              to={ROUTES.CUSTOMER_CART}
              className="relative flex items-center justify-center rounded-full border border-[#eeeeee] p-2 text-[#555555] transition hover:border-[#ee4d2d] hover:text-[#ee4d2d]"
              aria-label="Giỏ hàng"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[20px] sm:text-[22px]">
                shopping_bag
              </span>
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#ee4d2d] px-1 text-[10px] font-bold text-white shadow-sm sm:h-5 sm:min-w-5 sm:text-xs">
                  {count}
                </span>
              )}
            </Link>

            {user?.role === USER_ROLES.USER ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="hidden max-w-36 truncate text-sm font-semibold text-[#222222] sm:inline">
                  {user.name}
                </span>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  aria-label="Đăng xuất"
                  className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold text-[#c5371d] hover:bg-[#fff3ee] sm:px-3 sm:text-sm"
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    logout
                  </span>
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </div>
            ) : (
              <Link
                to={ROUTES.CUSTOMER_LOGIN}
                className="rounded-md bg-[#ee4d2d] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#d84023] sm:px-4 sm:py-2 sm:text-sm"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Single Page Title Bar (when title is provided) */}
      {title && (
        <div className="border-b border-[#eeeeee] bg-white">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 sm:py-5 lg:px-8">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Quay lại"
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 text-[#444444] md:hidden"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                arrow_back
              </span>
            </button>
            <h1 className="text-xl font-bold text-[#222222] sm:text-3xl">{title}</h1>
            <div className="ml-auto flex items-center gap-2 md:hidden">
              <Link
                to={ROUTES.CUSTOMER_CART}
                className="relative flex h-8 w-8 items-center justify-center rounded-full text-[#444444]"
                aria-label="Giỏ hàng"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                  shopping_bag
                </span>
                {count > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ee4d2d] px-1 text-[10px] font-bold text-white">
                    {count}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">{children}</main>
      <CustomerMobileNav cartCount={count} />
    </div>
  );
};
