import { describe, expect, it } from 'vitest';

import { mapActivityToDeltas } from './activityMapping';

function deltas(steps: number, sleepHours: number, exerciseMinutes: number) {
  return mapActivityToDeltas({ steps, sleepHours, exerciseMinutes });
}

describe('mapActivityToDeltas — steps tier (Fitness)', () => {
  it('gives no credit below 3,000 steps', () => {
    expect(deltas(0, 0, 0).fitnessDelta).toBe(0);
    expect(deltas(2_999, 0, 0).fitnessDelta).toBe(0);
  });

  it('gives +5 from 3,000 up to (not including) 7,000 steps', () => {
    expect(deltas(3_000, 0, 0).fitnessDelta).toBe(5);
    expect(deltas(6_999, 0, 0).fitnessDelta).toBe(5);
  });

  it('gives +10 from 7,000 up to (not including) 10,000 steps', () => {
    expect(deltas(7_000, 0, 0).fitnessDelta).toBe(10);
    expect(deltas(9_999, 0, 0).fitnessDelta).toBe(10);
  });

  it('gives +15 at 10,000 steps and above', () => {
    expect(deltas(10_000, 0, 0).fitnessDelta).toBe(15);
    expect(deltas(25_000, 0, 0).fitnessDelta).toBe(15);
  });
});

describe('mapActivityToDeltas — exercise-minutes tier (Fitness)', () => {
  it('gives no credit for 0 minutes', () => {
    expect(deltas(0, 0, 0).fitnessDelta).toBe(0);
  });

  it('gives +3 from 1 up to (not including) 15 minutes', () => {
    expect(deltas(0, 0, 1).fitnessDelta).toBe(3);
    expect(deltas(0, 0, 14).fitnessDelta).toBe(3);
  });

  it('gives +8 from 15 up to (not including) 30 minutes', () => {
    expect(deltas(0, 0, 15).fitnessDelta).toBe(8);
    expect(deltas(0, 0, 29).fitnessDelta).toBe(8);
  });

  it('gives +15 at 30 minutes and above', () => {
    expect(deltas(0, 0, 30).fitnessDelta).toBe(15);
    expect(deltas(0, 0, 180).fitnessDelta).toBe(15);
  });

  it('sums with the steps tier rather than replacing it', () => {
    expect(deltas(10_000, 0, 30).fitnessDelta).toBe(30); // 15 + 15
    expect(deltas(3_000, 0, 1).fitnessDelta).toBe(8); // 5 + 3
  });
});

describe('mapActivityToDeltas — sleep-hours tier (Sleep)', () => {
  it('gives no credit under 5 hours', () => {
    expect(deltas(0, 0, 0).sleepDelta).toBe(0);
    expect(deltas(0, 4.99, 0).sleepDelta).toBe(0);
  });

  it('gives +5 from 5 up to (not including) 7 hours', () => {
    expect(deltas(0, 5, 0).sleepDelta).toBe(5);
    expect(deltas(0, 6.99, 0).sleepDelta).toBe(5);
  });

  it('gives +15 from 7 up to and including 9 hours', () => {
    expect(deltas(0, 7, 0).sleepDelta).toBe(15);
    expect(deltas(0, 9, 0).sleepDelta).toBe(15);
  });

  it('gives +8 for oversleeping beyond 9 hours', () => {
    expect(deltas(0, 9.01, 0).sleepDelta).toBe(8);
    expect(deltas(0, 12, 0).sleepDelta).toBe(8);
  });
});

describe('mapActivityToDeltas — defensive bounds', () => {
  it('treats negative inputs the same as zero (falls through to the lowest tier)', () => {
    expect(deltas(-100, -5, -30)).toEqual({ fitnessDelta: 0, sleepDelta: 0 });
  });
});
