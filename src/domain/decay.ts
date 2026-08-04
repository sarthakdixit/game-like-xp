const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Days a child stat can go untouched before decay starts. */
const GRACE_DAYS = 1;

/** Points lost per day inactive beyond the grace period. */
const DECAY_PER_DAY = 4;

export const CHILD_STAT_MIN_VALUE = 0;
export const CHILD_STAT_MAX_VALUE = 100;

/**
 * Whole days between two ISO timestamps. Clamped to 0 for a non-positive gap
 * (clock skew, or `to` earlier than `from`) rather than returning a negative number.
 */
export function daysBetween(fromIso: string, toIso: string): number {
  const diffMs = new Date(toIso).getTime() - new Date(fromIso).getTime();
  if (diffMs <= 0) {
    return 0;
  }
  return Math.floor(diffMs / MS_PER_DAY);
}

/** Points a child stat should lose given `daysInactive`. Zero during the grace period. */
export function calculateDecay(daysInactive: number): number {
  if (daysInactive <= GRACE_DAYS) {
    return 0;
  }
  return (daysInactive - GRACE_DAYS) * DECAY_PER_DAY;
}

/**
 * Applies neglect decay to a child stat's current value. Clamped at 0 — no
 * protective floor above zero, per requirements.md: a long-enough gap (e.g.
 * reinstalling after months away) decays all the way out rather than
 * stopping short.
 */
export function applyDecay(currentValue: number, daysInactive: number): number {
  const decayAmount = calculateDecay(daysInactive);
  return Math.max(CHILD_STAT_MIN_VALUE, currentValue - decayAmount);
}

/** Convenience wrapper: applies decay to `currentValue` given `lastActiveAt` and the current time. */
export function applyDecaySince(currentValue: number, lastActiveAt: string, now: string): number {
  return applyDecay(currentValue, daysBetween(lastActiveAt, now));
}
