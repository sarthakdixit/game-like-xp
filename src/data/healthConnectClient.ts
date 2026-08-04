import {
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  readRecords,
  requestPermission as requestHealthConnectPermission,
  SdkAvailabilityStatus,
  type Permission,
} from 'react-native-health-connect';

import type { HealthClient, HealthDailySummary, HealthPermissionStatus } from './healthClient';

const READ_PERMISSIONS: readonly Permission[] = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'SleepSession' },
  { accessType: 'read', recordType: 'ExerciseSession' },
];

let sdkReady = false;

async function ensureInitialized(): Promise<boolean> {
  if (sdkReady) {
    return true;
  }
  const status = await getSdkStatus();
  if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) {
    return false;
  }
  sdkReady = await initialize();
  return sdkReady;
}

function hasAllReadPermissions(
  granted: readonly { accessType: string; recordType: string }[],
): boolean {
  return READ_PERMISSIONS.every((required) =>
    granted.some(
      (g) => g.accessType === required.accessType && g.recordType === required.recordType,
    ),
  );
}

function localDayRange(date: string): { startTime: string; endTime: string } {
  const start = new Date(`${date}T00:00:00`);
  const end = new Date(`${date}T23:59:59.999`);
  return { startTime: start.toISOString(), endTime: end.toISOString() };
}

function sumIntervalMinutes(records: readonly { startTime: string; endTime: string }[]): number {
  return records.reduce((total, record) => {
    const minutes =
      (new Date(record.endTime).getTime() - new Date(record.startTime).getTime()) / 60000;
    return total + minutes;
  }, 0);
}

let client: HealthClient | null = null;

/** The real, on-device Health Connect client (Android only). Lazily built so tests never construct it. */
export function getHealthClient(): HealthClient {
  if (!client) {
    client = {
      async isAvailable(): Promise<boolean> {
        return ensureInitialized();
      },

      async getPermissionStatus(): Promise<HealthPermissionStatus> {
        const available = await ensureInitialized();
        if (!available) {
          return 'denied';
        }
        const granted = await getGrantedPermissions();
        return hasAllReadPermissions(granted) ? 'granted' : 'denied';
      },

      async requestPermission(): Promise<HealthPermissionStatus> {
        const available = await ensureInitialized();
        if (!available) {
          return 'denied';
        }
        const granted = await requestHealthConnectPermission([...READ_PERMISSIONS]);
        return hasAllReadPermissions(granted) ? 'granted' : 'denied';
      },

      async readDailySummary(date: string): Promise<HealthDailySummary> {
        const timeRangeFilter = { operator: 'between' as const, ...localDayRange(date) };

        const [stepsResult, sleepResult, exerciseResult] = await Promise.all([
          readRecords('Steps', { timeRangeFilter }),
          readRecords('SleepSession', { timeRangeFilter }),
          readRecords('ExerciseSession', { timeRangeFilter }),
        ]);

        const steps = stepsResult.records.reduce((total, record) => total + record.count, 0);
        const sleepMinutes = sumIntervalMinutes(sleepResult.records);
        const exerciseMinutes = sumIntervalMinutes(exerciseResult.records);

        return { steps, sleepMinutes, exerciseMinutes };
      },
    };
  }
  return client;
}
