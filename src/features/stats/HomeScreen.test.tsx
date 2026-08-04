import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createFakeFirestoreClient } from '@/data/testUtils/fakeFirestoreClient';

import { HomeScreen } from './HomeScreen';

const UID = 'user-1';

describe('HomeScreen', () => {
  it('seeds an empty user and renders all 5 domains', async () => {
    const client = createFakeFirestoreClient();

    render(<HomeScreen uid={UID} firestoreClientFactory={() => client} />);

    await waitFor(() => screen.getByTestId('home-screen'));
    for (const key of ['health', 'career', 'relationships', 'finance', 'growth']) {
      expect(screen.getByTestId(`domain-row-${key}`)).toBeInTheDocument();
    }
    expect(screen.getAllByTestId(/^domain-row-[a-z]+$/)).toHaveLength(5);
  });

  it('renders the radar chart with one axis per domain', async () => {
    const client = createFakeFirestoreClient();

    render(<HomeScreen uid={UID} firestoreClientFactory={() => client} />);

    await waitFor(() => screen.getByTestId('home-screen'));
    expect(screen.getAllByTestId(/^radar-chart-label-/)).toHaveLength(5);
  });

  it('shows a loading state before data arrives', () => {
    const client = createFakeFirestoreClient();

    render(<HomeScreen uid={UID} firestoreClientFactory={() => client} />);

    expect(screen.getByTestId('home-screen-loading')).toBeInTheDocument();
  });

  it('shows an error state when the Firestore client fails', async () => {
    const failingFactory = () => {
      throw new Error('boom');
    };

    render(<HomeScreen uid={UID} firestoreClientFactory={failingFactory} />);

    await waitFor(() => {
      expect(screen.getByTestId('home-screen-error')).toBeInTheDocument();
    });
  });

  it('calls onSelectDomain with the domain id when a row is clicked', async () => {
    const client = createFakeFirestoreClient();
    const onSelectDomain = vi.fn();

    render(
      <HomeScreen
        uid={UID}
        firestoreClientFactory={() => client}
        onSelectDomain={onSelectDomain}
      />,
    );
    await waitFor(() => screen.getByTestId('home-screen'));

    fireEvent.click(screen.getByTestId('domain-row-health'));

    expect(onSelectDomain).toHaveBeenCalledTimes(1);
    expect(typeof onSelectDomain.mock.calls[0][0]).toBe('string');
  });

  it('renders domain rows as plain (non-interactive) when onSelectDomain is not provided', async () => {
    const client = createFakeFirestoreClient();

    render(<HomeScreen uid={UID} firestoreClientFactory={() => client} />);
    await waitFor(() => screen.getByTestId('home-screen'));

    expect(screen.getByTestId('domain-row-health').tagName).toBe('DIV');
  });
});
