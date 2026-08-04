import { applyDecay, applyDecaySince, calculateDecay, daysBetween } from './decay';

describe('daysBetween', () => {
  it('is 0 for the same timestamp', () => {
    expect(daysBetween('2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')).toBe(0);
  });

  it('is 0 for less than a full day apart', () => {
    expect(daysBetween('2026-01-01T00:00:00.000Z', '2026-01-01T12:00:00.000Z')).toBe(0);
  });

  it('is 1 for exactly 24 hours apart', () => {
    expect(daysBetween('2026-01-01T00:00:00.000Z', '2026-01-02T00:00:00.000Z')).toBe(1);
  });

  it('floors a partial extra day', () => {
    expect(daysBetween('2026-01-01T00:00:00.000Z', '2026-01-02T12:00:00.000Z')).toBe(1);
  });

  it('counts multiple whole days', () => {
    expect(daysBetween('2026-01-01T00:00:00.000Z', '2026-01-03T00:00:00.000Z')).toBe(2);
  });

  it('clamps a negative gap (clock skew) to 0', () => {
    expect(daysBetween('2026-01-05T00:00:00.000Z', '2026-01-01T00:00:00.000Z')).toBe(0);
  });
});

describe('calculateDecay', () => {
  it('is 0 within the grace period (0 or 1 day inactive)', () => {
    expect(calculateDecay(0)).toBe(0);
    expect(calculateDecay(1)).toBe(0);
  });

  it('starts decaying the day after the grace period', () => {
    expect(calculateDecay(2)).toBe(3);
  });

  it('scales linearly with days beyond the grace period', () => {
    expect(calculateDecay(5)).toBe(12);
    expect(calculateDecay(10)).toBe(27);
  });

  it('keeps growing for very large gaps (capping happens in applyDecay, not here)', () => {
    expect(calculateDecay(1000)).toBe(999 * 3);
  });
});

describe('applyDecay', () => {
  it('leaves the value unchanged within the grace period', () => {
    expect(applyDecay(50, 0)).toBe(50);
    expect(applyDecay(50, 1)).toBe(50);
  });

  it('subtracts the decay amount once the grace period has passed', () => {
    expect(applyDecay(50, 2)).toBe(47);
  });

  it('clamps at 0 rather than going negative', () => {
    expect(applyDecay(10, 5)).toBe(0);
  });

  it('stays at 0 once already at 0', () => {
    expect(applyDecay(0, 10)).toBe(0);
  });

  it('decays fully to 0 across a long reinstall gap', () => {
    expect(applyDecay(100, 400)).toBe(0);
  });
});

describe('applyDecaySince', () => {
  it('does not decay a stat touched today', () => {
    const result = applyDecaySince(80, '2026-08-04T09:00:00.000Z', '2026-08-04T18:00:00.000Z');
    expect(result).toBe(80);
  });

  it('decays a stat neglected for a few days', () => {
    const result = applyDecaySince(80, '2026-08-01T00:00:00.000Z', '2026-08-04T00:00:00.000Z');
    // 3 days inactive, 1 day grace -> 2 decaying days * 3 = 6
    expect(result).toBe(74);
  });

  it('decays fully to 0 across an app-reinstall date gap', () => {
    const result = applyDecaySince(90, '2025-01-01T00:00:00.000Z', '2026-08-04T00:00:00.000Z');
    expect(result).toBe(0);
  });
});
