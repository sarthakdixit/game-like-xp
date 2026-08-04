import { render, screen, waitFor } from '@testing-library/react';
import { useCallback } from 'react';
import { describe, expect, it } from 'vitest';

import { createFakeFirestoreClient } from '@/data/testUtils/fakeFirestoreClient';
import type { FirestoreClient } from '@/data/firestoreClient';

import { useDomains } from './useDomains';

function Harness({ uid, client }: { uid: string; client: FirestoreClient }) {
  const firestoreClientFactory = useCallback(() => client, [client]);
  const { domains, loading, error } = useDomains(uid, firestoreClientFactory);

  if (loading) {
    return <span>loading</span>;
  }
  if (error) {
    return <span data-testid="harness-error">{error.message}</span>;
  }
  return (
    <ul>
      {domains.map((d) => (
        <li key={d.id}>{d.name}</li>
      ))}
    </ul>
  );
}

describe('useDomains', () => {
  it('seeds and lists all 5 domains for a fresh user', async () => {
    const client = createFakeFirestoreClient();

    render(<Harness uid="user-1" client={client} />);

    await waitFor(() => {
      expect(screen.getByText('Health')).toBeInTheDocument();
    });
    for (const name of ['Career', 'Relationships', 'Finance', 'Growth']) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it('does not re-seed a user who already has domains', async () => {
    const client = createFakeFirestoreClient();
    render(<Harness uid="user-1" client={client} />);
    await waitFor(() => screen.getByText('Health'));

    render(<Harness uid="user-1" client={client} />);

    await waitFor(() => {
      expect(screen.getAllByText('Health')).toHaveLength(2);
    });
  });
});
