import { listChildStatsByDomain } from './repositories/childStatsRepository';
import { getDomainByKey, getDomainById, listDomains } from './repositories/domainsRepository';
import { seedDomains } from './seed';
import { createMigratedTestDb } from './testUtils/nodeSqliteClient';
import type { SqliteClient } from './sqliteClient';

describe('seedDomains', () => {
  let db: SqliteClient;

  beforeEach(async () => {
    db = await createMigratedTestDb();
    await seedDomains(db);
  });

  it('creates exactly the 5 top-level domains in order', async () => {
    const domains = await listDomains(db);

    expect(domains.map((d) => d.key)).toEqual([
      'health',
      'career',
      'relationships',
      'finance',
      'growth',
    ]);
  });

  it('starts every domain at level 1 with 0 xp', async () => {
    const domains = await listDomains(db);

    for (const domain of domains) {
      expect(domain.level).toBe(1);
      expect(domain.xp).toBe(0);
      expect(domain.title).toBeNull();
    }
  });

  it('round-trips a domain lookup by key and by id', async () => {
    const byKey = await getDomainByKey(db, 'health');
    expect(byKey).not.toBeNull();

    const byId = await getDomainById(db, byKey!.id);
    expect(byId).toEqual(byKey);
  });

  it('seeds the right child stats for each domain', async () => {
    const expected: Record<string, string[]> = {
      health: ['fitness', 'nutrition', 'sleep', 'mental_wellbeing'],
      career: ['skill_building', 'deep_work', 'networking'],
      relationships: ['family', 'friends', 'partner'],
      finance: ['savings', 'spending_discipline', 'income_growth'],
      growth: ['learning', 'reflection', 'creative_pursuits'],
    };

    for (const [domainKey, childKeys] of Object.entries(expected)) {
      const domain = await getDomainByKey(db, domainKey);
      const childStats = await listChildStatsByDomain(db, domain!.id);
      expect(childStats.map((c) => c.key)).toEqual(childKeys);
      for (const stat of childStats) {
        expect(stat.value).toBe(0);
      }
    }
  });
});
