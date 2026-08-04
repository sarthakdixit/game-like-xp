import { listDomains } from './repositories/domainsRepository';
import { seedDomains } from './seed';
import { seedQuests } from './seedQuests';
import type { SqliteClient } from './sqliteClient';

/** Seeds the 5 domains and the quest template bank, but only on a freshly migrated, empty database. */
export async function ensureSeeded(db: SqliteClient): Promise<void> {
  const domains = await listDomains(db);
  if (domains.length > 0) {
    return;
  }

  await seedDomains(db);
  await seedQuests(db);
}
