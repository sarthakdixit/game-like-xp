import { useCallback, useEffect, useState } from 'react';

import { ensureSeeded } from '@/data/bootstrap';
import { getDb } from '@/data/db';
import { listDomains } from '@/data/repositories/domainsRepository';
import type { Domain } from '@/data/schema';
import type { SqliteClient } from '@/data/sqliteClient';

export interface UseDomainsResult {
  domains: Domain[];
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

/**
 * Loads the 5 domains for the character sheet, seeding a fresh database first if needed.
 * `dbFactory` defaults to the real on-device database; tests inject a node:sqlite double instead.
 */
export function useDomains(dbFactory: () => Promise<SqliteClient> = getDb): UseDomainsResult {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const db = await dbFactory();
        await ensureSeeded(db);
        const result = await listDomains(db);
        if (!cancelled) {
          setDomains(result);
          setError(null);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught : new Error(String(caught)));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [dbFactory, reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  return { domains, loading, error, reload };
}
