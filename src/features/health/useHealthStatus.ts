import { useCallback, useEffect, useState } from 'react';

import { getDb } from '@/data/db';
import type { HealthClient } from '@/data/healthClient';
import { getHealthClient } from '@/data/healthConnectClient';
import type { SqliteClient } from '@/data/sqliteClient';
import { getLocalDateString } from '@/domain/today';

import {
  getHealthSyncStatus,
  importHealthDataForDate,
  type HealthSyncStatus,
} from './healthImportService';

export interface UseHealthStatusResult {
  status: HealthSyncStatus | null;
  loading: boolean;
  error: Error | null;
  /** True while a manual sync (triggered via `syncNow`) is in flight. */
  syncing: boolean;
  /** Requests permission if needed, imports today's data, then reloads `status`. */
  syncNow: () => Promise<void>;
}

/**
 * Loads the current Health Connect sync status. `dbFactory`/`healthClientFactory`
 * default to the real on-device singletons; tests inject fakes instead — same
 * pattern as `useDomains`/`useDailyQuests`. Both factories are effect
 * dependencies, so pass a stable reference (defined outside the component, or
 * memoized) — a fresh function literal every render re-triggers the load on
 * every render, forever.
 */
export function useHealthStatus(
  dbFactory: () => Promise<SqliteClient> = getDb,
  healthClientFactory: () => HealthClient = getHealthClient,
): UseHealthStatusResult {
  const [status, setStatus] = useState<HealthSyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const db = await dbFactory();
      const result = await getHealthSyncStatus(db, healthClientFactory());
      setStatus(result);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(String(caught)));
    } finally {
      setLoading(false);
    }
  }, [dbFactory, healthClientFactory]);

  useEffect(() => {
    void load();
  }, [load]);

  const syncNow = useCallback(async () => {
    setSyncing(true);
    try {
      const db = await dbFactory();
      const client = healthClientFactory();
      await importHealthDataForDate(db, client, getLocalDateString());
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(String(caught)));
    } finally {
      setSyncing(false);
    }
  }, [dbFactory, healthClientFactory, load]);

  return { status, loading, error, syncing, syncNow };
}
