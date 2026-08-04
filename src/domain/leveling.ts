export interface DomainProgress {
  level: number;
  xp: number;
  /**
   * The last title actually unlocked via a level-up, or `null` if the
   * domain hasn't crossed a title tier yet. Display code should fall back
   * to `titleForLevel(level)` when this is `null` — the stored value only
   * changes on a level-up event, it isn't a live-derived display value.
   */
  title: string | null;
}

export interface ApplyXpGainResult extends DomainProgress {
  leveledUp: boolean;
  /** The newly unlocked title, only set when this gain crosses into a new title tier. */
  unlockedTitle: string | null;
}

export interface XpProgress {
  /** XP earned since reaching the current level. */
  currentLevelXp: number;
  /** Total XP span of the current level (0 if the level has no span, e.g. a capped max level). */
  xpToNextLevel: number;
  /** 0..1 progress through the current level. */
  ratio: number;
}

interface TitleTier {
  minLevel: number;
  title: string;
}

/** Cosmetic titles unlocked as a domain levels up — first tier applies from level 1. */
const TITLE_TIERS: readonly TitleTier[] = [
  { minLevel: 1, title: 'Novice' },
  { minLevel: 3, title: 'Adept' },
  { minLevel: 6, title: 'Expert' },
  { minLevel: 10, title: 'Master' },
];

/** Quadratic XP curve: level N needs `XP_CURVE_BASE * (N-1)^2` cumulative XP. */
const XP_CURVE_BASE = 50;

/** Cumulative XP required to have reached `level` (level 1 = 0 XP). */
export function xpForLevel(level: number): number {
  if (level <= 1) {
    return 0;
  }
  return XP_CURVE_BASE * (level - 1) ** 2;
}

/** The level implied by a cumulative XP total. */
export function levelForXp(xp: number): number {
  if (xp <= 0) {
    return 1;
  }
  return 1 + Math.floor(Math.sqrt(xp / XP_CURVE_BASE));
}

/** The cosmetic title for a given level — the highest tier whose threshold the level meets. */
export function titleForLevel(level: number): string {
  let title = TITLE_TIERS[0].title;
  for (const tier of TITLE_TIERS) {
    if (level < tier.minLevel) {
      break;
    }
    title = tier.title;
  }
  return title;
}

/** Level at which a radar chart axis should read 100% — matches the Master title tier. */
const MAX_RADAR_LEVEL = 10;

/** Converts a level into a 0-100 radar-chart axis value, capped at `maxLevel`. */
export function levelToRadarValue(level: number, maxLevel: number = MAX_RADAR_LEVEL): number {
  if (maxLevel <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, (level / maxLevel) * 100));
}

/** Progress within the current level, for rendering an XP bar. */
export function xpProgressToNextLevel(level: number, xp: number): XpProgress {
  const currentThreshold = xpForLevel(level);
  const nextThreshold = xpForLevel(level + 1);
  const span = nextThreshold - currentThreshold;
  const currentLevelXp = Math.max(0, xp - currentThreshold);
  const ratio = span <= 0 ? 1 : Math.min(1, currentLevelXp / span);
  return { currentLevelXp, xpToNextLevel: span, ratio };
}

/**
 * Applies an XP gain to a domain's progress, recomputing level and (if a
 * level-up crosses into a new title tier) the title. A single large gain
 * (e.g. a boss quest) can skip multiple levels in one call — `unlockedTitle`
 * reflects only the final tier reached, not any tiers passed through along
 * the way, since this is a single event, not a step-by-step animation.
 */
export function applyXpGain(current: DomainProgress, amount: number): ApplyXpGainResult {
  const xp = current.xp + amount;
  const level = levelForXp(xp);
  const leveledUp = level > current.level;

  const previousTitle = current.title ?? titleForLevel(current.level);
  const currentTitle = titleForLevel(level);
  const unlockedTitle = leveledUp && currentTitle !== previousTitle ? currentTitle : null;

  return {
    level,
    xp,
    title: unlockedTitle ?? current.title,
    leveledUp,
    unlockedTitle,
  };
}
