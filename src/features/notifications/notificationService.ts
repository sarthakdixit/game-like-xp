import type { NotificationClient, PermissionStatus } from '@/data/notificationClient';
import {
  buildDecayNudgeBody,
  DAILY_REMINDER_HOUR,
  DAILY_REMINDER_ID,
  DAILY_REMINDER_MINUTE,
  DECAY_NUDGE_ID,
  resolveNotificationTime,
  shouldScheduleDailyReminder,
  type QuietHours,
} from '@/domain/notifications';

/**
 * Requests notification permission, but only if the user hasn't already made
 * a choice — re-prompting after a denial just trains people to dismiss it.
 */
export async function requestNotificationPermissions(
  client: NotificationClient,
): Promise<PermissionStatus> {
  const current = await client.getPermissionStatus();
  if (current === 'granted' || current === 'denied') {
    return current;
  }
  return client.requestPermission();
}

/** Idempotent: schedules the recurring daily quest reminder only if one isn't already scheduled. */
export async function ensureDailyReminderScheduled(client: NotificationClient): Promise<void> {
  const existingIds = await client.listScheduledIds();
  if (!shouldScheduleDailyReminder(existingIds)) {
    return;
  }

  await client.schedule({
    id: DAILY_REMINDER_ID,
    title: 'Chronicle',
    body: "Today's quests are ready.",
    schedule: { type: 'daily', hour: DAILY_REMINDER_HOUR, minute: DAILY_REMINDER_MINUTE },
  });
}

/**
 * Keeps the decay-nudge notification in sync with which domains are currently
 * decaying: cancels it when nothing is decaying, and re-schedules it with
 * fresh content (respecting quiet hours) whenever something is.
 */
export async function scheduleDecayNudgeIfNeeded(
  client: NotificationClient,
  decayingDomainNames: string[],
  now: Date = new Date(),
  quietHours?: QuietHours,
): Promise<void> {
  const existingIds = await client.listScheduledIds();
  const hasNudge = existingIds.includes(DECAY_NUDGE_ID);

  if (decayingDomainNames.length === 0) {
    if (hasNudge) {
      await client.cancel(DECAY_NUDGE_ID);
    }
    return;
  }

  if (hasNudge) {
    await client.cancel(DECAY_NUDGE_ID);
  }

  await client.schedule({
    id: DECAY_NUDGE_ID,
    title: 'Chronicle',
    body: buildDecayNudgeBody(decayingDomainNames),
    schedule: { type: 'date', date: resolveNotificationTime(now, quietHours) },
  });
}
