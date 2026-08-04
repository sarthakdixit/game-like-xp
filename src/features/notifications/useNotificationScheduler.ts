import { useCallback, useEffect, useState } from 'react';

import { getFirestoreClient } from '@/data/firestore';
import type { FirestoreClient } from '@/data/firestoreClient';
import { getNotificationScheduleStore } from '@/data/localNotificationScheduleStore';
import type { NotificationClient, NotificationPermissionState } from '@/data/notificationClient';
import type { NotificationScheduleStore } from '@/data/notificationScheduleStore';
import { getNotificationClient } from '@/data/webNotificationClient';

import { checkAndNotify } from './notificationService';

const DEFAULT_CHECK_INTERVAL_MS = 5 * 60 * 1000;

export interface UseNotificationSchedulerOptions {
  firestoreClientFactory?: () => FirestoreClient;
  notificationClientFactory?: () => NotificationClient;
  scheduleStoreFactory?: () => NotificationScheduleStore;
  /** How often to re-check while the tab stays open. Defaults to 5 minutes. */
  checkIntervalMs?: number;
}

export interface UseNotificationSchedulerResult {
  permissionState: NotificationPermissionState;
  requestPermission: () => Promise<void>;
}

/**
 * Runs `notificationService.checkAndNotify` once on mount and again on a
 * recurring interval for as long as this stays mounted, and exposes the
 * current Notification permission plus a way to request it. Per
 * requirements.md, this can only ever fire while the tab is open — there is
 * no browser API to schedule delivery once it's closed, and that's a known,
 * documented limitation rather than something worked around here.
 */
export function useNotificationScheduler(
  uid: string,
  options: UseNotificationSchedulerOptions = {},
): UseNotificationSchedulerResult {
  const {
    firestoreClientFactory = getFirestoreClient,
    notificationClientFactory = getNotificationClient,
    scheduleStoreFactory = getNotificationScheduleStore,
    checkIntervalMs = DEFAULT_CHECK_INTERVAL_MS,
  } = options;

  const [permissionState, setPermissionState] = useState<NotificationPermissionState>(() =>
    notificationClientFactory().getPermissionState(),
  );

  useEffect(() => {
    const firestoreClient = firestoreClientFactory();
    const notificationClient = notificationClientFactory();
    const scheduleStore = scheduleStoreFactory();

    function runCheck() {
      void checkAndNotify(firestoreClient, notificationClient, scheduleStore, uid);
    }

    runCheck();
    const intervalId = setInterval(runCheck, checkIntervalMs);
    return () => clearInterval(intervalId);
  }, [
    uid,
    firestoreClientFactory,
    notificationClientFactory,
    scheduleStoreFactory,
    checkIntervalMs,
  ]);

  const requestPermission = useCallback(async () => {
    const next = await notificationClientFactory().requestPermission();
    setPermissionState(next);
  }, [notificationClientFactory]);

  return { permissionState, requestPermission };
}
