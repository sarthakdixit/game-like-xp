import { calculateDecay, daysBetween } from '@/domain/decay';

import { listChildStatsByDomain } from './repositories/childStatsRepository';
import { listDomains } from './repositories/domainsRepository';
import type { SqliteClient } from './sqliteClient';

/** Names of domains with at least one child stat currently decaying from neglect. */
export async function getDecayingDomainNames(
  db: SqliteClient,
  now: string = new Date().toISOString(),
): Promise<string[]> {
  const domains = await listDomains(db);
  const decaying: string[] = [];

  for (const domain of domains) {
    const childStats = await listChildStatsByDomain(db, domain.id);
    const isDecaying = childStats.some(
      (stat) => calculateDecay(daysBetween(stat.lastActiveAt, now)) > 0,
    );
    if (isDecaying) {
      decaying.push(domain.name);
    }
  }

  return decaying;
}
