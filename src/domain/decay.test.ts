import { describe, expect, it } from 'vitest';

import {
  applyDecay,
  applyDecaySince,
  calculateDecay,
  CHILD_STAT_MAX_VALUE,
  CHILD_STAT_MIN_VALUE,
  daysBetween,
} from './decay';

describe('daysBetween', () => {
  it('is 0 for the same instant', () => {
    expect(daysBetween('2026-08-01T00:00:00.000Z', '2026-08-01T00:00:00.000Z')).toBe(0);
  });

  it('is 0 for less than a full day apart', () => {
    expect(daysBetween('2026-08-01T00:00:00.000Z', '2026-08-01T23:59:59.999Z')).toBe(0);
  });

  it('is 1 for exactly one day apart', () => {
    expect(daysBetween('2026-08-01T00:00:00.000Z', '2026-08-02T00:00:00.000Z')).toBe(1);
  });

  it('floors a partial extra day', () => {
    expect(daysBetween('2026-08-01T00:00:00.000Z', '2026-08-03T12:00:00.000Z')).toBe(2);
  });

  it('counts a long multi-day gap correctly', () => {
    expect(daysBetween('2026-01-01T00:00:00.000Z', '2026-08-01T00:00:00.000Z')).toBe(212);
  });

  it('clamps to 0 when `to` is before `from` (clock skew)', () => {
    expect(daysBetween('2026-08-02T00:00:00.000Z', '2026-08-01T00:00:00.000Z')).toBe(0);
  });
});

describe('calculateDecay', () => {
  it('is 0 with no days inactive', () => {
    expect(calculateDecay(0)).toBe(0);
  });

  it('is 0 exactly at the grace period boundary', () => {
    expect(calculateDecay(1)).toBe(0);
  });

  it('starts decaying the day after the grace period', () => {
    expect(calculateDecay(2)).toBe(4);
  });

  it('accumulates linearly beyond the grace period', () => {
    expect(calculateDecay(3)).toBe(8);
    expect(calculateDecay(5)).toBe(16);
  });

  it('produces a large decay amount across a long gap', () => {
    expect(calculateDecay(30)).toBe((30 - 1) * 4);
  });
});

describe('applyDecay', () => {
  it('leaves the value unchanged within the grace period', () => {
    expect(applyDecay(80, 1)).toBe(80);
  });

  it('subtracts the decay amount once past the grace period', () => {
    expect(applyDecay(80, 2)).toBe(76);
  });

  it('clamps at the minimum value instead of going negative', () => {
    expect(applyDecay(10, 10)).toBe(CHILD_STAT_MIN_VALUE);
  });

  it('clamps at the minimum value across a very long neglect gap', () => {
    expect(applyDecay(100, 1000)).toBe(CHILD_STAT_MIN_VALUE);
  });

  it('never needs to clamp at the maximum value (decay only subtracts)', () => {
    expect(applyDecay(CHILD_STAT_MAX_VALUE, 0)).toBe(CHILD_STAT_MAX_VALUE);
  });
});

describe('applyDecaySince', () => {
  it('applies no decay for same-day activity', () => {
    const value = applyDecaySince(50, '2026-08-01T09:00:00.000Z', '2026-08-01T18:00:00.000Z');
    expect(value).toBe(50);
  });

  it('applies decay proportional to the gap since last active', () => {
    const value = applyDecaySince(50, '2026-08-01T00:00:00.000Z', '2026-08-04T00:00:00.000Z');
    // 3 days inactive, 1 grace day => 2 decaying days * 4 = 8
    expect(value).toBe(42);
  });

  it('fully decays a stat across a multi-month gap (e.g. reinstall after a long absence)', () => {
    const value = applyDecaySince(75, '2026-01-01T00:00:00.000Z', '2026-08-01T00:00:00.000Z');
    expect(value).toBe(CHILD_STAT_MIN_VALUE);
  });
});
