jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(null),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('some-id'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  AndroidImportance: { DEFAULT: 5 },
  SchedulableTriggerInputTypes: { DAILY: 'daily', DATE: 'date' },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

describe('getNotificationClient', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  function loadClient() {
     
    const { getNotificationClient } =
      require('./notifications') as typeof import('./notifications');
    return getNotificationClient();
  }

  it('memoizes the client across calls', () => {
    const client = loadClient();
     
    const { getNotificationClient } =
      require('./notifications') as typeof import('./notifications');
    expect(getNotificationClient()).toBe(client);
  });

  it('maps getPermissionStatus and requestPermission through to expo-notifications', async () => {
    const client = loadClient();
    const Notifications = jest.requireMock('expo-notifications') as {
      getPermissionsAsync: jest.Mock;
      requestPermissionsAsync: jest.Mock;
    };

    expect(await client.getPermissionStatus()).toBe('granted');
    expect(Notifications.getPermissionsAsync).toHaveBeenCalledTimes(1);

    expect(await client.requestPermission()).toBe('granted');
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it('lists scheduled ids by mapping identifiers off the raw scheduled notifications', async () => {
    const Notifications = jest.requireMock('expo-notifications') as {
      getAllScheduledNotificationsAsync: jest.Mock;
    };
    Notifications.getAllScheduledNotificationsAsync.mockResolvedValueOnce([
      { identifier: 'a' },
      { identifier: 'b' },
    ]);

    const client = loadClient();
    expect(await client.listScheduledIds()).toEqual(['a', 'b']);
  });

  it('schedules a daily notification with the DAILY trigger shape', async () => {
    const client = loadClient();
    const Notifications = jest.requireMock('expo-notifications') as {
      scheduleNotificationAsync: jest.Mock;
    };

    await client.schedule({
      id: 'daily-quest-reminder',
      title: 'Chronicle',
      body: "Today's quests are ready.",
      schedule: { type: 'daily', hour: 9, minute: 0 },
    });

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: 'daily-quest-reminder',
      content: { title: 'Chronicle', body: "Today's quests are ready." },
      trigger: { type: 'daily', hour: 9, minute: 0 },
    });
  });

  it('schedules a one-off notification with the DATE trigger shape', async () => {
    const client = loadClient();
    const Notifications = jest.requireMock('expo-notifications') as {
      scheduleNotificationAsync: jest.Mock;
    };
    const date = new Date('2026-08-04T12:00:00.000Z');

    await client.schedule({
      id: 'decay-nudge',
      title: 'Chronicle',
      body: 'Health is decaying — check in today.',
      schedule: { type: 'date', date },
    });

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: 'decay-nudge',
      content: { title: 'Chronicle', body: 'Health is decaying — check in today.' },
      trigger: { type: 'date', date },
    });
  });

  it('cancels a scheduled notification by id', async () => {
    const client = loadClient();
    const Notifications = jest.requireMock('expo-notifications') as {
      cancelScheduledNotificationAsync: jest.Mock;
    };

    await client.cancel('decay-nudge');

    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('decay-nudge');
  });
});
