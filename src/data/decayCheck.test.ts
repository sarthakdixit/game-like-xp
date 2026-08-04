import { createChildStat } from './repositories/childStatsRepository';
import { createDomain } from './repositories/domainsRepository';
import { createMigratedTestDb } from './testUtils/nodeSqliteClient';
import { getDecayingDomainNames } from './decayCheck';

describe('getDecayingDomainNames', () => {
  it('returns an empty list when there are no domains', async () => {
    const db = await createMigratedTestDb();
    expect(await getDecayingDomainNames(db)).toEqual([]);
  });

  it('returns an empty list when every child stat was touched recently', async () => {
    const db = await createMigratedTestDb();
    const domain = await createDomain(db, { key: 'health', name: 'Health', sortOrder: 0 });
    const now = '2026-08-04T12:00:00.000Z';
    await createChildStat(db, {
      domainId: domain.id,
      key: 'fitness',
      name: 'Fitness',
      sortOrder: 0,
      value: 50,
      lastActiveAt: '2026-08-04T00:00:00.000Z',
    });

    expect(await getDecayingDomainNames(db, now)).toEqual([]);
  });

  it('names a domain with at least one decaying child stat', async () => {
    const db = await createMigratedTestDb();
    const domain = await createDomain(db, { key: 'health', name: 'Health', sortOrder: 0 });
    const now = '2026-08-10T00:00:00.000Z';
    await createChildStat(db, {
      domainId: domain.id,
      key: 'fitness',
      name: 'Fitness',
      sortOrder: 0,
      value: 50,
      lastActiveAt: '2026-08-01T00:00:00.000Z', // 9 days stale, well past the 1-day grace period
    });

    expect(await getDecayingDomainNames(db, now)).toEqual(['Health']);
  });

  it('does not repeat a domain twice even if multiple child stats are decaying', async () => {
    const db = await createMigratedTestDb();
    const domain = await createDomain(db, { key: 'health', name: 'Health', sortOrder: 0 });
    const now = '2026-08-10T00:00:00.000Z';
    for (const key of ['fitness', 'sleep']) {
      await createChildStat(db, {
        domainId: domain.id,
        key,
        name: key,
        sortOrder: 0,
        value: 50,
        lastActiveAt: '2026-08-01T00:00:00.000Z',
      });
    }

    expect(await getDecayingDomainNames(db, now)).toEqual(['Health']);
  });

  it('only names domains that are actually decaying, not every domain', async () => {
    const db = await createMigratedTestDb();
    const health = await createDomain(db, { key: 'health', name: 'Health', sortOrder: 0 });
    const career = await createDomain(db, { key: 'career', name: 'Career', sortOrder: 1 });
    const now = '2026-08-10T00:00:00.000Z';

    await createChildStat(db, {
      domainId: health.id,
      key: 'fitness',
      name: 'Fitness',
      sortOrder: 0,
      value: 50,
      lastActiveAt: '2026-08-01T00:00:00.000Z',
    });
    await createChildStat(db, {
      domainId: career.id,
      key: 'deep_work',
      name: 'Deep work',
      sortOrder: 0,
      value: 50,
      lastActiveAt: '2026-08-09T00:00:00.000Z',
    });

    expect(await getDecayingDomainNames(db, now)).toEqual(['Health']);
  });
});
