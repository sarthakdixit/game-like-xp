import { beforeEach, describe, expect, it } from 'vitest';

import { createFakeFirestoreClient } from '../testUtils/fakeFirestoreClient';
import type { FirestoreClient } from '../firestoreClient';
import { createDomain } from './domainsRepository';
import {
  createChildStat,
  deleteChildStat,
  getChildStatById,
  getChildStatByDomainAndKey,
  listChildStatsByDomain,
  updateChildStatValue,
} from './childStatsRepository';

const UID = 'user-1';

describe('childStatsRepository', () => {
  let client: FirestoreClient;
  let domainId: string;

  beforeEach(async () => {
    client = createFakeFirestoreClient();
    const domain = await createDomain(client, UID, { key: 'health', name: 'Health', sortOrder: 0 });
    domainId = domain.id;
  });

  it('creates a child stat defaulting value to 0', async () => {
    const stat = await createChildStat(client, UID, {
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
    const stat = await createChildStat(client, UID, {
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
    const created = await createChildStat(client, UID, {
      domainId,
      key: 'sleep',
      name: 'Sleep',
      sortOrder: 1,
      lastActiveAt: '2026-01-01T00:00:00.000Z',
    });

    expect(await getChildStatById(client, UID, domainId, created.id)).toEqual(created);
  });

  it('returns null for a missing id', async () => {
    expect(await getChildStatById(client, UID, domainId, 'missing')).toBeNull();
  });

  it('reads a child stat back by domain id and key', async () => {
    const created = await createChildStat(client, UID, {
      domainId,
      key: 'fitness',
      name: 'Fitness',
      sortOrder: 0,
      lastActiveAt: '2026-01-01T00:00:00.000Z',
    });

    expect(await getChildStatByDomainAndKey(client, UID, domainId, 'fitness')).toEqual(created);
  });

  it('returns null for a domain/key combination that does not exist', async () => {
    expect(await getChildStatByDomainAndKey(client, UID, domainId, 'missing')).toBeNull();
  });

  it('lists child stats for a domain ordered by sortOrder', async () => {
    await createChildStat(client, UID, {
      domainId,
      key: 'mental',
      name: 'Mental wellbeing',
      sortOrder: 3,
      lastActiveAt: '2026-01-01T00:00:00.000Z',
    });
    await createChildStat(client, UID, {
      domainId,
      key: 'fitness',
      name: 'Fitness',
      sortOrder: 0,
      lastActiveAt: '2026-01-01T00:00:00.000Z',
    });

    const stats = await listChildStatsByDomain(client, UID, domainId);

    expect(stats.map((s) => s.key)).toEqual(['fitness', 'mental']);
  });

  it('does not leak child stats from another domain', async () => {
    const otherDomain = await createDomain(client, UID, {
      key: 'career',
      name: 'Career',
      sortOrder: 1,
    });
    await createChildStat(client, UID, {
      domainId: otherDomain.id,
      key: 'deep_work',
      name: 'Deep work',
      sortOrder: 0,
      lastActiveAt: '2026-01-01T00:00:00.000Z',
    });
    await createChildStat(client, UID, {
      domainId,
      key: 'fitness',
      name: 'Fitness',
      sortOrder: 0,
      lastActiveAt: '2026-01-01T00:00:00.000Z',
    });

    const stats = await listChildStatsByDomain(client, UID, domainId);

    expect(stats.map((s) => s.key)).toEqual(['fitness']);
  });

  it('updates value and lastActiveAt', async () => {
    const created = await createChildStat(client, UID, {
      domainId,
      key: 'fitness',
      name: 'Fitness',
      sortOrder: 0,
      lastActiveAt: '2026-01-01T00:00:00.000Z',
    });

    await updateChildStatValue(client, UID, domainId, created.id, {
      value: 80,
      lastActiveAt: '2026-02-01T00:00:00.000Z',
    });

    expect(await getChildStatById(client, UID, domainId, created.id)).toMatchObject({
      value: 80,
      lastActiveAt: '2026-02-01T00:00:00.000Z',
    });
  });

  it('deletes a child stat', async () => {
    const created = await createChildStat(client, UID, {
      domainId,
      key: 'fitness',
      name: 'Fitness',
      sortOrder: 0,
      lastActiveAt: '2026-01-01T00:00:00.000Z',
    });

    await deleteChildStat(client, UID, domainId, created.id);

    expect(await getChildStatById(client, UID, domainId, created.id)).toBeNull();
  });
});
