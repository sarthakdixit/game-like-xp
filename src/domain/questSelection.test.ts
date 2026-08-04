import { describe, expect, it, vi } from 'vitest';

import { selectDailyQuest, type QuestTemplate } from './questSelection';

function template(overrides: Partial<QuestTemplate>): QuestTemplate {
  return {
    id: 'q1',
    domainId: 'health',
    text: 'Do a thing',
    xpReward: 15,
    isBoss: false,
    priority: 'P1',
    ...overrides,
  };
}

/** Cycles through `values` repeatedly — one call per invocation. */
function fixedRandom(...values: number[]): () => number {
  let call = 0;
  return () => {
    const value = values[call % values.length];
    call += 1;
    return value;
  };
}

describe('selectDailyQuest', () => {
  it('throws for an empty template list', () => {
    expect(() => selectDailyQuest([])).toThrow();
  });

  it('always calls random() exactly three times, regardless of the boss roll outcome', () => {
    const templates = [template({ id: 'normal', isBoss: false })];
    const random = vi.fn(fixedRandom(0.99, 0.99, 0));

    selectDailyQuest(templates, { random });

    expect(random).toHaveBeenCalledTimes(3);
  });

  it('calls random() exactly three times even when the boss roll succeeds', () => {
    const templates = [
      template({ id: 'normal', isBoss: false }),
      template({ id: 'boss', isBoss: true }),
    ];
    const random = vi.fn(fixedRandom(0, 0.99, 0));

    selectDailyQuest(templates, { random, bossChance: 0.5 });

    expect(random).toHaveBeenCalledTimes(3);
  });

  it('picks a normal quest when the boss roll misses', () => {
    const templates = [
      template({ id: 'normal', isBoss: false }),
      template({ id: 'boss', isBoss: true }),
    ];

    const chosen = selectDailyQuest(templates, {
      random: fixedRandom(0.9, 0.9, 0), // 0.9 >= default 0.15 bossChance
      bossChance: 0.15,
    });

    expect(chosen.id).toBe('normal');
  });

  it('picks a boss quest when the boss roll hits', () => {
    const templates = [
      template({ id: 'normal', isBoss: false }),
      template({ id: 'boss', isBoss: true }),
    ];

    const chosen = selectDailyQuest(templates, {
      random: fixedRandom(0.05, 0.9, 0), // 0.05 < 0.15 bossChance
      bossChance: 0.15,
    });

    expect(chosen.id).toBe('boss');
  });

  it('treats a boss roll exactly equal to bossChance as a miss (strict less-than)', () => {
    const templates = [
      template({ id: 'normal', isBoss: false }),
      template({ id: 'boss', isBoss: true }),
    ];

    const chosen = selectDailyQuest(templates, {
      random: fixedRandom(0.15, 0.9, 0),
      bossChance: 0.15,
    });

    expect(chosen.id).toBe('normal');
  });

  it('falls back to a normal quest when the boss roll hits but no boss template exists', () => {
    const templates = [template({ id: 'only-normal', isBoss: false })];

    const chosen = selectDailyQuest(templates, {
      random: fixedRandom(0, 0.9, 0), // would want a boss, but there is none
      bossChance: 0.15,
    });

    expect(chosen.id).toBe('only-normal');
  });

  it('falls back to the full pool when every template is a boss quest and the roll misses', () => {
    const templates = [template({ id: 'only-boss', isBoss: true })];

    const chosen = selectDailyQuest(templates, {
      random: fixedRandom(0.9, 0.9, 0), // boss roll misses, but there are no normal templates either
      bossChance: 0.15,
    });

    expect(chosen.id).toBe('only-boss');
  });

  it('selects by index within the normal pool using the third random value', () => {
    const templates = [
      template({ id: 'first', isBoss: false }),
      template({ id: 'second', isBoss: false }),
      template({ id: 'third', isBoss: false }),
    ];

    expect(selectDailyQuest(templates, { random: fixedRandom(0.9, 0.9, 0) }).id).toBe('first');
    expect(selectDailyQuest(templates, { random: fixedRandom(0.9, 0.9, 0.34) }).id).toBe('second');
    expect(selectDailyQuest(templates, { random: fixedRandom(0.9, 0.9, 0.67) }).id).toBe('third');
  });

  it('clamps the index instead of going out of bounds when indexRoll is exactly 1', () => {
    const templates = [template({ id: 'only', isBoss: false })];

    const chosen = selectDailyQuest(templates, { random: fixedRandom(0.9, 0.9, 1) });

    expect(chosen.id).toBe('only');
  });

  it('respects a custom bossChance', () => {
    const templates = [
      template({ id: 'normal', isBoss: false }),
      template({ id: 'boss', isBoss: true }),
    ];

    // 0.4 would miss the default 0.15 chance but hit a widened 0.5 chance
    const chosen = selectDailyQuest(templates, {
      random: fixedRandom(0.4, 0.9, 0),
      bossChance: 0.5,
    });

    expect(chosen.id).toBe('boss');
  });

  it('produces a boss ratio close to the configured bossChance over many trials', () => {
    const templates = [
      template({ id: 'normal', isBoss: false }),
      template({ id: 'boss', isBoss: true }),
    ];
    const trials = 5000;
    let bossCount = 0;

    for (let i = 0; i < trials; i += 1) {
      if (selectDailyQuest(templates, { bossChance: 0.15 }).isBoss) {
        bossCount += 1;
      }
    }

    const ratio = bossCount / trials;
    expect(ratio).toBeGreaterThan(0.1);
    expect(ratio).toBeLessThan(0.2);
  });

  describe('P2 (occasional) tier', () => {
    it('picks a P1 quest when both the boss and P2 rolls miss', () => {
      const templates = [
        template({ id: 'p1', priority: 'P1' }),
        template({ id: 'p2', priority: 'P2' }),
        template({ id: 'boss', isBoss: true }),
      ];

      const chosen = selectDailyQuest(templates, {
        random: fixedRandom(0.9, 0.9, 0), // both rolls miss their default 0.15/0.3 chances
      });

      expect(chosen.id).toBe('p1');
    });

    it('picks a P2 quest when the P2 roll hits and the boss roll misses', () => {
      const templates = [
        template({ id: 'p1', priority: 'P1' }),
        template({ id: 'p2', priority: 'P2' }),
        template({ id: 'boss', isBoss: true }),
      ];

      const chosen = selectDailyQuest(templates, {
        random: fixedRandom(0.9, 0.1, 0), // boss roll misses (0.9), P2 roll hits (0.1 < default 0.3)
      });

      expect(chosen.id).toBe('p2');
    });

    it('prefers boss over P2 when both rolls hit', () => {
      const templates = [
        template({ id: 'p1', priority: 'P1' }),
        template({ id: 'p2', priority: 'P2' }),
        template({ id: 'boss', isBoss: true }),
      ];

      const chosen = selectDailyQuest(templates, {
        random: fixedRandom(0, 0, 0), // both rolls hit
      });

      expect(chosen.id).toBe('boss');
    });

    it('treats a P2 roll exactly equal to p2Chance as a miss (strict less-than)', () => {
      const templates = [
        template({ id: 'p1', priority: 'P1' }),
        template({ id: 'p2', priority: 'P2' }),
      ];

      const chosen = selectDailyQuest(templates, {
        random: fixedRandom(0.9, 0.3, 0),
        p2Chance: 0.3,
      });

      expect(chosen.id).toBe('p1');
    });

    it('falls back to the P1 pool when the P2 roll hits but no P2 template exists', () => {
      const templates = [template({ id: 'only-p1', priority: 'P1' })];

      const chosen = selectDailyQuest(templates, {
        random: fixedRandom(0.9, 0, 0), // wants P2, but there is none
      });

      expect(chosen.id).toBe('only-p1');
    });

    it('falls back to the P2 pool when every non-boss template is P2 (no P1 available)', () => {
      const templates = [
        template({ id: 'p2-only', priority: 'P2' }),
        template({ id: 'boss', isBoss: true }),
      ];

      const chosen = selectDailyQuest(templates, {
        random: fixedRandom(0.9, 0.9, 0), // misses boss and the P2 roll, but there's no P1 pool
      });

      expect(chosen.id).toBe('p2-only');
    });

    it('respects a custom p2Chance', () => {
      const templates = [
        template({ id: 'p1', priority: 'P1' }),
        template({ id: 'p2', priority: 'P2' }),
      ];

      // 0.5 would miss the default 0.3 chance but hit a widened 0.6 chance
      const chosen = selectDailyQuest(templates, {
        random: fixedRandom(0.9, 0.5, 0),
        p2Chance: 0.6,
      });

      expect(chosen.id).toBe('p2');
    });

    it('produces a P2 ratio close to the configured p2Chance over many trials', () => {
      const templates = [
        template({ id: 'p1', priority: 'P1' }),
        template({ id: 'p2', priority: 'P2' }),
      ];
      const trials = 5000;
      let p2Count = 0;

      for (let i = 0; i < trials; i += 1) {
        if (selectDailyQuest(templates, { bossChance: 0, p2Chance: 0.3 }).id === 'p2') {
          p2Count += 1;
        }
      }

      const ratio = p2Count / trials;
      expect(ratio).toBeGreaterThan(0.25);
      expect(ratio).toBeLessThan(0.35);
    });
  });
});
