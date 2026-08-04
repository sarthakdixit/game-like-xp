import { selectQuest } from './questSelection';

function fixedRandom(...values: number[]): () => number {
  let call = 0;
  return () => {
    const value = values[Math.min(call, values.length - 1)];
    call += 1;
    return value;
  };
}

describe('selectQuest', () => {
  it('throws when there are no options', () => {
    expect(() => selectQuest([])).toThrow();
  });

  it('always picks the only regular option when no boss quest exists', () => {
    const options = [{ id: 'a', isBoss: false }];
    // roll below bossChance would normally want a boss, but none exists
    const result = selectQuest(options, fixedRandom(0, 0));
    expect(result).toEqual({ id: 'a', isBoss: false });
  });

  it('always picks a boss option when only boss quests exist', () => {
    const options = [{ id: 'boss-a', isBoss: true }];
    // roll above bossChance would normally want regular, but none exists
    const result = selectQuest(options, fixedRandom(0.9, 0));
    expect(result).toEqual({ id: 'boss-a', isBoss: true });
  });

  it('picks from the regular pool when the boss roll misses', () => {
    const options = [
      { id: 'regular-a', isBoss: false },
      { id: 'boss-a', isBoss: true },
    ];
    // bossChance defaults to 0.2; 0.5 misses it
    const result = selectQuest(options, fixedRandom(0.5, 0));
    expect(result.isBoss).toBe(false);
  });

  it('picks from the boss pool when the boss roll hits', () => {
    const options = [
      { id: 'regular-a', isBoss: false },
      { id: 'boss-a', isBoss: true },
    ];
    // bossChance defaults to 0.2; 0.1 hits it
    const result = selectQuest(options, fixedRandom(0.1, 0));
    expect(result.isBoss).toBe(true);
  });

  it('respects a custom bossChance', () => {
    const options = [
      { id: 'regular-a', isBoss: false },
      { id: 'boss-a', isBoss: true },
    ];
    const result = selectQuest(options, fixedRandom(0.5, 0), 0.9);
    expect(result.isBoss).toBe(true);
  });

  it('uses the second roll to index within the chosen pool', () => {
    const options = [
      { id: 'regular-a', isBoss: false },
      { id: 'regular-b', isBoss: false },
      { id: 'regular-c', isBoss: false },
    ];
    // miss the boss roll, then pick index 1 of 3 (roll 0.5 -> floor(0.5*3)=1)
    const result = selectQuest(options, fixedRandom(0.9, 0.5));
    expect(result.id).toBe('regular-b');
  });

  it('clamps an index roll of exactly 1 to the last item', () => {
    const options = [
      { id: 'regular-a', isBoss: false },
      { id: 'regular-b', isBoss: false },
    ];
    const result = selectQuest(options, fixedRandom(0.9, 1));
    expect(result.id).toBe('regular-b');
  });
});
