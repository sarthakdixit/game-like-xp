/** One day's raw health data, aggregated from the platform health API. */
export interface DailyHealthSample {
  steps: number;
  sleepMinutes: number;
  exerciseMinutes: number;
}

/** Value-gauge deltas to apply to the Health domain's child stats. */
export interface HealthStatDeltas {
  fitnessDelta: number;
  sleepDelta: number;
}

/** Step-count tiers, checked from highest to lowest; the first tier the count clears wins. */
const STEP_TIERS: readonly { minSteps: number; delta: number }[] = [
  { minSteps: 12000, delta: 14 },
  { minSteps: 8000, delta: 10 },
  { minSteps: 5000, delta: 6 },
  { minSteps: 2000, delta: 3 },
  { minSteps: 0, delta: 0 },
];

/** Minutes of exercise per +1 fitness point, capped so a single huge workout can't dominate a day. */
const EXERCISE_MINUTES_PER_POINT = 10;
const MAX_EXERCISE_DELTA = 10;

export function fitnessDeltaFromSteps(steps: number): number {
  const tier = STEP_TIERS.find((t) => steps >= t.minSteps);
  return tier ? tier.delta : 0;
}

export function fitnessDeltaFromExercise(exerciseMinutes: number): number {
  return Math.min(MAX_EXERCISE_DELTA, Math.floor(exerciseMinutes / EXERCISE_MINUTES_PER_POINT));
}

/**
 * Sleep tiers centered on the 7-9h range sleep science treats as ideal for adults;
 * both under- and oversleeping award less than a night in that range.
 */
const SLEEP_TIERS: readonly { minMinutes: number; maxMinutes: number; delta: number }[] = [
  { minMinutes: 420, maxMinutes: 540, delta: 12 }, // 7-9h: ideal
  { minMinutes: 360, maxMinutes: 420, delta: 7 }, // 6-7h
  { minMinutes: 540, maxMinutes: 600, delta: 7 }, // 9-10h
  { minMinutes: 240, maxMinutes: 360, delta: 3 }, // 4-6h
  { minMinutes: 600, maxMinutes: Infinity, delta: 3 }, // 10h+: oversleeping
  { minMinutes: 0, maxMinutes: 240, delta: 0 }, // under 4h
];

export function sleepDeltaFromMinutes(sleepMinutes: number): number {
  const tier = SLEEP_TIERS.find((t) => sleepMinutes >= t.minMinutes && sleepMinutes < t.maxMinutes);
  return tier ? tier.delta : 0;
}

export function mapHealthSampleToStatDeltas(sample: DailyHealthSample): HealthStatDeltas {
  return {
    fitnessDelta:
      fitnessDeltaFromSteps(sample.steps) + fitnessDeltaFromExercise(sample.exerciseMinutes),
    sleepDelta: sleepDeltaFromMinutes(sample.sleepMinutes),
  };
}
