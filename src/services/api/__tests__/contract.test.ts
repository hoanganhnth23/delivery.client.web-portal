import { describe, expect, it } from 'vitest';
import {
  optionalTimestamp,
  requireTimestamp,
} from '../contract';

describe('contract timestamp validation', () => {
  it('parses Jackson LocalDateTime number array format', () => {
    // [2026, 9, 3, 9, 51, 24, 607206000]
    const arrayFormat = [2026, 9, 3, 9, 51, 24, 607206000];
    const parsed = requireTimestamp(arrayFormat, 'createdAt');
    expect(parsed).toBe('2026-09-03T09:51:24.607Z');
  });

  it('parses Jackson LocalDateTime array without nanoseconds', () => {
    const arrayFormat = [2026, 9, 3, 9, 51, 24];
    const parsed = requireTimestamp(arrayFormat, 'updatedAt');
    expect(parsed).toBe('2026-09-03T09:51:24.000Z');
  });

  it('parses standard ISO timestamp string', () => {
    const isoString = '2026-09-03T09:51:24.607Z';
    expect(requireTimestamp(isoString, 'createdAt')).toBe(isoString);
  });

  it('parses epoch millisecond timestamp', () => {
    const epochMs = 1788429084000;
    const parsed = requireTimestamp(epochMs, 'createdAt');
    expect(parsed).toBe(new Date(epochMs).toISOString());
  });

  it('handles optionalTimestamp with null and undefined gracefully', () => {
    expect(optionalTimestamp(null, 'createdAt')).toBeNull();
    expect(optionalTimestamp(undefined, 'createdAt')).toBeNull();
    expect(optionalTimestamp('', 'createdAt')).toBeNull();
    expect(optionalTimestamp([2026, 9, 3, 9, 51, 24], 'createdAt')).toBe('2026-09-03T09:51:24.000Z');
  });

  it('throws for invalid date formats', () => {
    expect(() => requireTimestamp('invalid-date', 'createdAt')).toThrow('createdAt must be a valid timestamp');
    expect(() => requireTimestamp({}, 'createdAt')).toThrow();
  });
});
