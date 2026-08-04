import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type {
  NotificationClient,
  NotificationContent,
  NotificationSchedule,
  PermissionStatus,
} from './notificationClient';

const ANDROID_CHANNEL_ID = 'default';

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Chronicle',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

function toTrigger(schedule: NotificationSchedule): Notifications.NotificationTriggerInput {
  if (schedule.type === 'daily') {
    return {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: schedule.hour,
      minute: schedule.minute,
    };
  }
  return {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: schedule.date,
  };
}

let client: NotificationClient | null = null;

/** The real, on-device notification client. Lazily built so tests never construct it. */
export function getNotificationClient(): NotificationClient {
  if (!client) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    client = {
      async getPermissionStatus(): Promise<PermissionStatus> {
        const result = await Notifications.getPermissionsAsync();
        return result.status as PermissionStatus;
      },

      async requestPermission(): Promise<PermissionStatus> {
        const result = await Notifications.requestPermissionsAsync();
        return result.status as PermissionStatus;
      },

      async listScheduledIds(): Promise<string[]> {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        return scheduled.map((notification) => notification.identifier);
      },

      async schedule(content: NotificationContent): Promise<void> {
        await ensureAndroidChannel();
        await Notifications.scheduleNotificationAsync({
          identifier: content.id,
          content: { title: content.title, body: content.body },
          trigger: toTrigger(content.schedule),
        });
      },

      async cancel(id: string): Promise<void> {
        await Notifications.cancelScheduledNotificationAsync(id);
      },
    };
  }
  return client;
}
