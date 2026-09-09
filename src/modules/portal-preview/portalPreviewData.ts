import customerCatalog from '../customer-preview/catalog.json';

export type PortalKind = 'admin' | 'restaurant';

export type AdminPreviewPage =
  | 'dashboard'
  | 'orders'
  | 'chat'
  | 'restaurants'
  | 'shippers'
  | 'ratings'
  | 'coupons'
  | 'flash-sales'
  | 'catalog-import'
  | 'livestream'
  | 'livestreams';

export type RestaurantPreviewPage =
  | 'dashboard'
  | 'orders'
  | 'menu'
  | 'profile'
  | 'reviews'
  | 'vouchers'
  | 'catalog-import'
  | 'livestream';

export type PortalPreviewPage = AdminPreviewPage | RestaurantPreviewPage;

export interface PortalPreviewRoute {
  kind: PortalKind;
  page: PortalPreviewPage;
}

export interface PortalPreviewNavItem {
  page: PortalPreviewPage;
  icon: string;
  label: string;
}

export type PreviewOrderStatus =
  | 'PENDING'
  | 'PREPARING'
  | 'PICKED_UP'
  | 'DELIVERING'
  | 'DELIVERED'
  | 'CANCELLED';

export interface PreviewOrder {
  id: string;
  customer: string;
  restaurant: string;
  items: string;
  itemCount: number;
  total: number;
  status: PreviewOrderStatus;
  createdAt: string;
  address: string;
  channel: 'COD' | 'ONLINE';
}

export interface PreviewMenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  orders: number;
}

