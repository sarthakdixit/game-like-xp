import { getDomainByKey } from './repositories/domainsRepository';
import { createQuest } from './repositories/questsRepository';
import type { SqliteClient } from './sqliteClient';

interface QuestSeed {
  text: string;
  xpReward: number;
  isBoss?: boolean;
}

const QUEST_SEEDS: Record<string, QuestSeed[]> = {
  health: [
    { text: 'Move for 20 minutes', xpReward: 15 },
    { text: 'Drink 8 glasses of water', xpReward: 10 },
    { text: 'Get 7+ hours of sleep', xpReward: 15 },
    { text: 'Stretch for 10 minutes', xpReward: 10 },
    { text: 'Skip the junk food today', xpReward: 15 },
    { text: 'Complete a full workout session', xpReward: 45, isBoss: true },
  ],
  career: [
    { text: 'Finish one deep-work block', xpReward: 20 },
    { text: 'Learn one new tool or shortcut', xpReward: 15 },
    { text: 'Clear your inbox to zero', xpReward: 15 },
    { text: 'Message a mentor or colleague', xpReward: 10 },
    { text: 'Update your resume or portfolio', xpReward: 15 },
    { text: 'Ship a project milestone', xpReward: 45, isBoss: true },
  ],
  relationships: [
    { text: "Message someone you haven't talked to in a while", xpReward: 15 },
    { text: 'Have a phone or video call with family', xpReward: 20 },
    { text: 'Give someone a genuine compliment', xpReward: 10 },
    { text: 'Plan a hangout with a friend', xpReward: 15 },
    { text: 'Listen without interrupting today', xpReward: 10 },
    { text: 'Have a meaningful in-person conversation', xpReward: 45, isBoss: true },
  ],
  finance: [
    { text: "Log today's spending", xpReward: 10 },
    { text: 'Review your budget for 10 minutes', xpReward: 15 },
    { text: 'Skip one non-essential purchase', xpReward: 15 },
    { text: 'Move money into savings', xpReward: 20 },
    { text: 'Read one article about personal finance', xpReward: 10 },
    { text: 'Review and adjust your monthly budget', xpReward: 45, isBoss: true },
  ],
  growth: [
    { text: 'Read for 15 minutes', xpReward: 15 },
    { text: 'Journal for 10 minutes', xpReward: 10 },
    { text: 'Try something new for 15 minutes', xpReward: 15 },
    { text: 'Reflect on one lesson from today', xpReward: 10 },
    { text: 'Practice a hobby or creative skill', xpReward: 15 },
    { text: 'Finish a full chapter or course module', xpReward: 45, isBoss: true },
  ],
};

/** Seeds the quest template bank for every domain. Requires `seedDomains` to have run first. */
export async function seedQuests(db: SqliteClient): Promise<void> {
  for (const [domainKey, quests] of Object.entries(QUEST_SEEDS)) {
    const domain = await getDomainByKey(db, domainKey);
    if (!domain) {
      throw new Error(
        `Cannot seed quests: domain "${domainKey}" not found. Run seedDomains first.`,
      );
    }

    for (const quest of quests) {
      await createQuest(db, {
        domainId: domain.id,
        text: quest.text,
        xpReward: quest.xpReward,
        isBoss: quest.isBoss,
      });
    }
  }
}
