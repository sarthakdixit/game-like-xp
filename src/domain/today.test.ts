import { getLocalDateString } from './today';

describe('getLocalDateString', () => {
  it('formats year-month-day with zero-padding', () => {
    expect(getLocalDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(getLocalDateString(new Date(2026, 8, 30))).toBe('2026-09-30');
  });

  it('does not roll over across midnight within the same local day', () => {
    const lateNight = new Date(2026, 7, 3, 23, 59, 59);
    expect(getLocalDateString(lateNight)).toBe('2026-08-03');
  });

  it('uses local date components, not a UTC-based ISO slice', () => {
    // Late-night local time can be the *next* day in UTC depending on the
    // runtime's timezone offset. Using getFullYear/getMonth/getDate (always
    // local) rather than toISOString() (always UTC) is exactly what avoids
    // that mismatch — this pins the implementation choice down.
    const date = new Date(2026, 7, 3, 23, 30);
    expect(getLocalDateString(date)).toBe(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate(),
      ).padStart(2, '0')}`,
    );
  });

  it('defaults to the current date when called with no argument', () => {
    const now = new Date();
    const expected = getLocalDateString(now);
    expect(getLocalDateString()).toBe(expected);
  });
});
