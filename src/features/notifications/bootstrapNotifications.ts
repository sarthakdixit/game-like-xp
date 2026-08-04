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
  if (permission !== 'granted') {
    return;
  }

  await ensureDailyReminderScheduled(notificationClient);

  const decayingDomainNames = await getDecayingDomainNames(db);
  await scheduleDecayNudgeIfNeeded(notificationClient, decayingDomainNames);
}
