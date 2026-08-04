import { render, screen, waitFor } from '@testing-library/react';
import { useCallback } from 'react';
import { describe, expect, it } from 'vitest';

import { createChildStat } from '@/data/repositories/childStatsRepository';
import { createDomain } from '@/data/repositories/domainsRepository';
import { createFakeFirestoreClient } from '@/data/testUtils/fakeFirestoreClient';
import type { FirestoreClient } from '@/data/firestoreClient';

import { useDomainDetail } from './useDomainDetail';

const UID = 'user-1';

function Harness({ domainId, client }: { domainId: string; client: FirestoreClient }) {
  const factory = useCallback(() => client, [client]);
  const { domain, childStats, loading, error } = useDomainDetail(UID, domainId, factory);

  if (loading) {
    return <span>loading</span>;
  }
  if (error) {
    return <span data-testid="harness-error">{error.message}</span>;
  }

  return (
    <>
      <span data-testid="harness-domain-name">{domain?.name ?? 'null'}</span>
      <ul>
        {childStats.map((stat) => (
          <li key={stat.id} data-testid={`harness-stat-${stat.key}`}>
            {stat.name}:{stat.displayValue}:{stat.isDecaying ? 'decaying' : 'fresh'}
          </li>
        ))}
      </ul>
    </>
  );
}

describe('useDomainDetail', () => {
  it('loads the domain and its child stats ordered by sortOrder', async () => {
    const client = createFakeFirestoreClient();
    const domain = await createDomain(client, UID, { key: 'health', name: 'Health', sortOrder: 0 });
    const rightNow = new Date().toISOString();
    await createChildStat(client, UID, {
      domainId: domain.id,
      key: 'sleep',
      name: 'Sleep',
      sortOrder: 1,
      value: 50,
      lastActiveAt: rightNow,
    });
    await createChildStat(client, UID, {
      domainId: domain.id,
      key: 'fitness',
      name: 'Fitness',
      sortOrder: 0,
      value: 60,
      lastActiveAt: rightNow,
    });

    render(<Harness domainId={domain.id} client={client} />);

    await waitFor(() => screen.getByTestId('harness-domain-name'));
    expect(screen.getByTestId('harness-domain-name')).toHaveTextContent('Health');
    const items = screen.getAllByTestId(/^harness-stat-/);
    expect(items.map((i) => i.textContent?.split(':')[0])).toEqual(['Fitness', 'Sleep']);
  });

  it('does not apply decay within the grace period', async () => {
    const client = createFakeFirestoreClient();
    const domain = await createDomain(client, UID, { key: 'health', name: 'Health', sortOrder: 0 });
    await createChildStat(client, UID, {
      domainId: domain.id,
      key: 'fitness',
      name: 'Fitness',
      sortOrder: 0,
      value: 60,
      lastActiveAt: new Date().toISOString(), // right now, well within the grace period
    });

    render(<Harness domainId={domain.id} client={client} />);

    await waitFor(() => screen.getByTestId('harness-stat-fitness'));
    expect(screen.getByTestId('harness-stat-fitness')).toHaveTextContent('Fitness:60:fresh');
  });

  it('applies decay and flags a long-neglected stat as decaying', async () => {
    const client = createFakeFirestoreClient();
    const domain = await createDomain(client, UID, { key: 'health', name: 'Health', sortOrder: 0 });
    await createChildStat(client, UID, {
      domainId: domain.id,
      key: 'fitness',
      name: 'Fitness',
      sortOrder: 0,
      value: 60,
      lastActiveAt: '2020-01-01T00:00:00.000Z', // long stale relative to real "now"
    });

    render(<Harness domainId={domain.id} client={client} />);

    await waitFor(() => screen.getByTestId('harness-stat-fitness'));
    const text = screen.getByTestId('harness-stat-fitness').textContent!;
    expect(text).toContain(':decaying');
    expect(text).toContain('Fitness:0:'); // fully decayed to the floor over such a long gap
  });

  it('surfaces a database error', async () => {
    function FailingHarness() {
      const factory = useCallback(() => {
        throw new Error('boom');
      }, []);
      const { error, loading } = useDomainDetail(UID, 'health', factory);
      if (loading) {
        return <span>loading</span>;
      }
      return <span data-testid="harness-error">{error?.message ?? 'no error'}</span>;
    }

    render(<FailingHarness />);

    await waitFor(() => screen.getByTestId('harness-error'));
    expect(screen.getByTestId('harness-error')).toHaveTextContent('boom');
  });
});
