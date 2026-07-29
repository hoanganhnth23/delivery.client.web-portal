import { Link } from 'react-router-dom';
import AdminLayout from '@/components/layouts/AdminLayout';
import { ROUTES } from '@/utils/constants';

const actions = [
  { label: 'Đơn hàng', icon: 'receipt_long', to: ROUTES.ADMIN_ORDERS },
  { label: 'Shipper', icon: 'local_shipping', to: ROUTES.ADMIN_SHIPPERS },
  { label: 'Đánh giá', icon: 'reviews', to: ROUTES.ADMIN_RATINGS },
  { label: 'Coupon', icon: 'sell', to: ROUTES.ADMIN_COUPONS },
  { label: 'Flash Sale', icon: 'bolt', to: ROUTES.ADMIN_FLASH_SALES },
];

const AdminDashboard = () => (
  <AdminLayout>
    <section className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">MVP Console</p>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Quản trị hệ thống</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Chọn một nghiệp vụ đã được hỗ trợ. Analytics và thao tác settlement chưa mở trong MVP.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="flex items-center gap-4 rounded-2xl border border-border-light bg-white p-5 shadow-sm transition hover:border-primary hover:shadow-md dark:border-border-dark dark:bg-surface-dark"
          >
            <span className="material-symbols-outlined text-3xl text-primary">{action.icon}</span>
            <span className="font-bold text-gray-900 dark:text-white">{action.label}</span>
          </Link>
        ))}
      </div>
    </section>
  </AdminLayout>
);

export default AdminDashboard;
