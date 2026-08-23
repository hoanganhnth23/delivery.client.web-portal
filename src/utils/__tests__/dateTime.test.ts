import { describe, expect, it } from 'vitest';
import { formatDateTimeLocal, isValidDateTimeRange } from '@/utils/dateTime';

describe('local datetime helpers', () => {
  it('formats local date components without converting them to UTC', () => {
    const localDate = new Date(2026, 6, 29, 8, 5, 0);

    expect(formatDateTimeLocal(localDate)).toBe('2026-07-29T08:05');
  });

  it('accepts only an ordered finite datetime range', () => {
    expect(isValidDateTimeRange('2026-07-29T08:00', '2026-07-29T09:00')).toBe(true);
    expect(isValidDateTimeRange('2026-07-29T09:00', '2026-07-29T08:00')).toBe(false);
    expect(isValidDateTimeRange('', '2026-07-29T08:00')).toBe(false);
  });
});
