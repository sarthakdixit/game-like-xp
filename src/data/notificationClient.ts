export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface DailySchedule {
  type: 'daily';
  hour: number;
  minute: number;
}

export interface DateSchedule {
  type: 'date';
  date: Date;
}

export type NotificationSchedule = DailySchedule | DateSchedule;

export interface NotificationContent {
  id: string;
  title: string;
  body: string;
  schedule: NotificationSchedule;
}

/**
 * Structural interface shared by the production driver (an expo-notifications
 * wrapper) and the in-memory fake used in tests — same pattern as SqliteClient.
 */
export interface NotificationClient {
  getPermissionStatus(): Promise<PermissionStatus>;
  requestPermission(): Promise<PermissionStatus>;
  listScheduledIds(): Promise<string[]>;
  schedule(content: NotificationContent): Promise<void>;
  cancel(id: string): Promise<void>;
}
