import type { FirestoreClient } from '@/data/firestoreClient';

import { ActivityEntryForm } from './ActivityEntryForm';
import { useActivityEntry } from './useActivityEntry';

import './ActivityEntryScreen.css';

export interface ActivityEntryScreenProps {
  uid: string;
  firestoreClientFactory?: () => FirestoreClient;
}

export function ActivityEntryScreen({ uid, firestoreClientFactory }: ActivityEntryScreenProps) {
  const { existingEntry, loading, loadError, submitting, submitError, lastResult, submit } =
    useActivityEntry(uid, firestoreClientFactory);

  return (
    <div className="activityEntryScreen" data-testid="activity-entry-screen">
      <div className="screenHead">
        <p className="day">Today</p>
        <h2 className="display">Log activity</h2>
      </div>

      {loading ? (
        <p data-testid="activity-entry-loading">Loading…</p>
      ) : loadError ? (
        <p role="alert" data-testid="activity-entry-load-error">
          Couldn&apos;t load today&apos;s activity.
        </p>
      ) : (
        <ActivityEntryForm
          initialValues={
            existingEntry
              ? {
                  steps: existingEntry.steps,
                  sleepHours: existingEntry.sleepHours,
                  exerciseMinutes: existingEntry.exerciseMinutes,
                }
              : null
          }
          submitting={submitting}
          submitError={submitError}
          lastResult={lastResult}
          onSubmit={(input) => void submit(input)}
        />
      )}
    </div>
  );
}
