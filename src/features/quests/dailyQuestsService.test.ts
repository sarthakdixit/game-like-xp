import { beforeEach, describe, expect, it } from 'vitest';

import { getDomainByKey } from '@/data/repositories/domainsRepository';
import { listXpEventsByDomain } from '@/data/repositories/xpEventsRepository';
import { listDailyQuestsByDate } from '@/data/repositories/dailyQuestsRepository';
import { getQuestById } from '@/data/repositories/questsRepository';
import { seedDomains } from '@/data/seed';
import { createFakeFirestoreClient } from '@/data/testUtils/fakeFirestoreClient';
import type { FirestoreClient } from '@/data/firestoreClient';

import { completeDailyQuestAndAwardXp, generateDailyQuests } from './dailyQuestsService';

const UID = 'user-1';
const DATE = '2026-08-04';
const DOMAIN_KEYS = ['health', 'career', 'relationships', 'finance', 'growth'];

async function setupSeededDomains(): Promise<FirestoreClient> {
  const client = createFakeFirestoreClient();
  await seedDomains(client, UID);
  return client;
}

/** Cycles through `values` repeatedly — generateDailyQuests's selection calls random() three times per domain. */
function fixedRandom(...values: number[]): () => number {
  let call = 0;
  return () => {
    const value = values[call % values.length];
    call += 1;
    return value;
  };
}

describe('generateDailyQuests', () => {
  it('creates exactly one daily quest per domain — no domain skipped', async () => {
    const client = await setupSeededDomains();

    const quests = await generateDailyQuests(client, UID, DATE);

    expect(quests).toHaveLength(5);
    expect(quests.map((q) => q.domainId).sort()).toEqual([...DOMAIN_KEYS].sort());
  });

  it('seeds the quest template bank itself if it has not been seeded yet', async () => {
    const client = await setupSeededDomains();

    const quests = await generateDailyQuests(client, UID, DATE);

    for (const quest of quests) {
      expect(await getQuestById(client, UID, quest.questId)).not.toBeNull();
    }
  });

  it('is idempotent for the same date — a second call returns the same set, not a duplicate one', async () => {
    const client = await setupSeededDomains();

    const first = await generateDailyQuests(client, UID, DATE);
    const second = await generateDailyQuests(client, UID, DATE);

    expect(second.map((q) => q.id).sort()).toEqual(first.map((q) => q.id).sort());
    expect(await listDailyQuestsByDate(client, UID, DATE)).toHaveLength(5);
  });

  it('is idempotent even when two generation calls race concurrently for the same date', async () => {
    // regression coverage for the same class of bug fixed in domainsRepository:
    // two concurrent calls both see "no daily quests yet" and could otherwise
    // each create a full duplicate set.
    const client = await setupSeededDomains();

    await Promise.all([
      generateDailyQuests(client, UID, DATE),
      generateDailyQuests(client, UID, DATE),
    ]);

    expect(await listDailyQuestsByDate(client, UID, DATE)).toHaveLength(5);
  });

  it('generates a fresh set of quests for a different date', async () => {
    const client = await setupSeededDomains();

    await generateDailyQuests(client, UID, '2026-08-03');
    await generateDailyQuests(client, UID, DATE);

    expect(await listDailyQuestsByDate(client, UID, '2026-08-03')).toHaveLength(5);
    expect(await listDailyQuestsByDate(client, UID, DATE)).toHaveLength(5);
  });

  it('picks a boss quest for a domain when the injected random rolls under bossChance', async () => {
    const client = await setupSeededDomains();

    const quests = await generateDailyQuests(client, UID, DATE, { random: fixedRandom(0, 0.9, 0) });

    for (const dailyQuest of quests) {
      const quest = await getQuestById(client, UID, dailyQuest.questId);
      expect(quest!.isBoss).toBe(true);
    }
  });

  it('picks a normal quest for every domain when the injected random always misses bossChance', async () => {
    const client = await setupSeededDomains();

    const quests = await generateDailyQuests(client, UID, DATE, {
      random: fixedRandom(0.99, 0.99, 0),
    });

    for (const dailyQuest of quests) {
      const quest = await getQuestById(client, UID, dailyQuest.questId);
      expect(quest!.isBoss).toBe(false);
    }
  });
});

