import {
  getChildStatByDomainAndKey,
  updateChildStatValue,
} from '@/data/repositories/childStatsRepository';
import { getDomainByKey } from '@/data/repositories/domainsRepository';
import { getHealthImport } from '@/data/repositories/healthImportsRepository';
import { seedDomains } from '@/data/seed';
import { createFakeHealthClient } from '@/data/testUtils/fakeHealthClient';
import { createMigratedTestDb } from '@/data/testUtils/nodeSqliteClient';
import type { SqliteClient } from '@/data/sqliteClient';

import {
  ensureHealthPermission,
  getHealthSyncStatus,
  importHealthDataForDate,
} from './healthImportService';

const DATE = '2026-08-04';

async function setupSeededDb(): Promise<SqliteClient> {
  const db = await createMigratedTestDb();
  await seedDomains(db);
  return db;
}

async function fitnessAndSleepValues(db: SqliteClient) {
  const health = await getDomainByKey(db, 'health');
  const fitness = await getChildStatByDomainAndKey(db, health!.id, 'fitness');
  const sleep = await getChildStatByDomainAndKey(db, health!.id, 'sleep');
  return { fitness: fitness!, sleep: sleep! };
}

describe('ensureHealthPermission', () => {
  it('returns granted without re-requesting when already granted', async () => {
    const client = createFakeHealthClient({}, 'granted');
    const requestSpy = jest.spyOn(client, 'requestPermission');

    expect(await ensureHealthPermission(client)).toBe('granted');
    expect(requestSpy).not.toHaveBeenCalled();
  });

  it('requests permission when not yet granted', async () => {
    const client = createFakeHealthClient({}, 'denied');

    expect(await ensureHealthPermission(client)).toBe('granted');
  });
});

describe('importHealthDataForDate', () => {
  it('does nothing when permission is denied and the user declines the request', async () => {
    const db = await setupSeededDb();
    const client = createFakeHealthClient(
      { [DATE]: { steps: 9000, sleepMinutes: 480, exerciseMinutes: 30 } },
      'denied',
    );
    client.requestPermission = async () => 'denied';

    await importHealthDataForDate(db, client, DATE);

    const { fitness, sleep } = await fitnessAndSleepValues(db);
    expect(fitness.value).toBe(0);
    expect(sleep.value).toBe(0);
  });

  it('applies mapped fitness and sleep deltas to the Health domain child stats', async () => {
    const db = await setupSeededDb();
    const client = createFakeHealthClient({
      [DATE]: { steps: 9200, sleepMinutes: 450, exerciseMinutes: 45 },
    });

    await importHealthDataForDate(db, client, DATE);

    const { fitness, sleep } = await fitnessAndSleepValues(db);
    expect(fitness.value).toBe(14); // 10 (9200 steps tier) + 4 (45 min / 10)
    expect(sleep.value).toBe(12); // ideal 7.5h sleep
  });

  it('clamps the applied value at the 100 max', async () => {
    const db = await setupSeededDb();
    const { fitness: before } = await fitnessAndSleepValues(db);
    await updateChildStatValue(db, before.id, { value: 95, lastActiveAt: before.lastActiveAt });
    const client = createFakeHealthClient({
      [DATE]: { steps: 40000, sleepMinutes: 480, exerciseMinutes: 200 }, // fitness delta 24
    });

    await importHealthDataForDate(db, client, DATE);

    const { fitness } = await fitnessAndSleepValues(db);
    expect(fitness.value).toBe(100);
  });

  it('is idempotent: calling twice for the same date does not double-apply the delta', async () => {
    const db = await setupSeededDb();
    const client = createFakeHealthClient({
      [DATE]: { steps: 9200, sleepMinutes: 450, exerciseMinutes: 45 },
    });

    await importHealthDataForDate(db, client, DATE);
    await importHealthDataForDate(db, client, DATE);

    const { fitness, sleep } = await fitnessAndSleepValues(db);
    expect(fitness.value).toBe(14);
    expect(sleep.value).toBe(12);
  });

  it('records a health_imports row per child stat and date', async () => {
    const db = await setupSeededDb();
    const client = createFakeHealthClient({
      [DATE]: { steps: 9200, sleepMinutes: 450, exerciseMinutes: 45 },
    });

    await importHealthDataForDate(db, client, DATE);

    const { fitness, sleep } = await fitnessAndSleepValues(db);
    expect(await getHealthImport(db, fitness.id, DATE)).toMatchObject({ appliedDelta: 14 });
    expect(await getHealthImport(db, sleep.id, DATE)).toMatchObject({ appliedDelta: 12 });
  });

  it('does not touch child stats or record an import when the mapped delta is zero', async () => {
    const db = await setupSeededDb();
    const client = createFakeHealthClient({
      [DATE]: { steps: 0, sleepMinutes: 0, exerciseMinutes: 0 },
    });

    await importHealthDataForDate(db, client, DATE);

    const { fitness, sleep } = await fitnessAndSleepValues(db);
    expect(fitness.value).toBe(0);
    expect(sleep.value).toBe(0);
    expect(await getHealthImport(db, fitness.id, DATE)).toBeNull();
    expect(await getHealthImport(db, sleep.id, DATE)).toBeNull();
  });

  it('allows a later day to apply its own delta on top of an earlier imported day', async () => {
    const db = await setupSeededDb();
    const day1Client = createFakeHealthClient({
      '2026-08-03': { steps: 3000, sleepMinutes: 420, exerciseMinutes: 0 },
    });
    const day2Client = createFakeHealthClient({
      [DATE]: { steps: 3000, sleepMinutes: 420, exerciseMinutes: 0 },
    });

    await importHealthDataForDate(db, day1Client, '2026-08-03');
    await importHealthDataForDate(db, day2Client, DATE);

    const { fitness, sleep } = await fitnessAndSleepValues(db);
    expect(fitness.value).toBe(6); // 3 + 3
    expect(sleep.value).toBe(24); // 12 + 12
  });
});

