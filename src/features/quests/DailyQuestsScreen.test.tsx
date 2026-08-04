import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { updateDomainProgress } from '@/data/repositories/domainsRepository';
import { listAllQuests } from '@/data/repositories/questsRepository';
import { seedDomains } from '@/data/seed';
import { createFakeFirestoreClient } from '@/data/testUtils/fakeFirestoreClient';
import type { FirestoreClient } from '@/data/firestoreClient';

import { DailyQuestsScreen } from './DailyQuestsScreen';

const UID = 'user-1';

async function setupSeededDomains(): Promise<FirestoreClient> {
  const client = createFakeFirestoreClient();
  await seedDomains(client, UID);
  return client;
}

describe('DailyQuestsScreen', () => {
  it('shows a loading state before data arrives', () => {
    const client = createFakeFirestoreClient();

    render(<DailyQuestsScreen uid={UID} firestoreClientFactory={() => client} />);

    expect(screen.getByTestId('daily-quests-loading')).toBeInTheDocument();
  });

  it('shows an error state when the Firestore client fails', async () => {
    const failingFactory = () => {
      throw new Error('boom');
    };

    render(<DailyQuestsScreen uid={UID} firestoreClientFactory={failingFactory} />);

    await waitFor(() => {
      expect(screen.getByTestId('daily-quests-error')).toBeInTheDocument();
    });
  });

  it('renders one quest card per template in the bank', async () => {
    const client = await setupSeededDomains();

    render(<DailyQuestsScreen uid={UID} firestoreClientFactory={() => client} />);

    await waitFor(() => screen.getByTestId('daily-quests-screen'));
    const allTemplates = await listAllQuests(client, UID);
    expect(screen.getAllByTestId(/^quest-card-/)).toHaveLength(allTemplates.length);
  });

  it('renders a heading for every domain', async () => {
    const client = await setupSeededDomains();

    render(<DailyQuestsScreen uid={UID} firestoreClientFactory={() => client} />);

    await waitFor(() => screen.getByTestId('daily-quests-screen'));
    for (const name of ['Health', 'Career', 'Relationships', 'Finance', 'Growth']) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    }
  });

  it('groups quest cards under their domain heading, not interleaved', async () => {
    const client = await setupSeededDomains();

    const { container } = render(
      <DailyQuestsScreen uid={UID} firestoreClientFactory={() => client} />,
    );

    await waitFor(() => screen.getByTestId('daily-quests-screen'));
    const groups = container.querySelectorAll('.domainGroup');
    expect(groups).toHaveLength(5);
    expect(groups[0].querySelector('.domainGroupHeading')).toHaveTextContent('Health');
  });

  it('shows the initial progress line', async () => {
    const client = await setupSeededDomains();

    render(<DailyQuestsScreen uid={UID} firestoreClientFactory={() => client} />);

    await waitFor(() => screen.getByTestId('daily-quests-progress'));
    expect(screen.getByTestId('daily-quests-progress')).toHaveTextContent('0 of');
  });

  it('completing a quest checkbox updates its card and the progress line', async () => {
    const client = await setupSeededDomains();

    render(<DailyQuestsScreen uid={UID} firestoreClientFactory={() => client} />);
    await waitFor(() => screen.getAllByRole('checkbox'));

    const [firstCheckbox] = screen.getAllByRole('checkbox');
    fireEvent.click(firstCheckbox);

    await waitFor(() => {
      expect(screen.getByTestId('daily-quests-progress')).toHaveTextContent('1 of');
    });
    expect(firstCheckbox).toHaveAttribute('aria-checked', 'true');
  });

  it('shows no level-up banner before any quest is completed', async () => {
    const client = await setupSeededDomains();

    render(<DailyQuestsScreen uid={UID} firestoreClientFactory={() => client} />);

    await waitFor(() => screen.getByTestId('daily-quests-screen'));
    expect(screen.queryByTestId('daily-quests-levelup')).not.toBeInTheDocument();
  });

  it('shows a level-up banner when completing a quest crosses a level boundary', async () => {
    const client = await setupSeededDomains();
    await updateDomainProgress(client, UID, 'health', { level: 1, xp: 45, title: null });

    render(<DailyQuestsScreen uid={UID} firestoreClientFactory={() => client} />);
    await waitFor(() => screen.getAllByRole('checkbox'));

    // Health sorts first (sortOrder 0), so its first card is always among the first checkboxes.
    const [healthCheckbox] = screen.getAllByRole('checkbox');
    fireEvent.click(healthCheckbox);

    await waitFor(() => {
      expect(screen.getByTestId('daily-quests-levelup')).toHaveTextContent(/Health leveled up/);
    });
  });

  it('dismisses the level-up banner when its close button is clicked', async () => {
    const client = await setupSeededDomains();
    await updateDomainProgress(client, UID, 'health', { level: 1, xp: 45, title: null });

    render(<DailyQuestsScreen uid={UID} firestoreClientFactory={() => client} />);
    await waitFor(() => screen.getAllByRole('checkbox'));
    const [healthCheckbox] = screen.getAllByRole('checkbox');
    fireEvent.click(healthCheckbox);
    await waitFor(() => screen.getByTestId('daily-quests-levelup'));

    fireEvent.click(screen.getByLabelText('Dismiss level-up notice'));

    expect(screen.queryByTestId('daily-quests-levelup')).not.toBeInTheDocument();
  });
});
