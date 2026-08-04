import { fireEvent, render, screen } from '@testing-library/react-native';

import { getDomainByKey } from '@/data/repositories/domainsRepository';
import { seedDomains } from '@/data/seed';
import { seedQuests } from '@/data/seedQuests';
import { createFakeNotificationClient } from '@/data/testUtils/fakeNotificationClient';
import { createMigratedTestDb } from '@/data/testUtils/nodeSqliteClient';
import type { SqliteClient } from '@/data/sqliteClient';

import { DailyQuestsScreen } from './DailyQuestsScreen';

function fakeNotificationClientFactory() {
  const client = createFakeNotificationClient('granted');
  return () => client;
}

/** Cycles through `values` repeatedly — generateDailyQuests calls random() twice per domain. */
function fixedRandom(...values: number[]): () => number {
  let call = 0;
  return () => {
    const value = values[call % values.length];
    call += 1;
    return value;
  };
}

async function setupSeededDb(): Promise<SqliteClient> {
  const db = await createMigratedTestDb();
  await seedDomains(db);
  await seedQuests(db);
  return db;
}

describe('DailyQuestsScreen', () => {
  it('renders 5 quest cards and a 0-of-5 progress summary', async () => {
    const db = await setupSeededDb();

    await render(
      <DailyQuestsScreen
        dbFactory={() => Promise.resolve(db)}
        date="2026-08-04"
        notificationClientFactory={fakeNotificationClientFactory()}
      />,
    );

    expect(screen.getAllByTestId(/^quest-card-[a-z]+$/)).toHaveLength(5);
    expect(screen.getByTestId('daily-quests-progress')).toHaveTextContent('0 of 5 complete');
  });

  it('marks a quest done and updates the progress summary when tapped', async () => {
    const db = await setupSeededDb();

    await render(
      <DailyQuestsScreen
        dbFactory={() => Promise.resolve(db)}
        date="2026-08-04"
        notificationClientFactory={fakeNotificationClientFactory()}
      />,
    );
    const [firstDomainKey] = ['health'];
    fireEvent.press(screen.getByTestId(`quest-card-${firstDomainKey}`));

    await screen.findByText('1 of 5 complete');
  });

  it('calls onBack when the floating back button is pressed', async () => {
    const db = await setupSeededDb();
    const onBack = jest.fn();

    await render(
      <DailyQuestsScreen
        dbFactory={() => Promise.resolve(db)}
        date="2026-08-04"
        onBack={onBack}
        notificationClientFactory={fakeNotificationClientFactory()}
      />,
    );
    fireEvent.press(screen.getByTestId('daily-quests-back'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('shows an error state when the database fails to load', async () => {
    await render(
      <DailyQuestsScreen
        dbFactory={() => Promise.reject(new Error('boom'))}
        date="2026-08-04"
        notificationClientFactory={fakeNotificationClientFactory()}
      />,
    );

    expect(screen.getByTestId('daily-quests-error')).toBeTruthy();
  });

  describe('golden path: completing all 5 quests in a day', () => {
    it('completes every quest, reaches 5 of 5, and levels up a domain that crosses a threshold', async () => {
      const db = await setupSeededDb();
      // Fixed selection (miss the boss roll, always pick index 0) makes Health's
      // daily pick deterministically "Move for 20 minutes" (15xp) — 7 days
      // guarantees crossing the 100xp level-2 threshold, rather than depending
      // on real Math.random() picking a high-enough-xp quest every day.
      const selectionOptions = { random: fixedRandom(0.99, 0) };
      const notificationClientFactory = fakeNotificationClientFactory();

      const { rerender } = await render(
        <DailyQuestsScreen
          dbFactory={() => Promise.resolve(db)}
          date="2026-08-01"
          selectionOptions={selectionOptions}
          notificationClientFactory={notificationClientFactory}
        />,
      );

      for (let day = 1; day <= 7; day += 1) {
        const date = `2026-08-${String(day).padStart(2, '0')}`;
        if (day > 1) {
          await rerender(
            <DailyQuestsScreen
              dbFactory={() => Promise.resolve(db)}
              date={date}
              selectionOptions={selectionOptions}
              notificationClientFactory={notificationClientFactory}
            />,
          );
        }

        for (const domainKey of ['health', 'career', 'relationships', 'finance', 'growth']) {
          const card = screen.getByTestId(`quest-card-${domainKey}`);
          if (!card.props.accessibilityState.checked) {
            fireEvent.press(card);
            await screen.findByTestId(`quest-card-${domainKey}-checkbox`);
          }
        }

        await screen.findByText('5 of 5 complete');
      }

      const health = await getDomainByKey(db, 'health');
      expect(health!.xp).toBeGreaterThan(0);
      expect(health!.level).toBeGreaterThanOrEqual(2);
      expect(health!.title).not.toBeNull();

      // every domain should have accumulated xp across the 7-day streak
      for (const key of ['career', 'relationships', 'finance', 'growth']) {
        const domain = await getDomainByKey(db, key);
        expect(domain!.xp).toBeGreaterThan(0);
      }
    });
  });
});
