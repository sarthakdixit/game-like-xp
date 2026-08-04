/** Stable identifiers so scheduling is idempotent — check for these before adding another. */
export const DAILY_REMINDER_ID = 'daily-quest-reminder';
export const DECAY_NUDGE_ID = 'decay-nudge';

/** Local time the daily quest reminder fires at. */
export const DAILY_REMINDER_HOUR = 9;
export const DAILY_REMINDER_MINUTE = 0;

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

/** True if no notification with `DAILY_REMINDER_ID` is already scheduled. */
export function shouldScheduleDailyReminder(existingIds: string[]): boolean {
  return !existingIds.includes(DAILY_REMINDER_ID);
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
