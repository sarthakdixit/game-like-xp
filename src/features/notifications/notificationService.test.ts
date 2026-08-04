import { createFakeNotificationClient } from '@/data/testUtils/fakeNotificationClient';
import { DECAY_NUDGE_ID, reminderIdForHour } from '@/domain/notifications';

import {
  requestNotificationPermissions,
  scheduleDecayNudgeIfNeeded,
  syncQuestReminders,
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

describe('syncQuestReminders', () => {
  it('schedules a slot for every remaining reminder hour today when quests are incomplete', async () => {
    const client = createFakeNotificationClient();
    const now = new Date(2026, 7, 4, 0, 0); // midnight -> all 7 default slots remain

    await syncQuestReminders(client, now, false);

    expect(client.scheduled.size).toBe(7);
    for (const hour of [8, 10, 12, 14, 16, 18, 20]) {
      expect(client.scheduled.has(reminderIdForHour(hour))).toBe(true);
    }
  });

  it('only schedules slots at or after the current hour', async () => {
    const client = createFakeNotificationClient();
    const now = new Date(2026, 7, 4, 13, 0);

    await syncQuestReminders(client, now, false);

    expect(client.scheduled.size).toBe(4); // 14, 16, 18, 20
    expect(client.scheduled.has(reminderIdForHour(12))).toBe(false);
    expect(client.scheduled.has(reminderIdForHour(14))).toBe(true);
  });

  it('does not double-schedule a slot that already exists', async () => {
    const client = createFakeNotificationClient();
    const now = new Date(2026, 7, 4, 8, 0);

    await syncQuestReminders(client, now, false);
    await syncQuestReminders(client, now, false);

    expect(client.scheduled.size).toBe(7);
  });

  it('cancels every scheduled slot once all quests are complete', async () => {
    const client = createFakeNotificationClient();
    const now = new Date(2026, 7, 4, 8, 0);
    await syncQuestReminders(client, now, false);
    expect(client.scheduled.size).toBe(7);

    await syncQuestReminders(client, now, true);

    expect(client.scheduled.size).toBe(0);
  });

  it('cancels slots that have fallen behind "now" since they were scheduled', async () => {
    const client = createFakeNotificationClient();
    await syncQuestReminders(client, new Date(2026, 7, 4, 8, 0), false);
    expect(client.scheduled.has(reminderIdForHour(8))).toBe(true);
    expect(client.scheduled.has(reminderIdForHour(10))).toBe(true);

    // time has passed — re-syncing at 11:00 should drop the 8 and 10 slots
    await syncQuestReminders(client, new Date(2026, 7, 4, 11, 0), false);

    expect(client.scheduled.has(reminderIdForHour(8))).toBe(false);
    expect(client.scheduled.has(reminderIdForHour(10))).toBe(false);
    expect(client.scheduled.has(reminderIdForHour(12))).toBe(true);
  });

  it('schedules each slot at its exact hour on the given date', async () => {
    const client = createFakeNotificationClient();
    const now = new Date(2026, 7, 4, 8, 0);

    await syncQuestReminders(client, now, false);

    const slot = client.scheduled.get(reminderIdForHour(14))!;
    const scheduledDate = (slot.schedule as { type: 'date'; date: Date }).date;
    expect(scheduledDate.getHours()).toBe(14);
    expect(scheduledDate.getDate()).toBe(4);
  });

  it('schedules nothing new once past the last slot of the day, but does not error', async () => {
    const client = createFakeNotificationClient();
    const now = new Date(2026, 7, 4, 21, 0);

    await syncQuestReminders(client, now, false);

    expect(client.scheduled.size).toBe(0);
  });

  it('respects a custom quiet-hours window', async () => {
    const client = createFakeNotificationClient();
    const now = new Date(2026, 7, 4, 0, 0);

    await syncQuestReminders(client, now, false, { startHour: 12, endHour: 14 });

    expect(client.scheduled.has(reminderIdForHour(12))).toBe(false);
    expect(client.scheduled.has(reminderIdForHour(14))).toBe(true);
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
