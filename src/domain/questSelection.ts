export interface QuestTemplate {
  id: string;
  domainId: string;
  text: string;
  xpReward: number;
  isBoss: boolean;
  /** P1 quests are always eligible for the day's pick; P2 quests only come up occasionally. */
  priority: 'P1' | 'P2';
}

export interface SelectionOptions {
  /** Defaults to `Math.random`; inject a fixed/cycling function for deterministic tests. */
  random?: () => number;
  /** Probability [0,1) of rolling a boss quest instead of a regular one. Defaults to 0.15. */
  bossChance?: number;
  /** Probability [0,1) of rolling a P2 (occasional) quest over a P1 one, when the boss roll misses. Defaults to 0.3. */
  p2Chance?: number;
}

const DEFAULT_BOSS_CHANCE = 0.15;
const DEFAULT_P2_CHANCE = 0.3;

/**
 * Picks one quest template for a domain's daily quest. Always calls
 * `random()` exactly three times (boss roll, P2 roll, index pick),
 * regardless of which branch runs — see the original boss-only version's
 * note on why a short-circuited call count breaks deterministic tests fed a
 * fixed sequence of values; the same discipline now covers the P2 roll too.
 */
export function selectDailyQuest(
  templates: QuestTemplate[],
  options: SelectionOptions = {},
): QuestTemplate {
  if (templates.length === 0) {
    throw new Error('Cannot select a daily quest from an empty template list');
  }

  const random = options.random ?? Math.random;
  const bossChance = options.bossChance ?? DEFAULT_BOSS_CHANCE;
  const p2Chance = options.p2Chance ?? DEFAULT_P2_CHANCE;

  const bossRoll = random();
  const p2Roll = random();
  const indexRoll = random();

  const bossTemplates = templates.filter((t) => t.isBoss);
  const nonBossTemplates = templates.filter((t) => !t.isBoss);
  const p1Templates = nonBossTemplates.filter((t) => t.priority === 'P1');
  const p2Templates = nonBossTemplates.filter((t) => t.priority === 'P2');

  const wantsBoss = bossRoll < bossChance && bossTemplates.length > 0;
  const wantsP2 = !wantsBoss && p2Roll < p2Chance && p2Templates.length > 0;

  const pool = wantsBoss
    ? bossTemplates
    : wantsP2
      ? p2Templates
      : p1Templates.length > 0
        ? p1Templates
        : nonBossTemplates.length > 0
          ? nonBossTemplates
          : templates;

  const index = Math.min(Math.floor(indexRoll * pool.length), pool.length - 1);
  return pool[index];
}
