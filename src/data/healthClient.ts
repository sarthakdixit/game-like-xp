/**
 * Health Connect has no three-state "undetermined vs. denied" concept like
 * expo-notifications — a permission is either currently granted or it isn't.
 */
export type HealthPermissionStatus = 'granted' | 'denied';

/** One local calendar day's aggregated health data. */
export interface HealthDailySummary {
  steps: number;
  sleepMinutes: number;
  exerciseMinutes: number;
}

/**
 * Structural interface shared by the production driver (a Health Connect
 * wrapper, Android-only) and the in-memory fixture-based fake used in tests —
 * same pattern as SqliteClient/NotificationClient.
 */
export interface HealthClient {
  /** Whether Health Connect is installed and usable on this device. */
  isAvailable(): Promise<boolean>;
  getPermissionStatus(): Promise<HealthPermissionStatus>;
  requestPermission(): Promise<HealthPermissionStatus>;
  /** `date` is a local calendar date, `YYYY-MM-DD`. */
  readDailySummary(date: string): Promise<HealthDailySummary>;
}
