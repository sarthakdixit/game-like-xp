import { beforeEach, describe, expect, it } from 'vitest';

import type { FirestoreClient } from './firestoreClient';
import { createQuest, listAllQuests, listQuestsByDomain } from './repositories/questsRepository';
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

  it('seeds the new Health quests as P1 (always eligible)', async () => {
    await seedQuests(client, UID);

    const quests = await listQuestsByDomain(client, UID, 'health');
    const byKey = new Map(quests.map((q) => [q.id, q]));

    expect(byKey.get('health_workout')).toMatchObject({ priority: 'P1' });
    expect(byKey.get('health_low_calorie')).toMatchObject({ priority: 'P1' });
    expect(byKey.get('health_no_junk_food')).toMatchObject({ priority: 'P1' });
  });

  it('seeds the new Career quests as P1 (always eligible)', async () => {
    await seedQuests(client, UID);

    const quests = await listQuestsByDomain(client, UID, 'career');
    const byKey = new Map(quests.map((q) => [q.id, q]));

    expect(byKey.get('career_office')).toMatchObject({ priority: 'P1' });
    expect(byKey.get('career_interview_prep')).toMatchObject({ priority: 'P1' });
  });

  it('seeds the new Growth quests as P2 (occasional)', async () => {
    await seedQuests(client, UID);

    const quests = await listQuestsByDomain(client, UID, 'growth');
    const byKey = new Map(quests.map((q) => [q.id, q]));

    expect(byKey.get('growth_course')).toMatchObject({ priority: 'P2' });
    expect(byKey.get('growth_build_project')).toMatchObject({ priority: 'P2' });
  });

  it('defaults every pre-existing quest to P1', async () => {
    await seedQuests(client, UID);

    const quests = await listAllQuests(client, UID);
    const legacyQuests = quests.filter(
      (q) => !['growth_course', 'growth_build_project'].includes(q.id),
    );

    expect(legacyQuests.every((q) => q.priority === 'P1')).toBe(true);
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

  it('adds newly-added template quests for a returning user with only an older subset', async () => {
    // Regression test: a real user had already been seeded before health_workout (and the rest
    // of this batch's new quests) existed in QUEST_SEEDS. The old "skip entirely if the user has
    // any quests at all" guard meant they'd never receive new template additions — reconciling
    // by missing key, not by "seeded at all", is what actually fixes that.
    await createQuest(client, UID, {
      id: 'health_walk',
      domainId: 'health',
      text: 'Take a 15-minute walk',
      xpReward: 15,
    });

    await ensureQuestsSeeded(client, UID);

    const quests = await listAllQuests(client, UID);
    const ids = new Set(quests.map((q) => q.id));
    expect(ids.has('health_workout')).toBe(true);
    expect(ids.has('career_office')).toBe(true);
    expect(ids.has('growth_course')).toBe(true);
  });

  it('does not touch an existing quest doc when reconciling missing ones', async () => {
    const original = await createQuest(client, UID, {
      id: 'health_walk',
      domainId: 'health',
      text: 'Custom edited text', // simulates a doc that's diverged from the current seed text
      xpReward: 15,
    });

    await ensureQuestsSeeded(client, UID);

    const quests = await listAllQuests(client, UID);
    const stillThere = quests.find((q) => q.id === 'health_walk');
    expect(stillThere).toEqual(original);
  });
});
