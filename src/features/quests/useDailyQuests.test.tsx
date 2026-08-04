import { render, screen, waitFor } from '@testing-library/react';
import { useCallback } from 'react';
import { describe, expect, it } from 'vitest';

import { updateDomainProgress } from '@/data/repositories/domainsRepository';
import { listAllQuests } from '@/data/repositories/questsRepository';
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
          // Keyed/tagged by dailyQuestId, not domainKey — there are many quests per domain now.
          <li key={quest.dailyQuestId} data-testid={`harness-quest-${quest.dailyQuestId}`}>
            <button type="button" onClick={() => void completeQuest(quest.dailyQuestId)}>
              {quest.completed ? 'done' : 'todo'}:{quest.domainKey}:{quest.text}:{quest.xpReward}
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
  it('loads one quest per template, grouped by domain in sort order with no interleaving', async () => {
    const client = await setupSeededDomains();

    render(<Harness client={client} />);

    await waitFor(() => screen.getByTestId('harness-progress'));
    const items = screen.getAllByTestId(/^harness-quest-/);
    const domainKeys = items.map((el) => el.textContent!.split(':')[1]);

    // Collapse consecutive runs of the same domain key — should match the domain order exactly,
    // proving every domain's quests are grouped together rather than interleaved.
    const runs: string[] = [];
    for (const key of domainKeys) {
      if (runs[runs.length - 1] !== key) {
        runs.push(key);
      }
    }
    expect(runs).toEqual(['health', 'career', 'relationships', 'finance', 'growth']);
  });

  it('generates one daily quest per template in the bank', async () => {
    const client = await setupSeededDomains();

    render(<Harness client={client} />);
    await waitFor(() => screen.getByTestId('harness-progress'));

    const allTemplates = await listAllQuests(client, UID);
    expect(screen.getAllByTestId(/^harness-quest-/)).toHaveLength(allTemplates.length);
  });

  it('starts with none completed', async () => {
    const client = await setupSeededDomains();

    render(<Harness client={client} />);

    await waitFor(() => screen.getByTestId('harness-progress'));
    expect(screen.getByTestId('harness-progress')).toHaveTextContent('0 of');
  });

  it('marks a quest completed and updates the progress count', async () => {
    const client = await setupSeededDomains();

    render(<Harness client={client} />);
    await waitFor(() => screen.getByRole('button', { name: /health:Take a 15-minute walk/ }));

    screen.getByRole('button', { name: /health:Take a 15-minute walk/ }).click();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^done:/ })).toBeInTheDocument();
    });
    expect(screen.getByTestId('harness-progress')).toHaveTextContent('1 of');
  });

  it('does not surface a level-up announcement for an ordinary completion', async () => {
    const client = await setupSeededDomains();
    // Comfortably mid-level with headroom past even a boss-quest reward (60xp).
    await updateDomainProgress(client, UID, 'health', { level: 5, xp: 800, title: null });

    render(<Harness client={client} />);
    await waitFor(() => screen.getByRole('button', { name: /health:Take a 15-minute walk/ }));

    screen.getByRole('button', { name: /health:Take a 15-minute walk/ }).click();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^done:/ })).toBeInTheDocument();
    });
    expect(screen.queryByTestId('harness-levelup')).not.toBeInTheDocument();
  });

  it('surfaces a level-up announcement when a completion crosses a level boundary', async () => {
    const client = await setupSeededDomains();
    // 45xp puts Health one small quest reward (health_walk, 15xp) past the 50xp level-2 threshold.
    await updateDomainProgress(client, UID, 'health', { level: 1, xp: 45, title: null });

    render(<Harness client={client} />);
    await waitFor(() => screen.getByRole('button', { name: /health:Take a 15-minute walk/ }));

    screen.getByRole('button', { name: /health:Take a 15-minute walk/ }).click();

    await waitFor(() => {
      expect(screen.getByTestId('harness-levelup')).toHaveTextContent(/^Health:2:/);
    });
  });

  it('ignores a click on an already-completed quest', async () => {
    const client = await setupSeededDomains();

    render(<Harness client={client} />);
    await waitFor(() => screen.getByRole('button', { name: /health:Take a 15-minute walk/ }));

    const button = screen.getByRole('button', { name: /health:Take a 15-minute walk/ });
    button.click();
    await waitFor(() => expect(screen.getByTestId('harness-progress')).toHaveTextContent('1 of'));

    button.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.getByTestId('harness-progress')).toHaveTextContent('1 of');
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
