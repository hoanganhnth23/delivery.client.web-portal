import { Link, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useCustomerCart } from '../cart/useCustomerCart';
import { cartItemCount } from '../cart/cart';
import { ROUTES, USER_ROLES } from '@/utils/constants';

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
    <div className="min-h-screen bg-[#fffaf3] text-[#2d2116]">
      <header className="sticky top-0 z-20 border-b border-[#eadfce] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6">
          <Link to={ROUTES.HOME} className="flex items-center gap-2 text-xl font-black text-[#ed8a16]">
            <span aria-hidden="true" className="material-symbols-outlined">local_dining</span>
            Delivery
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-semibold text-[#705d48] md:flex">
            <Link className="hover:text-[#ed8a16]" to={ROUTES.HOME}>Nhà hàng</Link>
            <Link className="hover:text-[#ed8a16]" to={ROUTES.CUSTOMER_ORDERS}>Đơn của tôi</Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Link
              to={ROUTES.CUSTOMER_CART}
              className="relative rounded-full border border-[#eadfce] p-2 text-[#705d48] hover:border-[#ed8a16] hover:text-[#ed8a16]"
              aria-label="Giỏ hàng"
            >
              <span aria-hidden="true" className="material-symbols-outlined">shopping_bag</span>
              {cartItemCount(cart) > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ed8a16] px-1 text-xs font-bold text-white">
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
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-[#a85d0c] hover:bg-[#fff0d9]"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <Link
                to={ROUTES.CUSTOMER_LOGIN}
                className="rounded-lg bg-[#ed8a16] px-4 py-2 text-sm font-bold text-white hover:bg-[#d97608]"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </header>
      {title && (
        <div className="border-b border-[#eadfce] bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            <h1 className="text-2xl font-black sm:text-3xl">{title}</h1>
          </div>
        </div>
      )}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
};
