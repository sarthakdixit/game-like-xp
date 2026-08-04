import { beforeEach, describe, expect, it } from 'vitest';

import { createFakeFirestoreClient } from '../testUtils/fakeFirestoreClient';
import type { FirestoreClient } from '../firestoreClient';
import {
  createXpEvent,
  getLatestXpEventForDomain,
  getXpEventById,
  listXpEventsByDomain,
} from './xpEventsRepository';

const UID = 'user-1';

describe('xpEventsRepository', () => {
  let client: FirestoreClient;

  beforeEach(() => {
    client = createFakeFirestoreClient();
  });

  it('creates an xp event with a null sourceId by default', async () => {
    const event = await createXpEvent(client, UID, {
      domainId: 'health',
      amount: 15,
      source: 'quest',
    });

    expect(event).toMatchObject({
      domainId: 'health',
      amount: 15,
      source: 'quest',
      sourceId: null,
    });
  });

  it('creates an xp event with an explicit sourceId', async () => {
    const event = await createXpEvent(client, UID, {
      domainId: 'health',
      amount: 15,
      source: 'quest',
      sourceId: 'daily-quest-1',
    });

    expect(event.sourceId).toBe('daily-quest-1');
  });

  it('reads an xp event back by id', async () => {
    const created = await createXpEvent(client, UID, {
      domainId: 'health',
      amount: 15,
      source: 'quest',
    });

    expect(await getXpEventById(client, UID, created.id)).toEqual(created);
  });

  it('returns null for a missing id', async () => {
    expect(await getXpEventById(client, UID, 'missing')).toBeNull();
  });

  it('lists xp events for a single domain only', async () => {
    await createXpEvent(client, UID, { domainId: 'health', amount: 15, source: 'quest' });
    await createXpEvent(client, UID, { domainId: 'career', amount: 20, source: 'quest' });

    const results = await listXpEventsByDomain(client, UID, 'health');

    expect(results).toHaveLength(1);
    expect(results[0].domainId).toBe('health');
  });

  it('scopes xp events to the requesting user only', async () => {
    await createXpEvent(client, UID, { domainId: 'health', amount: 15, source: 'quest' });
    await createXpEvent(client, 'other-user', { domainId: 'health', amount: 15, source: 'quest' });

    const results = await listXpEventsByDomain(client, UID, 'health');

    expect(results).toHaveLength(1);
  });

  it('returns null for latest xp event when a domain has none', async () => {
    expect(await getLatestXpEventForDomain(client, UID, 'health')).toBeNull();
  });

  it('returns the most recently created xp event for a domain', async () => {
    await createXpEvent(client, UID, { domainId: 'health', amount: 15, source: 'quest' });
    const latest = await createXpEvent(client, UID, {
      domainId: 'health',
      amount: 20,
      source: 'manual',
    });

    expect(await getLatestXpEventForDomain(client, UID, 'health')).toEqual(latest);
  });
});
