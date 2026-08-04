import { useEffect, useState } from 'react';

import { getFirestoreClient } from '@/data/firestore';
import type { FirestoreClient } from '@/data/firestoreClient';
import { listChildStatsByDomain } from '@/data/repositories/childStatsRepository';
import { getDomainById } from '@/data/repositories/domainsRepository';
import type { Domain } from '@/data/schema';
import { applyDecay, calculateDecay, daysBetween } from '@/domain/decay';

export interface ChildStatDisplay {
  id: string;
  key: string;
  name: string;
  sortOrder: number;
  /** Current value with neglect decay already applied — never persisted, only computed for display. */
  displayValue: number;
  isDecaying: boolean;
}

export interface UseDomainDetailResult {
  domain: Domain | null;
  childStats: ChildStatDisplay[];
  loading: boolean;
  error: Error | null;
}

/**
 * Loads a single domain and its child stats, applying `domain/decay.ts`'s
 * neglect math to each child stat's value at read time — decay is never
 * written back to Firestore, it's purely a display transformation computed
 * fresh against the current time on every load.
 */
export function useDomainDetail(
  uid: string,
  domainId: string,
  firestoreClientFactory: () => FirestoreClient = getFirestoreClient,
): UseDomainDetailResult {
  const [domain, setDomain] = useState<Domain | null>(null);
  const [childStats, setChildStats] = useState<ChildStatDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const client = firestoreClientFactory();
        const [domainResult, statsResult] = await Promise.all([
          getDomainById(client, uid, domainId),
          listChildStatsByDomain(client, uid, domainId),
        ]);

        if (cancelled) {
          return;
        }

        const now = new Date().toISOString();
        const display = statsResult.map((stat) => {
          const daysInactive = daysBetween(stat.lastActiveAt, now);
          return {
            id: stat.id,
            key: stat.key,
            name: stat.name,
            sortOrder: stat.sortOrder,
            displayValue: applyDecay(stat.value, daysInactive),
            isDecaying: calculateDecay(daysInactive) > 0,
          };
        });

        setDomain(domainResult);
        setChildStats(display);
        setError(null);
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
  }, [uid, domainId, firestoreClientFactory]);

  return { domain, childStats, loading, error };
}
