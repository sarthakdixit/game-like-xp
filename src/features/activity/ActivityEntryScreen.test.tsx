import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { seedDomains } from '@/data/seed';
import { createFakeFirestoreClient } from '@/data/testUtils/fakeFirestoreClient';
import type { FirestoreClient } from '@/data/firestoreClient';

import { ActivityEntryScreen } from './ActivityEntryScreen';

const UID = 'user-1';

async function setupSeededDomains(): Promise<FirestoreClient> {
  const client = createFakeFirestoreClient();
  await seedDomains(client, UID);
  return client;
}

describe('ActivityEntryScreen', () => {
  it('shows a loading state before data arrives', () => {
    const client = createFakeFirestoreClient();

    render(<ActivityEntryScreen uid={UID} firestoreClientFactory={() => client} />);

    expect(screen.getByTestId('activity-entry-loading')).toBeInTheDocument();
  });

  it('shows an error state when the Firestore client fails', async () => {
    const failingFactory = () => {
      throw new Error('boom');
    };

    render(<ActivityEntryScreen uid={UID} firestoreClientFactory={failingFactory} />);

    await waitFor(() => {
      expect(screen.getByTestId('activity-entry-load-error')).toBeInTheDocument();
    });
  });

  it('renders the form once loaded', async () => {
    const client = await setupSeededDomains();

    render(<ActivityEntryScreen uid={UID} firestoreClientFactory={() => client} />);

    await waitFor(() => screen.getByTestId('activity-entry-form'));
  });

  it('logging activity shows the resulting Fitness/Sleep values', async () => {
    const client = await setupSeededDomains();

    render(<ActivityEntryScreen uid={UID} firestoreClientFactory={() => client} />);
    await waitFor(() => screen.getByTestId('activity-entry-form'));

    fireEvent.change(screen.getByLabelText('Steps'), { target: { value: '10000' } });
    fireEvent.change(screen.getByLabelText('Sleep (hours)'), { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText('Exercise (minutes)'), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: "Log today's activity" }));

    await waitFor(() => {
      expect(screen.getByTestId('activity-entry-success')).toHaveTextContent(
        'Saved — Fitness 30, Sleep 15.',
      );
    });
  });
});
