import { createDomain } from './domainsRepository';
import { createQuest, deleteQuest, getQuestById, listQuestsByDomain } from './questsRepository';
import { createMigratedTestDb } from '../testUtils/nodeSqliteClient';
import type { SqliteClient } from '../sqliteClient';

describe('questsRepository', () => {
  let db: SqliteClient;
  let domainId: string;

  beforeEach(async () => {
    db = await createMigratedTestDb();
    const domain = await createDomain(db, { key: 'health', name: 'Health', sortOrder: 0 });
    domainId = domain.id;
  });

  it('creates a quest defaulting isBoss to false', async () => {
    const quest = await createQuest(db, {
      domainId,
      text: 'Move for 20 minutes',
      xpReward: 15,
    });

    expect(quest.isBoss).toBe(false);
    expect(quest.xpReward).toBe(15);
  });

  it('creates a boss quest', async () => {
    const quest = await createQuest(db, {
      domainId,
      text: 'Finish a full workout',
      xpReward: 50,
      isBoss: true,
    });

    expect(quest.isBoss).toBe(true);
  });

  it('reads a quest back by id', async () => {
    const created = await createQuest(db, { domainId, text: 'Read for 15 minutes', xpReward: 15 });

    expect(await getQuestById(db, created.id)).toEqual(created);
  });

  it('returns null for a missing id', async () => {
    expect(await getQuestById(db, 'missing')).toBeNull();
  });

  it('lists quests for a domain', async () => {
    await createQuest(db, { domainId, text: 'Quest A', xpReward: 10 });
    await createQuest(db, { domainId, text: 'Quest B', xpReward: 20 });

    const quests = await listQuestsByDomain(db, domainId);

    expect(quests.map((q) => q.text)).toEqual(['Quest A', 'Quest B']);
  });

  it('deletes a quest', async () => {
    const created = await createQuest(db, { domainId, text: 'Quest A', xpReward: 10 });

    await deleteQuest(db, created.id);

    expect(await getQuestById(db, created.id)).toBeNull();
  });
});
