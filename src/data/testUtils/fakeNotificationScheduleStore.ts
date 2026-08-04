import type { NotificationScheduleStore } from '../notificationScheduleStore';

/** An in-memory NotificationScheduleStore double — no real `localStorage` involved. */
export function createFakeNotificationScheduleStore(): NotificationScheduleStore {
  const store = new Map<string, string>();

  return {
    getLastSentAt(uid, kind) {
      return store.get(`${uid}:${kind}`) ?? null;
    },

    setLastSentAt(uid, kind, iso) {
      store.set(`${uid}:${kind}`, iso);
    },
  };
}