export interface PreviewAdminData {
  identity: string;
  email: string;
  metrics: {
    orders: number;
    gmv: number;
    restaurants: number;
    shippers: number;
  };
  orders: PreviewOrder[];
  restaurants: Array<{
    id: number;
    name: string;
    orders: number;
    rating: number;
    status: 'OPEN' | 'CLOSED';
    address: string;
    phone: string;
    image: string;
  }>;
  shippers: Array<{ name: string; phone: string; zone: string; status: 'ONLINE' | 'OFFLINE'; deliveries: number; rating: number }>;
  ratings: Array<{ id: string; restaurant: string; customer: string; score: number; comment: string; createdAt: string; status: 'PENDING' | 'APPROVED' }>;
  coupons: Array<{ id: string; code: string; title: string; discount: string; usage: string; status: 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' }>;
  flashSales: Array<{ id: string; title: string; window: string; items: number; status: 'LIVE' | 'UPCOMING' | 'ENDED' }>;
}

export interface PreviewRestaurantData {
  identity: string;
  owner: string;
  email: string;
  phone: string;
  address: string;
  image: string;
  rating: number;
  reviewCount: number;
  open: boolean;
  hours: string;
  metrics: { orders: number; revenue: number; averageOrder: number; rating: number };
  orders: PreviewOrder[];
  menuItems: PreviewMenuItem[];
  reviews: Array<{ id: string; customer: string; score: number; comment: string; createdAt: string; status: 'PUBLISHED' | 'PENDING' }>;
  vouchers: Array<{ id: string; code: string; title: string; discount: string; usage: string; status: 'ACTIVE' | 'PENDING' }>;
}

export const ADMIN_PREVIEW_NAVIGATION: PortalPreviewNavItem[] = [
  { page: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
  { page: 'orders', icon: 'receipt_long', label: 'Đơn hàng' },
  { page: 'chat', icon: 'support_agent', label: 'Chat CSKH' },
  { page: 'restaurants', icon: 'storefront', label: 'Quản lý nhà hàng' },
  { page: 'shippers', icon: 'local_shipping', label: 'Shipper' },
  { page: 'ratings', icon: 'reviews', label: 'Đánh giá' },
  { page: 'coupons', icon: 'sell', label: 'Coupon' },
  { page: 'flash-sales', icon: 'bolt', label: 'Flash Sale' },
  { page: 'livestreams', icon: 'live_tv', label: 'Livestream' },
  { page: 'catalog-import', icon: 'upload_file', label: 'Import dữ liệu' },
];

export const RESTAURANT_PREVIEW_NAVIGATION: PortalPreviewNavItem[] = [
  { page: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
  { page: 'orders', icon: 'shopping_bag', label: 'Đơn hàng' },
  { page: 'menu', icon: 'menu_book', label: 'Quản lý Menu' },
  { page: 'profile', icon: 'storefront', label: 'Hồ sơ cửa hàng' },
  { page: 'reviews', icon: 'reviews', label: 'Đánh giá' },
  { page: 'vouchers', icon: 'local_offer', label: 'Voucher nhà hàng' },
  { page: 'catalog-import', icon: 'upload_file', label: 'Import dữ liệu' },
  { page: 'livestream', icon: 'videocam', label: 'Livestream' },
];

export const PREVIEW_ORDER_STATUS_LABELS: Record<PreviewOrderStatus, string> = {
  PENDING: 'Chờ xác nhận',
  PREPARING: 'Đang chuẩn bị',
  PICKED_UP: 'Đã lấy món',
  DELIVERING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
};

const catalogRestaurant = customerCatalog[0];

export const RESTAURANT_PREVIEW_DATA: PreviewRestaurantData = {
  identity: 'Quán Test HÀ ĐÔNG',
  owner: 'Chủ quán trải nghiệm',
  email: 'ha.dong.preview@delivery.local',
  phone: '0901 234 567',
  address: '12 Trần Phú, Hà Đông, Hà Nội',
  image: catalogRestaurant.image,
  rating: 4.8,
  reviewCount: 128,
  open: true,
  hours: '08:00 – 22:00',
  metrics: { orders: 86, revenue: 4260000, averageOrder: 49500, rating: 4.8 },
  orders: [
    { id: 'ORD-2401', customer: 'Nguyễn Minh Anh', restaurant: 'Quán Test HÀ ĐÔNG', items: 'Mì vằn thắn khô, Sủi cảo', itemCount: 2, total: 95000, status: 'PENDING', createdAt: '10:24', address: '35 Lê Văn Lương, Thanh Xuân', channel: 'COD' },
    { id: 'ORD-2398', customer: 'Lê Thu Hà', restaurant: 'Quán Test HÀ ĐÔNG', items: 'Hủ tiếu khô, Miến trộn đặc biệt', itemCount: 2, total: 110000, status: 'PREPARING', createdAt: '10:02', address: '28 Nguyễn Trãi, Hà Đông', channel: 'COD' },
    { id: 'ORD-2394', customer: 'Trần Đức Long', restaurant: 'Quán Test HÀ ĐÔNG', items: 'Sủi cảo', itemCount: 1, total: 35000, status: 'DELIVERING', createdAt: '09:36', address: '18 Quang Trung, Hà Đông', channel: 'ONLINE' },
    { id: 'ORD-2388', customer: 'Phạm Khánh Linh', restaurant: 'Quán Test HÀ ĐÔNG', items: 'Mì vằn thắn khô, Hủ tiếu khô', itemCount: 2, total: 95000, status: 'DELIVERED', createdAt: '09:05', address: '7 Văn Phú, Hà Đông', channel: 'COD' },
  ],
  menuItems: catalogRestaurant.items.map((item, index) => ({
    id: `MENU-${item.id}`,
    name: item.name,
    category: index < 2 ? 'Món bán chạy' : 'Món chính',
    price: item.price,
    image: item.image,
    orders: [42, 31, 24, 18][index] ?? 12,
  })),
  reviews: [
    { id: 'REV-1001', customer: 'Mai Hương', score: 5, comment: 'Món nóng, đóng gói gọn và giao rất nhanh.', createdAt: 'Hôm nay, 09:42', status: 'PUBLISHED' },
    { id: 'REV-1000', customer: 'Quốc Bảo', score: 4, comment: 'Khẩu vị ổn, lần sau sẽ gọi thêm sủi cảo.', createdAt: 'Hôm qua, 20:18', status: 'PUBLISHED' },
    { id: 'REV-999', customer: 'Ngọc Anh', score: 5, comment: 'Ảnh và món thực tế khá đúng nhau.', createdAt: 'Hôm qua, 18:06', status: 'PENDING' },
  ],
  vouchers: [
    { id: 'VCH-01', code: 'HADONG30', title: 'Giảm 30.000đ cho đơn từ 120.000đ', discount: '30.000đ', usage: '42 / 100', status: 'ACTIVE' },
    { id: 'VCH-02', code: 'MIHANOI', title: 'Giảm 15% món mì và phở', discount: '15%', usage: '18 / 50', status: 'PENDING' },
  ],
};

export const ADMIN_PREVIEW_DATA: PreviewAdminData = {
  identity: 'Lan Anh',
  email: 'admin.preview@delivery.local',
  metrics: { orders: 1248, gmv: 68400000, restaurants: 520, shippers: 86 },
  orders: [
    ...RESTAURANT_PREVIEW_DATA.orders,
    { id: 'ORD-2402', customer: 'Đỗ Hoàng Nam', restaurant: 'Phở Lý Quốc Sư - 25 Phủ Doãn', items: 'Phở chín, Quẩy', itemCount: 2, total: 85000, status: 'PREPARING', createdAt: '10:18', address: '12 Tràng Thi, Hoàn Kiếm', channel: 'COD' },
    { id: 'ORD-2403', customer: 'Vũ Mai Chi', restaurant: 'Bánh Cuốn Nóng - Lê Duẩn', items: 'Bánh cuốn nóng', itemCount: 1, total: 45000, status: 'CANCELLED', createdAt: '10:11', address: '19 Nguyễn Thái Học, Đống Đa', channel: 'COD' },
  ],
  restaurants: [
    {
      id: 35,
      name: 'Quán Test HÀ ĐÔNG',
      orders: 86,
      rating: 4.8,
      status: 'OPEN',
      address: RESTAURANT_PREVIEW_DATA.address,
      phone: RESTAURANT_PREVIEW_DATA.phone,
      image: RESTAURANT_PREVIEW_DATA.image,
    },
    {
      id: 101,
      name: 'Mì vằn thắn 9A Đinh Liệt',
      orders: 74,
      rating: 4.8,
      status: 'OPEN',
      address: customerCatalog[0].address,
      phone: '024 3926 1908',
      image: customerCatalog[0].image,
    },
    {
      id: 102,
      name: 'Phở Lý Quốc Sư - 25 Phủ Doãn',
      orders: 68,
      rating: 4.8,
      status: 'OPEN',
      address: customerCatalog[4].address,
      phone: '024 3825 7333',
      image: customerCatalog[4].image,
    },
    {
      id: 103,
      name: 'Bánh Cuốn Nóng - Lê Duẩn',
      orders: 41,
      rating: 4.6,
      status: 'CLOSED',
      address: customerCatalog[3].address,
      phone: '024 3942 5268',
      image: customerCatalog[3].image,
    },
  ],
  shippers: [
    { name: 'Nguyễn Văn Bình', phone: '0908 111 234', zone: 'Hà Đông', status: 'ONLINE', deliveries: 18, rating: 4.9 },
    { name: 'Trần Quốc Huy', phone: '0912 321 654', zone: 'Hoàn Kiếm', status: 'ONLINE', deliveries: 15, rating: 4.8 },
    { name: 'Lê Minh Đức', phone: '0986 456 789', zone: 'Đống Đa', status: 'OFFLINE', deliveries: 11, rating: 4.7 },
    { name: 'Phạm Tuấn Anh', phone: '0977 456 123', zone: 'Thanh Xuân', status: 'ONLINE', deliveries: 22, rating: 4.9 },
  ],
  ratings: [
    { id: 'REV-1001', restaurant: 'Quán Test HÀ ĐÔNG', customer: 'Mai Hương', score: 5, comment: 'Món nóng, đóng gói gọn và giao rất nhanh.', createdAt: 'Hôm nay, 09:42', status: 'PENDING' },
    { id: 'REV-998', restaurant: 'Mì vằn thắn 9A Đinh Liệt', customer: 'Đức Anh', score: 3, comment: 'Đơn đến hơi muộn nhưng món vẫn ổn.', createdAt: 'Hôm qua, 21:05', status: 'APPROVED' },
    { id: 'REV-997', restaurant: 'Vũ Sáng', customer: 'Ngọc Linh', score: 5, comment: 'Nước dùng đậm vị, sẽ quay lại.', createdAt: 'Hôm qua, 19:16', status: 'PENDING' },
  ],
  coupons: [
    { id: 'CP-001', code: 'WELCOME30', title: 'Khách mới giảm 30.000đ', discount: '30.000đ', usage: '482 / 1.000', status: 'ACTIVE' },
    { id: 'CP-002', code: 'FREESHIP15', title: 'Hỗ trợ phí giao hàng', discount: '15.000đ', usage: '920 / 2.000', status: 'ACTIVE' },
    { id: 'CP-003', code: 'HANOI09', title: 'Cuối tuần Hà Nội', discount: '20%', usage: '0 / 500', status: 'SCHEDULED' },
  ],
  flashSales: [
    { id: 'FS-001', title: 'Bữa trưa tiết kiệm', window: '11:00 – 13:00 · Hôm nay', items: 24, status: 'LIVE' },
    { id: 'FS-002', title: 'Món ngon phố cổ', window: '18:00 – 21:00 · 12/09', items: 18, status: 'UPCOMING' },
    { id: 'FS-003', title: 'Ưu đãi cuối tuần', window: 'Đã kết thúc · 07/09', items: 30, status: 'ENDED' },
  ],
};
