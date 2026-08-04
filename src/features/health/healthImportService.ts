import type { HealthClient, HealthPermissionStatus } from '@/data/healthClient';
import {
  getChildStatByDomainAndKey,
  updateChildStatValue,
} from '@/data/repositories/childStatsRepository';
import { getDomainByKey } from '@/data/repositories/domainsRepository';
import {
  createHealthImport,
  getHealthImport,
  getLatestHealthImport,
} from '@/data/repositories/healthImportsRepository';
import type { SqliteClient } from '@/data/sqliteClient';
import { CHILD_STAT_MAX_VALUE, CHILD_STAT_MIN_VALUE, mapHealthSampleToStatDeltas } from '@/domain';

const HEALTH_DOMAIN_KEY = 'health';
const FITNESS_CHILD_STAT_KEY = 'fitness';
const SLEEP_CHILD_STAT_KEY = 'sleep';

export interface HealthSyncStatus {
  isAvailable: boolean;
  permissionStatus: HealthPermissionStatus;
  /** ISO timestamp of the most recent import, across either child stat. Null if never synced. */
  lastSyncedAt: string | null;
  /** Fitness/sleep deltas applied on `lastSyncedAt`'s date. Zero if that stat had no delta that day. */
  lastSyncFitnessDelta: number;
  lastSyncSleepDelta: number;
}

/**
 * Requests Health Connect permission, but only if it isn't already granted.
 * Unlike notification permissions, Health Connect has no OS-enforced
 * "don't ask again" lock — re-requesting when not-yet-granted is the
 * platform-recommended flow, not a re-prompt-after-denial anti-pattern.
 */
export async function ensureHealthPermission(
  client: HealthClient,
): Promise<HealthPermissionStatus> {
  const current = await client.getPermissionStatus();
  if (current === 'granted') {
    return current;
  }
  return client.requestPermission();
}

async function applyDeltaIfNotAlreadyImported(
  db: SqliteClient,
  childStatId: string,
  currentValue: number,
  date: string,
  delta: number,
  now: string,
): Promise<void> {
  if (delta === 0) {
    return;
  }
  const alreadyImported = await getHealthImport(db, childStatId, date);
  if (alreadyImported) {
    return;
  }

  const newValue = Math.min(
    CHILD_STAT_MAX_VALUE,
    Math.max(CHILD_STAT_MIN_VALUE, currentValue + delta),
  );
  await updateChildStatValue(db, childStatId, { value: newValue, lastActiveAt: now });
  await createHealthImport(db, { childStatId, date, appliedDelta: delta });
}

/**
 * Imports one local calendar day's health data (steps, sleep, exercise) into
 * the Health domain's Fitness and Sleep child stats. Idempotent per
 * (child stat, date) via the health_imports ledger, so it's safe to call on
 * every app open without double-applying the same day's deltas — the
 * mapping happens in `mapHealthSampleToStatDeltas`, this just wires
 * permission, read, and write together.
 */
export async function importHealthDataForDate(
  db: SqliteClient,
  healthClient: HealthClient,
  date: string,
): Promise<void> {
  const permission = await ensureHealthPermission(healthClient);
  if (permission !== 'granted') {
    return;
  }

  const healthDomain = await getDomainByKey(db, HEALTH_DOMAIN_KEY);
  if (!healthDomain) {
    return;
  }

  const [fitnessStat, sleepStat] = await Promise.all([
    getChildStatByDomainAndKey(db, healthDomain.id, FITNESS_CHILD_STAT_KEY),
    getChildStatByDomainAndKey(db, healthDomain.id, SLEEP_CHILD_STAT_KEY),
  ]);

  const sample = await healthClient.readDailySummary(date);
  const { fitnessDelta, sleepDelta } = mapHealthSampleToStatDeltas(sample);
  const now = new Date().toISOString();

  if (fitnessStat) {
    await applyDeltaIfNotAlreadyImported(
      db,
      fitnessStat.id,
      fitnessStat.value,
      date,
      fitnessDelta,
      now,
    );
  }
  if (sleepStat) {
    await applyDeltaIfNotAlreadyImported(db, sleepStat.id, sleepStat.value, date, sleepDelta, now);
  }
}

/**
 * Aggregates current Health Connect availability/permission state together
 * with the most recent import, for display on the Health screen. Read-only —
 * never requests permission or imports anything itself.
 */
export async function getHealthSyncStatus(
  db: SqliteClient,
  healthClient: HealthClient,
): Promise<HealthSyncStatus> {
  const [isAvailable, permissionStatus, latest] = await Promise.all([
    healthClient.isAvailable(),
    healthClient.getPermissionStatus(),
    getLatestHealthImport(db),
  ]);

  if (!latest) {
    return {
      isAvailable,
      permissionStatus,
      lastSyncedAt: null,
      lastSyncFitnessDelta: 0,
      lastSyncSleepDelta: 0,
    };
  }

  const healthDomain = await getDomainByKey(db, HEALTH_DOMAIN_KEY);
  const [fitnessStat, sleepStat] = healthDomain
    ? await Promise.all([
        getChildStatByDomainAndKey(db, healthDomain.id, FITNESS_CHILD_STAT_KEY),
        getChildStatByDomainAndKey(db, healthDomain.id, SLEEP_CHILD_STAT_KEY),
      ])
    : [null, null];

  const [fitnessImport, sleepImport] = await Promise.all([
    fitnessStat ? getHealthImport(db, fitnessStat.id, latest.date) : null,
    sleepStat ? getHealthImport(db, sleepStat.id, latest.date) : null,
  ]);

  return {
    isAvailable,
    permissionStatus,
    lastSyncedAt: latest.createdAt,
    lastSyncFitnessDelta: fitnessImport?.appliedDelta ?? 0,
    lastSyncSleepDelta: sleepImport?.appliedDelta ?? 0,
  };
}
