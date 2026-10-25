import { describe, expect, it } from 'vitest';
import { formatVnd } from '../money';

describe('formatVnd', () => {
  it('uses dot grouping and a trailing đ like the mobile apps', () => {
    expect(formatVnd(45000)).toBe('45.000đ');
    expect(formatVnd(0)).toBe('0đ');
    expect(formatVnd(1234567.6)).toBe('1.234.568đ');
  });
});
