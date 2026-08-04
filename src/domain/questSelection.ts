export interface QuestOption {
  id: string;
  isBoss: boolean;
}

export interface SelectedQuest {
  id: string;
  isBoss: boolean;
}

/** Default odds that a domain's daily pick is a boss quest, when one is available. */
const DEFAULT_BOSS_CHANCE = 0.2;

/**
 * Picks one quest from a domain's template pool for a given day.
 *
 * `random` is called at most twice — once to decide boss vs. regular, once to
 * pick within the chosen pool — so tests can inject a fake sequence for
 * deterministic outcomes. Defaults to `Math.random`.
 */
export function selectQuest(
  options: QuestOption[],
  random: () => number = Math.random,
  bossChance: number = DEFAULT_BOSS_CHANCE,
): SelectedQuest {
  if (options.length === 0) {
    throw new Error('Cannot select a quest from an empty option list');
  }

  const bossOptions = options.filter((option) => option.isBoss);
  const regularOptions = options.filter((option) => !option.isBoss);

  const bossRoll = random();
  const wantsBoss = bossOptions.length > 0 && bossRoll < bossChance;
  const pool = wantsBoss ? bossOptions : regularOptions.length > 0 ? regularOptions : bossOptions;

  const indexRoll = random();
  const rawIndex = Math.floor(indexRoll * pool.length);
  const index = Math.min(Math.max(rawIndex, 0), pool.length - 1);
  const chosen = pool[index];

  return { id: chosen.id, isBoss: chosen.isBoss };
}
