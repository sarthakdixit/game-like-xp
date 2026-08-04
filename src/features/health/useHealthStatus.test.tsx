import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useCallback } from 'react';
import { Text } from 'react-native';

import { seedDomains } from '@/data/seed';
import { createFakeHealthClient, type FakeHealthClient } from '@/data/testUtils/fakeHealthClient';
import { createMigratedTestDb } from '@/data/testUtils/nodeSqliteClient';
import type { SqliteClient } from '@/data/sqliteClient';
import { getLocalDateString } from '@/domain/today';

import { useHealthStatus } from './useHealthStatus';

// syncNow always targets "today" off the real system clock, so the fixture
// has to key off today's date rather than a hardcoded literal.
const DATE = getLocalDateString();

function Harness({ db, client }: { db: SqliteClient; client: FakeHealthClient }) {
  const dbFactory = useCallback(() => Promise.resolve(db), [db]);
  const healthClientFactory = useCallback(() => client, [client]);
  const { status, loading, error, syncing, syncNow } = useHealthStatus(
    dbFactory,
    healthClientFactory,
  );

  if (loading) {
    return <Text>loading</Text>;
  }
  if (error) {
    return <Text testID="harness-error">{error.message}</Text>;
  }

  return (
    <>
      <Text testID="harness-permission">{status?.permissionStatus}</Text>
      <Text testID="harness-last-synced">{status?.lastSyncedAt ?? 'never'}</Text>
      <Text testID="harness-fitness-delta">{status?.lastSyncFitnessDelta}</Text>
      <Text testID="harness-sleep-delta">{status?.lastSyncSleepDelta}</Text>
      <Text testID="harness-syncing">{syncing ? 'syncing' : 'idle'}</Text>
      <Text testID="harness-sync-now" onPress={() => void syncNow()}>
        sync
      </Text>
    </>
  );
}

async function setupSeededDb(): Promise<SqliteClient> {
  const db = await createMigratedTestDb();
  await seedDomains(db);
  return db;
}

describe('useHealthStatus', () => {
  it('loads the current permission status and reports never synced initially', async () => {
    const db = await setupSeededDb();
    const client = createFakeHealthClient({}, 'denied');

    await render(<Harness db={db} client={client} />);

    expect(screen.getByTestId('harness-permission')).toHaveTextContent('denied');
    expect(screen.getByTestId('harness-last-synced')).toHaveTextContent('never');
    expect(screen.getByTestId('harness-fitness-delta')).toHaveTextContent('0');
    expect(screen.getByTestId('harness-sleep-delta')).toHaveTextContent('0');
  });

  it('surfaces a database error', async () => {
    function FailingHarness() {
      const dbFactory = useCallback(() => Promise.reject(new Error('boom')), []);
      const healthClientFactory = useCallback(() => createFakeHealthClient(), []);
      const { error, loading } = useHealthStatus(dbFactory, healthClientFactory);
      if (loading) {
        return <Text>loading</Text>;
      }
      return <Text testID="harness-error">{error?.message ?? 'no error'}</Text>;
    }

    await render(<FailingHarness />);

    expect(screen.getByTestId('harness-error')).toHaveTextContent('boom');
  });

  it('syncNow imports the current day and reloads the status with the new deltas', async () => {
    const db = await setupSeededDb();
    const client = createFakeHealthClient(
      { [DATE]: { steps: 9200, sleepMinutes: 450, exerciseMinutes: 45 } },
      'granted',
    );

    await render(<Harness db={db} client={client} />);
    expect(screen.getByTestId('harness-last-synced')).toHaveTextContent('never');

    fireEvent.press(screen.getByTestId('harness-sync-now'));

    await waitFor(() => {
      expect(screen.getByTestId('harness-fitness-delta')).toHaveTextContent('14');
      expect(screen.getByTestId('harness-syncing')).toHaveTextContent('idle');
    });
    expect(screen.getByTestId('harness-sleep-delta')).toHaveTextContent('12');
    expect(screen.getByTestId('harness-last-synced')).not.toHaveTextContent('never');
  });
});
