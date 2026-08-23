import type { Order } from '@/types/api.types';

export const statusLabels: Record<Order['status'], string> = {
  PENDING: 'Chờ nhà hàng xác nhận',
  CONFIRMED: 'Nhà hàng đã xác nhận',
  FINDING_SHIPPER: 'Đang tìm shipper',
  WAIT_SHIPPER_CONFIRM: 'Chờ shipper nhận',
  ASSIGNED: 'Đã có shipper',
  PICKED_UP: 'Đã lấy món',
  DELIVERING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
  SHIPPER_NOT_FOUND: 'Chưa tìm được shipper',
};
