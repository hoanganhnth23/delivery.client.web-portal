/**
 * Restaurant Dashboard - Analytics & Statistics
 * Thống kê doanh thu, đơn hàng, hiệu suất của nhà hàng
 * Biểu đồ tăng trưởng theo tháng/quý/năm
 */
import { useState, useMemo, useEffect } from 'react';
import RestaurantSidebar from '@/components/layout/RestaurantSidebar';
import RestaurantHeader from '@/components/layout/RestaurantHeader';
import { useRestaurant } from '../hooks/useRestaurant';
import adminService, { RestaurantDashboardResponse, TimeSeriesPoint } from '@/services/api/adminService';

// ==================== TYPES ====================
type TimePeriod = 'month' | 'quarter' | 'year';

interface ChartDataPoint {
  label: string;
  value: number;
}

// ==================== SVG LINE CHART ====================
const LineChart = ({ data, color = '#f97316', height = 180, showArea = true }: {
  data: ChartDataPoint[];
  color?: string;
  height?: number;
  showArea?: boolean;
}) => {
  if (!data.length) return null;
  const maxVal = Math.max(...data.map(d => d.value)) * 1.15 || 1;
  const w = 100;
  const h = 100;
  const pad = { top: 12, right: 8, bottom: 18, left: 30 };
  const cw = w - pad.left - pad.right;
  const ch = h - pad.top - pad.bottom;

  const points = data.map((d, i) => ({
    x: pad.left + (i / Math.max(data.length - 1, 1)) * cw,
    y: pad.top + ch - (d.value / maxVal) * ch,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${pad.top + ch} L ${points[0].x} ${pad.top + ch} Z`;

  const yTicks = 4;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((maxVal / yTicks) * i));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: `${height}px` }}>
      {yLabels.map((val, i) => {
        const y = pad.top + ch - (val / maxVal) * ch;
        return (
          <g key={i}>
            <line x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke="#e5e7eb" strokeWidth="0.2" strokeDasharray="1.5,1.5" />
            <text x={pad.left - 2} y={y + 1} textAnchor="end" fill="#9ca3af" fontSize="2.8">
              {val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val}
            </text>
          </g>
        );
      })}
      {showArea && <path d={areaD} fill={`${color}12`} />}
      <path d={pathD} fill="none" stroke={color} strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="0.9" fill="white" stroke={color} strokeWidth="0.4" />
          <text x={p.x} y={pad.top + ch + 6} textAnchor="middle" fill="#6b7280" fontSize="2.5">{data[i].label}</text>
        </g>
      ))}
    </svg>
  );
};

// ==================== BAR CHART ====================
const BarChart = ({ data, color = '#f97316', height = 180 }: {
  data: ChartDataPoint[];
  color?: string;
  height?: number;
}) => {
  if (!data.length) return null;
  const maxVal = Math.max(...data.map(d => d.value)) * 1.15 || 1;
  const w = 100;
  const h = 100;
  const pad = { top: 8, right: 8, bottom: 18, left: 30 };
  const cw = w - pad.left - pad.right;
  const ch = h - pad.top - pad.bottom;
  const barW = cw / data.length * 0.6;
  const gap = cw / data.length * 0.4;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: `${height}px` }}>
      {data.map((d, i) => {
        const barH = (d.value / maxVal) * ch;
        const x = pad.left + i * (barW + gap) + gap / 2;
        const y = pad.top + ch - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} fill={color} rx="1" opacity="0.85" />
            <text x={x + barW / 2} y={pad.top + ch + 6} textAnchor="middle" fill="#6b7280" fontSize="2.5">{d.label}</text>
            <text x={x + barW / 2} y={y - 2} textAnchor="middle" fill="#374151" fontSize="2.2" fontWeight="bold">
              {d.value >= 1000 ? `${(d.value / 1000).toFixed(0)}K` : d.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ==================== SPARKLINE ====================
const Sparkline = ({ data, color = '#22c55e', width = 80, height = 28 }: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) => {
  const maxVal = Math.max(...data) * 1.2 || 1;
  const points = data.map((v, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * width,
    y: height - (v / maxVal) * height,
  }));
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  return (
    <svg width={width} height={height} className="mt-1">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

// ==================== DATA GENERATORS ====================
const genMonthly = () => {
  const m = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
  return {
    revenue: m.map((l, i) => ({ label: l, value: Math.round(5000000 + Math.random() * 5000000 + i * 800000) })),
    orders: m.map((l, i) => ({ label: l, value: Math.round(40 + Math.random() * 30 + i * 5) })),
  };
};

const genQuarterly = () => {
  const q = ['Q1', 'Q2', 'Q3', 'Q4'];
  return {
    revenue: q.map((l, i) => ({ label: l, value: Math.round(18000000 + Math.random() * 12000000 + i * 3000000) })),
    orders: q.map((l, i) => ({ label: l, value: Math.round(120 + Math.random() * 80 + i * 25) })),
  };
};

const genYearly = () => {
  const y = ['2022', '2023', '2024', '2025', '2026'];
  return {
    revenue: y.map((l, i) => ({ label: l, value: Math.round(60000000 + Math.random() * 40000000 + i * 20000000) })),
    orders: y.map((l, i) => ({ label: l, value: Math.round(400 + Math.random() * 300 + i * 150) })),
  };
};

// ==================== STAT CARD ====================
const StatCard = ({ icon, gradient, label, value, change, sparkData }: {
  icon: string;
  gradient: string;
  label: string;
  value: string | number;
  change: string;
  sparkData: number[];
}) => (
  <div className="group relative overflow-hidden rounded-2xl bg-card-light dark:bg-card-dark p-5 shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md">
    <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full opacity-10 group-hover:opacity-20 transition-opacity" style={{ background: gradient }} />
    <div className="flex items-start justify-between relative z-10">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 mb-1">
          <div className={`p-2 rounded-xl text-white`} style={{ background: gradient }}>
            <span className="material-symbols-outlined text-lg">{icon}</span>
          </div>
        </div>
        <p className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">{label}</p>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          <span className="mb-1 text-[10px] font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[11px]">trending_up</span>
            {change}
          </span>
        </div>
      </div>
      <Sparkline data={sparkData} color={gradient} />
    </div>
  </div>
);

// ==================== TOP ITEMS ====================
const TopItems = ({ items }: { items: { name: string; orders: number; revenue: number }[] }) => (
  <div className="flex flex-col gap-2">
    {items.map((item, i) => (
      <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
        <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
          i === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-400 text-white' :
          i === 1 ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300' :
          'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
        }`}>{i + 1}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{item.orders} đơn</p>
        </div>
        <span className="text-xs font-bold text-primary">{new Intl.NumberFormat('vi-VN').format(item.revenue)}đ</span>
      </div>
    ))}
  </div>
);

