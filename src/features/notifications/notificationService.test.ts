import { createFakeNotificationClient } from '@/data/testUtils/fakeNotificationClient';
import { DAILY_REMINDER_ID, DECAY_NUDGE_ID } from '@/domain/notifications';

import {
  ensureDailyReminderScheduled,
  requestNotificationPermissions,
  scheduleDecayNudgeIfNeeded,
} from './notificationService';

describe('requestNotificationPermissions', () => {
  it('requests permission when undetermined', async () => {
    const client = createFakeNotificationClient('undetermined');

    const status = await requestNotificationPermissions(client);

    expect(status).toBe('granted');
  });

  it('does not re-prompt if already granted', async () => {
    const client = createFakeNotificationClient('granted');
    const requestSpy = jest.spyOn(client, 'requestPermission');

    const status = await requestNotificationPermissions(client);

    expect(status).toBe('granted');
    expect(requestSpy).not.toHaveBeenCalled();
  });

  it('does not re-prompt if already denied', async () => {
    const client = createFakeNotificationClient('denied');
    const requestSpy = jest.spyOn(client, 'requestPermission');

    const status = await requestNotificationPermissions(client);

    expect(status).toBe('denied');
    expect(requestSpy).not.toHaveBeenCalled();
  });
});

describe('ensureDailyReminderScheduled', () => {
  it('schedules the reminder on an empty client', async () => {
    const client = createFakeNotificationClient();

    await ensureDailyReminderScheduled(client);

    expect(client.scheduled.has(DAILY_REMINDER_ID)).toBe(true);
    const scheduled = client.scheduled.get(DAILY_REMINDER_ID)!;
    expect(scheduled.schedule).toEqual({ type: 'daily', hour: 9, minute: 0 });
  });

  it('does not double-schedule when a reminder already exists', async () => {
    const client = createFakeNotificationClient();

    await ensureDailyReminderScheduled(client);
    await ensureDailyReminderScheduled(client);
    await ensureDailyReminderScheduled(client);

    expect(client.scheduled.size).toBe(1);
  });
});

describe('scheduleDecayNudgeIfNeeded', () => {
  it('does nothing when nothing is decaying and no nudge exists', async () => {
    const client = createFakeNotificationClient();

    await scheduleDecayNudgeIfNeeded(client, [], new Date(2026, 7, 4, 12, 0));

    expect(client.scheduled.size).toBe(0);
  });

  it('cancels an existing nudge when nothing is decaying anymore', async () => {
    const client = createFakeNotificationClient();
    await scheduleDecayNudgeIfNeeded(client, ['Health'], new Date(2026, 7, 4, 12, 0));
    expect(client.scheduled.has(DECAY_NUDGE_ID)).toBe(true);

    await scheduleDecayNudgeIfNeeded(client, [], new Date(2026, 7, 5, 12, 0));

    expect(client.scheduled.has(DECAY_NUDGE_ID)).toBe(false);
  });

  it('schedules a nudge with the decaying domain names in the body', async () => {
    const client = createFakeNotificationClient();

    await scheduleDecayNudgeIfNeeded(client, ['Health', 'Growth'], new Date(2026, 7, 4, 12, 0));

    const nudge = client.scheduled.get(DECAY_NUDGE_ID)!;
    expect(nudge.body).toBe('Health and Growth are decaying — check in today.');
  });

  it('does not double-schedule — replaces the existing nudge instead of adding a second', async () => {
    const client = createFakeNotificationClient();

    await scheduleDecayNudgeIfNeeded(client, ['Health'], new Date(2026, 7, 4, 12, 0));
    await scheduleDecayNudgeIfNeeded(client, ['Health', 'Career'], new Date(2026, 7, 4, 13, 0));

    expect(client.scheduled.size).toBe(1);
    expect(client.scheduled.get(DECAY_NUDGE_ID)!.body).toContain('Career');
  });

  it('fires immediately (now) outside quiet hours', async () => {
    const client = createFakeNotificationClient();
    const now = new Date(2026, 7, 4, 14, 0);

    await scheduleDecayNudgeIfNeeded(client, ['Health'], now);

    const nudge = client.scheduled.get(DECAY_NUDGE_ID)!;
    expect(nudge.schedule).toEqual({ type: 'date', date: now });
  });

  it('defers to the end of quiet hours when triggered during quiet hours', async () => {
    const client = createFakeNotificationClient();
    const lateNight = new Date(2026, 7, 4, 23, 30);

    await scheduleDecayNudgeIfNeeded(client, ['Health'], lateNight);

    const nudge = client.scheduled.get(DECAY_NUDGE_ID)!;
    const scheduledDate = (nudge.schedule as { type: 'date'; date: Date }).date;
    expect(scheduledDate.getHours()).toBe(8);
    expect(scheduledDate > lateNight).toBe(true);
  });

  it('respects a custom quiet-hours window', async () => {
    const client = createFakeNotificationClient();
    const now = new Date(2026, 7, 4, 2, 0);

    await scheduleDecayNudgeIfNeeded(client, ['Health'], now, { startHour: 1, endHour: 5 });

    const nudge = client.scheduled.get(DECAY_NUDGE_ID)!;
    const scheduledDate = (nudge.schedule as { type: 'date'; date: Date }).date;
    expect(scheduledDate.getHours()).toBe(5);
  });
});
