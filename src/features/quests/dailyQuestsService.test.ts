import { listQuestsByDomain } from '../../data/repositories/questsRepository';
import { getDomainByKey, listDomains } from '../../data/repositories/domainsRepository';
import { listXpEventsByDomain } from '../../data/repositories/xpEventsRepository';
import { seedDomains } from '../../data/seed';
import { seedQuests } from '../../data/seedQuests';
import { createMigratedTestDb } from '../../data/testUtils/nodeSqliteClient';
import type { SqliteClient } from '../../data/sqliteClient';
import { completeDailyQuestAndAwardXp, generateDailyQuests } from './dailyQuestsService';

/** Cycles through `values` repeatedly — generateDailyQuests calls random() twice per domain. */
function fixedRandom(...values: number[]): () => number {
  let call = 0;
  return () => {
    const value = values[call % values.length];
    call += 1;
    return value;
  };
}

async function setupSeededDb(): Promise<SqliteClient> {
  const db = await createMigratedTestDb();
  await seedDomains(db);
  await seedQuests(db);
  return db;
}

describe('generateDailyQuests', () => {
  it('creates exactly one daily quest per domain, none skipped', async () => {
    const db = await setupSeededDb();

    const created = await generateDailyQuests(db, '2026-08-04');

    expect(created).toHaveLength(5);
    expect(new Set(created.map((dq) => dq.domainId)).size).toBe(5);
  });

  it('is idempotent for the same date — no duplicates on a second call', async () => {
    const db = await setupSeededDb();

    const first = await generateDailyQuests(db, '2026-08-04');
    const second = await generateDailyQuests(db, '2026-08-04');

    expect(second).toEqual(first);
    expect(second).toHaveLength(5);
  });

  it('generates a fresh set of 5 for a different date', async () => {
    const db = await setupSeededDb();

    await generateDailyQuests(db, '2026-08-04');
    const dayTwo = await generateDailyQuests(db, '2026-08-05');

    expect(dayTwo).toHaveLength(5);
    expect(dayTwo.every((dq) => dq.date === '2026-08-05')).toBe(true);
  });

  it('picks a boss quest for every domain when the boss roll always hits', async () => {
    const db = await setupSeededDb();

    const created = await generateDailyQuests(db, '2026-08-04', {
      random: fixedRandom(0.01, 0),
    });

    for (const dailyQuest of created) {
      const quests = await listQuestsByDomain(db, dailyQuest.domainId);
      const quest = quests.find((q) => q.id === dailyQuest.questId);
      expect(quest?.isBoss).toBe(true);
    }
  });

  it('picks a regular quest for every domain when the boss roll always misses', async () => {
    const db = await setupSeededDb();

    const created = await generateDailyQuests(db, '2026-08-04', {
      random: fixedRandom(0.99, 0),
    });

    for (const dailyQuest of created) {
      const quests = await listQuestsByDomain(db, dailyQuest.domainId);
      const quest = quests.find((q) => q.id === dailyQuest.questId);
      expect(quest?.isBoss).toBe(false);
    }
  });

  it('keeps boss-quest odds within the configured bossChance across many trials', async () => {
    let bossCount = 0;
    const trials = 200;

    for (let i = 0; i < trials; i += 1) {
      const db = await setupSeededDb();
      const [dailyQuest] = await generateDailyQuests(db, '2026-08-04', { bossChance: 0.2 });
      const quests = await listQuestsByDomain(db, dailyQuest.domainId);
      const quest = quests.find((q) => q.id === dailyQuest.questId);
      if (quest?.isBoss) {
        bossCount += 1;
      }
    }

    // 0.2 chance over 200 trials: allow generous slack (0.05-0.4) to avoid flakiness.
    const rate = bossCount / trials;
    expect(rate).toBeGreaterThan(0.05);
    expect(rate).toBeLessThan(0.4);
  });
});

describe('completeDailyQuestAndAwardXp', () => {
  it('awards xp and records an xp event tied to the daily quest', async () => {
    const db = await setupSeededDb();
    const [dailyQuest] = await generateDailyQuests(db, '2026-08-04', {
      random: fixedRandom(0.99, 0),
    });

    const result = await completeDailyQuestAndAwardXp(
      db,
      dailyQuest.id,
      '2026-08-04T12:00:00.000Z',
    );

    expect(result.dailyQuest.completedAt).toBe('2026-08-04T12:00:00.000Z');
    expect(result.xpEvent.sourceId).toBe(dailyQuest.id);
    expect(result.xpEvent.source).toBe('quest');
    expect(result.domain.xp).toBe(result.xpEvent.amount);

    const events = await listXpEventsByDomain(db, dailyQuest.domainId);
    expect(events).toHaveLength(1);
    expect(events[0].id).toBe(result.xpEvent.id);
  });

  it('levels up the domain through the Batch 2 engine when xp crosses a threshold', async () => {
    const db = await setupSeededDb();
    const healthDomainId = (await getDomainByKey(db, 'health'))!.id;

    // Health's regular quests are worth 10-15xp each; complete enough to cross 100xp (level 2).
    for (let day = 1; day <= 7; day += 1) {
      const date = `2026-08-${String(day).padStart(2, '0')}`;
      const daily = await generateDailyQuests(db, date, { random: fixedRandom(0.99, 0) });
      const healthQuest = daily.find((dq) => dq.domainId === healthDomainId)!;
      await completeDailyQuestAndAwardXp(db, healthQuest.id, `${date}T12:00:00.000Z`);
    }

    const health = await getDomainByKey(db, 'health');
    expect(health!.xp).toBeGreaterThanOrEqual(100);
    expect(health!.level).toBeGreaterThanOrEqual(2);
    expect(health!.title).not.toBeNull();
  });

  it('throws when the daily quest does not exist', async () => {
    const db = await setupSeededDb();

    await expect(
      completeDailyQuestAndAwardXp(db, 'missing-id', '2026-08-04T12:00:00.000Z'),
    ).rejects.toThrow();
  });

  it('throws when the daily quest is already completed', async () => {
    const db = await setupSeededDb();
    const [dailyQuest] = await generateDailyQuests(db, '2026-08-04');

    await completeDailyQuestAndAwardXp(db, dailyQuest.id, '2026-08-04T12:00:00.000Z');

    await expect(
      completeDailyQuestAndAwardXp(db, dailyQuest.id, '2026-08-04T13:00:00.000Z'),
    ).rejects.toThrow();
  });

  it('does not change xp for domains whose quest was not completed', async () => {
    const db = await setupSeededDb();
    const created = await generateDailyQuests(db, '2026-08-04', { random: fixedRandom(0.99, 0) });
    const [toComplete, ...rest] = created;

    await completeDailyQuestAndAwardXp(db, toComplete.id, '2026-08-04T12:00:00.000Z');

    const domains = await listDomains(db);
    for (const domain of domains) {
      if (domain.id === toComplete.domainId) {
        continue;
      }
      expect(domain.xp).toBe(0);
      expect(domain.level).toBe(1);
    }
    expect(rest.length).toBe(4);
  });
});
