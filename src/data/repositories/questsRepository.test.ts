import { beforeEach, describe, expect, it } from 'vitest';

import { createFakeFirestoreClient } from '../testUtils/fakeFirestoreClient';
import type { FirestoreClient } from '../firestoreClient';
import { createQuest, getQuestById, listAllQuests, listQuestsByDomain } from './questsRepository';

const UID = 'user-1';

describe('questsRepository', () => {
  let client: FirestoreClient;

  beforeEach(() => {
    client = createFakeFirestoreClient();
  });

  it('creates a quest defaulting isBoss to false', async () => {
    const quest = await createQuest(client, UID, {
      domainId: 'health',
      text: 'Move for 20 minutes',
      xpReward: 15,
    });

    expect(quest).toMatchObject({
      domainId: 'health',
      text: 'Move for 20 minutes',
      xpReward: 15,
      isBoss: false,
    });
  });

  it('creates a boss quest when requested', async () => {
    const quest = await createQuest(client, UID, {
      domainId: 'health',
      text: 'Run a 5k',
      xpReward: 50,
      isBoss: true,
    });

    expect(quest.isBoss).toBe(true);
  });

  it('reads a quest back by id', async () => {
    const created = await createQuest(client, UID, {
      domainId: 'health',
      text: 'Move for 20 minutes',
      xpReward: 15,
    });

    expect(await getQuestById(client, UID, created.id)).toEqual(created);
  });

  it('returns null for a missing id', async () => {
    expect(await getQuestById(client, UID, 'missing')).toBeNull();
  });

  it('lists quests for a single domain', async () => {
    await createQuest(client, UID, { domainId: 'health', text: 'Move', xpReward: 15 });
    await createQuest(client, UID, { domainId: 'career', text: 'Deep work block', xpReward: 20 });

    const results = await listQuestsByDomain(client, UID, 'health');

    expect(results.map((q) => q.text)).toEqual(['Move']);
  });

  it('lists every quest across all domains', async () => {
    await createQuest(client, UID, { domainId: 'health', text: 'Move', xpReward: 15 });
    await createQuest(client, UID, { domainId: 'career', text: 'Deep work block', xpReward: 20 });

    const results = await listAllQuests(client, UID);

    expect(results).toHaveLength(2);
  });

  it('scopes quests to the requesting user only', async () => {
    await createQuest(client, UID, { domainId: 'health', text: 'Move', xpReward: 15 });
    await createQuest(client, 'other-user', { domainId: 'health', text: 'Other', xpReward: 15 });

    const results = await listAllQuests(client, UID);

    expect(results).toHaveLength(1);
  });
});
