import { act, render, screen } from '@testing-library/react';
import { useCallback } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createChildStat } from '@/data/repositories/childStatsRepository';
import { createDailyQuest } from '@/data/repositories/dailyQuestsRepository';
import { createDomain } from '@/data/repositories/domainsRepository';
import { createQuest } from '@/data/repositories/questsRepository';
import { createFakeFirestoreClient } from '@/data/testUtils/fakeFirestoreClient';
import { createFakeNotificationClient } from '@/data/testUtils/fakeNotificationClient';
import { createFakeNotificationScheduleStore } from '@/data/testUtils/fakeNotificationScheduleStore';
import type { FirestoreClient } from '@/data/firestoreClient';
import type { FakeNotificationClient } from '@/data/testUtils/fakeNotificationClient';
import type { NotificationScheduleStore } from '@/data/notificationScheduleStore';
import { DEFAULT_QUEST_REMINDER_HOUR } from '@/domain/notificationScheduling';

import { useNotificationScheduler } from './useNotificationScheduler';

const UID = 'user-1';
const CHECK_INTERVAL_MS = 60_000;

function Harness({
  client,
  notificationClient,
  scheduleStore,
}: {
  client: FirestoreClient;
  notificationClient: FakeNotificationClient;
  scheduleStore: NotificationScheduleStore;
}) {
  // Stable references, same pattern as every other hook test harness in this codebase — an
  // inline `() => x` recreated every render would make the hook's effect (keyed on these
  // factories) tear down and re-run on every re-render instead of just once on mount.
  const firestoreClientFactory = useCallback(() => client, [client]);
  const notificationClientFactory = useCallback(() => notificationClient, [notificationClient]);
  const scheduleStoreFactory = useCallback(() => scheduleStore, [scheduleStore]);

  const { permissionState, requestPermission } = useNotificationScheduler(UID, {
    firestoreClientFactory,
    notificationClientFactory,
    scheduleStoreFactory,
    checkIntervalMs: CHECK_INTERVAL_MS,
  });

  return (
    <>
      <span data-testid="permission">{permissionState.permission}</span>
      <button type="button" onClick={() => void requestPermission()}>
        Enable
      </button>
    </>
  );
}

async function seedIncompleteDailyQuest(client: FirestoreClient, date: string): Promise<void> {
  const domain = await createDomain(client, UID, { key: 'health', name: 'Health', sortOrder: 0 });
  const quest = await createQuest(client, UID, {
    domainId: domain.id,
    text: 'Take a walk',
    xpReward: 15,
  });
  await createDailyQuest(client, UID, {
    id: `${date}_${domain.id}`,
    questId: quest.id,
    domainId: domain.id,
    date,
  });
}

async function seedDecayingChildStat(client: FirestoreClient): Promise<void> {
  const domain = await createDomain(client, UID, { key: 'health', name: 'Health', sortOrder: 0 });
  await createChildStat(client, UID, {
    domainId: domain.id,
    key: 'fitness',
    name: 'Fitness',
    sortOrder: 0,
    value: 60,
    lastActiveAt: '2020-01-01T00:00:00.000Z',
  });
}

describe('useNotificationScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('exposes the notification client’s initial permission state', async () => {
    const client = createFakeFirestoreClient();
    const notificationClient = createFakeNotificationClient('denied');
    const scheduleStore = createFakeNotificationScheduleStore();

    render(
      <Harness
        client={client}
        notificationClient={notificationClient}
        scheduleStore={scheduleStore}
      />,
    );

    expect(screen.getByTestId('permission')).toHaveTextContent('denied');
  });

  it('runs an immediate check on mount', async () => {
    const client = createFakeFirestoreClient();
    await seedDecayingChildStat(client);
    const notificationClient = createFakeNotificationClient('granted');
    const scheduleStore = createFakeNotificationScheduleStore();

    render(
      <Harness
        client={client}
        notificationClient={notificationClient}
        scheduleStore={scheduleStore}
      />,
    );
    await vi.advanceTimersByTimeAsync(0);

    expect(notificationClient.shown).toHaveLength(1);
  });

  it('re-checks on the interval, catching a condition that becomes due later', async () => {
    vi.setSystemTime(new Date(2026, 7, 4, DEFAULT_QUEST_REMINDER_HOUR - 1, 0, 0));
    const client = createFakeFirestoreClient();
    await seedIncompleteDailyQuest(client, '2026-08-04');
    const notificationClient = createFakeNotificationClient('granted');
    const scheduleStore = createFakeNotificationScheduleStore();

    render(
      <Harness
        client={client}
        notificationClient={notificationClient}
        scheduleStore={scheduleStore}
      />,
    );
    await vi.advanceTimersByTimeAsync(0);
    expect(notificationClient.shown).toHaveLength(0); // before the reminder hour, nothing yet

    await vi.advanceTimersByTimeAsync(60 * 60 * 1000); // advance 1 hour, past the reminder hour

    expect(notificationClient.shown).toHaveLength(1);
  });

  it('stops checking after unmount', async () => {
    const client = createFakeFirestoreClient();
    await seedDecayingChildStat(client);
    const notificationClient = createFakeNotificationClient('granted');
    const scheduleStore = createFakeNotificationScheduleStore();

    const { unmount } = render(
      <Harness
        client={client}
        notificationClient={notificationClient}
        scheduleStore={scheduleStore}
      />,
    );
    await vi.advanceTimersByTimeAsync(0);
    expect(notificationClient.shown).toHaveLength(1);

    unmount();
    await vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000); // a full day of further ticks

    expect(notificationClient.shown).toHaveLength(1);
  });

  it('requestPermission updates the exposed permission state', async () => {
    const client = createFakeFirestoreClient();
    const notificationClient = createFakeNotificationClient('default');
    const scheduleStore = createFakeNotificationScheduleStore();

    render(
      <Harness
        client={client}
        notificationClient={notificationClient}
        scheduleStore={scheduleStore}
      />,
    );
    await vi.advanceTimersByTimeAsync(0);

    await act(async () => {
      screen.getByText('Enable').click();
    });

    expect(screen.getByTestId('permission')).toHaveTextContent('granted');
  });
});
