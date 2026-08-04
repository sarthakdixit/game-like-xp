import { describe, expect, it } from 'vitest';

import { createFakeFirestoreClient } from '../testUtils/fakeFirestoreClient';

import { getActivityEntryByDate, saveActivityEntry } from './activityEntriesRepository';

const UID = 'user-1';

describe('activityEntriesRepository', () => {
  it('saves an entry and reads it back by date', async () => {
    const client = createFakeFirestoreClient();

    const saved = await saveActivityEntry(client, UID, {
      date: '2026-08-04',
      steps: 8000,
      sleepHours: 7.5,
      exerciseMinutes: 20,
      fitnessDelta: 18,
      sleepDelta: 15,
    });

    expect(saved).toMatchObject({
      id: '2026-08-04',
      date: '2026-08-04',
      steps: 8000,
      sleepHours: 7.5,
      exerciseMinutes: 20,
      fitnessDelta: 18,
      sleepDelta: 15,
    });
    expect(await getActivityEntryByDate(client, UID, '2026-08-04')).toEqual(saved);
  });

  it('returns null for a date with no entry', async () => {
    const client = createFakeFirestoreClient();

    expect(await getActivityEntryByDate(client, UID, '2026-08-04')).toBeNull();
  });

  it('overwrites the same day rather than creating a duplicate when saved again', async () => {
    const client = createFakeFirestoreClient();

    await saveActivityEntry(client, UID, {
      date: '2026-08-04',
      steps: 5000,
      sleepHours: 6,
      exerciseMinutes: 0,
      fitnessDelta: 5,
      sleepDelta: 5,
    });
    const corrected = await saveActivityEntry(client, UID, {
      date: '2026-08-04',
      steps: 9000,
      sleepHours: 7,
      exerciseMinutes: 30,
      fitnessDelta: 25,
      sleepDelta: 15,
    });

    expect(await getActivityEntryByDate(client, UID, '2026-08-04')).toEqual(corrected);
  });

  it('keeps separate entries for different dates', async () => {
    const client = createFakeFirestoreClient();

    await saveActivityEntry(client, UID, {
      date: '2026-08-03',
      steps: 1000,
      sleepHours: 6,
      exerciseMinutes: 0,
      fitnessDelta: 0,
      sleepDelta: 5,
    });
    await saveActivityEntry(client, UID, {
      date: '2026-08-04',
      steps: 9000,
      sleepHours: 7,
      exerciseMinutes: 30,
      fitnessDelta: 25,
      sleepDelta: 15,
    });

    expect((await getActivityEntryByDate(client, UID, '2026-08-03'))?.steps).toBe(1000);
    expect((await getActivityEntryByDate(client, UID, '2026-08-04'))?.steps).toBe(9000);
  });
});
