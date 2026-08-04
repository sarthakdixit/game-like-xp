import { createMigratedTestDb } from '../testUtils/nodeSqliteClient';
import {
  createDomain,
  deleteDomain,
  getDomainByKey,
  getDomainById,
  listDomains,
  updateDomainProgress,
} from './domainsRepository';
import type { SqliteClient } from '../sqliteClient';

describe('domainsRepository', () => {
  let db: SqliteClient;

  beforeEach(async () => {
    db = await createMigratedTestDb();
  });

  it('creates a domain with level 1 and 0 xp by default', async () => {
    const domain = await createDomain(db, { key: 'health', name: 'Health', sortOrder: 0 });

    expect(domain.key).toBe('health');
    expect(domain.name).toBe('Health');
    expect(domain.level).toBe(1);
    expect(domain.xp).toBe(0);
    expect(domain.title).toBeNull();
    expect(domain.id).toBeTruthy();
  });

  it('reads a domain back by id', async () => {
    const created = await createDomain(db, { key: 'career', name: 'Career', sortOrder: 1 });

    const found = await getDomainById(db, created.id);

    expect(found).toEqual(created);
  });

  it('returns null for a missing id', async () => {
    expect(await getDomainById(db, 'does-not-exist')).toBeNull();
  });

  it('reads a domain back by key', async () => {
    const created = await createDomain(db, { key: 'growth', name: 'Growth', sortOrder: 4 });

    expect(await getDomainByKey(db, 'growth')).toEqual(created);
    expect(await getDomainByKey(db, 'nope')).toBeNull();
  });

  it('lists domains ordered by sort_order', async () => {
    await createDomain(db, { key: 'finance', name: 'Finance', sortOrder: 3 });
    await createDomain(db, { key: 'health', name: 'Health', sortOrder: 0 });
    await createDomain(db, { key: 'career', name: 'Career', sortOrder: 1 });

    const domains = await listDomains(db);

    expect(domains.map((d) => d.key)).toEqual(['health', 'career', 'finance']);
  });

  it('updates level, xp, and title', async () => {
    const created = await createDomain(db, { key: 'health', name: 'Health', sortOrder: 0 });

    await updateDomainProgress(db, created.id, { level: 4, xp: 420, title: 'Adept' });

    const updated = await getDomainById(db, created.id);
    expect(updated).toMatchObject({ level: 4, xp: 420, title: 'Adept' });
  });

  it('deletes a domain', async () => {
    const created = await createDomain(db, { key: 'health', name: 'Health', sortOrder: 0 });

    await deleteDomain(db, created.id);

    expect(await getDomainById(db, created.id)).toBeNull();
  });
});
