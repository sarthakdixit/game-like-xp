export interface ActivityInput {
  steps: number;
  sleepHours: number;
  exerciseMinutes: number;
}

export interface ActivityDeltas {
  /** Points to add to the Health domain's Fitness child stat (0-100 scale). */
  fitnessDelta: number;
  /** Points to add to the Health domain's Sleep child stat (0-100 scale). */
  sleepDelta: number;
}

/** Step-count tiers contributing to the Fitness delta. */
function stepsToFitnessDelta(steps: number): number {
  if (steps >= 10_000) {
    return 15;
  }
  if (steps >= 7_000) {
    return 10;
  }
  if (steps >= 3_000) {
    return 5;
  }
  return 0;
}

/** Exercise-minute tiers, added on top of the steps contribution to the Fitness delta. */
function exerciseToFitnessDelta(minutes: number): number {
  if (minutes >= 30) {
    return 15;
  }
  if (minutes >= 15) {
    return 8;
  }
  if (minutes >= 1) {
    return 3;
  }
  return 0;
}

/**
 * Sleep-duration tiers for the Sleep delta. Oversleeping (>9h) is still
 * credited, just less than the 7-9h sweet spot — not penalized, per the
 * app's no-punitive-negative-deltas design (only decay, a separate
 * mechanism, ever reduces a child stat).
 */
function sleepHoursToSleepDelta(hours: number): number {
  if (hours > 9) {
    return 8;
  }
  if (hours >= 7) {
    return 15;
  }
  if (hours >= 5) {
    return 5;
  }
  return 0;
}

/**
 * Maps a day's manually-logged activity (steps, sleep, exercise minutes) to
 * Fitness/Sleep child-stat deltas — the same category of mapping the old
 * native HealthKit/Health Connect auto-import used, just fed by a form
 * instead of a device API (see requirements.md §6). Pure, tier-based, and
 * additive only; negative/zero inputs simply fall through to the lowest
 * (zero) tier rather than needing special-casing.
 */
export function mapActivityToDeltas(input: ActivityInput): ActivityDeltas {
  return {
    fitnessDelta: stepsToFitnessDelta(input.steps) + exerciseToFitnessDelta(input.exerciseMinutes),
    sleepDelta: sleepHoursToSleepDelta(input.sleepHours),
  };
}
