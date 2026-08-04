import { createDomain } from './domainsRepository';
import {
  createXpEvent,
  getLatestXpEventForDomain,
  getXpEventById,
  listXpEventsByDomain,
} from './xpEventsRepository';
import { createMigratedTestDb } from '../testUtils/nodeSqliteClient';
import type { SqliteClient } from '../sqliteClient';

describe('xpEventsRepository', () => {
  let db: SqliteClient;
  let domainId: string;

  beforeEach(async () => {
    db = await createMigratedTestDb();
    const domain = await createDomain(db, { key: 'health', name: 'Health', sortOrder: 0 });
    domainId = domain.id;
  });

  it('creates an xp event with a null sourceId by default', async () => {
    const event = await createXpEvent(db, { domainId, amount: 15, source: 'manual' });

    expect(event.amount).toBe(15);
    expect(event.source).toBe('manual');
    expect(event.sourceId).toBeNull();
  });

  it('creates an xp event tied to a source id', async () => {
    const event = await createXpEvent(db, {
      domainId,
      amount: 40,
      source: 'quest',
      sourceId: 'daily-quest-1',
    });

    expect(event.sourceId).toBe('daily-quest-1');
  });

  it('reads an xp event back by id', async () => {
    const created = await createXpEvent(db, { domainId, amount: 15, source: 'manual' });

    expect(await getXpEventById(db, created.id)).toEqual(created);
  });

  it('returns null for a missing id', async () => {
    expect(await getXpEventById(db, 'missing')).toBeNull();
  });

  it('lists xp events for a domain in creation order', async () => {
    const first = await createXpEvent(db, { domainId, amount: 10, source: 'manual' });
    const second = await createXpEvent(db, { domainId, amount: 20, source: 'quest' });

    const events = await listXpEventsByDomain(db, domainId);

    expect(events.map((e) => e.id)).toEqual([first.id, second.id]);
  });

  it('returns null for latest xp event when none exist', async () => {
    expect(await getLatestXpEventForDomain(db, domainId)).toBeNull();
  });

  it('returns the most recent xp event for a domain', async () => {
    await createXpEvent(db, { domainId, amount: 10, source: 'manual' });
    const second = await createXpEvent(db, { domainId, amount: 20, source: 'quest' });

    const latest = await getLatestXpEventForDomain(db, domainId);

    expect(latest?.id).toBe(second.id);
  });
});
