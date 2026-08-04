import { beforeEach, describe, expect, it } from 'vitest';

import {
  getChildStatByDomainAndKey,
  updateChildStatValue,
} from '@/data/repositories/childStatsRepository';
import { getDomainByKey } from '@/data/repositories/domainsRepository';
import { seedDomains } from '@/data/seed';
import { createFakeFirestoreClient } from '@/data/testUtils/fakeFirestoreClient';
import type { FirestoreClient } from '@/data/firestoreClient';

import { submitActivityEntry } from './activityEntryService';

const UID = 'user-1';
const DATE = '2026-08-04';
const NOW = new Date('2026-08-04T09:00:00.000Z');

describe('submitActivityEntry', () => {
  let client: FirestoreClient;

  beforeEach(async () => {
    client = createFakeFirestoreClient();
    await seedDomains(client, UID);
  });

  it('applies the full mapped delta to Fitness and Sleep on a first submit', async () => {
    const result = await submitActivityEntry(
      client,
      UID,
      DATE,
      { steps: 10_000, sleepHours: 8, exerciseMinutes: 30 },
      NOW,
    );

    // 10,000 steps (+15) + 30 exercise minutes (+15) = +30 Fitness; 8h sleep (+15) Sleep.
    expect(result.fitnessValue).toBe(30);
    expect(result.sleepValue).toBe(15);
  });

  it('persists the entry with the mapped deltas', async () => {
    const result = await submitActivityEntry(
      client,
      UID,
      DATE,
      { steps: 3_000, sleepHours: 6, exerciseMinutes: 0 },
      NOW,
    );

    expect(result.entry).toMatchObject({
      id: DATE,
      steps: 3_000,
      sleepHours: 6,
      exerciseMinutes: 0,
      fitnessDelta: 5,
      sleepDelta: 5,
    });
  });

  it('resets the child stats’ lastActiveAt to now', async () => {
    await submitActivityEntry(
      client,
      UID,
      DATE,
      { steps: 10_000, sleepHours: 8, exerciseMinutes: 30 },
      NOW,
    );

    const health = await getDomainByKey(client, UID, 'health');
    const fitness = await getChildStatByDomainAndKey(client, UID, health!.id, 'fitness');
    expect(fitness!.lastActiveAt).toBe(NOW.toISOString());
  });

  it('applies only the net change in delta when the same day is corrected, not the full new delta again', async () => {
    await submitActivityEntry(
      client,
      UID,
      DATE,
      { steps: 3_000, sleepHours: 6, exerciseMinutes: 0 }, // fitness +5, sleep +5
      NOW,
    );

    const corrected = await submitActivityEntry(
      client,
      UID,
      DATE,
      { steps: 10_000, sleepHours: 8, exerciseMinutes: 0 }, // fitness +15, sleep +15
      NOW,
    );

    // Net change: fitness +10 (15-5), sleep +10 (15-5) — starting from 0, not from the first
    // submit's own +5/+5 stacked on top of the second's full +15/+15.
    expect(corrected.fitnessValue).toBe(15);
    expect(corrected.sleepValue).toBe(15);
  });

  it('applies a negative net delta when a corrected day logs less activity than before', async () => {
    await submitActivityEntry(
      client,
      UID,
      DATE,
      { steps: 10_000, sleepHours: 8, exerciseMinutes: 0 }, // fitness +15
      NOW,
    );

    const corrected = await submitActivityEntry(
      client,
      UID,
      DATE,
      { steps: 3_000, sleepHours: 8, exerciseMinutes: 0 }, // fitness +5 — net -10 from the first
      NOW,
    );

    expect(corrected.fitnessValue).toBe(5);
  });

  it('leaves other days’ already-applied deltas alone', async () => {
    await submitActivityEntry(
      client,
      UID,
      '2026-08-03',
      { steps: 10_000, sleepHours: 8, exerciseMinutes: 0 },
      new Date('2026-08-03T09:00:00.000Z'),
    );

    const today = await submitActivityEntry(
      client,
      UID,
      DATE,
      { steps: 3_000, sleepHours: 6, exerciseMinutes: 0 },
      NOW,
    );

    // Yesterday's +15 plus today's +5, not a reset or a double-count of yesterday's.
    expect(today.fitnessValue).toBe(20);
  });

  it('catches a decayed stat up to its current display value before adding the delta', async () => {
    const health = await getDomainByKey(client, UID, 'health');
    const fitness = await getChildStatByDomainAndKey(client, UID, health!.id, 'fitness');
    await updateChildStatValue(client, UID, health!.id, fitness!.id, {
      value: 50,
      lastActiveAt: '2020-01-01T00:00:00.000Z', // long enough ago to fully decay to 0
    });

    const result = await submitActivityEntry(
      client,
      UID,
      DATE,
      { steps: 3_000, sleepHours: 0, exerciseMinutes: 0 }, // fitness +5
      NOW,
    );

    // Decayed to 0 first, then +5 — not 50 (the stale stored value) + 5.
    expect(result.fitnessValue).toBe(5);
  });

  it('throws when the Health domain does not exist', async () => {
    const emptyClient = createFakeFirestoreClient();

    await expect(
      submitActivityEntry(
        emptyClient,
        UID,
        DATE,
        { steps: 1000, sleepHours: 7, exerciseMinutes: 10 },
        NOW,
      ),
    ).rejects.toThrow();
  });
});
