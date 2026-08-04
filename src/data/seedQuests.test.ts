import { beforeEach, describe, expect, it } from 'vitest';

import type { FirestoreClient } from './firestoreClient';
import { listAllQuests, listQuestsByDomain } from './repositories/questsRepository';
import { ensureQuestsSeeded, seedQuests } from './seedQuests';
import { createFakeFirestoreClient } from './testUtils/fakeFirestoreClient';

const UID = 'user-1';
const DOMAIN_KEYS = ['health', 'career', 'relationships', 'finance', 'growth'];

describe('seedQuests', () => {
  let client: FirestoreClient;

  beforeEach(() => {
    client = createFakeFirestoreClient();
  });

  it('seeds at least 5 quests for every domain', async () => {
    await seedQuests(client, UID);

    for (const domainKey of DOMAIN_KEYS) {
      const quests = await listQuestsByDomain(client, UID, domainKey);
      expect(quests.length).toBeGreaterThanOrEqual(5);
    }
  });

  it('seeds no more than 10 quests for any domain', async () => {
    await seedQuests(client, UID);

    for (const domainKey of DOMAIN_KEYS) {
      const quests = await listQuestsByDomain(client, UID, domainKey);
      expect(quests.length).toBeLessThanOrEqual(10);
    }
  });

  it('gives every domain exactly one boss quest', async () => {
    await seedQuests(client, UID);

    for (const domainKey of DOMAIN_KEYS) {
      const quests = await listQuestsByDomain(client, UID, domainKey);
      expect(quests.filter((q) => q.isBoss)).toHaveLength(1);
    }
  });

  it('does not duplicate quests when seeded twice', async () => {
    await seedQuests(client, UID);
    await seedQuests(client, UID);

    const quests = await listAllQuests(client, UID);
    const uniqueIds = new Set(quests.map((q) => q.id));
    expect(quests).toHaveLength(uniqueIds.size);
  });
});

describe('ensureQuestsSeeded', () => {
  let client: FirestoreClient;

  beforeEach(() => {
    client = createFakeFirestoreClient();
  });

  it('seeds quests for a user with none yet', async () => {
    await ensureQuestsSeeded(client, UID);

    expect((await listAllQuests(client, UID)).length).toBeGreaterThan(0);
  });

  it('does not duplicate quests for a user who already has them', async () => {
    await ensureQuestsSeeded(client, UID);
    const first = await listAllQuests(client, UID);

    await ensureQuestsSeeded(client, UID);
    const second = await listAllQuests(client, UID);

    expect(second).toHaveLength(first.length);
  });

  it('does not seed quests for a different user', async () => {
    await ensureQuestsSeeded(client, UID);

    expect(await listAllQuests(client, 'other-user')).toEqual([]);
  });
});
