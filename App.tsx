import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { getDb } from '@/data/db';
import { getHealthClient } from '@/data/healthConnectClient';
import { getNotificationClient } from '@/data/notifications';
import { getLocalDateString } from '@/domain/today';
import { importHealthDataForDate } from '@/features/health/healthImportService';
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

    async function setupHealthImport() {
      // Health Connect is Android-only; there's no iOS HealthKit client yet.
      if (Platform.OS !== 'android') {
        return;
      }
      try {
        const db = await getDb();
        await importHealthDataForDate(db, getHealthClient(), getLocalDateString());
      } catch (error) {
        console.error('[Chronicle health import] bootstrap failed:', error);
      }
    }

    void setupNotifications();
    void setupHealthImport();
  }, []);

  return (
    <>
      <RootNavigator />
      <StatusBar style="auto" />
    </>
  );
}
