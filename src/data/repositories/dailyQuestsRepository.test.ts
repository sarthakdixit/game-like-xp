import { createDomain } from './domainsRepository';
import { createQuest } from './questsRepository';
import {
  completeDailyQuest,
  createDailyQuest,
  deleteDailyQuest,
  getDailyQuestById,
  listDailyQuestsByDate,
} from './dailyQuestsRepository';
import { createMigratedTestDb } from '../testUtils/nodeSqliteClient';
import type { SqliteClient } from '../sqliteClient';

describe('dailyQuestsRepository', () => {
  let db: SqliteClient;
  let domainId: string;
  let questId: string;

  beforeEach(async () => {
    db = await createMigratedTestDb();
    const domain = await createDomain(db, { key: 'health', name: 'Health', sortOrder: 0 });
    domainId = domain.id;
    const quest = await createQuest(db, { domainId, text: 'Move for 20 minutes', xpReward: 15 });
    questId = quest.id;
  });

  it('creates a daily quest that starts incomplete', async () => {
    const dq = await createDailyQuest(db, { questId, domainId, date: '2026-08-04' });

    expect(dq.completedAt).toBeNull();
    expect(dq.date).toBe('2026-08-04');
  });

  it('reads a daily quest back by id', async () => {
    const created = await createDailyQuest(db, { questId, domainId, date: '2026-08-04' });

    expect(await getDailyQuestById(db, created.id)).toEqual(created);
  });

  it('returns null for a missing id', async () => {
    expect(await getDailyQuestById(db, 'missing')).toBeNull();
  });

  it('lists daily quests for a date', async () => {
    await createDailyQuest(db, { questId, domainId, date: '2026-08-04' });
    await createDailyQuest(db, { questId, domainId, date: '2026-08-05' });

    const forDay = await listDailyQuestsByDate(db, '2026-08-04');

    expect(forDay).toHaveLength(1);
    expect(forDay[0].date).toBe('2026-08-04');
  });

  it('marks a daily quest complete', async () => {
    const created = await createDailyQuest(db, { questId, domainId, date: '2026-08-04' });

    await completeDailyQuest(db, created.id, '2026-08-04T12:00:00.000Z');

    const updated = await getDailyQuestById(db, created.id);
    expect(updated?.completedAt).toBe('2026-08-04T12:00:00.000Z');
  });

  it('deletes a daily quest', async () => {
    const created = await createDailyQuest(db, { questId, domainId, date: '2026-08-04' });

    await deleteDailyQuest(db, created.id);

    expect(await getDailyQuestById(db, created.id)).toBeNull();
  });
});
