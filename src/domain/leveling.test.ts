import {
  applyXpGain,
  levelForXp,
  levelToRadarValue,
  titleForLevel,
  xpForLevel,
  xpProgressToNextLevel,
} from './leveling';

describe('xpForLevel', () => {
  it('requires 0 xp for level 1', () => {
    expect(xpForLevel(1)).toBe(0);
  });

  it('clamps levels below 1 to 0 xp', () => {
    expect(xpForLevel(0)).toBe(0);
    expect(xpForLevel(-5)).toBe(0);
  });

  it('increments by 100 more each level', () => {
    expect(xpForLevel(2)).toBe(100);
    expect(xpForLevel(3)).toBe(300);
    expect(xpForLevel(4)).toBe(600);
    expect(xpForLevel(5)).toBe(1000);
  });
});

describe('levelForXp', () => {
  it('is level 1 at 0 xp and for negative xp', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(-100)).toBe(1);
  });

  it('stays at the current level just below a threshold', () => {
    expect(levelForXp(99)).toBe(1);
    expect(levelForXp(299)).toBe(2);
    expect(levelForXp(599)).toBe(3);
  });

  it('reaches the next level exactly at its threshold', () => {
    expect(levelForXp(100)).toBe(2);
    expect(levelForXp(300)).toBe(3);
    expect(levelForXp(600)).toBe(4);
  });

  it('reaches the level just above a threshold', () => {
    expect(levelForXp(101)).toBe(2);
  });
});

describe('titleForLevel', () => {
  it('is Novice for levels 1-2', () => {
    expect(titleForLevel(1)).toBe('Novice');
    expect(titleForLevel(2)).toBe('Novice');
  });

  it('unlocks Adept at exactly level 3', () => {
    expect(titleForLevel(3)).toBe('Adept');
    expect(titleForLevel(5)).toBe('Adept');
  });

  it('unlocks Expert at exactly level 6', () => {
    expect(titleForLevel(6)).toBe('Expert');
    expect(titleForLevel(9)).toBe('Expert');
  });

  it('unlocks Master at exactly level 10 and holds beyond it', () => {
    expect(titleForLevel(10)).toBe('Master');
    expect(titleForLevel(100)).toBe('Master');
  });
});

describe('applyXpGain', () => {
  it('gains xp without leveling up when below the next threshold', () => {
    const result = applyXpGain({ level: 1, xp: 0, title: 'Novice' }, 50);

    expect(result).toEqual({
      level: 1,
      xp: 50,
      title: 'Novice',
      leveledUp: false,
      unlockedTitle: null,
    });
  });

  it('levels up exactly at the threshold', () => {
    const result = applyXpGain({ level: 1, xp: 90, title: 'Novice' }, 10);

    expect(result.level).toBe(2);
    expect(result.xp).toBe(100);
    expect(result.leveledUp).toBe(true);
  });

  it('does not report a title unlock when staying within the same tier', () => {
    const result = applyXpGain({ level: 1, xp: 90, title: 'Novice' }, 10);

    expect(result.title).toBe('Novice');
    expect(result.unlockedTitle).toBeNull();
  });

  it('reports a title unlock when crossing into a new tier', () => {
    // level 2 -> level 3 crosses the Adept tier boundary (minLevel 3)
    const result = applyXpGain({ level: 2, xp: 100, title: 'Novice' }, 200);

    expect(result.level).toBe(3);
    expect(result.title).toBe('Adept');
    expect(result.unlockedTitle).toBe('Adept');
  });

  it('jumps multiple levels at once on a large xp gain', () => {
    const result = applyXpGain({ level: 1, xp: 0, title: 'Novice' }, 1000);

    expect(result.level).toBe(5);
    expect(result.title).toBe('Adept');
    expect(result.leveledUp).toBe(true);
    expect(result.unlockedTitle).toBe('Adept');
  });

  it('rejects a negative xp amount', () => {
    expect(() => applyXpGain({ level: 1, xp: 0, title: 'Novice' }, -10)).toThrow();
  });

  it('accepts a zero xp gain as a no-op', () => {
    const result = applyXpGain({ level: 2, xp: 150, title: 'Novice' }, 0);

    expect(result).toEqual({
      level: 2,
      xp: 150,
      title: 'Novice',
      leveledUp: false,
      unlockedTitle: null,
    });
  });
});

describe('levelToRadarValue', () => {
  it('is 0 at level 0 or below', () => {
    expect(levelToRadarValue(0)).toBe(0);
    expect(levelToRadarValue(-3)).toBe(0);
  });

  it('scales linearly toward level 10', () => {
    expect(levelToRadarValue(1)).toBe(10);
    expect(levelToRadarValue(5)).toBe(50);
  });

  it('reaches exactly 100 at level 10', () => {
    expect(levelToRadarValue(10)).toBe(100);
  });

  it('clamps at 100 beyond level 10', () => {
    expect(levelToRadarValue(15)).toBe(100);
    expect(levelToRadarValue(100)).toBe(100);
  });
});

describe('xpProgressToNextLevel', () => {
  it('is 0 ratio at the very start of a level', () => {
    const progress = xpProgressToNextLevel(1, 0);
    expect(progress.currentLevelXp).toBe(0);
    expect(progress.xpToNextLevel).toBe(100);
    expect(progress.ratio).toBe(0);
  });

  it('is 1 ratio exactly at the next level threshold', () => {
    const progress = xpProgressToNextLevel(1, 100);
    expect(progress.ratio).toBe(1);
  });

  it('computes a partial ratio mid-level', () => {
    const progress = xpProgressToNextLevel(2, 150);
    // level 2 starts at 100xp, level 3 starts at 300xp -> span 200, 50 earned so far
    expect(progress.currentLevelXp).toBe(50);
    expect(progress.xpToNextLevel).toBe(200);
    expect(progress.ratio).toBe(0.25);
  });

  it('clamps ratio at 1 if xp somehow exceeds the next threshold', () => {
    const progress = xpProgressToNextLevel(1, 500);
    expect(progress.ratio).toBe(1);
  });

  it('clamps ratio at 0 if xp is somehow below the current level floor', () => {
    const progress = xpProgressToNextLevel(3, 0);
    expect(progress.ratio).toBe(0);
  });
});
