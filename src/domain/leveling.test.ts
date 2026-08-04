import { describe, expect, it } from 'vitest';

import {
  applyXpGain,
  levelForXp,
  levelToRadarValue,
  titleForLevel,
  xpForLevel,
  xpProgressToNextLevel,
} from './leveling';

describe('xpForLevel', () => {
  it('is 0 for level 1', () => {
    expect(xpForLevel(1)).toBe(0);
  });

  it('is 0 for any level below 1 (defensive)', () => {
    expect(xpForLevel(0)).toBe(0);
    expect(xpForLevel(-5)).toBe(0);
  });

  it('follows the quadratic curve for higher levels', () => {
    expect(xpForLevel(2)).toBe(50);
    expect(xpForLevel(3)).toBe(200);
    expect(xpForLevel(4)).toBe(450);
    expect(xpForLevel(5)).toBe(800);
  });
});

describe('levelForXp', () => {
  it('is level 1 for 0 or negative xp', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(-10)).toBe(1);
  });

  it('stays at level 1 just below the level-2 threshold', () => {
    expect(levelForXp(49)).toBe(1);
  });

  it('reaches level 2 exactly at its threshold', () => {
    expect(levelForXp(50)).toBe(2);
  });

  it('stays at level 2 just below the level-3 threshold', () => {
    expect(levelForXp(199)).toBe(2);
  });

  it('reaches level 3 exactly at its threshold', () => {
    expect(levelForXp(200)).toBe(3);
  });

  it('is the inverse of xpForLevel at every boundary up to level 10', () => {
    for (let level = 1; level <= 10; level += 1) {
      expect(levelForXp(xpForLevel(level))).toBe(level);
    }
  });
});

describe('titleForLevel', () => {
  it('is Novice at level 1', () => {
    expect(titleForLevel(1)).toBe('Novice');
  });

  it('stays Novice through level 2 (below the Adept threshold)', () => {
    expect(titleForLevel(2)).toBe('Novice');
  });

  it('becomes Adept exactly at its threshold', () => {
    expect(titleForLevel(3)).toBe('Adept');
  });

  it('stays Adept through level 5 (below the Expert threshold)', () => {
    expect(titleForLevel(5)).toBe('Adept');
  });

  it('becomes Expert exactly at its threshold', () => {
    expect(titleForLevel(6)).toBe('Expert');
  });

  it('stays Expert through level 9 (below the Master threshold)', () => {
    expect(titleForLevel(9)).toBe('Expert');
  });

  it('becomes Master exactly at its threshold', () => {
    expect(titleForLevel(10)).toBe('Master');
  });

  it('stays Master for any level beyond the threshold', () => {
    expect(titleForLevel(11)).toBe('Master');
    expect(titleForLevel(100)).toBe('Master');
  });
});

describe('xpProgressToNextLevel', () => {
  it('is 0 ratio at the very start of a level', () => {
    const progress = xpProgressToNextLevel(1, 0);
    expect(progress).toEqual({ currentLevelXp: 0, xpToNextLevel: 50, ratio: 0 });
  });

  it('is a fractional ratio partway through a level', () => {
    const progress = xpProgressToNextLevel(1, 25);
    expect(progress).toEqual({ currentLevelXp: 25, xpToNextLevel: 50, ratio: 0.5 });
  });

  it('is ratio 1 exactly at the next level boundary', () => {
    const progress = xpProgressToNextLevel(1, 50);
    expect(progress.ratio).toBe(1);
  });

  it('clamps ratio at 1 even if xp overshoots into the next level and beyond', () => {
    // in practice applyXpGain would have already bumped the level, but the
    // function itself should never report more than 100% progress
    const progress = xpProgressToNextLevel(1, 999);
    expect(progress.ratio).toBe(1);
  });

  it('computes the correct span for a non-level-1 level', () => {
    const progress = xpProgressToNextLevel(2, 100);
    expect(progress).toEqual({ currentLevelXp: 50, xpToNextLevel: 150, ratio: 50 / 150 });
  });
});

