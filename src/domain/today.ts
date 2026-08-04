function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * `date` formatted as `YYYY-MM-DD` in **local** time, not UTC — a quest day
 * should follow the player's own calendar day, so someone playing late at
 * night doesn't get flipped to "tomorrow" just because UTC has already rolled over.
 */
export function getLocalDateString(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
