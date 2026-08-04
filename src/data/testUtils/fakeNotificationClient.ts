import type {
  NotificationClient,
  NotificationContent,
  PermissionStatus,
} from '../notificationClient';

export interface FakeNotificationClient extends NotificationClient {
  /** Currently "scheduled" notifications, keyed by id — inspect directly in tests. */
  scheduled: Map<string, NotificationContent>;
  /** Test hook: force the permission status without going through requestPermission. */
  setPermissionStatus(status: PermissionStatus): void;
}

/** An in-memory NotificationClient double — no native module involved. */
export function createFakeNotificationClient(
  initialPermission: PermissionStatus = 'undetermined',
): FakeNotificationClient {
  const scheduled = new Map<string, NotificationContent>();
  let permissionStatus: PermissionStatus = initialPermission;

  return {
    scheduled,
    setPermissionStatus(status) {
      permissionStatus = status;
    },
    async getPermissionStatus() {
      return permissionStatus;
    },
    async requestPermission() {
      permissionStatus = 'granted';
      return permissionStatus;
    },
    async listScheduledIds() {
      return Array.from(scheduled.keys());
    },
    async schedule(content) {
      scheduled.set(content.id, content);
    },
    async cancel(id) {
      scheduled.delete(id);
    },
  };
}