describe('completeDailyQuestAndAwardXp', () => {
  let client: FirestoreClient;

  beforeEach(async () => {
    client = await setupSeededDomains();
  });

  it('awards the quest xp to the correct domain through the leveling engine', async () => {
    const [dailyQuest] = await generateDailyQuests(client, UID, DATE, {
      random: fixedRandom(0.99, 0.99, 0), // force a normal (non-boss) quest for a predictable xp amount
    });
    const quest = await getQuestById(client, UID, dailyQuest.questId);

    await completeDailyQuestAndAwardXp(client, UID, dailyQuest.id, '2026-08-04T09:00:00.000Z');

    const domain = await getDomainByKey(client, UID, dailyQuest.domainId);
    expect(domain!.xp).toBe(quest!.xpReward);
  });

  it('leaves every other domain unaffected', async () => {
    const quests = await generateDailyQuests(client, UID, DATE, {
      random: fixedRandom(0.99, 0.99, 0),
    });
    const [target, ...rest] = quests;

    await completeDailyQuestAndAwardXp(client, UID, target.id, '2026-08-04T09:00:00.000Z');

    for (const other of rest) {
      const domain = await getDomainByKey(client, UID, other.domainId);
      expect(domain!.xp).toBe(0);
      expect(domain!.level).toBe(1);
    }
  });

  it('marks the daily quest completed', async () => {
    const [dailyQuest] = await generateDailyQuests(client, UID, DATE);

    await completeDailyQuestAndAwardXp(client, UID, dailyQuest.id, '2026-08-04T09:00:00.000Z');

    const updated = await listDailyQuestsByDate(client, UID, DATE);
    const completed = updated.find((d) => d.id === dailyQuest.id);
    expect(completed!.completedAt).toBe('2026-08-04T09:00:00.000Z');
  });

  it('records an xp event for the audit trail', async () => {
    const [dailyQuest] = await generateDailyQuests(client, UID, DATE, {
      random: fixedRandom(0.99, 0.99, 0),
    });
    const quest = await getQuestById(client, UID, dailyQuest.questId);

    await completeDailyQuestAndAwardXp(client, UID, dailyQuest.id, '2026-08-04T09:00:00.000Z');

    const events = await listXpEventsByDomain(client, UID, dailyQuest.domainId);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      amount: quest!.xpReward,
      source: 'quest',
      sourceId: dailyQuest.id,
    });
  });

  it('reports a level-up when the gain crosses a level boundary', async () => {
    const [dailyQuest] = await generateDailyQuests(client, UID, DATE, {
      random: fixedRandom(0, 0.9, 0), // force the boss quest (60xp) — crosses the 50xp level-2 threshold
    });

    const result = await completeDailyQuestAndAwardXp(
      client,
      UID,
      dailyQuest.id,
      '2026-08-04T09:00:00.000Z',
    );

    expect(result.leveledUp).toBe(true);
  });

  it('throws when completing a daily quest that does not exist', async () => {
    await expect(
      completeDailyQuestAndAwardXp(client, UID, 'missing', '2026-08-04T09:00:00.000Z'),
    ).rejects.toThrow();
  });

  it('throws when completing an already-completed daily quest', async () => {
    const [dailyQuest] = await generateDailyQuests(client, UID, DATE);
    await completeDailyQuestAndAwardXp(client, UID, dailyQuest.id, '2026-08-04T09:00:00.000Z');

    await expect(
      completeDailyQuestAndAwardXp(client, UID, dailyQuest.id, '2026-08-04T10:00:00.000Z'),
    ).rejects.toThrow();
  });
});
