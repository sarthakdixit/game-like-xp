import { getDecayingDomainNames } from '@/data/decayCheck';
import type { NotificationClient } from '@/data/notificationClient';
import type { SqliteClient } from '@/data/sqliteClient';

import {
  ensureDailyReminderScheduled,
  requestNotificationPermissions,
  scheduleDecayNudgeIfNeeded,
} from './notificationService';

/**
 * Called once on app startup: requests permission (if undecided), and — only
 * if granted — ensures the daily reminder exists and syncs the decay nudge to
 * whatever is currently decaying. Does nothing destructive if permission is
 * denied; it just skips scheduling.
 */
export async function bootstrapNotifications(
  db: SqliteClient,
  notificationClient: NotificationClient,
): Promise<void> {
  const permission = await requestNotificationPermissions(notificationClient);
  console.log('[Chronicle notifications] permission status:', permission);
  if (permission !== 'granted') {
    console.log('[Chronicle notifications] skipping scheduling — permission not granted');
    return;
  }

  await ensureDailyReminderScheduled(notificationClient);
  console.log('[Chronicle notifications] daily reminder ensured');

  const decayingDomainNames = await getDecayingDomainNames(db);
  console.log('[Chronicle notifications] decaying domains:', decayingDomainNames);
  await scheduleDecayNudgeIfNeeded(notificationClient, decayingDomainNames);
  console.log('[Chronicle notifications] decay nudge sync complete');
}
