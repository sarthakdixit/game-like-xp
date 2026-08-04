import { describe, expect, it, vi } from 'vitest';

import { selectDailyQuest, type QuestTemplate } from './questSelection';

function template(overrides: Partial<QuestTemplate>): QuestTemplate {
  return {
    id: 'q1',
    domainId: 'health',
    text: 'Do a thing',
    xpReward: 15,
    isBoss: false,
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

  it('always calls random() exactly twice, regardless of the boss roll outcome', () => {
    const templates = [template({ id: 'normal', isBoss: false })];
    const random = vi.fn(fixedRandom(0.99, 0));

    selectDailyQuest(templates, { random });

    expect(random).toHaveBeenCalledTimes(2);
  });

  it('calls random() exactly twice even when the boss roll succeeds', () => {
    const templates = [
      template({ id: 'normal', isBoss: false }),
      template({ id: 'boss', isBoss: true }),
    ];
    const random = vi.fn(fixedRandom(0, 0));

    selectDailyQuest(templates, { random, bossChance: 0.5 });

    expect(random).toHaveBeenCalledTimes(2);
  });

  it('picks a normal quest when the boss roll misses', () => {
    const templates = [
      template({ id: 'normal', isBoss: false }),
      template({ id: 'boss', isBoss: true }),
    ];

    const chosen = selectDailyQuest(templates, {
      random: fixedRandom(0.9, 0), // 0.9 >= default 0.15 bossChance
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
      random: fixedRandom(0.05, 0), // 0.05 < 0.15 bossChance
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
      random: fixedRandom(0.15, 0),
      bossChance: 0.15,
    });

    expect(chosen.id).toBe('normal');
  });

  it('falls back to a normal quest when the boss roll hits but no boss template exists', () => {
    const templates = [template({ id: 'only-normal', isBoss: false })];

    const chosen = selectDailyQuest(templates, {
      random: fixedRandom(0, 0), // would want a boss, but there is none
      bossChance: 0.15,
    });

    expect(chosen.id).toBe('only-normal');
  });

  it('falls back to the full pool when every template is a boss quest and the roll misses', () => {
    const templates = [template({ id: 'only-boss', isBoss: true })];

    const chosen = selectDailyQuest(templates, {
      random: fixedRandom(0.9, 0), // boss roll misses, but there are no normal templates either
      bossChance: 0.15,
    });

    expect(chosen.id).toBe('only-boss');
  });

  it('selects by index within the normal pool using the second random value', () => {
    const templates = [
      template({ id: 'first', isBoss: false }),
      template({ id: 'second', isBoss: false }),
      template({ id: 'third', isBoss: false }),
    ];

    expect(selectDailyQuest(templates, { random: fixedRandom(0.9, 0) }).id).toBe('first');
    expect(selectDailyQuest(templates, { random: fixedRandom(0.9, 0.34) }).id).toBe('second');
    expect(selectDailyQuest(templates, { random: fixedRandom(0.9, 0.67) }).id).toBe('third');
  });

  it('clamps the index instead of going out of bounds when indexRoll is exactly 1', () => {
    const templates = [template({ id: 'only', isBoss: false })];

    const chosen = selectDailyQuest(templates, { random: fixedRandom(0.9, 1) });

    expect(chosen.id).toBe('only');
  });

  it('respects a custom bossChance', () => {
    const templates = [
      template({ id: 'normal', isBoss: false }),
      template({ id: 'boss', isBoss: true }),
    ];

    // 0.4 would miss the default 0.15 chance but hit a widened 0.5 chance
    const chosen = selectDailyQuest(templates, { random: fixedRandom(0.4, 0), bossChance: 0.5 });

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
});
