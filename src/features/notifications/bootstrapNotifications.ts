import { getDecayingDomainNames } from '@/data/decayCheck';
import type { NotificationClient } from '@/data/notificationClient';
import type { SqliteClient } from '@/data/sqliteClient';
import { getLocalDateString } from '@/domain/today';
import { generateDailyQuests } from '@/features/quests/dailyQuestsService';

import {
  requestNotificationPermissions,
  scheduleDecayNudgeIfNeeded,
  syncQuestReminders,
} from './notificationService';

/**
 * Called once on app startup: requests permission (if undecided), and — only
 * if granted — reconciles today's quest-reminder slots against completion
 * status and syncs the decay nudge to whatever is currently decaying. Does
 * nothing destructive if permission is denied; it just skips scheduling.
 */
export async function bootstrapNotifications(
  db: SqliteClient,
  notificationClient: NotificationClient,
  now: Date = new Date(),
): Promise<void> {
  const permission = await requestNotificationPermissions(notificationClient);
  console.log('[Chronicle notifications] permission status:', permission);
  if (permission !== 'granted') {
    console.log('[Chronicle notifications] skipping scheduling — permission not granted');
    return;
  }

  const today = getLocalDateString(now);
  const todaysQuests = await generateDailyQuests(db, today);
  const allComplete = todaysQuests.every((quest) => quest.completedAt !== null);
  await syncQuestReminders(notificationClient, now, allComplete);
  console.log('[Chronicle notifications] quest reminders synced, allComplete:', allComplete);

  const decayingDomainNames = await getDecayingDomainNames(db);
  console.log('[Chronicle notifications] decaying domains:', decayingDomainNames);
  await scheduleDecayNudgeIfNeeded(notificationClient, decayingDomainNames);
  console.log('[Chronicle notifications] decay nudge sync complete');
}
