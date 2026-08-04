import type { HealthClient, HealthDailySummary, HealthPermissionStatus } from '../healthClient';

export interface FakeHealthClient extends HealthClient {
  /** Test hook: force the permission status without going through requestPermission. */
  setPermissionStatus(status: HealthPermissionStatus): void;
  /** Test hook: set/replace the fixture summary returned for a given date. */
  setDailySummary(date: string, summary: HealthDailySummary): void;
}

/**
 * An in-memory HealthClient double driven by fixture data — no native module
 * involved. `fixtures` maps a local calendar date (`YYYY-MM-DD`) to the daily
 * summary that date should return; missing dates read back as all-zero.
 */
export function createFakeHealthClient(
  fixtures: Record<string, HealthDailySummary> = {},
  initialPermission: HealthPermissionStatus = 'granted',
): FakeHealthClient {
  const summaries = new Map<string, HealthDailySummary>(Object.entries(fixtures));
  let permissionStatus: HealthPermissionStatus = initialPermission;

  return {
    setPermissionStatus(status) {
      permissionStatus = status;
    },
    setDailySummary(date, summary) {
      summaries.set(date, summary);
    },
    async isAvailable() {
      return true;
    },
    async getPermissionStatus() {
      return permissionStatus;
    },
    async requestPermission() {
      permissionStatus = 'granted';
      return permissionStatus;
    },
    async readDailySummary(date) {
      return summaries.get(date) ?? { steps: 0, sleepMinutes: 0, exerciseMinutes: 0 };
    },
  };
}
