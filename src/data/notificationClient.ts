export type NotificationPermission = 'default' | 'granted' | 'denied';

export interface NotificationPermissionState {
  /** Whether the Notification API exists in this browser at all. */
  supported: boolean;
  permission: NotificationPermission;
}

export interface ShowNotificationOptions {
  body?: string;
  /** Notifications sharing a tag replace each other instead of stacking. */
  tag?: string;
}

/**
 * Structural interface shared by the production driver (a thin wrapper over
 * the browser's Notification API) and the in-memory fake used in tests —
 * same seam pattern as AuthClient/FirestoreClient.
 */
export interface NotificationClient {
  getPermissionState(): NotificationPermissionState;
  requestPermission(): Promise<NotificationPermissionState>;
  show(title: string, options?: ShowNotificationOptions): void;
}
