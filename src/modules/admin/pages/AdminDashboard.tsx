import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useAppDependencies } from '@/app/dependencies';
import type { AdminDashboard } from '@/services/api/adminService';
import { ROUTES } from '@/utils/constants';

const actions = [
  { label: 'Đơn hàng', icon: 'receipt_long', to: ROUTES.ADMIN_ORDERS },
  { label: 'Shipper', icon: 'local_shipping', to: ROUTES.ADMIN_SHIPPERS },
  { label: 'Đánh giá', icon: 'reviews', to: ROUTES.ADMIN_RATINGS },
  { label: 'Coupon', icon: 'sell', to: ROUTES.ADMIN_COUPONS },
  { label: 'Flash Sale', icon: 'bolt', to: ROUTES.ADMIN_FLASH_SALES },
  { label: 'Import dữ liệu', icon: 'upload_file', to: ROUTES.ADMIN_CATALOG_IMPORT },
];

type DashboardPeriod = 'month' | 'quarter' | 'year';

const emptyDashboard: AdminDashboard = {
  overview: {
    totalOrders: 0,
    totalRevenue: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    avgOrderValue: 0,
    deliveryRate: 0,
  },
  revenueTimeSeries: [],
  orderTimeSeries: [],
  statusBreakdown: [],
  topRestaurants: [],
};

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat('vi-VN');

const formatCurrency = (value: number) => currency.format(value);
const formatNumber = (value: number) => number.format(value);

const statusLabel: Record<string, string> = {
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
  PENDING: 'Chờ xử lý',
  PROCESSING: 'Đang xử lý',
  SHIPPER_NOT_FOUND: 'Không tìm thấy shipper',
};

const metricCards = (dashboard: AdminDashboard) => [
  {
    label: 'Tổng đơn',
    value: formatNumber(dashboard.overview.totalOrders),
    icon: 'shopping_bag',
    tone: 'text-primary',
  },
  {
    label: 'GMV đã giao',
    value: formatCurrency(dashboard.overview.totalRevenue),
    icon: 'payments',
    tone: 'text-emerald-600',
  },
  {
    label: 'Đã giao thành công',
    value: formatNumber(dashboard.overview.deliveredOrders),
    icon: 'task_alt',
    tone: 'text-blue-600',
  },
  {
    label: 'Tỷ lệ giao thành công',
    value: `${dashboard.overview.deliveryRate.toLocaleString('vi-VN')}%`,
    icon: 'local_shipping',
    tone: 'text-violet-600',
  },
];

interface TrendChartProps {
  dashboard: AdminDashboard;
}

