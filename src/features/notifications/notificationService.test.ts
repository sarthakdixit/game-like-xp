import { describe, expect, it } from 'vitest';

import { createChildStat } from '@/data/repositories/childStatsRepository';
import { createDailyQuest } from '@/data/repositories/dailyQuestsRepository';
import { createDomain } from '@/data/repositories/domainsRepository';
import { createQuest } from '@/data/repositories/questsRepository';
import { createFakeFirestoreClient } from '@/data/testUtils/fakeFirestoreClient';
import { createFakeNotificationClient } from '@/data/testUtils/fakeNotificationClient';
import { createFakeNotificationScheduleStore } from '@/data/testUtils/fakeNotificationScheduleStore';
import type { FirestoreClient } from '@/data/firestoreClient';
import { DEFAULT_QUEST_REMINDER_HOUR } from '@/domain/notificationScheduling';

import { checkAndNotify } from './notificationService';

const UID = 'user-1';
const TODAY = '2026-08-04';
const EVENING = new Date(2026, 7, 4, DEFAULT_QUEST_REMINDER_HOUR, 0, 0);
const MORNING = new Date(2026, 7, 4, DEFAULT_QUEST_REMINDER_HOUR - 1, 0, 0);

async function seedIncompleteDailyQuest(client: FirestoreClient): Promise<void> {
  const domain = await createDomain(client, UID, { key: 'health', name: 'Health', sortOrder: 0 });
  const quest = await createQuest(client, UID, {
    domainId: domain.id,
    text: 'Take a walk',
    xpReward: 15,
  });
  await createDailyQuest(client, UID, {
    id: `${TODAY}_${domain.id}`,
    questId: quest.id,
    domainId: domain.id,
    date: TODAY,
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

describe('checkAndNotify', () => {
  it('sends a quest reminder past the reminder hour when quests remain incomplete', async () => {
    const client = createFakeFirestoreClient();
    await seedIncompleteDailyQuest(client);
    const notificationClient = createFakeNotificationClient('granted');
    const scheduleStore = createFakeNotificationScheduleStore();

    const result = await checkAndNotify(client, notificationClient, scheduleStore, UID, EVENING);

    expect(result.questReminderSent).toBe(true);
    expect(notificationClient.shown).toContainEqual(
      expect.objectContaining({ title: 'Quests await' }),
    );
  });

  it('does not send a quest reminder before the reminder hour', async () => {
    const client = createFakeFirestoreClient();
    await seedIncompleteDailyQuest(client);
    const notificationClient = createFakeNotificationClient('granted');
    const scheduleStore = createFakeNotificationScheduleStore();

    const result = await checkAndNotify(client, notificationClient, scheduleStore, UID, MORNING);

    expect(result.questReminderSent).toBe(false);
    expect(notificationClient.shown).toEqual([]);
  });

  it('does not send a second quest reminder the same day', async () => {
    const client = createFakeFirestoreClient();
    await seedIncompleteDailyQuest(client);
    const notificationClient = createFakeNotificationClient('granted');
    const scheduleStore = createFakeNotificationScheduleStore();

    await checkAndNotify(client, notificationClient, scheduleStore, UID, EVENING);
    const second = await checkAndNotify(client, notificationClient, scheduleStore, UID, EVENING);

    expect(second.questReminderSent).toBe(false);
    expect(notificationClient.shown).toHaveLength(1);
  });

  it('does not send a quest reminder when there are no daily quests yet', async () => {
    const client = createFakeFirestoreClient();
    const notificationClient = createFakeNotificationClient('granted');
    const scheduleStore = createFakeNotificationScheduleStore();

    const result = await checkAndNotify(client, notificationClient, scheduleStore, UID, EVENING);

    expect(result.questReminderSent).toBe(false);
  });

  it('sends a decay nudge when a child stat is decaying', async () => {
    const client = createFakeFirestoreClient();
    await seedDecayingChildStat(client);
    const notificationClient = createFakeNotificationClient('granted');
    const scheduleStore = createFakeNotificationScheduleStore();

    const result = await checkAndNotify(client, notificationClient, scheduleStore, UID, EVENING);

    expect(result.decayNudgeSent).toBe(true);
    expect(notificationClient.shown).toContainEqual(
      expect.objectContaining({ title: 'A stat needs attention' }),
    );
  });

  it('does not send a decay nudge when nothing is decaying', async () => {
    const client = createFakeFirestoreClient();
    const domain = await createDomain(client, UID, { key: 'health', name: 'Health', sortOrder: 0 });
    await createChildStat(client, UID, {
      domainId: domain.id,
      key: 'fitness',
      name: 'Fitness',
      sortOrder: 0,
      value: 60,
      lastActiveAt: new Date().toISOString(),
    });
    const notificationClient = createFakeNotificationClient('granted');
    const scheduleStore = createFakeNotificationScheduleStore();

    const result = await checkAndNotify(client, notificationClient, scheduleStore, UID, EVENING);

    expect(result.decayNudgeSent).toBe(false);
  });

  it('does not send a second decay nudge the same day', async () => {
    const client = createFakeFirestoreClient();
    await seedDecayingChildStat(client);
    const notificationClient = createFakeNotificationClient('granted');
    const scheduleStore = createFakeNotificationScheduleStore();

    await checkAndNotify(client, notificationClient, scheduleStore, UID, EVENING);
    const second = await checkAndNotify(client, notificationClient, scheduleStore, UID, EVENING);

    expect(second.decayNudgeSent).toBe(false);
    expect(
      notificationClient.shown.filter((n) => n.title === 'A stat needs attention'),
    ).toHaveLength(1);
  });

  it('can send both a quest reminder and a decay nudge from the same check', async () => {
    const client = createFakeFirestoreClient();
    await seedIncompleteDailyQuest(client);
    await seedDecayingChildStat(client);
    const notificationClient = createFakeNotificationClient('granted');
    const scheduleStore = createFakeNotificationScheduleStore();

    const result = await checkAndNotify(client, notificationClient, scheduleStore, UID, EVENING);

    expect(result).toEqual({ questReminderSent: true, decayNudgeSent: true });
    expect(notificationClient.shown).toHaveLength(2);
  });

  it('does not show anything when notification permission is not granted', async () => {
    const client = createFakeFirestoreClient();
    await seedIncompleteDailyQuest(client);
    await seedDecayingChildStat(client);
    const notificationClient = createFakeNotificationClient('default');
    const scheduleStore = createFakeNotificationScheduleStore();

    const result = await checkAndNotify(client, notificationClient, scheduleStore, UID, EVENING);

    expect(result).toEqual({ questReminderSent: false, decayNudgeSent: false });
    expect(notificationClient.shown).toEqual([]);
  });

  it('does not mark a reminder as sent when permission is not granted, so it can still fire once granted', async () => {
    const client = createFakeFirestoreClient();
    await seedIncompleteDailyQuest(client);
    const notificationClient = createFakeNotificationClient('default');
    const scheduleStore = createFakeNotificationScheduleStore();

    await checkAndNotify(client, notificationClient, scheduleStore, UID, EVENING);
    await notificationClient.requestPermission();
    const afterGranting = await checkAndNotify(
      client,
      notificationClient,
      scheduleStore,
      UID,
      EVENING,
    );

    expect(afterGranting.questReminderSent).toBe(true);
  });
});
