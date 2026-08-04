import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { seedDomains } from '@/data/seed';
import { createFakeHealthClient } from '@/data/testUtils/fakeHealthClient';
import { createMigratedTestDb } from '@/data/testUtils/nodeSqliteClient';
import type { SqliteClient } from '@/data/sqliteClient';
import { getLocalDateString } from '@/domain/today';

import { HealthScreen } from './HealthScreen';

const DATE = getLocalDateString();

async function setupSeededDb(): Promise<SqliteClient> {
  const db = await createMigratedTestDb();
  await seedDomains(db);
  return db;
}

describe('HealthScreen', () => {
  it('shows "Not connected" and "Never synced" before any sync has happened', async () => {
    const db = await setupSeededDb();
    const client = createFakeHealthClient({}, 'denied');

    await render(
      <HealthScreen dbFactory={() => Promise.resolve(db)} healthClientFactory={() => client} />,
    );

    expect(screen.getByTestId('health-screen-status')).toHaveTextContent('Not connected');
    expect(screen.getByTestId('health-screen-last-synced')).toHaveTextContent('Never synced');
    expect(screen.queryByTestId('health-screen-deltas')).toBeNull();
    expect(screen.getByTestId('health-screen-sync-button')).toHaveTextContent('Connect');
  });

  it('shows "Connected" and the last-sync deltas after a successful sync', async () => {
    const db = await setupSeededDb();
    const client = createFakeHealthClient({
      [DATE]: { steps: 9200, sleepMinutes: 450, exerciseMinutes: 45 },
    });

    await render(
      <HealthScreen dbFactory={() => Promise.resolve(db)} healthClientFactory={() => client} />,
    );
    fireEvent.press(screen.getByTestId('health-screen-sync-button'));

    await waitFor(() => {
      expect(screen.getByTestId('health-screen-last-synced')).not.toHaveTextContent('Never synced');
    });
    expect(screen.getByTestId('health-screen-status')).toHaveTextContent('Connected');
    expect(screen.getByTestId('health-screen-deltas')).toHaveTextContent('+14 Fitness · +12 Sleep');
    expect(screen.getByTestId('health-screen-sync-button')).toHaveTextContent('Sync now');
  });

  it('requests permission via the Connect button when not yet granted', async () => {
    const db = await setupSeededDb();
    const client = createFakeHealthClient(
      { [DATE]: { steps: 3000, sleepMinutes: 420, exerciseMinutes: 0 } },
      'denied',
    );

    await render(
      <HealthScreen dbFactory={() => Promise.resolve(db)} healthClientFactory={() => client} />,
    );
    fireEvent.press(screen.getByTestId('health-screen-sync-button'));

    await waitFor(() => {
      expect(screen.getByTestId('health-screen-status')).toHaveTextContent('Connected');
    });
  });

  it('shows an error state when the database fails to load', async () => {
    await render(
      <HealthScreen
        dbFactory={() => Promise.reject(new Error('boom'))}
        healthClientFactory={() => createFakeHealthClient()}
      />,
    );

    expect(screen.getByTestId('health-screen-error')).toBeTruthy();
  });
});
