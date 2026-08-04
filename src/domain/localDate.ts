/** Today's date as `YYYY-MM-DD` in the caller's local time zone (not UTC), for day-scoped queries like daily quest generation. */
export function todayLocalDate(reference: Date = new Date()): string {
  const year = reference.getFullYear();
  const month = String(reference.getMonth() + 1).padStart(2, '0');
  const day = String(reference.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
