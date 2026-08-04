import {
  getActivityEntryByDate,
  saveActivityEntry,
} from '@/data/repositories/activityEntriesRepository';
import {
  getChildStatByDomainAndKey,
  updateChildStatValue,
} from '@/data/repositories/childStatsRepository';
import { getDomainByKey } from '@/data/repositories/domainsRepository';
import type { FirestoreClient } from '@/data/firestoreClient';
import type { ActivityEntry } from '@/data/schema';
import { applyDecaySince, CHILD_STAT_MAX_VALUE, CHILD_STAT_MIN_VALUE } from '@/domain/decay';
import { mapActivityToDeltas, type ActivityInput } from '@/domain/activityMapping';

const HEALTH_DOMAIN_KEY = 'health';
const FITNESS_CHILD_STAT_KEY = 'fitness';
const SLEEP_CHILD_STAT_KEY = 'sleep';

export interface SubmitActivityEntryResult {
  entry: ActivityEntry;
  /** The Fitness child stat's new value, or `null` if that child stat doesn't exist. */
  fitnessValue: number | null;
  /** The Sleep child stat's new value, or `null` if that child stat doesn't exist. */
  sleepValue: number | null;
}

/**
 * Applies `netDelta` on top of the child stat's currently-decayed value (not
 * its stale stored one) so the delta lands where the user actually sees the
 * stat right now, clamped to the 0-100 gauge, and resets its decay clock.
 */
async function applyNetDeltaToChildStat(
  client: FirestoreClient,
  uid: string,
  domainId: string,
  childStatKey: string,
  netDelta: number,
  nowIso: string,
): Promise<number | null> {
  const stat = await getChildStatByDomainAndKey(client, uid, domainId, childStatKey);
  if (!stat) {
    return null;
  }

  const caughtUpValue = applyDecaySince(stat.value, stat.lastActiveAt, nowIso);
  const nextValue = Math.min(
    CHILD_STAT_MAX_VALUE,
    Math.max(CHILD_STAT_MIN_VALUE, caughtUpValue + netDelta),
  );
  await updateChildStatValue(client, uid, domainId, stat.id, {
    value: nextValue,
    lastActiveAt: nowIso,
  });
  return nextValue;
}

/**
 * Logs a day's manually-entered activity (steps, sleep, exercise) and
 * applies its mapped Fitness/Sleep deltas to the Health domain's child
 * stats — the replacement for the old native HealthKit/Health Connect
 * auto-import (requirements.md §6).
 *
 * Idempotent per (user, date): if `date` already has a saved entry, only
 * the *change* in mapped delta since that entry — not the full new delta
 * again — gets applied, so correcting a mistyped day's numbers doesn't
 * double-count the parts that didn't change.
 */
export async function submitActivityEntry(
  client: FirestoreClient,
  uid: string,
  date: string,
  input: ActivityInput,
  now: Date = new Date(),
): Promise<SubmitActivityEntryResult> {
  const nowIso = now.toISOString();
  const { fitnessDelta, sleepDelta } = mapActivityToDeltas(input);

  const existing = await getActivityEntryByDate(client, uid, date);
  const netFitnessDelta = fitnessDelta - (existing?.fitnessDelta ?? 0);
  const netSleepDelta = sleepDelta - (existing?.sleepDelta ?? 0);

  const health = await getDomainByKey(client, uid, HEALTH_DOMAIN_KEY);
  if (!health) {
    throw new Error('Health domain not found — cannot apply activity deltas');
  }

  const fitnessValue = await applyNetDeltaToChildStat(
    client,
    uid,
    health.id,
    FITNESS_CHILD_STAT_KEY,
    netFitnessDelta,
    nowIso,
  );
  const sleepValue = await applyNetDeltaToChildStat(
    client,
    uid,
    health.id,
    SLEEP_CHILD_STAT_KEY,
    netSleepDelta,
    nowIso,
  );

  const entry = await saveActivityEntry(client, uid, {
    date,
    steps: input.steps,
    sleepHours: input.sleepHours,
    exerciseMinutes: input.exerciseMinutes,
    fitnessDelta,
    sleepDelta,
  });

  return { entry, fitnessValue, sleepValue };
}
