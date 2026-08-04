export type NotificationKind = 'questReminder' | 'decayNudge';

/**
 * Tracks the last time each notification kind actually fired, per user, so a
 * tab reload doesn't re-send one already shown today. Deliberately device-
 * local (not synced through Firestore) — which notifications have already
 * fired on this particular device/tab has no bearing on any other device.
 */
export interface NotificationScheduleStore {
  getLastSentAt(uid: string, kind: NotificationKind): string | null;
  setLastSentAt(uid: string, kind: NotificationKind, iso: string): void;
}
