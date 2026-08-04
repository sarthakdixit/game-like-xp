import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createFakeFirestoreClient } from '@/data/testUtils/fakeFirestoreClient';

import { SignedInShell } from './SignedInShell';

function fakeFirestoreClientFactory() {
  const client = createFakeFirestoreClient();
  return () => client;
}

describe('SignedInShell', () => {
  it('shows the display name when available', async () => {
    render(
      <SignedInShell
        user={{ uid: 'abc', displayName: 'Ada Lovelace', email: 'ada@example.com', photoURL: null }}
        onSignOut={vi.fn()}
        firestoreClientFactory={fakeFirestoreClientFactory()}
      />,
    );

    expect(screen.getByText('Signed in as Ada Lovelace')).toBeInTheDocument();
    await waitFor(() => screen.getByTestId('domains-list'));
  });

  it('falls back to email when display name is missing', async () => {
    render(
      <SignedInShell
        user={{ uid: 'abc', displayName: null, email: 'ada@example.com', photoURL: null }}
        onSignOut={vi.fn()}
        firestoreClientFactory={fakeFirestoreClientFactory()}
      />,
    );

    expect(screen.getByText('Signed in as ada@example.com')).toBeInTheDocument();
    await waitFor(() => screen.getByTestId('domains-list'));
  });

  it('falls back to uid when display name and email are both missing', async () => {
    render(
      <SignedInShell
        user={{ uid: 'abc-123', displayName: null, email: null, photoURL: null }}
        onSignOut={vi.fn()}
        firestoreClientFactory={fakeFirestoreClientFactory()}
      />,
    );

    expect(screen.getByText('Signed in as abc-123')).toBeInTheDocument();
    await waitFor(() => screen.getByTestId('domains-list'));
  });

  it('calls onSignOut when the button is clicked', async () => {
    const onSignOut = vi.fn();
    render(
      <SignedInShell
        user={{ uid: 'abc', displayName: 'Ada Lovelace', email: 'ada@example.com', photoURL: null }}
        onSignOut={onSignOut}
        firestoreClientFactory={fakeFirestoreClientFactory()}
      />,
    );

    screen.getByText('Sign out').click();

    expect(onSignOut).toHaveBeenCalledTimes(1);
    await waitFor(() => screen.getByTestId('domains-list'));
  });

  it('seeds and lists all 5 domains for a freshly signed-in user', async () => {
    render(
      <SignedInShell
        user={{ uid: 'abc', displayName: 'Ada Lovelace', email: 'ada@example.com', photoURL: null }}
        onSignOut={vi.fn()}
        firestoreClientFactory={fakeFirestoreClientFactory()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Health')).toBeInTheDocument();
    });
    for (const name of ['Career', 'Relationships', 'Finance', 'Growth']) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });
});
