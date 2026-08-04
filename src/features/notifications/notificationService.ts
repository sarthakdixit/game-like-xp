import type { NotificationClient, PermissionStatus } from '@/data/notificationClient';
import {
  buildDecayNudgeBody,
  DECAY_NUDGE_ID,
  remainingReminderHoursToday,
  reminderIdForHour,
  reminderSlotHours,
  resolveNotificationTime,
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

/**
 * Reconciles today's quest-reminder notifications against `allQuestsComplete`:
 *
 * - If every quest is done, cancels any remaining reminder slots for today —
 *   there's nothing left to nag about.
 * - Otherwise, schedules a one-off notification for every remaining slot hour
 *   today that isn't already scheduled, and cancels any scheduled slot that's
 *   no longer relevant (already passed, or left over from a previous day).
 *
 * Local notifications can't be conditionally suppressed at fire time — once
 * scheduled, they fire whether or not the app is open — so "stop nagging
 * after completion" and "skip quiet hours" both have to be enforced here, by
 * only ever having the right slots scheduled in the first place. That means
 * this needs to run again whenever a quest is completed (to cancel the rest
 * of today) and whenever the app opens (to populate a fresh day's slots).
 */
export async function syncQuestReminders(
  client: NotificationClient,
  now: Date,
  allQuestsComplete: boolean,
  quietHours?: QuietHours,
): Promise<void> {
  const allSlotIds = reminderSlotHours(undefined, quietHours).map(reminderIdForHour);
  const existingIds = await client.listScheduledIds();

  if (allQuestsComplete) {
    for (const id of allSlotIds) {
      if (existingIds.includes(id)) {
        await client.cancel(id);
      }
    }
    return;
  }

  const remainingHours = remainingReminderHoursToday(now.getHours(), undefined, quietHours);
  const remainingIds = new Set(remainingHours.map(reminderIdForHour));

  for (const id of allSlotIds) {
    if (existingIds.includes(id) && !remainingIds.has(id)) {
      await client.cancel(id);
    }
  }

  for (const hour of remainingHours) {
    const id = reminderIdForHour(hour);
    if (existingIds.includes(id)) {
      continue;
    }
    const fireDate = new Date(now);
    fireDate.setHours(hour, 0, 0, 0);
    await client.schedule({
      id,
      title: 'Chronicle',
      body: "Today's quests are still waiting.",
      schedule: { type: 'date', date: fireDate },
    });
  }
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
