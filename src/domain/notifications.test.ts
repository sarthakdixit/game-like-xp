import {
  buildDecayNudgeBody,
  isQuietHour,
  resolveNotificationTime,
  shouldScheduleDailyReminder,
} from './notifications';

describe('isQuietHour', () => {
  it('is quiet within a window that wraps past midnight (default 21-8)', () => {
    expect(isQuietHour(21)).toBe(true);
    expect(isQuietHour(23)).toBe(true);
    expect(isQuietHour(0)).toBe(true);
    expect(isQuietHour(7)).toBe(true);
  });

  it('is not quiet at the exact end hour or during the day', () => {
    expect(isQuietHour(8)).toBe(false);
    expect(isQuietHour(9)).toBe(false);
    expect(isQuietHour(20)).toBe(false);
  });

  it('is quiet at the exact start hour (inclusive)', () => {
    expect(isQuietHour(21)).toBe(true);
  });

  it('handles a non-wrapping window (e.g. 1-5)', () => {
    const window = { startHour: 1, endHour: 5 };
    expect(isQuietHour(0, window)).toBe(false);
    expect(isQuietHour(1, window)).toBe(true);
    expect(isQuietHour(4, window)).toBe(true);
    expect(isQuietHour(5, window)).toBe(false);
  });

  it('treats a zero-width window as never quiet', () => {
    expect(isQuietHour(12, { startHour: 5, endHour: 5 })).toBe(false);
  });
});

describe('resolveNotificationTime', () => {
  it('returns now unchanged outside quiet hours', () => {
    const now = new Date(2026, 7, 4, 14, 30);
    expect(resolveNotificationTime(now)).toEqual(now);
  });

  it('defers to the end of quiet hours (same day) when currently quiet', () => {
    const now = new Date(2026, 7, 4, 23, 15);
    const resolved = resolveNotificationTime(now);
    expect(resolved.getDate()).toBe(5);
    expect(resolved.getHours()).toBe(8);
    expect(resolved.getMinutes()).toBe(0);
  });

  it('defers to the next day when already past the end hour but still quiet (early morning)', () => {
    const now = new Date(2026, 7, 4, 3, 0);
    const resolved = resolveNotificationTime(now);
    expect(resolved.getDate()).toBe(4);
    expect(resolved.getHours()).toBe(8);
  });

  it('respects a custom quiet-hours window', () => {
    const now = new Date(2026, 7, 4, 2, 0);
    const resolved = resolveNotificationTime(now, { startHour: 1, endHour: 5 });
    expect(resolved.getHours()).toBe(5);
    expect(resolved.getDate()).toBe(4);
  });
});

describe('shouldScheduleDailyReminder', () => {
  it('is true when no reminder is scheduled yet', () => {
    expect(shouldScheduleDailyReminder([])).toBe(true);
    expect(shouldScheduleDailyReminder(['some-other-id'])).toBe(true);
  });

  it('is false when a reminder is already scheduled', () => {
    expect(shouldScheduleDailyReminder(['daily-quest-reminder'])).toBe(false);
    expect(shouldScheduleDailyReminder(['x', 'daily-quest-reminder', 'y'])).toBe(false);
  });
});

describe('buildDecayNudgeBody', () => {
  it('is empty when nothing is decaying', () => {
    expect(buildDecayNudgeBody([])).toBe('');
  });

  it('names a single decaying domain', () => {
    expect(buildDecayNudgeBody(['Health'])).toBe('Health is decaying — check in today.');
  });

  it('joins two decaying domains with "and"', () => {
    expect(buildDecayNudgeBody(['Health', 'Growth'])).toBe(
      'Health and Growth are decaying — check in today.',
    );
  });

  it('joins three or more with commas and a trailing "and"', () => {
    expect(buildDecayNudgeBody(['Health', 'Growth', 'Finance'])).toBe(
      'Health, Growth, and Finance are decaying — check in today.',
    );
  });
});
