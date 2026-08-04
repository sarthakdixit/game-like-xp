jest.mock('react-native-health-connect', () => ({
  getSdkStatus: jest.fn().mockResolvedValue(3),
  initialize: jest.fn().mockResolvedValue(true),
  getGrantedPermissions: jest.fn().mockResolvedValue([
    { accessType: 'read', recordType: 'Steps' },
    { accessType: 'read', recordType: 'SleepSession' },
    { accessType: 'read', recordType: 'ExerciseSession' },
  ]),
  requestPermission: jest.fn().mockResolvedValue([
    { accessType: 'read', recordType: 'Steps' },
    { accessType: 'read', recordType: 'SleepSession' },
    { accessType: 'read', recordType: 'ExerciseSession' },
  ]),
  readRecords: jest.fn().mockResolvedValue({ records: [] }),
  SdkAvailabilityStatus: {
    SDK_UNAVAILABLE: 1,
    SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED: 2,
    SDK_AVAILABLE: 3,
  },
}));

describe('getHealthClient', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  function loadClient() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- reset module state per test
    const mod = require('./healthConnectClient') as typeof import('./healthConnectClient');
    return mod.getHealthClient();
  }

  function mockHealthConnect() {
    return jest.requireMock('react-native-health-connect') as {
      getSdkStatus: jest.Mock;
      initialize: jest.Mock;
      getGrantedPermissions: jest.Mock;
      requestPermission: jest.Mock;
      readRecords: jest.Mock;
    };
  }

  it('memoizes the client across calls', () => {
    const client = loadClient();
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- reset module state per test
    const mod = require('./healthConnectClient') as typeof import('./healthConnectClient');
    expect(mod.getHealthClient()).toBe(client);
  });

  it('reports available when the SDK status is SDK_AVAILABLE and initialize succeeds', async () => {
    const client = loadClient();
    expect(await client.isAvailable()).toBe(true);
  });

  it('reports unavailable when the SDK status is not SDK_AVAILABLE', async () => {
    const HealthConnect = mockHealthConnect();
    HealthConnect.getSdkStatus.mockResolvedValueOnce(1);

    const client = loadClient();
    expect(await client.isAvailable()).toBe(false);
    expect(HealthConnect.initialize).not.toHaveBeenCalled();
  });

  it('reports granted permission status when all three read permissions are granted', async () => {
    const client = loadClient();
    expect(await client.getPermissionStatus()).toBe('granted');
  });

  it('reports denied permission status when a required permission is missing', async () => {
    const HealthConnect = mockHealthConnect();
    HealthConnect.getGrantedPermissions.mockResolvedValueOnce([
      { accessType: 'read', recordType: 'Steps' },
    ]);

    const client = loadClient();
    expect(await client.getPermissionStatus()).toBe('denied');
  });

  it('reports denied when Health Connect is unavailable, without calling getGrantedPermissions', async () => {
    const HealthConnect = mockHealthConnect();
    HealthConnect.getSdkStatus.mockResolvedValue(1);

    const client = loadClient();
    expect(await client.getPermissionStatus()).toBe('denied');
    expect(HealthConnect.getGrantedPermissions).not.toHaveBeenCalled();
  });

  it('requests all three read permissions and reports granted when they come back', async () => {
    const client = loadClient();
    const HealthConnect = mockHealthConnect();

    expect(await client.requestPermission()).toBe('granted');
    expect(HealthConnect.requestPermission).toHaveBeenCalledWith([
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'SleepSession' },
      { accessType: 'read', recordType: 'ExerciseSession' },
    ]);
  });

  it('reports denied when the user declines the permission request', async () => {
    const HealthConnect = mockHealthConnect();
    HealthConnect.requestPermission.mockResolvedValueOnce([]);

    const client = loadClient();
    expect(await client.requestPermission()).toBe('denied');
  });

  it('reads a daily summary by summing steps and interval-record durations in minutes', async () => {
    const HealthConnect = mockHealthConnect();
    HealthConnect.readRecords.mockImplementation((recordType: string) => {
      if (recordType === 'Steps') {
        return Promise.resolve({
          records: [
            {
              startTime: '2026-08-04T08:00:00.000Z',
              endTime: '2026-08-04T09:00:00.000Z',
              count: 3000,
            },
            {
              startTime: '2026-08-04T12:00:00.000Z',
              endTime: '2026-08-04T13:00:00.000Z',
              count: 2000,
            },
          ],
        });
      }
      if (recordType === 'SleepSession') {
        return Promise.resolve({
          records: [{ startTime: '2026-08-04T00:00:00.000Z', endTime: '2026-08-04T07:30:00.000Z' }],
        });
      }
      if (recordType === 'ExerciseSession') {
        return Promise.resolve({
          records: [{ startTime: '2026-08-04T18:00:00.000Z', endTime: '2026-08-04T18:45:00.000Z' }],
        });
      }
      return Promise.resolve({ records: [] });
    });

    const client = loadClient();
    const summary = await client.readDailySummary('2026-08-04');

    expect(summary).toEqual({ steps: 5000, sleepMinutes: 450, exerciseMinutes: 45 });
  });

  it('reads back all-zero for a day with no records', async () => {
    const client = loadClient();
    const summary = await client.readDailySummary('2026-08-04');

    expect(summary).toEqual({ steps: 0, sleepMinutes: 0, exerciseMinutes: 0 });
  });
});
