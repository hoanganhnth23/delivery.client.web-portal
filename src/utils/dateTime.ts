const pad = (value: number): string => String(value).padStart(2, '0');

export const formatDateTimeLocal = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
  `T${pad(date.getHours())}:${pad(date.getMinutes())}`;

export const isValidDateTimeRange = (startTime: string, endTime: string): boolean => {
  if (!startTime || !endTime) return false;
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  return Number.isFinite(start) && Number.isFinite(end) && start < end;
};

/** Display format shared with the mobile apps: `20/10/2026 12:30`. */
export const formatDateTime = (value: string | number | Date): string => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return (
    `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
};
