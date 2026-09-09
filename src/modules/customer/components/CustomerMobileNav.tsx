import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';

interface CustomerMobileNavProps {
  cartCount: number;
}

const items = [
  {
    label: 'Trang chủ',
    icon: 'home',
    to: ROUTES.HOME,
    match: (pathname: string) =>
      pathname === '/' ||
      pathname === ROUTES.CUSTOMER_RESTAURANTS ||
      pathname.startsWith(`${ROUTES.CUSTOMER_RESTAURANTS}/`),
  },
  {
    label: 'Đơn hàng',
    icon: 'receipt_long',
    to: ROUTES.CUSTOMER_ORDERS,
    match: (pathname: string) => pathname.startsWith(ROUTES.CUSTOMER_ORDERS),
  },
  {
    label: 'Giỏ hàng',
    icon: 'shopping_bag',
    to: ROUTES.CUSTOMER_CART,
    match: (pathname: string) =>
      pathname === ROUTES.CUSTOMER_CART || pathname === ROUTES.CUSTOMER_CHECKOUT,
  },
  {
    label: 'Tôi',
    icon: 'person',
    to: ROUTES.CUSTOMER_ACCOUNT,
    match: (pathname: string) =>
      pathname === ROUTES.CUSTOMER_ACCOUNT || pathname.startsWith('/customer/account'),
  },
];

const CustomerMobileNav = ({ cartCount }: CustomerMobileNavProps) => {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Điều hướng khách hàng"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[#eeeeee] bg-white/95 px-2 pt-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur md:hidden"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      {items.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? 'page' : undefined}
            className={`relative flex min-w-0 flex-col items-center gap-0.5 rounded-md px-1 py-1 text-[11px] font-medium transition-colors ${
              active ? 'text-[#ee4d2d] font-bold' : 'text-[#777777] hover:text-[#ee4d2d]'
            }`}
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[22px]"
              style={{ fontVariationSettings: active ? "'FILL' 1" : undefined }}
            >
              {item.icon}
            </span>
            {item.label === 'Giỏ hàng' && cartCount > 0 && (
              <span className="absolute left-1/2 top-0 ml-2 flex h-4 min-w-4 -translate-y-1/4 items-center justify-center rounded-full bg-[#ee4d2d] px-1 text-[10px] font-bold text-white shadow-sm">
                {cartCount}
              </span>
            )}
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default CustomerMobileNav;
