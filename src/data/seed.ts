import { createChildStat } from './repositories/childStatsRepository';
import { createDomain, listDomains } from './repositories/domainsRepository';
import type { FirestoreClient } from './firestoreClient';

interface DomainSeed {
  key: string;
  name: string;
  childStats: { key: string; name: string }[];
}

const DOMAIN_SEEDS: DomainSeed[] = [
  {
    key: 'health',
    name: 'Health',
    childStats: [
      { key: 'fitness', name: 'Fitness' },
      { key: 'nutrition', name: 'Nutrition' },
      { key: 'sleep', name: 'Sleep' },
      { key: 'mental_wellbeing', name: 'Mental wellbeing' },
    ],
  },
  {
    key: 'career',
    name: 'Career',
    childStats: [
      { key: 'skill_building', name: 'Skill-building' },
      { key: 'deep_work', name: 'Deep work' },
      { key: 'networking', name: 'Networking' },
    ],
  },
  {
    key: 'relationships',
    name: 'Relationships',
    childStats: [
      { key: 'family', name: 'Family' },
      { key: 'friends', name: 'Friends' },
      { key: 'partner', name: 'Partner' },
    ],
  },
  {
    key: 'finance',
    name: 'Finance',
    childStats: [
      { key: 'savings', name: 'Savings' },
      { key: 'spending_discipline', name: 'Spending discipline' },
      { key: 'income_growth', name: 'Income growth' },
    ],
  },
  {
    key: 'growth',
    name: 'Growth',
    childStats: [
      { key: 'learning', name: 'Learning' },
      { key: 'reflection', name: 'Reflection' },
      { key: 'creative_pursuits', name: 'Creative pursuits' },
    ],
  },
];

/**
 * Seeds the 5 top-level domains and their child stats from `requirements.md`
 * for a signed-in user. Intended for a freshly signed-up user with no
 * Firestore data yet.
 */
export async function seedDomains(client: FirestoreClient, uid: string): Promise<void> {
  const lastActiveAt = new Date().toISOString();

  for (let i = 0; i < DOMAIN_SEEDS.length; i += 1) {
    const seed = DOMAIN_SEEDS[i];
    const domain = await createDomain(client, uid, {
      key: seed.key,
      name: seed.name,
      sortOrder: i,
    });

    for (let j = 0; j < seed.childStats.length; j += 1) {
      const child = seed.childStats[j];
      await createChildStat(client, uid, {
        domainId: domain.id,
        key: child.key,
        name: child.name,
        sortOrder: j,
        lastActiveAt,
      });
    }
  }
}

/**
 * Seeds domains only if the user has none yet — safe to call on every app
 * open without duplicating data for a returning user.
 */
export async function ensureSeeded(client: FirestoreClient, uid: string): Promise<void> {
  const existing = await listDomains(client, uid);
  if (existing.length === 0) {
    await seedDomains(client, uid);
  }
}
