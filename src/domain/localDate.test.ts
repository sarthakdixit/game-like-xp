import { describe, expect, it } from 'vitest';

import { todayLocalDate } from './localDate';

describe('todayLocalDate', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(todayLocalDate(new Date(2026, 7, 4))).toBe('2026-08-04');
  });

  it('pads single-digit months', () => {
    expect(todayLocalDate(new Date(2026, 0, 15))).toBe('2026-01-15');
  });

  it('pads single-digit days', () => {
    expect(todayLocalDate(new Date(2026, 7, 4))).toBe('2026-08-04');
    expect(todayLocalDate(new Date(2026, 11, 1))).toBe('2026-12-01');
  });

  it('handles the last day of a leap-year February', () => {
    expect(todayLocalDate(new Date(2028, 1, 29))).toBe('2028-02-29');
  });

  it('handles the last day of December', () => {
    expect(todayLocalDate(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('defaults to the current moment when no reference is given', () => {
    const result = todayLocalDate();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
