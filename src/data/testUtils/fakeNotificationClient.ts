import type {
  NotificationClient,
  NotificationPermission,
  ShowNotificationOptions,
} from '../notificationClient';

export interface ShownNotification {
  title: string;
  options?: ShowNotificationOptions;
}

export interface FakeNotificationClient extends NotificationClient {
  /** Every notification `show()` has actually displayed (permission granted), in order. */
  shown: ShownNotification[];
  /** Test hook: change the permission state directly, without going through requestPermission. */
  setPermission(permission: NotificationPermission): void;
}

/** An in-memory NotificationClient double — no real browser Notification API involved. */
export function createFakeNotificationClient(
  initialPermission: NotificationPermission = 'default',
): FakeNotificationClient {
  let permission = initialPermission;
  const shown: ShownNotification[] = [];

  return {
    shown,

    getPermissionState() {
      return { supported: true, permission };
    },

    setPermission(next) {
      permission = next;
    },

    async requestPermission() {
      permission = 'granted';
      return { supported: true, permission };
    },

    show(title, options) {
      if (permission !== 'granted') {
        return;
      }
      shown.push({ title, options });
    },
  };
}
