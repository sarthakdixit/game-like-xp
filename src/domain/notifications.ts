/** Stable identifiers so scheduling is idempotent — check for these before adding another. */
export const DAILY_REMINDER_ID = 'daily-quest-reminder';
export const DECAY_NUDGE_ID = 'decay-nudge';

/** How often the quest reminder repeats while quests are still outstanding. */
export const REMINDER_INTERVAL_HOURS = 2;

export interface QuietHours {
  /** Hour (0-23) quiet hours begin, inclusive. */
  startHour: number;
  /** Hour (0-23) quiet hours end, exclusive. */
  endHour: number;
}

/** 9pm-8am — no nudge should buzz someone awake or mid-sleep. */
export const DEFAULT_QUIET_HOURS: QuietHours = { startHour: 21, endHour: 8 };

/** Whether `hour` (0-23) falls within a quiet-hours window that may wrap past midnight. */
export function isQuietHour(hour: number, quietHours: QuietHours = DEFAULT_QUIET_HOURS): boolean {
  const { startHour, endHour } = quietHours;
  if (startHour === endHour) {
    return false;
  }
  if (startHour < endHour) {
    return hour >= startHour && hour < endHour;
  }
  return hour >= startHour || hour < endHour;
}

/**
 * If `now` falls within quiet hours, returns the moment quiet hours next end
 * (today or tomorrow); otherwise returns `now` unchanged so the caller can
 * fire right away.
 */
export function resolveNotificationTime(
  now: Date,
  quietHours: QuietHours = DEFAULT_QUIET_HOURS,
): Date {
  if (!isQuietHour(now.getHours(), quietHours)) {
    return now;
  }

  const result = new Date(now);
  result.setHours(quietHours.endHour, 0, 0, 0);
  if (result <= now) {
    result.setDate(result.getDate() + 1);
  }
  return result;
}

/** Stable, per-slot notification id — one per reminder hour, so each can be cancelled individually. */
export function reminderIdForHour(hour: number): string {
  return `${DAILY_REMINDER_ID}-${hour}`;
}

/**
 * Every hour (0-23) a reminder could fire at, spaced `intervalHours` apart
 * starting from midnight, skipping any hour that falls in quiet hours. E.g.
 * with the defaults (2-hour interval, 21:00-8:00 quiet): [8, 10, 12, 14, 16, 18, 20].
 */
export function reminderSlotHours(
  intervalHours: number = REMINDER_INTERVAL_HOURS,
  quietHours: QuietHours = DEFAULT_QUIET_HOURS,
): number[] {
  const hours: number[] = [];
  for (let hour = 0; hour < 24; hour += intervalHours) {
    if (!isQuietHour(hour, quietHours)) {
      hours.push(hour);
    }
  }
  return hours;
}

/** Slot hours still ahead today, at or after `nowHour`. */
export function remainingReminderHoursToday(
  nowHour: number,
  intervalHours: number = REMINDER_INTERVAL_HOURS,
  quietHours: QuietHours = DEFAULT_QUIET_HOURS,
): number[] {
  return reminderSlotHours(intervalHours, quietHours).filter((hour) => hour >= nowHour);
}

/** Grammatically joins decaying domain names into a notification body. Empty string if none. */
export function buildDecayNudgeBody(decayingDomainNames: string[]): string {
  if (decayingDomainNames.length === 0) {
    return '';
  }
  if (decayingDomainNames.length === 1) {
    return `${decayingDomainNames[0]} is decaying — check in today.`;
  }
  if (decayingDomainNames.length === 2) {
    return `${decayingDomainNames[0]} and ${decayingDomainNames[1]} are decaying — check in today.`;
  }
  const allButLast = decayingDomainNames.slice(0, -1).join(', ');
  const last = decayingDomainNames[decayingDomainNames.length - 1];
  return `${allButLast}, and ${last} are decaying — check in today.`;
}
