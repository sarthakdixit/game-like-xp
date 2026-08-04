import { beforeEach, describe, expect, it } from 'vitest';

import { createFakeFirestoreClient } from '../testUtils/fakeFirestoreClient';
import type { FirestoreClient } from '../firestoreClient';
import {
  completeDailyQuest,
  createDailyQuest,
  getDailyQuestById,
  listDailyQuestsByDate,
} from './dailyQuestsRepository';

const UID = 'user-1';

describe('dailyQuestsRepository', () => {
  let client: FirestoreClient;

  beforeEach(() => {
    client = createFakeFirestoreClient();
  });

  it('creates a daily quest with completedAt null', async () => {
    const dailyQuest = await createDailyQuest(client, UID, {
      questId: 'quest-1',
      domainId: 'health',
      date: '2026-08-04',
    });

    expect(dailyQuest).toMatchObject({
      questId: 'quest-1',
      domainId: 'health',
      date: '2026-08-04',
      completedAt: null,
    });
  });

  it('reads a daily quest back by id', async () => {
    const created = await createDailyQuest(client, UID, {
      questId: 'quest-1',
      domainId: 'health',
      date: '2026-08-04',
    });

    expect(await getDailyQuestById(client, UID, created.id)).toEqual(created);
  });

  it('returns null for a missing id', async () => {
    expect(await getDailyQuestById(client, UID, 'missing')).toBeNull();
  });

  it('lists daily quests for a given date only', async () => {
    await createDailyQuest(client, UID, { questId: 'q1', domainId: 'health', date: '2026-08-04' });
    await createDailyQuest(client, UID, { questId: 'q2', domainId: 'career', date: '2026-08-04' });
    await createDailyQuest(client, UID, { questId: 'q3', domainId: 'health', date: '2026-08-03' });

    const results = await listDailyQuestsByDate(client, UID, '2026-08-04');

    expect(results.map((d) => d.questId).sort()).toEqual(['q1', 'q2']);
  });

  it('scopes daily quests to the requesting user only', async () => {
    await createDailyQuest(client, UID, { questId: 'q1', domainId: 'health', date: '2026-08-04' });
    await createDailyQuest(client, 'other-user', {
      questId: 'q2',
      domainId: 'health',
      date: '2026-08-04',
    });

    const results = await listDailyQuestsByDate(client, UID, '2026-08-04');

    expect(results).toHaveLength(1);
  });

  it('uses a caller-supplied stable id instead of generating one, when given', async () => {
    const dailyQuest = await createDailyQuest(client, UID, {
      id: '2026-08-04_health',
      questId: 'q1',
      domainId: 'health',
      date: '2026-08-04',
    });

    expect(dailyQuest.id).toBe('2026-08-04_health');
  });

  it('overwrites the same doc instead of duplicating when re-created with the same stable id', async () => {
    await createDailyQuest(client, UID, {
      id: '2026-08-04_health',
      questId: 'q1',
      domainId: 'health',
      date: '2026-08-04',
    });
    await createDailyQuest(client, UID, {
      id: '2026-08-04_health',
      questId: 'q1',
      domainId: 'health',
      date: '2026-08-04',
    });

    expect(await listDailyQuestsByDate(client, UID, '2026-08-04')).toHaveLength(1);
  });

  it('marks a daily quest completed', async () => {
    const created = await createDailyQuest(client, UID, {
      questId: 'q1',
      domainId: 'health',
      date: '2026-08-04',
    });

    await completeDailyQuest(client, UID, created.id, '2026-08-04T09:00:00.000Z');

    expect(await getDailyQuestById(client, UID, created.id)).toMatchObject({
      completedAt: '2026-08-04T09:00:00.000Z',
    });
  });
});
