import { ORDER_STATUS_LABELS } from '@/utils/orderStatusLabels';
import { formatVnd } from '@/utils/money';
export const screens = {
  map: 'Bản đồ', offer: 'Đơn mới', active: 'Chuyến đang giao', detail: 'Chi tiết đơn',
  success: 'Giao thành công', history: 'Lịch sử chuyến', earnings: 'Thu nhập',
  notifications: 'Thông báo', account: 'Tôi', profile: 'Thông tin cá nhân',
  payout: 'Cài đặt thanh toán', vehicle: 'Thông tin phương tiện',
  permissions: 'Yêu cầu quyền', incident: 'Báo cáo sự cố',
  ratings: 'Đánh giá', documents: 'Giấy tờ', forgot: 'Quên mật khẩu',
  debug: 'Debug tools', login: 'Đăng nhập', splash: 'Khởi động',
} as const;
export type Screen = keyof typeof screens;
export const cases = { normal: 'Bình thường', loading: 'Đang tải', empty: 'Trống',
  error: 'Lỗi kết nối', gps: 'Chưa cấp GPS', map: 'Chưa cấu hình bản đồ',
  expired: 'Offer hết hạn', cod: 'COD không hợp lệ', far: 'Cách điểm đến 450m',
  batch: 'Đơn ghép 2 điểm giao', busy: 'Đang có chuyến khác' } as const;
export type Scenario = keyof typeof cases;
export type Status = 'ASSIGNED' | 'PICKED_UP' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';
export const labels: Record<Status, string> = {
  ASSIGNED: ORDER_STATUS_LABELS.ASSIGNED,
  PICKED_UP: ORDER_STATUS_LABELS.PICKED_UP,
  DELIVERING: ORDER_STATUS_LABELS.DELIVERING,
  DELIVERED: ORDER_STATUS_LABELS.DELIVERED,
  CANCELLED: ORDER_STATUS_LABELS.CANCELLED,
};
export const actions: Partial<Record<Status, string>> = { ASSIGNED: 'Xác nhận đã lấy hàng', PICKED_UP: 'Bắt đầu giao hàng', DELIVERING: 'Giao hàng thành công' };
export function advance(status: Status, distance: number, validCod: boolean, connected: boolean): Status {
  if (!validCod || !connected || distance >= 200) return status;
  return ({ ASSIGNED: 'PICKED_UP', PICKED_UP: 'DELIVERING', DELIVERING: 'DELIVERED' } as Partial<Record<Status, Status>>)[status] ?? status;
}
export const money = formatVnd;
export const reasons = ['Khoảng cách quá xa', 'Xe gặp sự cố', 'Quán quá đông, phải chờ lâu', 'Khách không nghe máy', 'Lý do cá nhân khác'];
export const stops = [
  { name: 'Nguyễn Minh Anh', address: '35 Lê Văn Lương, Thanh Xuân, Hà Nội', cod: 95000, earnings: 24000 },
  { name: 'Lê Thu Hà', address: '28 Nguyễn Trãi, Hà Đông, Hà Nội', cod: 110000, earnings: 20000 },
];
export const pickup = { name: 'Quán Hà Đông', address: '12 Trần Phú, Hà Đông, Hà Nội' };
