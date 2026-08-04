import { render, screen, waitFor } from '@testing-library/react';
import { useCallback } from 'react';
import { describe, expect, it } from 'vitest';

import { updateDomainProgress } from '@/data/repositories/domainsRepository';
import { seedDomains } from '@/data/seed';
import { createFakeFirestoreClient } from '@/data/testUtils/fakeFirestoreClient';
import type { FirestoreClient } from '@/data/firestoreClient';

import { useDailyQuests } from './useDailyQuests';

const UID = 'user-1';

function Harness({ client }: { client: FirestoreClient }) {
  const factory = useCallback(() => client, [client]);
  const { quests, completedCount, totalCount, loading, error, levelUp, completeQuest } =
    useDailyQuests(UID, factory);

  if (loading) {
    return <span>loading</span>;
  }
  if (error) {
    return <span data-testid="harness-error">{error.message}</span>;
  }

  return (
    <>
      <span data-testid="harness-progress">
        {completedCount} of {totalCount}
      </span>
      {levelUp ? (
        <span data-testid="harness-levelup">
          {levelUp.domainName}:{levelUp.level}:{levelUp.unlockedTitle ?? 'none'}
        </span>
      ) : null}
      <ul>
        {quests.map((quest) => (
          <li key={quest.dailyQuestId} data-testid={`harness-quest-${quest.domainKey}`}>
            <button type="button" onClick={() => void completeQuest(quest.dailyQuestId)}>
              {quest.completed ? 'done' : 'todo'}:{quest.text}:{quest.xpReward}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

async function setupSeededDomains(): Promise<FirestoreClient> {
  const client = createFakeFirestoreClient();
  await seedDomains(client, UID);
  return client;
}

describe('useDailyQuests', () => {
  it('loads exactly one quest per domain, ordered by domain sort order', async () => {
    const client = await setupSeededDomains();

    render(<Harness client={client} />);

    await waitFor(() => screen.getByTestId('harness-progress'));
    const items = screen.getAllByTestId(/^harness-quest-/);
    expect(items.map((el) => el.dataset.testid)).toEqual([
      'harness-quest-health',
      'harness-quest-career',
      'harness-quest-relationships',
      'harness-quest-finance',
      'harness-quest-growth',
    ]);
  });

  it('starts with none completed', async () => {
    const client = await setupSeededDomains();

    render(<Harness client={client} />);

    await waitFor(() => screen.getByTestId('harness-progress'));
    expect(screen.getByTestId('harness-progress')).toHaveTextContent('0 of 5');
  });

  it('marks a quest completed and updates the progress count', async () => {
    const client = await setupSeededDomains();

    render(<Harness client={client} />);
    await waitFor(() => screen.getByTestId('harness-quest-health'));

    screen.getByTestId('harness-quest-health').querySelector('button')!.click();

    await waitFor(() => {
      expect(screen.getByTestId('harness-quest-health')).toHaveTextContent(/^done:/);
    });
    expect(screen.getByTestId('harness-progress')).toHaveTextContent('1 of 5');
  });

  it('does not surface a level-up announcement for an ordinary completion', async () => {
    const client = await setupSeededDomains();
    // Comfortably mid-level with headroom past even a boss-quest reward (60xp), so this holds
    // regardless of which template today's random selection happens to pick — starting from 0xp
    // wouldn't: a boss quest alone (60xp) crosses the 50xp level-2 threshold on its own.
    await updateDomainProgress(client, UID, 'health', { level: 5, xp: 800, title: null });

    render(<Harness client={client} />);
    await waitFor(() => screen.getByTestId('harness-quest-health'));

    screen.getByTestId('harness-quest-health').querySelector('button')!.click();

    await waitFor(() => {
      expect(screen.getByTestId('harness-quest-health')).toHaveTextContent(/^done:/);
    });
    expect(screen.queryByTestId('harness-levelup')).not.toBeInTheDocument();
  });

  it('surfaces a level-up announcement when a completion crosses a level boundary', async () => {
    const client = await setupSeededDomains();
    // 45xp puts Health one small quest reward (>=10xp) away from the 50xp level-2 threshold,
    // regardless of which template the day's random selection happens to pick.
    await updateDomainProgress(client, UID, 'health', { level: 1, xp: 45, title: null });

    render(<Harness client={client} />);
    await waitFor(() => screen.getByTestId('harness-quest-health'));

    screen.getByTestId('harness-quest-health').querySelector('button')!.click();

    await waitFor(() => {
      expect(screen.getByTestId('harness-levelup')).toHaveTextContent(/^Health:2:/);
    });
  });

  it('ignores a click on an already-completed quest', async () => {
    const client = await setupSeededDomains();

    render(<Harness client={client} />);
    await waitFor(() => screen.getByTestId('harness-quest-health'));

    const button = screen.getByTestId('harness-quest-health').querySelector('button')!;
    button.click();
    await waitFor(() => expect(screen.getByTestId('harness-progress')).toHaveTextContent('1 of 5'));

    button.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.getByTestId('harness-progress')).toHaveTextContent('1 of 5');
  });

  it('surfaces an error when the Firestore client fails', async () => {
    function FailingHarness() {
      const factory = useCallback(() => {
        throw new Error('boom');
      }, []);
      const { error, loading } = useDailyQuests(UID, factory);
      if (loading) {
        return <span>loading</span>;
      }
      return <span data-testid="harness-error">{error?.message ?? 'no error'}</span>;
    }

    render(<FailingHarness />);

    await waitFor(() => screen.getByTestId('harness-error'));
    expect(screen.getByTestId('harness-error')).toHaveTextContent('boom');
  });
});
