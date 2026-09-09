// Voucher persistence uses UTC LocalDateTime; do not share this contract with flash sales.
export const voucherLocalToUtc = (value: string): string => new Date(value).toISOString().slice(0, -1);

export const voucherDate = (value: string): Date =>
  new Date(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}Z`);

export const voucherLifecycle = (voucher: {
  approvalStatus?: string;
  active: boolean;
  startTime: string;
  endTime: string;
  usedQuantity: number;
  totalQuantity: number;
}, now: Date): string => {
  const start = voucherDate(voucher.startTime).getTime();
  const end = voucherDate(voucher.endTime).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 'KHÔNG HỢP LỆ';
  if (voucher.approvalStatus === 'PENDING') return 'CHỜ DUYỆT';
  if (voucher.approvalStatus === 'REJECTED') return 'ĐÃ TỪ CHỐI';
  if (voucher.approvalStatus && voucher.approvalStatus !== 'APPROVED') return 'CHƯA ĐƯỢC DUYỆT';
  if (!voucher.active) return 'TẠM DỪNG';
  if (end <= now.getTime()) return 'HẾT HẠN';
  if (voucher.usedQuantity >= voucher.totalQuantity) return 'HẾT LƯỢT';
  if (start > now.getTime()) return 'CHƯA BẮT ĐẦU';
  return 'ĐANG CHẠY';
};
