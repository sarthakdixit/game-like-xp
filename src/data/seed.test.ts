import { beforeEach, describe, expect, it } from 'vitest';

import { createFakeFirestoreClient } from './testUtils/fakeFirestoreClient';
import type { FirestoreClient } from './firestoreClient';
import { listChildStatsByDomain } from './repositories/childStatsRepository';
import { listDomains } from './repositories/domainsRepository';
import { ensureSeeded, seedDomains } from './seed';

const UID = 'user-1';

describe('seedDomains', () => {
  let client: FirestoreClient;

  beforeEach(() => {
    client = createFakeFirestoreClient();
  });

  it('creates all 5 domains in the requirements.md order', async () => {
    await seedDomains(client, UID);

    const domains = await listDomains(client, UID);

    expect(domains.map((d) => d.key)).toEqual([
      'health',
      'career',
      'relationships',
      'finance',
      'growth',
    ]);
  });

  it('seeds Health with 4 child stats', async () => {
    await seedDomains(client, UID);
    const [health] = await listDomains(client, UID);

    const childStats = await listChildStatsByDomain(client, UID, health.id);

    expect(childStats.map((c) => c.key)).toEqual([
      'fitness',
      'nutrition',
      'sleep',
      'mental_wellbeing',
    ]);
  });

  it('seeds every other domain with 3 child stats', async () => {
    await seedDomains(client, UID);
    const domains = await listDomains(client, UID);

    for (const domain of domains.filter((d) => d.key !== 'health')) {
      const childStats = await listChildStatsByDomain(client, UID, domain.id);
      expect(childStats).toHaveLength(3);
    }
  });

  it('does not seed data for a different user', async () => {
    await seedDomains(client, UID);

    expect(await listDomains(client, 'other-user')).toEqual([]);
  });
});

describe('ensureSeeded', () => {
  let client: FirestoreClient;

  beforeEach(() => {
    client = createFakeFirestoreClient();
  });

  it('seeds domains for a user with none yet', async () => {
    await ensureSeeded(client, UID);

    expect(await listDomains(client, UID)).toHaveLength(5);
  });

  it('does not duplicate domains for a user who already has them', async () => {
    await ensureSeeded(client, UID);
    await ensureSeeded(client, UID);

    expect(await listDomains(client, UID)).toHaveLength(5);
  });

  it('does not duplicate domains or child stats when two seed calls race concurrently', async () => {
    // Regression test: React StrictMode (and any other double-mount) can
    // fire the loading effect twice back-to-back. Both calls see "no domains
    // yet" and both try to seed — this only stays correct because domain/
    // child-stat ids are the deterministic `key`, not a random generated id,
    // so the two concurrent writes converge on the same 5 documents instead
    // of producing 10.
    await Promise.all([seedDomains(client, UID), seedDomains(client, UID)]);

    const domains = await listDomains(client, UID);
    expect(domains).toHaveLength(5);

    for (const domain of domains) {
      const childStats = await listChildStatsByDomain(client, UID, domain.id);
      const keys = childStats.map((c) => c.key);
      expect(keys).toHaveLength(new Set(keys).size); // no duplicate keys
    }
  });
});
