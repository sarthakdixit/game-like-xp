import type { FirestoreClient } from '../firestoreClient';
import { activityEntryPath } from '../paths';
import type { ActivityEntry } from '../schema';

export interface SaveActivityEntryInput {
  date: string;
  steps: number;
  sleepHours: number;
  exerciseMinutes: number;
  fitnessDelta: number;
  sleepDelta: number;
}

/**
 * `date` doubles as the document id — one entry per user per day, same
 * idempotent-id pattern as domains/child stats/daily quests. Correcting an
 * already-logged day overwrites that same document instead of creating a
 * second one for the day.
 */
export async function saveActivityEntry(
  client: FirestoreClient,
  uid: string,
  input: SaveActivityEntryInput,
): Promise<ActivityEntry> {
  const entry: ActivityEntry = {
    id: input.date,
    date: input.date,
    steps: input.steps,
    sleepHours: input.sleepHours,
    exerciseMinutes: input.exerciseMinutes,
    fitnessDelta: input.fitnessDelta,
    sleepDelta: input.sleepDelta,
    loggedAt: new Date().toISOString(),
  };

  await client.setDoc(activityEntryPath(uid, input.date), entry);
  return entry;
}

export async function getActivityEntryByDate(
  client: FirestoreClient,
  uid: string,
  date: string,
): Promise<ActivityEntry | null> {
  return client.getDoc<ActivityEntry>(activityEntryPath(uid, date));
}
