import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createChildStat } from '@/data/repositories/childStatsRepository';
import { createDomain } from '@/data/repositories/domainsRepository';
import { createFakeFirestoreClient } from '@/data/testUtils/fakeFirestoreClient';
import type { FirestoreClient } from '@/data/firestoreClient';

import { DomainDetailScreen } from './DomainDetailScreen';

const UID = 'user-1';

async function seedDomainWithChildStats(
  client: FirestoreClient,
  childStatCount: number,
): Promise<string> {
  const domain = await createDomain(client, UID, { key: 'health', name: 'Health', sortOrder: 0 });
  for (let i = 0; i < childStatCount; i += 1) {
    await createChildStat(client, UID, {
      domainId: domain.id,
      key: `stat-${i}`,
      name: `Stat ${i}`,
      sortOrder: i,
      value: 50,
      lastActiveAt: new Date().toISOString(),
    });
  }
  return domain.id;
}

describe('DomainDetailScreen', () => {
  it('shows a loading state before data arrives', () => {
    const client = createFakeFirestoreClient();

    render(
      <DomainDetailScreen uid={UID} domainId="health" firestoreClientFactory={() => client} />,
    );

    expect(screen.getByTestId('domain-detail-loading')).toBeInTheDocument();
  });

  it('shows a not-found state for a domain id that does not exist', async () => {
    const client = createFakeFirestoreClient();

    render(
      <DomainDetailScreen uid={UID} domainId="missing" firestoreClientFactory={() => client} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('domain-detail-not-found')).toBeInTheDocument();
    });
  });

  it('shows an error state when the Firestore client fails', async () => {
    const failingFactory = () => {
      throw new Error('boom');
    };

    render(
      <DomainDetailScreen uid={UID} domainId="health" firestoreClientFactory={failingFactory} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('domain-detail-error')).toBeInTheDocument();
    });
  });

  it('shows the domain name, level, and title', async () => {
    const client = createFakeFirestoreClient();
    const domainId = await seedDomainWithChildStats(client, 3);

    render(
      <DomainDetailScreen uid={UID} domainId={domainId} firestoreClientFactory={() => client} />,
    );

    await waitFor(() => screen.getByTestId('domain-detail-screen'));
    expect(screen.getByText(/Health · level 1/)).toBeInTheDocument();
    expect(screen.getByText('Novice')).toBeInTheDocument();
  });

  it('shows the xp bar reflecting progress to the next level', async () => {
    const client = createFakeFirestoreClient();
    const domainId = await seedDomainWithChildStats(client, 3);

    render(
      <DomainDetailScreen uid={UID} domainId={domainId} firestoreClientFactory={() => client} />,
    );

    await waitFor(() => screen.getByTestId('domain-detail-xp-bar'));
    expect(screen.getByText('0xp')).toBeInTheDocument();
    expect(screen.getByText(/next: 50xp/)).toBeInTheDocument();
  });

  it('adapts the child radar chart to 3 child stats', async () => {
    const client = createFakeFirestoreClient();
    const domainId = await seedDomainWithChildStats(client, 3);

    render(
      <DomainDetailScreen uid={UID} domainId={domainId} firestoreClientFactory={() => client} />,
    );

    await waitFor(() => screen.getByTestId('domain-detail-screen'));
    expect(screen.getAllByTestId(/^radar-chart-label-/)).toHaveLength(3);
  });

  it('adapts the child radar chart to 4 child stats', async () => {
    const client = createFakeFirestoreClient();
    const domainId = await seedDomainWithChildStats(client, 4);

    render(
      <DomainDetailScreen uid={UID} domainId={domainId} firestoreClientFactory={() => client} />,
    );

    await waitFor(() => screen.getByTestId('domain-detail-screen'));
    expect(screen.getAllByTestId(/^radar-chart-label-/)).toHaveLength(4);
  });

  it('adapts the child radar chart to 5 child stats', async () => {
    const client = createFakeFirestoreClient();
    const domainId = await seedDomainWithChildStats(client, 5);

    render(
      <DomainDetailScreen uid={UID} domainId={domainId} firestoreClientFactory={() => client} />,
    );

    await waitFor(() => screen.getByTestId('domain-detail-screen'));
    expect(screen.getAllByTestId(/^radar-chart-label-/)).toHaveLength(5);
  });

  it('renders one child stat row per stat', async () => {
    const client = createFakeFirestoreClient();
    const domainId = await seedDomainWithChildStats(client, 4);

    render(
      <DomainDetailScreen uid={UID} domainId={domainId} firestoreClientFactory={() => client} />,
    );

    await waitFor(() => screen.getByTestId('domain-detail-screen'));
    expect(screen.getAllByTestId(/^child-stat-row-/)).toHaveLength(4);
  });

  it('calls onBack when the back link is clicked', async () => {
    const client = createFakeFirestoreClient();
    const domainId = await seedDomainWithChildStats(client, 3);
    const onBack = vi.fn();

    render(
      <DomainDetailScreen
        uid={UID}
        domainId={domainId}
        firestoreClientFactory={() => client}
        onBack={onBack}
      />,
    );
    await waitFor(() => screen.getByTestId('domain-detail-screen'));

    fireEvent.click(screen.getByText('← Back to sheet'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders no back link when onBack is not provided', async () => {
    const client = createFakeFirestoreClient();
    const domainId = await seedDomainWithChildStats(client, 3);

    render(
      <DomainDetailScreen uid={UID} domainId={domainId} firestoreClientFactory={() => client} />,
    );

    await waitFor(() => screen.getByTestId('domain-detail-screen'));
    expect(screen.queryByText('← Back to sheet')).not.toBeInTheDocument();
  });
});
