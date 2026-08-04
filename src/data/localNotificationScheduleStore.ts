import type { NotificationKind, NotificationScheduleStore } from './notificationScheduleStore';

function storageKey(uid: string, kind: NotificationKind): string {
  return `chronicle:notif:${uid}:${kind}`;
}

let store: NotificationScheduleStore | null = null;

/** The real, `window.localStorage`-backed schedule store. Lazily built so tests never construct it. */
export function getNotificationScheduleStore(): NotificationScheduleStore {
  if (!store) {
    store = {
      getLastSentAt(uid, kind) {
        try {
          return window.localStorage.getItem(storageKey(uid, kind));
        } catch {
          return null;
        }
      },

      setLastSentAt(uid, kind, iso) {
        try {
          window.localStorage.setItem(storageKey(uid, kind), iso);
        } catch {
          // Best-effort only (e.g. localStorage disabled or full) — a missed dedup write risks
          // one extra notification on the next check, not a functional failure.
        }
      },
    };
  }
  return store;
}
