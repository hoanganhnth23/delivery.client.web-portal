/**
 * Vietnamese labels for the non-order enums shown in the portals, so no page
 * prints a raw backend code. Order statuses live in orderStatusLabels.ts.
 */
const label = (table: Record<string, string>) => (code: string): string =>
  table[code] ?? code;

/** Moderation state of ratings, flash-sale items and vouchers. */
export const approvalLabel = label({
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
});

/** Time-boxed campaigns such as flash sales. */
export const campaignLabel = label({
  ACTIVE: 'Đang diễn ra',
  LIVE: 'Đang diễn ra',
  UPCOMING: 'Sắp diễn ra',
  SCHEDULED: 'Sắp diễn ra',
  ENDED: 'Đã kết thúc',
  EXPIRED: 'Đã kết thúc',
});

export const livestreamLabel = label({
  CREATED: 'Mới tạo',
  SCHEDULED: 'Đã lên lịch',
  LIVE: 'Đang phát',
  ENDED: 'Đã kết thúc',
});

/** Same wording as the customer app's voucher wallet filters. */
export const voucherLayerLabel = label({
  FREESHIP: 'Freeship',
  SHOP_DISCOUNT: 'Giảm quán ăn',
  PLATFORM_DISCOUNT: 'Ưu đãi sàn',
});
