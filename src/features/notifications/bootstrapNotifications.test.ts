import { createChildStat } from '@/data/repositories/childStatsRepository';
import { createDomain } from '@/data/repositories/domainsRepository';
import { createFakeNotificationClient } from '@/data/testUtils/fakeNotificationClient';
import { createMigratedTestDb } from '@/data/testUtils/nodeSqliteClient';
import { DAILY_REMINDER_ID, DECAY_NUDGE_ID } from '@/domain/notifications';

import { bootstrapNotifications } from './bootstrapNotifications';

describe('bootstrapNotifications', () => {
  it('schedules the daily reminder when permission is granted and nothing is decaying', async () => {
    const db = await createMigratedTestDb();
    const notificationClient = createFakeNotificationClient('granted');

    await bootstrapNotifications(db, notificationClient);

    expect(notificationClient.scheduled.has(DAILY_REMINDER_ID)).toBe(true);
    expect(notificationClient.scheduled.has(DECAY_NUDGE_ID)).toBe(false);
  });

  it('also schedules a decay nudge when a domain is decaying', async () => {
    const db = await createMigratedTestDb();
    const domain = await createDomain(db, { key: 'health', name: 'Health', sortOrder: 0 });
    await createChildStat(db, {
      domainId: domain.id,
      key: 'fitness',
      name: 'Fitness',
      sortOrder: 0,
      value: 50,
      lastActiveAt: '2020-01-01T00:00:00.000Z', // long stale
    });
    const notificationClient = createFakeNotificationClient('granted');

    await bootstrapNotifications(db, notificationClient);

    expect(notificationClient.scheduled.has(DAILY_REMINDER_ID)).toBe(true);
    expect(notificationClient.scheduled.get(DECAY_NUDGE_ID)!.body).toContain('Health');
  });

  it('requests permission when undetermined, and schedules once granted', async () => {
    const db = await createMigratedTestDb();
    const notificationClient = createFakeNotificationClient('undetermined');

    await bootstrapNotifications(db, notificationClient);

    expect(notificationClient.scheduled.has(DAILY_REMINDER_ID)).toBe(true);
  });

  it('schedules nothing when permission is denied', async () => {
    const db = await createMigratedTestDb();
    const notificationClient = createFakeNotificationClient('denied');

    await bootstrapNotifications(db, notificationClient);

    expect(notificationClient.scheduled.size).toBe(0);
  });
});
