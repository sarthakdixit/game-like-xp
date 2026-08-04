export interface QuestTemplate {
  id: string;
  domainId: string;
  text: string;
  xpReward: number;
  isBoss: boolean;
}

export interface SelectionOptions {
  /** Defaults to `Math.random`; inject a fixed/cycling function for deterministic tests. */
  random?: () => number;
  /** Probability [0,1) of rolling a boss quest instead of a regular one. Defaults to 0.15. */
  bossChance?: number;
}

const DEFAULT_BOSS_CHANCE = 0.15;

/**
 * Picks one quest template for a domain's daily quest. Always calls
 * `random()` exactly twice (once for the boss roll, once for the pick),
 * regardless of which branch runs — a previous version short-circuited via
 * `&&` and only called `random()` once when the boss roll failed, which
 * made call counts inconsistent and broke deterministic tests fed a fixed
 * sequence of values.
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

  const bossRoll = random();
  const indexRoll = random();

  const bossTemplates = templates.filter((t) => t.isBoss);
  const normalTemplates = templates.filter((t) => !t.isBoss);

  const wantsBoss = bossRoll < bossChance && bossTemplates.length > 0;
  const pool = wantsBoss ? bossTemplates : normalTemplates.length > 0 ? normalTemplates : templates;

  const index = Math.min(Math.floor(indexRoll * pool.length), pool.length - 1);
  return pool[index];
}