describe('getHealthSyncStatus', () => {
  it('reports never synced when no import has ever run', async () => {
    const db = await setupSeededDb();
    const client = createFakeHealthClient({}, 'denied');

    const status = await getHealthSyncStatus(db, client);

    expect(status).toEqual({
      isAvailable: true,
      permissionStatus: 'denied',
      lastSyncedAt: null,
      lastSyncFitnessDelta: 0,
      lastSyncSleepDelta: 0,
    });
  });

  it('reports the last sync time and deltas after a successful import', async () => {
    const db = await setupSeededDb();
    const client = createFakeHealthClient({
      [DATE]: { steps: 9200, sleepMinutes: 450, exerciseMinutes: 45 },
    });
    await importHealthDataForDate(db, client, DATE);

    const status = await getHealthSyncStatus(db, client);

    expect(status.isAvailable).toBe(true);
    expect(status.permissionStatus).toBe('granted');
    expect(status.lastSyncedAt).not.toBeNull();
    expect(status.lastSyncFitnessDelta).toBe(14);
    expect(status.lastSyncSleepDelta).toBe(12);
  });

  it('reports a zero delta for a stat with no import on the latest synced date', async () => {
    const db = await setupSeededDb();
    // only steps produced a delta; sleep/exercise were zero, so no sleep import row exists
    const client = createFakeHealthClient({
      [DATE]: { steps: 9200, sleepMinutes: 0, exerciseMinutes: 0 },
    });
    await importHealthDataForDate(db, client, DATE);

    const status = await getHealthSyncStatus(db, client);

    expect(status.lastSyncFitnessDelta).toBe(10);
    expect(status.lastSyncSleepDelta).toBe(0);
  });

  it('reflects the most recent sync date, not an earlier one', async () => {
    const db = await setupSeededDb();
    const day1Client = createFakeHealthClient({
      '2026-08-03': { steps: 3000, sleepMinutes: 420, exerciseMinutes: 0 },
    });
    const day2Client = createFakeHealthClient({
      [DATE]: { steps: 9200, sleepMinutes: 450, exerciseMinutes: 45 },
    });
    await importHealthDataForDate(db, day1Client, '2026-08-03');
    await importHealthDataForDate(db, day2Client, DATE);

    const status = await getHealthSyncStatus(db, day2Client);

    expect(status.lastSyncFitnessDelta).toBe(14);
    expect(status.lastSyncSleepDelta).toBe(12);
  });
});
