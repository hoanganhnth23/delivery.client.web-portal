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

const TONE_CLASSES = {
  waiting: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  dispatching: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  assigned: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  moving: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  done: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
} as const;

const STATUS_TONE: Record<string, keyof typeof TONE_CLASSES> = {
  PENDING: 'waiting',
  CONFIRMED: 'confirmed',
  FINDING_SHIPPER: 'dispatching',
  WAIT_SHIPPER_CONFIRM: 'dispatching',
  ASSIGNED: 'assigned',
  PICKED_UP: 'moving',
  DELIVERING: 'moving',
  RETURNING: 'moving',
  DELIVERED: 'done',
  RETURNED: 'other',
  SHIPPER_NOT_FOUND: 'failed',
  CANCELLED: 'failed',
};

/** Badge colours shared by the admin and restaurant order lists. */
export function orderStatusBadgeClass(status: string): string {
  return TONE_CLASSES[STATUS_TONE[status] ?? 'other'];
}
