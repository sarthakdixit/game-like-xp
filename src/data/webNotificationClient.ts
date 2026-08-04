import type {
  NotificationClient,
  NotificationPermissionState,
  ShowNotificationOptions,
} from './notificationClient';

function isSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

let client: NotificationClient | null = null;

/** The real, browser-native Notification API wrapper. Lazily built so tests never construct it. */
export function getNotificationClient(): NotificationClient {
  if (!client) {
    client = {
      getPermissionState(): NotificationPermissionState {
        if (!isSupported()) {
          return { supported: false, permission: 'denied' };
        }
        return { supported: true, permission: Notification.permission };
      },

      async requestPermission(): Promise<NotificationPermissionState> {
        if (!isSupported()) {
          return { supported: false, permission: 'denied' };
        }
        const permission = await Notification.requestPermission();
        return { supported: true, permission };
      },

      show(title: string, options?: ShowNotificationOptions): void {
        if (!isSupported() || Notification.permission !== 'granted') {
          return;
        }
        new Notification(title, options);
      },
    };
  }
  return client;
}
