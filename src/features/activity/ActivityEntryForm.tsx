import { useState, type FormEvent } from 'react';

import type { ActivityInput } from '@/domain/activityMapping';

import type { SubmitActivityEntryResult } from './activityEntryService';

import './ActivityEntryForm.css';

const MAX_STEPS = 100_000;
const MAX_SLEEP_HOURS = 24;
const MAX_EXERCISE_MINUTES = 24 * 60;

export interface ActivityEntryFormProps {
  /** Today's already-saved values to pre-fill, or `null` for a fresh, unlogged day. */
  initialValues: ActivityInput | null;
  submitting: boolean;
  submitError: Error | null;
  lastResult: SubmitActivityEntryResult | null;
  onSubmit: (input: ActivityInput) => void;
}

function parseNonNegativeNumber(raw: string): number {
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

/**
 * A form for today's steps/sleep/exercise — replaces the old native
 * HealthKit/Health Connect auto-import (requirements.md §6). Submitting
 * again the same day corrects rather than double-counts, per
 * `activityEntryService.submitActivityEntry`.
 */
export function ActivityEntryForm({
  initialValues,
  submitting,
  submitError,
  lastResult,
  onSubmit,
}: ActivityEntryFormProps) {
  const [steps, setSteps] = useState(initialValues?.steps ?? 0);
  const [sleepHours, setSleepHours] = useState(initialValues?.sleepHours ?? 0);
  const [exerciseMinutes, setExerciseMinutes] = useState(initialValues?.exerciseMinutes ?? 0);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Only `min` is set on the inputs themselves — adding `max` there would trigger the browser's
  // own constraint validation and silently block the submit event before this ever runs.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (steps < 0 || steps > MAX_STEPS) {
      setValidationError(`Steps must be between 0 and ${MAX_STEPS}.`);
      return;
    }
    if (sleepHours < 0 || sleepHours > MAX_SLEEP_HOURS) {
      setValidationError(`Sleep hours must be between 0 and ${MAX_SLEEP_HOURS}.`);
      return;
    }
    if (exerciseMinutes < 0 || exerciseMinutes > MAX_EXERCISE_MINUTES) {
      setValidationError(`Exercise minutes must be between 0 and ${MAX_EXERCISE_MINUTES}.`);
      return;
    }

    setValidationError(null);
    onSubmit({ steps, sleepHours, exerciseMinutes });
  }

  return (
    <form className="activityEntryForm" onSubmit={handleSubmit} data-testid="activity-entry-form">
      <div className="field">
        <label htmlFor="activity-steps">Steps</label>
        <input
          id="activity-steps"
          type="number"
          min={0}
          value={steps}
          onChange={(event) => setSteps(parseNonNegativeNumber(event.target.value))}
        />
      </div>

      <div className="field">
        <label htmlFor="activity-sleep-hours">Sleep (hours)</label>
        <input
          id="activity-sleep-hours"
          type="number"
          min={0}
          step={0.5}
          value={sleepHours}
          onChange={(event) => setSleepHours(parseNonNegativeNumber(event.target.value))}
        />
      </div>

      <div className="field">
        <label htmlFor="activity-exercise-minutes">Exercise (minutes)</label>
        <input
          id="activity-exercise-minutes"
          type="number"
          min={0}
          value={exerciseMinutes}
          onChange={(event) => setExerciseMinutes(parseNonNegativeNumber(event.target.value))}
        />
      </div>

      {validationError ? (
        <p role="alert" data-testid="activity-entry-validation-error">
          {validationError}
        </p>
      ) : null}

      {submitError ? (
        <p role="alert" data-testid="activity-entry-submit-error">
          Couldn&apos;t save today&apos;s activity.
        </p>
      ) : null}

      <button type="submit" disabled={submitting}>
        {submitting
          ? 'Saving…'
          : initialValues
            ? "Update today's activity"
            : "Log today's activity"}
      </button>

      {lastResult ? (
        <p data-testid="activity-entry-success">
          Saved — Fitness {lastResult.fitnessValue ?? '—'}, Sleep {lastResult.sleepValue ?? '—'}.
        </p>
      ) : null}
    </form>
  );
}
