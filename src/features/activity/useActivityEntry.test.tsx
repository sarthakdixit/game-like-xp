import { render, screen, waitFor } from '@testing-library/react';
import { useCallback } from 'react';
import { describe, expect, it } from 'vitest';

import { seedDomains } from '@/data/seed';
import { createFakeFirestoreClient } from '@/data/testUtils/fakeFirestoreClient';
import type { FirestoreClient } from '@/data/firestoreClient';
import { todayLocalDate } from '@/domain/localDate';

import { submitActivityEntry } from './activityEntryService';
import { useActivityEntry } from './useActivityEntry';

const UID = 'user-1';

function Harness({ client }: { client: FirestoreClient }) {
  const factory = useCallback(() => client, [client]);
  const { existingEntry, loading, loadError, submitting, submitError, lastResult, submit } =
    useActivityEntry(UID, factory);

  if (loading) {
    return <span>loading</span>;
  }
  if (loadError) {
    return <span data-testid="harness-load-error">{loadError.message}</span>;
  }

  return (
    <>
      <span data-testid="harness-existing">
        {existingEntry ? `${existingEntry.steps}:${existingEntry.sleepHours}` : 'none'}
      </span>
      <span data-testid="harness-submitting">{submitting ? 'yes' : 'no'}</span>
      {submitError ? <span data-testid="harness-submit-error">{submitError.message}</span> : null}
      {lastResult ? (
        <span data-testid="harness-result">
          {lastResult.fitnessValue}:{lastResult.sleepValue}
        </span>
      ) : null}
      <button
        type="button"
        onClick={() => void submit({ steps: 10_000, sleepHours: 8, exerciseMinutes: 30 })}
      >
        Submit
      </button>
    </>
  );
}

async function setupSeededDomains(): Promise<FirestoreClient> {
  const client = createFakeFirestoreClient();
  await seedDomains(client, UID);
  return client;
}

describe('useActivityEntry', () => {
  it('has no existing entry for a fresh user', async () => {
    const client = await setupSeededDomains();

    render(<Harness client={client} />);

    await waitFor(() => screen.getByTestId('harness-existing'));
    expect(screen.getByTestId('harness-existing')).toHaveTextContent('none');
  });

  it('loads an already-saved entry for today', async () => {
    const client = await setupSeededDomains();
    await submitActivityEntry(client, UID, todayLocalDate(), {
      steps: 5000,
      sleepHours: 6,
      exerciseMinutes: 10,
    });

    render(<Harness client={client} />);

    await waitFor(() => screen.getByTestId('harness-existing'));
    expect(screen.getByTestId('harness-existing')).toHaveTextContent('5000:6');
  });

  it('submits and reports the resulting Fitness/Sleep values', async () => {
    const client = await setupSeededDomains();

    render(<Harness client={client} />);
    await waitFor(() => screen.getByText('Submit'));

    screen.getByText('Submit').click();

    await waitFor(() => screen.getByTestId('harness-result'));
    expect(screen.getByTestId('harness-result')).toHaveTextContent('30:15');
  });

  it('surfaces a load error', async () => {
    function FailingHarness() {
      const factory = useCallback(() => {
        throw new Error('boom');
      }, []);
      const { loadError, loading } = useActivityEntry(UID, factory);
      if (loading) {
        return <span>loading</span>;
      }
      return <span data-testid="harness-load-error">{loadError?.message ?? 'no error'}</span>;
    }

    render(<FailingHarness />);

    await waitFor(() => screen.getByTestId('harness-load-error'));
    expect(screen.getByTestId('harness-load-error')).toHaveTextContent('boom');
  });

  it('surfaces a submit error without touching loading state', async () => {
    const client = createFakeFirestoreClient(); // no domains seeded — submit will throw

    render(<Harness client={client} />);
    await waitFor(() => screen.getByText('Submit'));

    screen.getByText('Submit').click();

    await waitFor(() => screen.getByTestId('harness-submit-error'));
    expect(screen.getByTestId('harness-submitting')).toHaveTextContent('no');
  });
});
