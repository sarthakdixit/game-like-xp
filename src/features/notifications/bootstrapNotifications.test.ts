import { createChildStat } from '@/data/repositories/childStatsRepository';
import { createDomain } from '@/data/repositories/domainsRepository';
import { seedDomains } from '@/data/seed';
import { seedQuests } from '@/data/seedQuests';
import { createFakeNotificationClient } from '@/data/testUtils/fakeNotificationClient';
import { createMigratedTestDb } from '@/data/testUtils/nodeSqliteClient';
import { DECAY_NUDGE_ID, reminderIdForHour } from '@/domain/notifications';

import { bootstrapNotifications } from './bootstrapNotifications';

const DAYTIME_NOW = new Date(2026, 7, 4, 10, 0); // 10am — well within reminder hours

describe('bootstrapNotifications', () => {
  it('schedules quest reminder slots when permission is granted and nothing is decaying', async () => {
    const db = await createMigratedTestDb();
    await seedDomains(db);
    await seedQuests(db);
    const notificationClient = createFakeNotificationClient('granted');

    await bootstrapNotifications(db, notificationClient, DAYTIME_NOW);

    expect(notificationClient.scheduled.has(reminderIdForHour(10))).toBe(true);
    expect(notificationClient.scheduled.has(DECAY_NUDGE_ID)).toBe(false);
  });

  it('schedules nothing for a day whose quests are all already complete', async () => {
    const db = await createMigratedTestDb();
    // no domains/quests seeded -> generateDailyQuests returns an empty list,
    // which is vacuously "all complete" — nothing to remind about today.
    const notificationClient = createFakeNotificationClient('granted');

    await bootstrapNotifications(db, notificationClient, DAYTIME_NOW);

    expect(notificationClient.scheduled.has(reminderIdForHour(10))).toBe(false);
  });

  it('also schedules a decay nudge when a domain is decaying', async () => {
    const db = await createMigratedTestDb();
    await seedDomains(db);
    await seedQuests(db);
    const domain = await createDomain(db, { key: 'test-domain', name: 'TestDomain', sortOrder: 5 });
    await createChildStat(db, {
      domainId: domain.id,
      key: 'fitness',
      name: 'Fitness',
      sortOrder: 0,
      value: 50,
      lastActiveAt: '2020-01-01T00:00:00.000Z', // long stale
    });
    const notificationClient = createFakeNotificationClient('granted');

    await bootstrapNotifications(db, notificationClient, DAYTIME_NOW);

    expect(notificationClient.scheduled.has(reminderIdForHour(10))).toBe(true);
    expect(notificationClient.scheduled.get(DECAY_NUDGE_ID)!.body).toContain('TestDomain');
  });

  it('requests permission when undetermined, and schedules once granted', async () => {
    const db = await createMigratedTestDb();
    await seedDomains(db);
    await seedQuests(db);
    const notificationClient = createFakeNotificationClient('undetermined');

    await bootstrapNotifications(db, notificationClient, DAYTIME_NOW);

    expect(notificationClient.scheduled.has(reminderIdForHour(10))).toBe(true);
  });

  it('schedules nothing when permission is denied', async () => {
    const db = await createMigratedTestDb();
    await seedDomains(db);
    await seedQuests(db);
    const notificationClient = createFakeNotificationClient('denied');

    await bootstrapNotifications(db, notificationClient, DAYTIME_NOW);

    expect(notificationClient.scheduled.size).toBe(0);
  });
});
