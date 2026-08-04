import { act, render, screen, waitFor } from '@testing-library/react';
import { useCallback } from 'react';
import { describe, expect, it } from 'vitest';

import type { AuthClient } from '@/data/authClient';
import { createFakeAuthClient, type FakeAuthClient } from '@/data/testUtils/fakeAuthClient';

import { useAuth } from './useAuth';

function Harness({ client }: { client: AuthClient }) {
  const authClientFactory = useCallback(() => client, [client]);
  const { user, loading, error, signIn, signOut } = useAuth(authClientFactory);

  if (loading) {
    return <span>loading</span>;
  }

  return (
    <>
      <span data-testid="user">{user ? user.displayName : 'signed-out'}</span>
      <span data-testid="error">{error?.message ?? 'no-error'}</span>
      <button onClick={() => void signIn()}>Sign in</button>
      <button onClick={() => void signOut()}>Sign out</button>
    </>
  );
}

describe('useAuth', () => {
  it('starts signed out when the fake client has no initial user', () => {
    const client = createFakeAuthClient(null);

    render(<Harness client={client} />);

    expect(screen.getByTestId('user')).toHaveTextContent('signed-out');
  });

  it('reflects an already-signed-in user on mount', () => {
    const client = createFakeAuthClient({
      uid: 'abc',
      displayName: 'Ada Lovelace',
      email: 'ada@example.com',
      photoURL: null,
    });

    render(<Harness client={client} />);

    expect(screen.getByTestId('user')).toHaveTextContent('Ada Lovelace');
  });

  it('updates to signed-in after calling signIn', async () => {
    const client: FakeAuthClient = createFakeAuthClient(null);
    render(<Harness client={client} />);

    screen.getByText('Sign in').click();

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });
  });

  it('updates to signed-out after calling signOut', async () => {
    const client = createFakeAuthClient({
      uid: 'abc',
      displayName: 'Ada Lovelace',
      email: 'ada@example.com',
      photoURL: null,
    });
    render(<Harness client={client} />);

    screen.getByText('Sign out').click();

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('signed-out');
    });
  });

  it('reacts to auth state pushed directly via setUser (e.g. another tab signing out)', async () => {
    const client = createFakeAuthClient({
      uid: 'abc',
      displayName: 'Ada Lovelace',
      email: 'ada@example.com',
      photoURL: null,
    });
    render(<Harness client={client} />);

    act(() => {
      client.setUser(null);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('signed-out');
    });
  });
});
