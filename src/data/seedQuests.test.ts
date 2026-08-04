import { getDomainByKey } from './repositories/domainsRepository';
import { listQuestsByDomain } from './repositories/questsRepository';
import { seedDomains } from './seed';
import { seedQuests } from './seedQuests';
import { createMigratedTestDb } from './testUtils/nodeSqliteClient';
import type { SqliteClient } from './sqliteClient';

describe('seedQuests', () => {
  let db: SqliteClient;

  beforeEach(async () => {
    db = await createMigratedTestDb();
    await seedDomains(db);
  });

  it('throws if domains have not been seeded yet', async () => {
    const emptyDb = await createMigratedTestDb();
    await expect(seedQuests(emptyDb)).rejects.toThrow();
  });

  it('seeds every domain with at least 5 quests including one boss quest', async () => {
    await seedQuests(db);

    for (const key of ['health', 'career', 'relationships', 'finance', 'growth']) {
      const domain = await getDomainByKey(db, key);
      const quests = await listQuestsByDomain(db, domain!.id);

      expect(quests.length).toBeGreaterThanOrEqual(5);
      expect(quests.some((q) => q.isBoss)).toBe(true);
      expect(quests.filter((q) => q.isBoss)).toHaveLength(1);
      for (const quest of quests) {
        expect(quest.xpReward).toBeGreaterThan(0);
        expect(quest.text.length).toBeGreaterThan(0);
      }
    }
  });
});
