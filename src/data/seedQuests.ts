import { createQuest, listAllQuests } from './repositories/questsRepository';
import type { FirestoreClient } from './firestoreClient';

interface QuestSeed {
  /** Stable key, used as the Firestore doc id so re-seeding is idempotent. */
  key: string;
  domainKey: string;
  text: string;
  xpReward: number;
  isBoss?: boolean;
  /** Defaults to 'P1' (always eligible) — 'P2' quests only come up occasionally. */
  priority?: 'P1' | 'P2';
}

/**
 * The starter template bank — mostly easy/low-friction quests plus one
 * harder "boss quest" per domain for bigger XP, per requirements.md.
 * `domainKey` doubles as the domain's Firestore doc id (domains are seeded
 * with `id === key`, see `seed.ts`), so quests can reference their domain
 * without needing the domain to already exist in memory.
 */
const QUEST_SEEDS: QuestSeed[] = [
  // Health
  { key: 'health_walk', domainKey: 'health', text: 'Take a 15-minute walk', xpReward: 15 },
  {
    key: 'health_water',
    domainKey: 'health',
    text: 'Drink 6 glasses of water today',
    xpReward: 10,
  },
  {
    key: 'health_sleep_early',
    domainKey: 'health',
    text: 'Get to bed before midnight',
    xpReward: 15,
  },
  {
    key: 'health_veggie',
    domainKey: 'health',
    text: 'Eat a vegetable with every meal today',
    xpReward: 15,
  },
  {
    key: 'health_breathe',
    domainKey: 'health',
    text: 'Spend 5 minutes on deep breathing or meditation',
    xpReward: 15,
  },
  { key: 'health_stretch', domainKey: 'health', text: 'Stretch for 10 minutes', xpReward: 10 },
  {
    key: 'health_boss_workout',
    domainKey: 'health',
    text: 'Complete a full workout session (30+ minutes)',
    xpReward: 60,
    isBoss: true,
  },
  {
    key: 'health_workout',
    domainKey: 'health',
    text: 'Get a workout in today',
    xpReward: 15,
    priority: 'P1',
  },
  {
    key: 'health_low_calorie',
    domainKey: 'health',
    text: 'Keep today low-calorie',
    xpReward: 15,
    priority: 'P1',
  },
  {
    key: 'health_no_junk_food',
    domainKey: 'health',
    text: 'Avoid junk food today',
    xpReward: 15,
    priority: 'P1',
  },

  // Career
  { key: 'career_read', domainKey: 'career', text: 'Read one article in your field', xpReward: 15 },
  {
    key: 'career_deep_work',
    domainKey: 'career',
    text: 'Work 1 uninterrupted hour on your most important task',
    xpReward: 20,
  },
  {
    key: 'career_learn_tool',
    domainKey: 'career',
    text: 'Learn one new tool or shortcut',
    xpReward: 15,
  },
  {
    key: 'career_network',
    domainKey: 'career',
    text: 'Send a message to a professional contact',
    xpReward: 15,
  },
  {
    key: 'career_portfolio',
    domainKey: 'career',
    text: 'Update one line item on your resume or portfolio',
    xpReward: 10,
  },
  {
    key: 'career_tidy',
    domainKey: 'career',
    text: 'Tidy your workspace or inbox for 10 minutes',
    xpReward: 10,
  },
  {
    key: 'career_boss_milestone',
    domainKey: 'career',
    text: "Finish a project milestone you've been putting off",
    xpReward: 60,
    isBoss: true,
  },
  {
    key: 'career_office',
    domainKey: 'career',
    text: 'Work from the office today',
    xpReward: 15,
    priority: 'P1',
  },
  {
    key: 'career_interview_prep',
    domainKey: 'career',
    text: 'Prepare for an upcoming interview',
    xpReward: 20,
    priority: 'P1',
  },

  // Relationships
  {
    key: 'relationships_family_checkin',
    domainKey: 'relationships',
    text: 'Call or text a family member',
    xpReward: 15,
  },
  {
    key: 'relationships_friend_checkin',
    domainKey: 'relationships',
    text: "Check in with a friend you haven't spoken to in a while",
    xpReward: 15,
  },
  {
    key: 'relationships_partner_time',
    domainKey: 'relationships',
    text: 'Have an undistracted conversation with your partner or a close loved one',
    xpReward: 15,
  },
  {
    key: 'relationships_compliment',
    domainKey: 'relationships',
    text: 'Give someone a genuine compliment',
    xpReward: 10,
  },
  {
    key: 'relationships_make_plans',
    domainKey: 'relationships',
    text: 'Make plans to see someone in person',
    xpReward: 15,
  },
  {
    key: 'relationships_thank_you',
    domainKey: 'relationships',
    text: 'Write a thank-you note or message',
    xpReward: 10,
  },
  {
    key: 'relationships_boss_gathering',
    domainKey: 'relationships',
    text: 'Plan and host a get-together',
    xpReward: 60,
    isBoss: true,
  },

  // Finance
  { key: 'finance_log_spending', domainKey: 'finance', text: "Log today's spending", xpReward: 10 },
  {
    key: 'finance_skip_purchase',
    domainKey: 'finance',
    text: 'Skip one non-essential purchase',
    xpReward: 15,
  },
  {
    key: 'finance_save',
    domainKey: 'finance',
    text: 'Move a small amount into savings',
    xpReward: 15,
  },
  {
    key: 'finance_review_subscription',
    domainKey: 'finance',
    text: "Review one subscription for whether it's worth keeping",
    xpReward: 15,
  },
  {
    key: 'finance_research_income',
    domainKey: 'finance',
    text: 'Research one way to grow your income',
    xpReward: 15,
  },
  {
    key: 'finance_check_balances',
    domainKey: 'finance',
    text: 'Check your account balances',
    xpReward: 10,
  },
  {
    key: 'finance_boss_budget',
    domainKey: 'finance',
    text: 'Create or update your monthly budget',
    xpReward: 60,
    isBoss: true,
  },

  // Growth
  { key: 'growth_read', domainKey: 'growth', text: 'Read for 15 minutes', xpReward: 15 },
  {
    key: 'growth_journal',
    domainKey: 'growth',
    text: 'Write in a journal for 5 minutes',
    xpReward: 15,
  },
  {
    key: 'growth_learn_fact',
    domainKey: 'growth',
    text: 'Learn one new fact or concept',
    xpReward: 10,
  },
  {
    key: 'growth_creative',
    domainKey: 'growth',
    text: 'Spend 15 minutes on a creative hobby',
    xpReward: 15,
  },
  {
    key: 'growth_reflect_win',
    domainKey: 'growth',
    text: 'Reflect on one win from today',
    xpReward: 10,
  },
  {
    key: 'growth_educational_media',
    domainKey: 'growth',
    text: 'Watch or listen to something educational',
    xpReward: 15,
  },
  {
    key: 'growth_boss_project',
    domainKey: 'growth',
    text: 'Finish a chapter, course module, or creative-project milestone',
    xpReward: 60,
    isBoss: true,
  },
  {
    key: 'growth_course',
    domainKey: 'growth',
    text: 'Make progress on a course',
    xpReward: 20,
    priority: 'P2',
  },
  {
    key: 'growth_build_project',
    domainKey: 'growth',
    text: 'Work on a personal project',
    xpReward: 20,
    priority: 'P2',
  },
];

/** Seeds the starter quest template bank for a signed-in user. */
export async function seedQuests(client: FirestoreClient, uid: string): Promise<void> {
  for (const seed of QUEST_SEEDS) {
    await createQuest(client, uid, {
      id: seed.key,
      domainId: seed.domainKey,
      text: seed.text,
      xpReward: seed.xpReward,
      isBoss: seed.isBoss,
      priority: seed.priority,
    });
  }
}

/**
 * Seeds the quest template bank only if the user has none yet — safe to
 * call on every app open without duplicating data for a returning user.
 */
export async function ensureQuestsSeeded(client: FirestoreClient, uid: string): Promise<void> {
  const existing = await listAllQuests(client, uid);
  if (existing.length === 0) {
    await seedQuests(client, uid);
  }
}
