import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createFakeAuthClient } from '@/data/testUtils/fakeAuthClient';

import { App } from './App';

describe('App', () => {
  it('shows the sign-in screen when signed out', async () => {
    const client = createFakeAuthClient(null);

    render(<App authClientFactory={() => client} />);

    await waitFor(() => {
      expect(screen.getByTestId('sign-in-screen')).toBeInTheDocument();
    });
    expect(screen.getByText('Chronicle')).toBeInTheDocument();
  });

  it('shows the signed-in shell when a user is already authenticated', async () => {
    const client = createFakeAuthClient({
      uid: 'abc',
      displayName: 'Ada Lovelace',
      email: 'ada@example.com',
      photoURL: null,
    });

    render(<App authClientFactory={() => client} />);

    await waitFor(() => {
      expect(screen.getByTestId('signed-in-shell')).toBeInTheDocument();
    });
    expect(screen.getByText('Signed in as Ada Lovelace')).toBeInTheDocument();
  });

  it('moves from sign-in to signed-in shell after clicking sign in', async () => {
    const client = createFakeAuthClient(null);
    render(<App authClientFactory={() => client} />);
    await waitFor(() => screen.getByTestId('sign-in-screen'));

    screen.getByText('Sign in with Google').click();

    await waitFor(() => {
      expect(screen.getByTestId('signed-in-shell')).toBeInTheDocument();
    });
  });

  it('moves from signed-in shell back to sign-in after clicking sign out', async () => {
    const client = createFakeAuthClient({
      uid: 'abc',
      displayName: 'Ada Lovelace',
      email: 'ada@example.com',
      photoURL: null,
    });
    render(<App authClientFactory={() => client} />);
    await waitFor(() => screen.getByTestId('signed-in-shell'));

    screen.getByText('Sign out').click();

    await waitFor(() => {
      expect(screen.getByTestId('sign-in-screen')).toBeInTheDocument();
    });
  });
});
