/** XP required to go from level `n` to `n + 1`. Increments by 100 per level. */
const XP_INCREMENT_PER_LEVEL = 100;

interface TitleTier {
  minLevel: number;
  title: string;
}

/** Ordered ascending by `minLevel`; the last tier whose `minLevel` a level meets or exceeds wins. */
const TITLE_TIERS: TitleTier[] = [
  { minLevel: 1, title: 'Novice' },
  { minLevel: 3, title: 'Adept' },
  { minLevel: 6, title: 'Expert' },
  { minLevel: 10, title: 'Master' },
];

export interface DomainProgress {
  level: number;
  xp: number;
  title: string;
}

export interface ApplyXpGainResult {
  level: number;
  xp: number;
  title: string;
  leveledUp: boolean;
  unlockedTitle: string | null;
}

/** Cumulative XP required to reach `level`. `xpForLevel(1)` is always 0. */
export function xpForLevel(level: number): number {
  if (level <= 1) {
    return 0;
  }
  return (XP_INCREMENT_PER_LEVEL * (level - 1) * level) / 2;
}

/** The level reached by `xp` total, inclusive at exact thresholds. Never below 1. */
export function levelForXp(xp: number): number {
  if (xp <= 0) {
    return 1;
  }
  let level = 1;
  while (xpForLevel(level + 1) <= xp) {
    level += 1;
  }
  return level;
}

/** The title unlocked at `level` — the highest tier whose `minLevel` has been reached. */
export function titleForLevel(level: number): string {
  let title = TITLE_TIERS[0].title;
  for (const tier of TITLE_TIERS) {
    if (level >= tier.minLevel) {
      title = tier.title;
    } else {
      break;
    }
  }
  return title;
}

/**
 * Applies an XP gain (e.g. a completed quest) to a domain's progress.
 * `amount` must be non-negative — XP never decreases; use decay.ts for stat neglect instead.
 */
export function applyXpGain(current: DomainProgress, amount: number): ApplyXpGainResult {
  if (amount < 0) {
    throw new Error(`applyXpGain amount must be non-negative, got ${amount}`);
  }

  const newXp = current.xp + amount;
  const newLevel = levelForXp(newXp);
  const newTitle = titleForLevel(newLevel);

  return {
    level: newLevel,
    xp: newXp,
    title: newTitle,
    leveledUp: newLevel > current.level,
    unlockedTitle: newTitle !== current.title ? newTitle : null,
  };
}
