import { useDialogFocus } from './useDialogFocus';
import { Link, useLocation } from 'react-router-dom';
import type { PortalNavigationItem } from './portalNavigation';

interface PortalMobileDrawerProps {
  open: boolean;
  title: string;
  identity: string;
  subtitle: string;
  items: PortalNavigationItem[];
  onClose: () => void;
  onLogout: () => void | Promise<void>;
}

const PortalMobileDrawer = ({
  open,
  title,
  identity,
  subtitle,
  items,
  onClose,
  onLogout,
}: PortalMobileDrawerProps) => {
  const location = useLocation();
  const dialogRef = useDialogFocus(open, onClose);

  if (!open) return null;

  return (
    <div ref={dialogRef} tabIndex={-1} className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-labelledby="mobile-drawer-heading">
      <button
        type="button"
        aria-label="Đóng menu"
        className="absolute inset-0 h-full w-full bg-black/40"
        onClick={onClose}
      />
      <aside className="portal-drawer-panel relative flex h-full w-80 max-w-[85vw] flex-col bg-surface-light p-5 shadow-2xl dark:bg-surface-dark">
        <div className="flex items-start justify-between gap-3 border-b border-border-light pb-5 dark:border-border-dark">
          <div className="min-w-0">
            <h2 id="mobile-drawer-heading" className="text-xs font-semibold uppercase tracking-wider text-primary">{title}</h2>
            <p className="mt-1 truncate text-lg font-bold text-gray-900 dark:text-white">
              {identity}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
          </div>
          <button
            type="button"
            aria-label="Đóng menu"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <span aria-hidden="true" className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="mt-6 flex flex-col gap-2" aria-label="Điều hướng portal">
          {items.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? 'page' : undefined}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                  active
                    ? 'bg-primary/10 font-bold text-primary'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                <span aria-hidden="true" className="material-symbols-outlined">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => void onLogout()}
          className="mt-auto flex items-center gap-3 rounded-lg px-4 py-3 text-left text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <span aria-hidden="true" className="material-symbols-outlined">logout</span>
          <span className="text-sm font-medium">Đăng xuất</span>
        </button>
      </aside>
    </div>
  );
};

export default PortalMobileDrawer;
