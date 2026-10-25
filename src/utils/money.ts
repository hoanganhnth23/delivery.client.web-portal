/** One money format for every portal and app: `45.000đ`. */
export const formatVnd = (value: number): string =>
  `${Math.round(value).toLocaleString('vi-VN')}đ`;
