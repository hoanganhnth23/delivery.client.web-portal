export { formatVnd as formatCurrency } from '@/utils/money';

export const isVietnamCoordinate = (latitude?: number, longitude?: number): boolean =>
  typeof latitude === 'number' && Number.isFinite(latitude) && latitude >= 8 && latitude <= 24 &&
  typeof longitude === 'number' && Number.isFinite(longitude) && longitude >= 102 && longitude <= 110;

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
};
