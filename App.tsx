import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { getDb } from '@/data/db';
import { getNotificationClient } from '@/data/notifications';
import { bootstrapNotifications } from '@/features/notifications/bootstrapNotifications';
import { RootNavigator } from '@/navigation/RootNavigator';

export default function App() {
  useEffect(() => {
    async function setupNotifications() {
      try {
        const db = await getDb();
        await bootstrapNotifications(db, getNotificationClient());
      } catch (error) {
        // Notification setup is best-effort — a failure here (e.g. no native
        // module available) should never block the rest of the app, but log
        // it rather than swallowing it so it's actually diagnosable.
        console.error('[Chronicle notifications] bootstrap failed:', error);
      }
    }

    void setupNotifications();
  }, []);

  return (
    <>
      <RootNavigator />
      <StatusBar style="auto" />
    </>
  );
}
