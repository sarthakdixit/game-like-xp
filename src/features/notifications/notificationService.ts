import { listChildStatsByDomain } from '@/data/repositories/childStatsRepository';
import { listDailyQuestsByDate } from '@/data/repositories/dailyQuestsRepository';
import { listDomains } from '@/data/repositories/domainsRepository';
import type { FirestoreClient } from '@/data/firestoreClient';
import type { NotificationClient } from '@/data/notificationClient';
import type { NotificationScheduleStore } from '@/data/notificationScheduleStore';
import { calculateDecay, daysBetween } from '@/domain/decay';
import { todayLocalDate } from '@/domain/localDate';
import { shouldSendDecayNudge, shouldSendQuestReminder } from '@/domain/notificationScheduling';

async function hasAnyDecayingDomain(
  client: FirestoreClient,
  uid: string,
  nowIso: string,
): Promise<boolean> {
  const domains = await listDomains(client, uid);
  for (const domain of domains) {
    const stats = await listChildStatsByDomain(client, uid, domain.id);
    if (stats.some((stat) => calculateDecay(daysBetween(stat.lastActiveAt, nowIso)) > 0)) {
      return true;
    }
  }
  return false;
}

export interface CheckAndNotifyResult {
  questReminderSent: boolean;
  decayNudgeSent: boolean;
}

/**
 * Checks whether a daily-quest reminder and/or a decay/streak nudge are due
 * right now and shows them if so, recording the send so a reload doesn't
 * repeat one already shown today. Best-effort only, per requirements.md:
 * this only runs while the caller keeps calling it (see
 * useNotificationScheduler) — nothing here can fire once the tab/browser is
 * fully closed, and that's a known, documented limitation, not a bug.
 */
export async function checkAndNotify(
  client: FirestoreClient,
  notificationClient: NotificationClient,
  scheduleStore: NotificationScheduleStore,
  uid: string,
  now: Date = new Date(),
): Promise<CheckAndNotifyResult> {
  const nowIso = now.toISOString();
  // Only actually persist "sent" once permission is granted — otherwise the browser silently
  // no-ops `show()`, and marking it sent anyway would wrongly suppress the day's only reminder
  // if the user grants permission later that same day.
  const granted = notificationClient.getPermissionState().permission === 'granted';

  const dailyQuests = await listDailyQuestsByDate(client, uid, todayLocalDate(now));
  const completedCount = dailyQuests.filter((quest) => quest.completedAt !== null).length;

  const questReminderDue = shouldSendQuestReminder({
    now,
    completedCount,
    totalCount: dailyQuests.length,
    lastSentAt: scheduleStore.getLastSentAt(uid, 'questReminder'),
  });
  if (questReminderDue) {
    notificationClient.show('Quests await', {
      body: `${dailyQuests.length - completedCount} of ${dailyQuests.length} quests still open today.`,
      tag: 'quest-reminder',
    });
    if (granted) {
      scheduleStore.setLastSentAt(uid, 'questReminder', nowIso);
    }
  }

  const hasDecaying = await hasAnyDecayingDomain(client, uid, nowIso);
  const decayNudgeDue = shouldSendDecayNudge({
    now,
    hasDecayingDomain: hasDecaying,
    lastSentAt: scheduleStore.getLastSentAt(uid, 'decayNudge'),
  });
  if (decayNudgeDue) {
    notificationClient.show('A stat needs attention', {
      body: 'One of your stats has started to decay from neglect.',
      tag: 'decay-nudge',
    });
    if (granted) {
      scheduleStore.setLastSentAt(uid, 'decayNudge', nowIso);
    }
  }

  return {
    questReminderSent: questReminderDue && granted,
    decayNudgeSent: decayNudgeDue && granted,
  };
}