describe('applyXpGain', () => {
  it('adds xp without leveling up when the gain stays within the current level', () => {
    const result = applyXpGain({ level: 1, xp: 0, title: null }, 20);

    expect(result).toEqual({
      level: 1,
      xp: 20,
      title: null,
      leveledUp: false,
      unlockedTitle: null,
    });
  });

  it('levels up exactly at the boundary', () => {
    const result = applyXpGain({ level: 1, xp: 30, title: null }, 20); // total 50

    expect(result.level).toBe(2);
    expect(result.leveledUp).toBe(true);
  });

  it('does not level up one xp short of the boundary', () => {
    const result = applyXpGain({ level: 1, xp: 30, title: null }, 19); // total 49

    expect(result.level).toBe(1);
    expect(result.leveledUp).toBe(false);
  });

  it('unlocks a new title when leveling up crosses into a new tier', () => {
    // level 2 -> level 3 crosses the Adept threshold
    const result = applyXpGain({ level: 2, xp: 50, title: null }, 150); // total 200

    expect(result.level).toBe(3);
    expect(result.leveledUp).toBe(true);
    expect(result.unlockedTitle).toBe('Adept');
    expect(result.title).toBe('Adept');
  });

  it('levels up without unlocking a title when staying within the same tier', () => {
    // level 3 (Adept) -> level 4, still Adept until level 6
    const result = applyXpGain({ level: 3, xp: 200, title: 'Adept' }, 250); // total 450 = level 4

    expect(result.level).toBe(4);
    expect(result.leveledUp).toBe(true);
    expect(result.unlockedTitle).toBeNull();
    expect(result.title).toBe('Adept');
  });

  it('unlocks only the final tier when a huge gain skips multiple tiers at once', () => {
    // a single massive gain from level 1 straight past Adept and Expert to level 10 (Master)
    const result = applyXpGain({ level: 1, xp: 0, title: null }, xpForLevel(10));

    expect(result.level).toBe(10);
    expect(result.unlockedTitle).toBe('Master');
  });

  it('is a no-op for a zero xp gain', () => {
    const current = { level: 2, xp: 60, title: null };
    const result = applyXpGain(current, 0);

    expect(result).toEqual({ ...current, leveledUp: false, unlockedTitle: null });
  });

  it('falls back to the level-derived title when the stored title is null but level is already past tier 1', () => {
    // domain somehow already at level 4 (Adept) with a null stored title —
    // gaining enough to reach level 6 (Expert) should still detect the tier crossing
    const result = applyXpGain({ level: 4, xp: 450, title: null }, 800); // total 1250 = level 6

    expect(result.level).toBe(6);
    expect(result.unlockedTitle).toBe('Expert');
  });
});

describe('levelToRadarValue', () => {
  it('is 0 at level 0 (defensive)', () => {
    expect(levelToRadarValue(0)).toBe(0);
  });

  it('scales linearly below the cap', () => {
    expect(levelToRadarValue(1)).toBe(10);
    expect(levelToRadarValue(5)).toBe(50);
  });

  it('is exactly 100 at the default cap level (10)', () => {
    expect(levelToRadarValue(10)).toBe(100);
  });

  it('clamps at 100 beyond the cap level', () => {
    expect(levelToRadarValue(11)).toBe(100);
    expect(levelToRadarValue(999)).toBe(100);
  });

  it('respects a custom cap level', () => {
    expect(levelToRadarValue(5, 5)).toBe(100);
    expect(levelToRadarValue(2, 4)).toBe(50);
  });

  it('is 0 for a defensive non-positive custom cap instead of dividing by zero', () => {
    expect(levelToRadarValue(5, 0)).toBe(0);
    expect(levelToRadarValue(5, -1)).toBe(0);
  });
});
