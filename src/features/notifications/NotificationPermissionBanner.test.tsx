import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { NotificationPermissionBanner } from './NotificationPermissionBanner';

describe('NotificationPermissionBanner', () => {
  it('renders when permission is default and notifications are supported', () => {
    render(
      <NotificationPermissionBanner
        permissionState={{ supported: true, permission: 'default' }}
        onRequestPermission={vi.fn()}
      />,
    );

    expect(screen.getByTestId('notification-permission-banner')).toBeInTheDocument();
  });

  it('renders nothing when notifications are not supported', () => {
    render(
      <NotificationPermissionBanner
        permissionState={{ supported: false, permission: 'denied' }}
        onRequestPermission={vi.fn()}
      />,
    );

    expect(screen.queryByTestId('notification-permission-banner')).not.toBeInTheDocument();
  });

  it('renders nothing once permission has already been granted', () => {
    render(
      <NotificationPermissionBanner
        permissionState={{ supported: true, permission: 'granted' }}
        onRequestPermission={vi.fn()}
      />,
    );

    expect(screen.queryByTestId('notification-permission-banner')).not.toBeInTheDocument();
  });

  it('renders nothing once permission has already been denied', () => {
    render(
      <NotificationPermissionBanner
        permissionState={{ supported: true, permission: 'denied' }}
        onRequestPermission={vi.fn()}
      />,
    );

    expect(screen.queryByTestId('notification-permission-banner')).not.toBeInTheDocument();
  });

  it('calls onRequestPermission when the button is clicked', () => {
    const onRequestPermission = vi.fn();
    render(
      <NotificationPermissionBanner
        permissionState={{ supported: true, permission: 'default' }}
        onRequestPermission={onRequestPermission}
      />,
    );

    screen.getByRole('button', { name: 'Enable notifications' }).click();

    expect(onRequestPermission).toHaveBeenCalledTimes(1);
  });
});
