import { describe, expect, it } from 'vitest';

import { createFakeNotificationClient } from './fakeNotificationClient';

describe('createFakeNotificationClient', () => {
  it('starts with the given initial permission, defaulting to "default"', () => {
    expect(createFakeNotificationClient().getPermissionState()).toEqual({
      supported: true,
      permission: 'default',
    });
    expect(createFakeNotificationClient('denied').getPermissionState().permission).toBe('denied');
  });

  it('requestPermission grants permission and returns the updated state', async () => {
    const client = createFakeNotificationClient('default');

    const result = await client.requestPermission();

    expect(result).toEqual({ supported: true, permission: 'granted' });
    expect(client.getPermissionState().permission).toBe('granted');
  });

  it('records a shown notification when permission is granted', () => {
    const client = createFakeNotificationClient('granted');

    client.show('Quest reminder', { body: '2 quests left today', tag: 'quest-reminder' });

    expect(client.shown).toEqual([
      { title: 'Quest reminder', options: { body: '2 quests left today', tag: 'quest-reminder' } },
    ]);
  });

  it('does not record a notification when permission is not granted', () => {
    const client = createFakeNotificationClient('default');

    client.show('Quest reminder');

    expect(client.shown).toEqual([]);
  });

  it('setPermission changes the state directly without going through requestPermission', () => {
    const client = createFakeNotificationClient('default');

    client.setPermission('denied');

    expect(client.getPermissionState().permission).toBe('denied');
  });
});