const TrendChart = ({ dashboard }: TrendChartProps) => {
  const points = dashboard.revenueTimeSeries;
  const maxRevenue = Math.max(...points.map((point) => point.revenue), 1);
  const maxOrders = Math.max(...points.map((point) => point.orderCount), 1);
  const width = 720;
  const height = 220;
  const padding = 28;
  const x = (index: number) => padding + (index * (width - padding * 2)) / Math.max(points.length - 1, 1);
  const revenueY = (value: number) => height - padding - (value / maxRevenue) * (height - padding * 2);
  const orderY = (value: number) => height - padding - (value / maxOrders) * (height - padding * 2);
  const revenuePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${revenueY(point.revenue)}`).join(' ');
  const orderPath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${orderY(point.orderCount)}`).join(' ');

  return (
    <div className="rounded-2xl border border-border-light bg-white p-5 shadow-sm dark:border-border-dark dark:bg-surface-dark">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Xu hướng kinh doanh</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">GMV và số đơn theo kỳ đang chọn</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> GMV</span>
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-primary" /> Đơn hàng</span>
        </div>
      </div>
      {points.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-gray-500">Chưa có dữ liệu xu hướng.</div>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="h-56 min-w-[620px] w-full" role="img" aria-label="Biểu đồ xu hướng GMV và số đơn">
            {[0, 1, 2, 3].map((line) => {
              const y = padding + (line * (height - padding * 2)) / 3;
              return <line key={line} x1={padding} x2={width - padding} y1={y} y2={y} stroke="currentColor" className="text-gray-100 dark:text-gray-800" strokeWidth="1" />;
            })}
            <path d={revenuePath} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d={orderPath} fill="none" stroke="#f49d25" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((point, index) => (
              <g key={`${point.label}-${index}`}>
                <circle cx={x(index)} cy={revenueY(point.revenue)} r="4" fill="#10b981" />
                <circle cx={x(index)} cy={orderY(point.orderCount)} r="4" fill="#f49d25" />
                <text x={x(index)} y={height - 6} textAnchor="middle" className="fill-gray-400 text-[10px]">{point.label}</text>
              </g>
            ))}
          </svg>
        </div>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const { admin: adminService, notifications } = useAppDependencies();
  const [dashboard, setDashboard] = useState<AdminDashboard>(emptyDashboard);
  const [period, setPeriod] = useState<DashboardPeriod>('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await adminService.fetchAdminDashboard(period);
      setDashboard(next);
      setUpdatedAt(new Date());
    } catch {
      setError('Không thể tải số liệu dashboard');
      notifications.error('Không thể tải số liệu dashboard');
    } finally {
      setLoading(false);
    }
  }, [adminService, notifications, period]);

  useEffect(() => {
    void loadDashboard();
    const refresh = window.setInterval(() => void loadDashboard(), 60_000);
    return () => window.clearInterval(refresh);
  }, [loadDashboard]);

  const cards = useMemo(() => metricCards(dashboard), [dashboard]);

  return (
    <AdminLayout>
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Platform analytics</p>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">Quản trị hệ thống</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Tổng quan vận hành đơn hàng và GMV toàn hệ thống.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="dashboard-period" className="sr-only">Khoảng thời gian</label>
            <select id="dashboard-period" value={period} onChange={(event) => setPeriod(event.target.value as DashboardPeriod)} className="rounded-lg border border-border-light bg-white px-3 py-2 text-sm dark:border-border-dark dark:bg-surface-dark">
              <option value="month">Theo tháng</option>
              <option value="quarter">Theo quý</option>
              <option value="year">Theo năm</option>
            </select>
            <button type="button" onClick={() => void loadDashboard()} disabled={loading} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-hover disabled:opacity-50">
              {loading ? 'Đang tải…' : 'Làm mới'}
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            <span>{error}</span>
            <button type="button" onClick={() => void loadDashboard()} className="rounded-lg bg-red-700 px-3 py-2 font-semibold text-white">Thử lại</button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-border-light bg-white p-5 shadow-sm dark:border-border-dark dark:bg-surface-dark">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{card.label}</p>
                <span className={`material-symbols-outlined ${card.tone}`}>{card.icon}</span>
              </div>
              <p className="mt-4 text-2xl font-black text-gray-900 dark:text-white">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <TrendChart dashboard={dashboard} />
          <div className="rounded-2xl border border-border-light bg-white p-5 shadow-sm dark:border-border-dark dark:bg-surface-dark">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Phân bổ trạng thái</h2>
            <div className="mt-5 flex flex-col gap-4">
              {dashboard.statusBreakdown.length === 0 ? <p className="text-sm text-gray-500">Chưa có dữ liệu trạng thái.</p> : dashboard.statusBreakdown.map((item) => {
                const ratio = dashboard.overview.totalOrders > 0 ? Math.min(100, (item.count / dashboard.overview.totalOrders) * 100) : 0;
                return (
                  <div key={item.status}>
                    <div className="flex justify-between gap-3 text-sm"><span className="font-medium text-gray-700 dark:text-gray-300">{statusLabel[item.status] || item.status}</span><span className="font-bold text-gray-900 dark:text-white">{formatNumber(item.count)}</span></div>
                    <div className="mt-2 h-2 rounded-full bg-gray-100 dark:bg-gray-800"><div className="h-2 rounded-full bg-primary" style={{ width: `${ratio}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border-light bg-white shadow-sm dark:border-border-dark dark:bg-surface-dark">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-light p-5 dark:border-border-dark">
            <div><h2 className="text-lg font-bold text-gray-900 dark:text-white">Top nhà hàng</h2><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Xếp theo doanh thu đơn đã giao</p></div>
            {updatedAt && <span className="text-xs text-gray-400">Cập nhật {updatedAt.toLocaleTimeString('vi-VN')}</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left">
              <thead><tr className="border-b border-border-light text-xs uppercase tracking-wider text-gray-500 dark:border-border-dark"><th className="p-4">#</th><th className="p-4">Nhà hàng</th><th className="p-4">Đơn đã giao</th><th className="p-4">GMV</th></tr></thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {dashboard.topRestaurants.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-sm text-gray-500">Chưa có dữ liệu nhà hàng.</td></tr> : dashboard.topRestaurants.map((restaurant, index) => <tr key={restaurant.restaurantId} className="hover:bg-gray-50 dark:hover:bg-gray-800/30"><td className="p-4 font-bold text-primary">{index + 1}</td><td className="p-4 font-semibold text-gray-900 dark:text-white">{restaurant.restaurantName}</td><td className="p-4 text-gray-600 dark:text-gray-300">{formatNumber(restaurant.orderCount)}</td><td className="p-4 font-semibold text-gray-900 dark:text-white">{formatCurrency(restaurant.revenue)}</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Nghiệp vụ quản trị</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {actions.map((action) => <Link key={action.to} to={action.to} className="flex items-center gap-4 rounded-2xl border border-border-light bg-white p-5 shadow-sm transition hover:border-primary hover:shadow-md dark:border-border-dark dark:bg-surface-dark"><span className="material-symbols-outlined text-3xl text-primary">{action.icon}</span><span className="font-bold text-gray-900 dark:text-white">{action.label}</span></Link>)}
          </div>
        </div>
      </section>
    </AdminLayout>
  );
};

export default AdminDashboard;
