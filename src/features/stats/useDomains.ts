import { useEffect, useState } from 'react';

import { getFirestoreClient } from '@/data/firestore';
import type { FirestoreClient } from '@/data/firestoreClient';
import { listDomains } from '@/data/repositories/domainsRepository';
import type { Domain } from '@/data/schema';
import { ensureSeeded } from '@/data/seed';

export interface UseDomainsResult {
  domains: Domain[];
  loading: boolean;
  error: Error | null;
}

/**
 * Loads the 5 domains for the character sheet, seeding a fresh user's
 * Firestore data first if needed. `firestoreClientFactory` defaults to the
 * real on-device singleton; tests inject a fake instead — same pattern as
 * the auth hooks. Pass a stable reference (defined outside the component, or
 * memoized) since it's an effect dependency.
 */
export function useDomains(
  uid: string,
  firestoreClientFactory: () => FirestoreClient = getFirestoreClient,
): UseDomainsResult {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const client = firestoreClientFactory();
        await ensureSeeded(client, uid);
        const result = await listDomains(client, uid);
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
  }, [uid, firestoreClientFactory]);

  return { domains, loading, error };
}
