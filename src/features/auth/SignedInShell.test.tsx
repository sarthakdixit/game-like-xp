import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { createFakeFirestoreClient } from '@/data/testUtils/fakeFirestoreClient';

import { SignedInShell, type SignedInShellProps } from './SignedInShell';

function fakeFirestoreClientFactory() {
  const client = createFakeFirestoreClient();
  return () => client;
}

function renderSignedInShell(props: SignedInShellProps) {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <SignedInShell {...props} />
    </MemoryRouter>,
  );
}

describe('SignedInShell', () => {
  it('shows the display name when available', async () => {
    renderSignedInShell({
      user: { uid: 'abc', displayName: 'Ada Lovelace', email: 'ada@example.com', photoURL: null },
      onSignOut: vi.fn(),
      firestoreClientFactory: fakeFirestoreClientFactory(),
    });

    expect(screen.getByText('Signed in as Ada Lovelace')).toBeInTheDocument();
    await waitFor(() => screen.getByTestId('home-screen'));
  });

  it('falls back to email when display name is missing', async () => {
    renderSignedInShell({
      user: { uid: 'abc', displayName: null, email: 'ada@example.com', photoURL: null },
      onSignOut: vi.fn(),
      firestoreClientFactory: fakeFirestoreClientFactory(),
    });

    expect(screen.getByText('Signed in as ada@example.com')).toBeInTheDocument();
    await waitFor(() => screen.getByTestId('home-screen'));
  });

  it('falls back to uid when display name and email are both missing', async () => {
    renderSignedInShell({
      user: { uid: 'abc-123', displayName: null, email: null, photoURL: null },
      onSignOut: vi.fn(),
      firestoreClientFactory: fakeFirestoreClientFactory(),
    });

    expect(screen.getByText('Signed in as abc-123')).toBeInTheDocument();
    await waitFor(() => screen.getByTestId('home-screen'));
  });

  it('calls onSignOut when the button is clicked', async () => {
    const onSignOut = vi.fn();
    renderSignedInShell({
      user: { uid: 'abc', displayName: 'Ada Lovelace', email: 'ada@example.com', photoURL: null },
      onSignOut,
      firestoreClientFactory: fakeFirestoreClientFactory(),
    });

    screen.getByText('Sign out').click();

    expect(onSignOut).toHaveBeenCalledTimes(1);
    await waitFor(() => screen.getByTestId('home-screen'));
  });

  it('seeds and lists all 5 domains for a freshly signed-in user', async () => {
    renderSignedInShell({
      user: { uid: 'abc', displayName: 'Ada Lovelace', email: 'ada@example.com', photoURL: null },
      onSignOut: vi.fn(),
      firestoreClientFactory: fakeFirestoreClientFactory(),
    });

    await waitFor(() => screen.getByTestId('home-screen'));
    for (const key of ['health', 'career', 'relationships', 'finance', 'growth']) {
      expect(screen.getByTestId(`domain-row-${key}`)).toBeInTheDocument();
    }
  });

  it('navigates to a domain detail screen when a domain row is clicked, and back to home', async () => {
    renderSignedInShell({
      user: { uid: 'abc', displayName: 'Ada Lovelace', email: 'ada@example.com', photoURL: null },
      onSignOut: vi.fn(),
      firestoreClientFactory: fakeFirestoreClientFactory(),
    });
    await waitFor(() => screen.getByTestId('home-screen'));

    screen.getByTestId('domain-row-health').click();

    await waitFor(() => screen.getByTestId('domain-detail-screen'));
    expect(screen.queryByTestId('home-screen')).not.toBeInTheDocument();

    screen.getByText('← Back to sheet').click();

    await waitFor(() => screen.getByTestId('home-screen'));
    expect(screen.queryByTestId('domain-detail-screen')).not.toBeInTheDocument();
  });
});
