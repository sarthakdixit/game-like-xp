import { createDomain } from './domainsRepository';
import {
  createChildStat,
  deleteChildStat,
  getChildStatById,
  listChildStatsByDomain,
  updateChildStatValue,
} from './childStatsRepository';
import { createMigratedTestDb } from '../testUtils/nodeSqliteClient';
import type { SqliteClient } from '../sqliteClient';

describe('childStatsRepository', () => {
  let db: SqliteClient;
  let domainId: string;

  beforeEach(async () => {
    db = await createMigratedTestDb();
    const domain = await createDomain(db, { key: 'health', name: 'Health', sortOrder: 0 });
    domainId = domain.id;
  });

  it('creates a child stat defaulting value to 0', async () => {
    const stat = await createChildStat(db, {
      domainId,
      key: 'fitness',
      name: 'Fitness',
      sortOrder: 0,
      lastActiveAt: '2026-01-01T00:00:00.000Z',
    });

    expect(stat.domainId).toBe(domainId);
    expect(stat.value).toBe(0);
  });

  it('creates a child stat with an explicit value', async () => {
    const stat = await createChildStat(db, {
      domainId,
      key: 'fitness',
      name: 'Fitness',
      sortOrder: 0,
      value: 65,
      lastActiveAt: '2026-01-01T00:00:00.000Z',
    });

    expect(stat.value).toBe(65);
  });

  it('reads a child stat back by id', async () => {
    const created = await createChildStat(db, {
      domainId,
      key: 'sleep',
      name: 'Sleep',
      sortOrder: 1,
      lastActiveAt: '2026-01-01T00:00:00.000Z',
    });

    expect(await getChildStatById(db, created.id)).toEqual(created);
  });

  it('returns null for a missing id', async () => {
    expect(await getChildStatById(db, 'missing')).toBeNull();
  });

  it('lists child stats for a domain ordered by sort_order', async () => {
    await createChildStat(db, {
      domainId,
      key: 'mental',
      name: 'Mental wellbeing',
      sortOrder: 3,
      lastActiveAt: '2026-01-01T00:00:00.000Z',
    });
    await createChildStat(db, {
      domainId,
      key: 'fitness',
      name: 'Fitness',
      sortOrder: 0,
      lastActiveAt: '2026-01-01T00:00:00.000Z',
    });

    const stats = await listChildStatsByDomain(db, domainId);

    expect(stats.map((s) => s.key)).toEqual(['fitness', 'mental']);
  });

  it('updates value and last_active_at', async () => {
    const created = await createChildStat(db, {
      domainId,
      key: 'fitness',
      name: 'Fitness',
      sortOrder: 0,
      lastActiveAt: '2026-01-01T00:00:00.000Z',
    });

    await updateChildStatValue(db, created.id, {
      value: 80,
      lastActiveAt: '2026-02-01T00:00:00.000Z',
    });

    const updated = await getChildStatById(db, created.id);
    expect(updated).toMatchObject({ value: 80, lastActiveAt: '2026-02-01T00:00:00.000Z' });
  });

  it('deletes a child stat', async () => {
    const created = await createChildStat(db, {
      domainId,
      key: 'fitness',
      name: 'Fitness',
      sortOrder: 0,
      lastActiveAt: '2026-01-01T00:00:00.000Z',
    });

    await deleteChildStat(db, created.id);

    expect(await getChildStatById(db, created.id)).toBeNull();
  });
});