// ==================== MAIN COMPONENT ====================
const RestaurantDashboard = () => {
  const { currentRestaurant } = useRestaurant();
  const [period, setPeriod] = useState<TimePeriod>('month');
  const [apiData, setApiData] = useState<RestaurantDashboardResponse | null>(null);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  // Load dashboard data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await adminService.fetchMyRestaurantDashboard(
          period, undefined, currentRestaurant?.id ? Number(currentRestaurant.id) : undefined
        );
        if (data) setApiData(data);
      } catch {
        // fallback to mock
      }
    };
    loadData();
  }, [period, currentRestaurant?.id]);

  const toChartData = (series: TimeSeriesPoint[] | undefined, extractor: (p: TimeSeriesPoint) => number): ChartDataPoint[] => {
    if (series && series.length > 0) {
      return series.map(p => ({ label: p.label, value: extractor(p) }));
    }
    return [];
  };

  const chartData = useMemo(() => {
    if (apiData) {
      const revData = toChartData(apiData.revenueTimeSeries, p => p.revenue);
      const ordData = toChartData(apiData.orderTimeSeries, p => p.orderCount);
      if (revData.length > 0) return { revenue: revData, orders: ordData };
    }
    switch (period) {
      case 'month': return genMonthly();
      case 'quarter': return genQuarterly();
      case 'year': return genYearly();
    }
  }, [period, apiData]);

  const overview = apiData?.overview;

  const topMenuItems = apiData?.topMenuItems?.length
    ? apiData.topMenuItems.map(m => ({
        name: m.itemName,
        orders: m.quantity,
        revenue: m.revenue,
      }))
    : [
        { name: 'Phở bò tái lăn', orders: 89, revenue: 4450000 },
        { name: 'Bún chả Hà Nội', orders: 67, revenue: 3685000 },
        { name: 'Cơm tấm sườn bì', orders: 52, revenue: 3120000 },
        { name: 'Gỏi cuốn tôm thịt', orders: 48, revenue: 1920000 },
        { name: 'Chè bưởi', orders: 35, revenue: 875000 },
      ];

  const recentOrders = [
    { id: 'ORD-2048', status: 'delivered', time: '5 phút trước', amount: 125000 },
    { id: 'ORD-2047', status: 'preparing', time: '12 phút trước', amount: 89000 },
    { id: 'ORD-2046', status: 'delivered', time: '25 phút trước', amount: 234000 },
    { id: 'ORD-2045', status: 'cancelled', time: '1 giờ trước', amount: 67000 },
    { id: 'ORD-2044', status: 'delivered', time: '1.5 giờ trước', amount: 198000 },
  ];

  const statusMap: Record<string, { label: string; class: string }> = {
    delivered: { label: 'Hoàn thành', class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    preparing: { label: 'Đang chế biến', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    cancelled: { label: 'Đã hủy', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
      <RestaurantSidebar
        restaurantName={currentRestaurant?.name}
        restaurantImage={currentRestaurant?.image}
      />

      <main className="flex flex-1 flex-col overflow-hidden">
        <RestaurantHeader
          title="Dashboard"
          subtitle="Tổng quan doanh thu và hiệu suất"
          showSearch={false}
          actions={
            <div className="flex items-center gap-2">
              {/* Period Selector */}
              <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5">
                {(['month', 'quarter', 'year'] as TimePeriod[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      period === p
                        ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'
                    }`}
                  >
                    {p === 'month' ? 'Tháng' : p === 'quarter' ? 'Quý' : 'Năm'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 rounded-full bg-green-100 dark:bg-green-900/30 px-4 py-1.5 border border-green-200 dark:border-green-800">
                <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-bold text-green-700 dark:text-green-400">Đang mở cửa</span>
              </div>
            </div>
          }
        />

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon="payments"
                gradient="#22c55e"
                label="Doanh thu tháng này"
                value={formatCurrency(overview?.totalRevenue || 12500000)}
                change="+12.5%"
                sparkData={[3, 5, 4, 7, 6, 8, 9, 7, 10, 11, 9, 13]}
              />
              <StatCard
                icon="receipt_long"
                gradient="#8b5cf6"
                label="Tổng đơn hàng"
                value={overview?.totalOrders || 342}
                change="+8.3%"
                sparkData={[20, 25, 22, 28, 30, 27, 32, 29, 35, 33, 38, 40]}
              />
              <StatCard
                icon="check_circle"
                gradient="#f97316"
                label="Giao thành công"
                value={overview?.deliveredOrders || 89}
                change={`${overview?.deliveryRate || 95}%`}
                sparkData={[5, 7, 6, 8, 10, 9, 12, 11, 14, 13, 16, 18]}
              />
              <StatCard
                icon="star"
                gradient="#eab308"
                label="Giá trị TB/đơn"
                value={formatCurrency(overview?.avgOrderValue || 75000)}
                change="+5%"
                sparkData={[4.2, 4.3, 4.4, 4.3, 4.5, 4.4, 4.6, 4.5, 4.7, 4.6, 4.7, 4.7]}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
              {/* Revenue Chart */}
              <div className="bg-card-light dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Doanh thu</h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {period === 'month' ? 'Theo tháng trong năm nay' : period === 'quarter' ? 'Theo quý' : 'Theo năm'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="material-symbols-outlined text-green-600 text-xs">trending_up</span>
                    <span className="text-[10px] font-bold text-green-600">+12.5%</span>
                  </div>
                </div>
                <LineChart data={chartData.revenue} color="#22c55e" height={200} />
              </div>

              {/* Orders Chart */}
              <div className="bg-card-light dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Số đơn hàng</h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Số lượng đơn theo thời gian</p>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <span className="material-symbols-outlined text-purple-600 text-xs">trending_up</span>
                    <span className="text-[10px] font-bold text-purple-600">+8.3%</span>
                  </div>
                </div>
                <BarChart data={chartData.orders} color="#8b5cf6" height={200} />
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Top Menu Items */}
              <div className="bg-card-light dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Món bán chạy nhất</h3>
                <TopItems items={topMenuItems} />
              </div>

              {/* Recent Orders */}
              <div className="xl:col-span-2 bg-card-light dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Đơn hàng gần đây</h3>
                  <button className="text-xs font-semibold text-primary hover:text-orange-600 transition-colors flex items-center gap-0.5">
                    Xem tất cả <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <th className="pb-3 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mã đơn</th>
                        <th className="pb-3 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trạng thái</th>
                        <th className="pb-3 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Thời gian</th>
                        <th className="pb-3 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Giá trị</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {recentOrders.map((order, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="py-3">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">#{order.id}</span>
                          </td>
                          <td className="py-3">
                            <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${statusMap[order.status]?.class}`}>
                              {statusMap[order.status]?.label}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{order.time}</span>
                          </td>
                          <td className="py-3 text-right">
                            <span className="text-sm font-bold text-primary">{formatCurrency(order.amount)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RestaurantDashboard;
