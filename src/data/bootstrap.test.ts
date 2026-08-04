import { listDomains } from './repositories/domainsRepository';
import { listQuestsByDomain } from './repositories/questsRepository';
import { seedDomains } from './seed';
import { ensureSeeded } from './bootstrap';
import { createMigratedTestDb } from './testUtils/nodeSqliteClient';

describe('ensureSeeded', () => {
  it('seeds domains and quests on an empty database', async () => {
    const db = await createMigratedTestDb();

    await ensureSeeded(db);

    const domains = await listDomains(db);
    expect(domains).toHaveLength(5);
    for (const domain of domains) {
      const quests = await listQuestsByDomain(db, domain.id);
      expect(quests.length).toBeGreaterThan(0);
    }
  });

  it('does not reseed a database that already has domains', async () => {
    const db = await createMigratedTestDb();
    await seedDomains(db);

    await ensureSeeded(db);

    const domains = await listDomains(db);
    expect(domains).toHaveLength(5);
    // quests were never seeded, and ensureSeeded should not have added any either
    const quests = await listQuestsByDomain(db, domains[0].id);
    expect(quests).toHaveLength(0);
  });

  it('is idempotent across repeated calls', async () => {
    const db = await createMigratedTestDb();

    await ensureSeeded(db);
    await ensureSeeded(db);

    const domains = await listDomains(db);
    expect(domains).toHaveLength(5);
  });
});
