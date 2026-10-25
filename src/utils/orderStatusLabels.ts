import type { Order } from '@/types/api.types';

/**
 * One Vietnamese label per backend order/delivery status. Customer app and
 * shipper app keep the same table (docs/plans/active/mobile-flow-and-web-parity.md).
 */
export const ORDER_STATUS_LABELS: Record<Order['status'], string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  FINDING_SHIPPER: 'Đang tìm shipper',
  WAIT_SHIPPER_CONFIRM: 'Chờ shipper nhận đơn',
  SHIPPER_NOT_FOUND: 'Không tìm được shipper',
  ASSIGNED: 'Đã có shipper',
  PICKED_UP: 'Đã lấy hàng',
  DELIVERING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
};

export const DELIVERY_ONLY_STATUS_LABELS = {
  RETURNING: 'Đang hoàn hàng',
  RETURNED: 'Đã hoàn hàng',
} as const;

export function orderStatusLabel(status: string): string {
  return (
    (ORDER_STATUS_LABELS as Record<string, string>)[status] ??
    (DELIVERY_ONLY_STATUS_LABELS as Record<string, string>)[status] ??
    status
  );
}
