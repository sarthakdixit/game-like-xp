import { render, screen } from '@testing-library/react-native';
import { useCallback } from 'react';
import { Text } from 'react-native';

import { createChildStat } from '@/data/repositories/childStatsRepository';
import { createDomain } from '@/data/repositories/domainsRepository';
import { createMigratedTestDb } from '@/data/testUtils/nodeSqliteClient';
import type { SqliteClient } from '@/data/sqliteClient';

import { useDomainDetail } from './useDomainDetail';

function Harness({ domainId, db }: { domainId: string; db: SqliteClient }) {
  // Memoized so the hook's effect (keyed on this reference) doesn't re-run every render.
  const dbFactory = useCallback(() => Promise.resolve(db), [db]);
  const { domain, childStats, loading, error } = useDomainDetail(domainId, dbFactory);

  if (loading) {
    return <Text>loading</Text>;
  }
  if (error) {
    return <Text testID="harness-error">{error.message}</Text>;
  }
  return (
    <>
      <Text testID="harness-domain-name">{domain?.name ?? 'missing'}</Text>
      {childStats.map((stat) => (
        <Text key={stat.id} testID={`harness-stat-${stat.key}`}>
          {stat.name}:{Math.round(stat.displayValue)}:{stat.isDecaying ? 'decaying' : 'fresh'}
        </Text>
      ))}
    </>
  );
}

describe('useDomainDetail', () => {
  it('loads the domain and its child stats, freshly-touched stats are not decaying', async () => {
    const db = await createMigratedTestDb();
    const domain = await createDomain(db, { key: 'health', name: 'Health', sortOrder: 0 });
    const now = new Date().toISOString();
    await createChildStat(db, {
      domainId: domain.id,
      key: 'fitness',
      name: 'Fitness',
      sortOrder: 0,
      value: 65,
      lastActiveAt: now,
    });

    await render(<Harness domainId={domain.id} db={db} />);

    expect(screen.getByTestId('harness-domain-name')).toHaveTextContent('Health');
    expect(screen.getByTestId('harness-stat-fitness')).toHaveTextContent('Fitness:65:fresh');
  });

  it('marks a long-neglected stat as decaying and lowers its displayed value', async () => {
    const db = await createMigratedTestDb();
    const domain = await createDomain(db, { key: 'health', name: 'Health', sortOrder: 0 });
    const longAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    await createChildStat(db, {
      domainId: domain.id,
      key: 'sleep',
      name: 'Sleep',
      sortOrder: 0,
      value: 80,
      lastActiveAt: longAgo,
    });

    await render(<Harness domainId={domain.id} db={db} />);

    const text = screen.getByTestId('harness-stat-sleep').props.children.join('');
    expect(text).toContain('decaying');
    expect(text).not.toContain(':80:');
  });

  it('surfaces a missing domain as null rather than throwing', async () => {
    const db = await createMigratedTestDb();

    await render(<Harness domainId="missing-domain" db={db} />);

    // getDomainById resolves null rather than throwing, so this exercises the "missing" render path
    expect(screen.getByTestId('harness-domain-name')).toHaveTextContent('missing');
  });

  it('surfaces a thrown error from the database factory', async () => {
    function FailingHarness({ domainId }: { domainId: string }) {
      const dbFactory = useCallback(() => Promise.reject(new Error('db unavailable')), []);
      const { error, loading } = useDomainDetail(domainId, dbFactory);

      if (loading) {
        return <Text>loading</Text>;
      }
      return <Text testID="harness-error">{error?.message ?? 'no error'}</Text>;
    }

    await render(<FailingHarness domainId="any" />);

    expect(screen.getByTestId('harness-error')).toHaveTextContent('db unavailable');
  });
});
