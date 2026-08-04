import type { NotificationPermissionState } from '@/data/notificationClient';

import './NotificationPermissionBanner.css';

export interface NotificationPermissionBannerProps {
  permissionState: NotificationPermissionState;
  onRequestPermission: () => void;
}

/**
 * A dismissable-by-outcome banner offering to enable quest-reminder/decay
 * notifications — shown only while the browser supports them and the user
 * hasn't yet answered the permission prompt either way. Once they grant or
 * deny it, `permissionState.permission` moves off `'default'` and this stops
 * rendering on its own.
 */
export function NotificationPermissionBanner({
  permissionState,
  onRequestPermission,
}: NotificationPermissionBannerProps) {
  if (!permissionState.supported || permissionState.permission !== 'default') {
    return null;
  }

  return (
    <div
      className="notificationPermissionBanner"
      role="status"
      data-testid="notification-permission-banner"
    >
      <span>Get a nudge for open quests and neglected stats?</span>
      <button type="button" onClick={onRequestPermission}>
        Enable notifications
      </button>
    </div>
  );
}
