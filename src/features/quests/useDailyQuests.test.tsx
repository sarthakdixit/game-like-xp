import { render, screen } from '@testing-library/react-native';
import { useCallback, useRef } from 'react';
import { Text } from 'react-native';

import { getDomainByKey } from '@/data/repositories/domainsRepository';
import { seedDomains } from '@/data/seed';
import { seedQuests } from '@/data/seedQuests';
import {
  createFakeNotificationClient,
  type FakeNotificationClient,
} from '@/data/testUtils/fakeNotificationClient';
import { createMigratedTestDb } from '@/data/testUtils/nodeSqliteClient';
import type { SqliteClient } from '@/data/sqliteClient';

import { useDailyQuests } from './useDailyQuests';

function Harness({ db, date }: { db: SqliteClient; date: string }) {
  const dbFactory = useCallback(() => Promise.resolve(db), [db]);
  const notificationClientRef = useRef<FakeNotificationClient | null>(null);
  if (!notificationClientRef.current) {
    notificationClientRef.current = createFakeNotificationClient('granted');
  }
  const notificationClientFactory = useCallback(() => notificationClientRef.current!, []);
  const { quests, loading, error, completeQuest } = useDailyQuests(
    dbFactory,
    date,
    undefined,
    notificationClientFactory,
  );

  if (loading) {
    return <Text>loading</Text>;
  }
  if (error) {
    return <Text testID="harness-error">{error.message}</Text>;
  }

  return (
    <>
      <Text testID="harness-count">{quests.length}</Text>
      <Text testID="harness-completed-count">{quests.filter((q) => q.completed).length}</Text>
      {quests.map((quest) => (
        <Text
          key={quest.dailyQuestId}
          testID={`harness-quest-${quest.domainKey}`}
          onPress={() => completeQuest(quest.dailyQuestId)}
        >
          {quest.domainName}:{quest.text}:{quest.completed ? 'done' : 'todo'}
        </Text>
      ))}
    </>
  );
}

async function setupSeededDb(): Promise<SqliteClient> {
  const db = await createMigratedTestDb();
  await seedDomains(db);
  await seedQuests(db);
  return db;
}

describe('useDailyQuests', () => {
  it('generates and loads 5 daily quest views for today', async () => {
    const db = await setupSeededDb();

    await render(<Harness db={db} date="2026-08-04" />);

    expect(screen.getByTestId('harness-count')).toHaveTextContent('5');
    expect(screen.getByTestId('harness-completed-count')).toHaveTextContent('0');
  });

  it('marks a quest completed and reloads the list after completeQuest', async () => {
    const db = await setupSeededDb();

    await render(<Harness db={db} date="2026-08-04" />);
    const healthNode = screen.getByTestId('harness-quest-health');
    healthNode.props.onPress();

    await screen.findByText(/health.*:done/i);

    expect(screen.getByTestId('harness-completed-count')).toHaveTextContent('1');
  });

  it('is idempotent across remounts for the same date (no duplicate quests)', async () => {
    const db = await setupSeededDb();

    await render(<Harness db={db} date="2026-08-04" />);
    const first = screen.getByTestId('harness-count').props.children;

    await render(<Harness db={db} date="2026-08-04" />);
    const second = screen.getByTestId('harness-count').props.children;

    expect(second).toBe(first);
  });

  it('surfaces a database error', async () => {
    function FailingHarness() {
      const dbFactory = useCallback(() => Promise.reject(new Error('boom')), []);
      const { error, loading } = useDailyQuests(dbFactory, '2026-08-04');
      if (loading) {
        return <Text>loading</Text>;
      }
      return <Text testID="harness-error">{error?.message ?? 'no error'}</Text>;
    }

    await render(<FailingHarness />);

    expect(screen.getByTestId('harness-error')).toHaveTextContent('boom');
  });

  it('returns null and surfaces an error when completeQuest fails', async () => {
    const db = await setupSeededDb();
    await render(<Harness db={db} date="2026-08-04" />);

    const healthNode = screen.getByTestId('harness-quest-health');
    // completing the same quest twice makes the second call throw ("already completed")
    healthNode.props.onPress();
    await screen.findByText(/health.*:done/i);
    screen.getByTestId('harness-quest-health').props.onPress();

    await screen.findByTestId('harness-error');
  });

  it('leaves other domains unaffected after completing one quest', async () => {
    const db = await setupSeededDb();
    await render(<Harness db={db} date="2026-08-04" />);

    screen.getByTestId('harness-quest-health').props.onPress();
    await screen.findByText(/health.*:done/i);

    const career = await getDomainByKey(db, 'career');
    expect(career!.xp).toBe(0);
    expect(career!.level).toBe(1);
  });
});
