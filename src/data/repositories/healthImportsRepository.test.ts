import { createChildStat } from './childStatsRepository';
import { createDomain } from './domainsRepository';
import { createHealthImport, getHealthImport } from './healthImportsRepository';
import { createMigratedTestDb } from '../testUtils/nodeSqliteClient';
import type { SqliteClient } from '../sqliteClient';

describe('healthImportsRepository', () => {
  let db: SqliteClient;
  let childStatId: string;

  beforeEach(async () => {
    db = await createMigratedTestDb();
    const domain = await createDomain(db, { key: 'health', name: 'Health', sortOrder: 0 });
    const childStat = await createChildStat(db, {
      domainId: domain.id,
      key: 'fitness',
      name: 'Fitness',
      sortOrder: 0,
      lastActiveAt: '2026-01-01T00:00:00.000Z',
    });
    childStatId = childStat.id;
  });

  it('records a health import for a child stat and date', async () => {
    const created = await createHealthImport(db, {
      childStatId,
      date: '2026-08-04',
      appliedDelta: 10,
    });

    expect(created).toMatchObject({ childStatId, date: '2026-08-04', appliedDelta: 10 });
  });

  it('reads a health import back by child stat id and date', async () => {
    const created = await createHealthImport(db, {
      childStatId,
      date: '2026-08-04',
      appliedDelta: 10,
    });

    expect(await getHealthImport(db, childStatId, '2026-08-04')).toEqual(created);
  });

  it('returns null when no import exists yet for that child stat/date', async () => {
    expect(await getHealthImport(db, childStatId, '2026-08-04')).toBeNull();
  });

  it('rejects a second import for the same child stat and date (unique constraint)', async () => {
    await createHealthImport(db, { childStatId, date: '2026-08-04', appliedDelta: 10 });

    await expect(
      createHealthImport(db, { childStatId, date: '2026-08-04', appliedDelta: 5 }),
    ).rejects.toThrow();
  });
});
