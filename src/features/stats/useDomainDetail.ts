import { useEffect, useState } from 'react';

import { getDb } from '@/data/db';
import { listChildStatsByDomain } from '@/data/repositories/childStatsRepository';
import { getDomainById } from '@/data/repositories/domainsRepository';
import type { ChildStat, Domain } from '@/data/schema';
import type { SqliteClient } from '@/data/sqliteClient';
import { applyDecaySince, calculateDecay, daysBetween } from '@/domain/decay';

export interface DisplayChildStat extends ChildStat {
  /** The stored value with neglect decay applied for display — not persisted back. */
  displayValue: number;
  isDecaying: boolean;
}

export interface UseDomainDetailResult {
  domain: Domain | null;
  childStats: DisplayChildStat[];
  loading: boolean;
  error: Error | null;
}

function toDisplayChildStat(stat: ChildStat, now: string): DisplayChildStat {
  const daysInactive = daysBetween(stat.lastActiveAt, now);
  return {
    ...stat,
    displayValue: applyDecaySince(stat.value, stat.lastActiveAt, now),
    isDecaying: calculateDecay(daysInactive) > 0,
  };
}

/**
 * Loads a single domain and its child stats. Decay is computed live from
 * `lastActiveAt` for display only — it is not written back to the database here.
 */
export function useDomainDetail(
  domainId: string,
  dbFactory: () => Promise<SqliteClient> = getDb,
): UseDomainDetailResult {
  const [domain, setDomain] = useState<Domain | null>(null);
  const [childStats, setChildStats] = useState<DisplayChildStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const db = await dbFactory();
        const [foundDomain, stats] = await Promise.all([
          getDomainById(db, domainId),
          listChildStatsByDomain(db, domainId),
        ]);
        const now = new Date().toISOString();

        if (!cancelled) {
          setDomain(foundDomain);
          setChildStats(stats.map((stat) => toDisplayChildStat(stat, now)));
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
  }, [domainId, dbFactory]);

  return { domain, childStats, loading, error };
}
