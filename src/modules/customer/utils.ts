export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

export const isVietnamCoordinate = (latitude?: number, longitude?: number): boolean =>
  typeof latitude === 'number' && Number.isFinite(latitude) && latitude >= 8 && latitude <= 24 &&
  typeof longitude === 'number' && Number.isFinite(longitude) && longitude >= 102 && longitude <= 110;

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
};
