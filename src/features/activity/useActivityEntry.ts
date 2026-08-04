import { useCallback, useEffect, useState } from 'react';

import { getActivityEntryByDate } from '@/data/repositories/activityEntriesRepository';
import type { FirestoreClient } from '@/data/firestoreClient';
import { getFirestoreClient } from '@/data/firestore';
import type { ActivityEntry } from '@/data/schema';
import type { ActivityInput } from '@/domain/activityMapping';
import { todayLocalDate } from '@/domain/localDate';

import { submitActivityEntry, type SubmitActivityEntryResult } from './activityEntryService';

export interface UseActivityEntryResult {
  /** Today's already-saved entry, if the user has logged today already — used to pre-fill the form. */
  existingEntry: ActivityEntry | null;
  loading: boolean;
  loadError: Error | null;
  submitting: boolean;
  submitError: Error | null;
  lastResult: SubmitActivityEntryResult | null;
  submit: (input: ActivityInput) => Promise<void>;
}

/**
 * Loads today's already-saved activity entry (if any) and exposes `submit`,
 * wired through `activityEntryService.submitActivityEntry` — idempotent
 * per day, so calling `submit` again today corrects rather than double-
 * counts.
 */
export function useActivityEntry(
  uid: string,
  firestoreClientFactory: () => FirestoreClient = getFirestoreClient,
): UseActivityEntryResult {
  const [existingEntry, setExistingEntry] = useState<ActivityEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<Error | null>(null);
  const [lastResult, setLastResult] = useState<SubmitActivityEntryResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const client = firestoreClientFactory();
        const entry = await getActivityEntryByDate(client, uid, todayLocalDate());
        if (!cancelled) {
          setExistingEntry(entry);
          setLoading(false);
        }
      } catch (caught) {
        if (!cancelled) {
          setLoadError(caught instanceof Error ? caught : new Error(String(caught)));
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [uid, firestoreClientFactory]);

  const submit = useCallback(
    async (input: ActivityInput) => {
      setSubmitting(true);
      setSubmitError(null);
      try {
        const client = firestoreClientFactory();
        const result = await submitActivityEntry(client, uid, todayLocalDate(), input);
        setExistingEntry(result.entry);
        setLastResult(result);
      } catch (caught) {
        setSubmitError(caught instanceof Error ? caught : new Error(String(caught)));
      } finally {
        setSubmitting(false);
      }
    },
    [uid, firestoreClientFactory],
  );

  return { existingEntry, loading, loadError, submitting, submitError, lastResult, submit };
}
