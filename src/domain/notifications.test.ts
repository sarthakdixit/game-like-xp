import {
  buildDecayNudgeBody,
  isQuietHour,
  reminderIdForHour,
  remainingReminderHoursToday,
  reminderSlotHours,
  resolveNotificationTime,
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

describe('reminderIdForHour', () => {
  it('produces a stable, distinct id per hour', () => {
    expect(reminderIdForHour(8)).toBe('daily-quest-reminder-8');
    expect(reminderIdForHour(20)).toBe('daily-quest-reminder-20');
    expect(reminderIdForHour(8)).not.toBe(reminderIdForHour(10));
  });
});

describe('reminderSlotHours', () => {
  it('spaces slots by the interval, skipping default quiet hours (21-8)', () => {
    expect(reminderSlotHours()).toEqual([8, 10, 12, 14, 16, 18, 20]);
  });

  it('respects a custom interval', () => {
    expect(reminderSlotHours(4)).toEqual([8, 12, 16, 20]);
  });

  it('respects a custom quiet-hours window', () => {
    expect(reminderSlotHours(2, { startHour: 12, endHour: 14 })).toEqual([
      0, 2, 4, 6, 8, 10, 14, 16, 18, 20, 22,
    ]);
  });
});

describe('remainingReminderHoursToday', () => {
  it('includes every slot when called at the start of the day', () => {
    expect(remainingReminderHoursToday(0)).toEqual([8, 10, 12, 14, 16, 18, 20]);
  });

  it('excludes slots already passed', () => {
    expect(remainingReminderHoursToday(13)).toEqual([14, 16, 18, 20]);
  });

  it('is empty once past the last slot of the day', () => {
    expect(remainingReminderHoursToday(21)).toEqual([]);
  });

  it('includes a slot exactly at the current hour', () => {
    expect(remainingReminderHoursToday(14)).toEqual([14, 16, 18, 20]);
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
