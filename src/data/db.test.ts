jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));
jest.mock('./migrate', () => ({
  migrate: jest.fn(),
}));

describe('getDb', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('opens and migrates the database on first call', async () => {
    const fakeDb = { name: 'fake-db' };
    const { openDatabaseAsync } = jest.requireMock('expo-sqlite') as {
      openDatabaseAsync: jest.Mock;
    };
    const { migrate } = jest.requireMock('./migrate') as { migrate: jest.Mock };
    openDatabaseAsync.mockResolvedValue(fakeDb);

    // eslint-disable-next-line @typescript-eslint/no-require-imports -- reset module state per test
    const { getDb } = require('./db') as typeof import('./db');
    const db = await getDb();

    expect(db).toBe(fakeDb);
    expect(openDatabaseAsync).toHaveBeenCalledWith('chronicle.db');
    expect(migrate).toHaveBeenCalledWith(fakeDb);
  });

  it('memoizes the database across repeated calls', async () => {
    const fakeDb = { name: 'fake-db' };
    const { openDatabaseAsync } = jest.requireMock('expo-sqlite') as {
      openDatabaseAsync: jest.Mock;
    };
    const { migrate } = jest.requireMock('./migrate') as { migrate: jest.Mock };
    openDatabaseAsync.mockResolvedValue(fakeDb);

    // eslint-disable-next-line @typescript-eslint/no-require-imports -- reset module state per test
    const { getDb } = require('./db') as typeof import('./db');
    await getDb();
    await getDb();

    expect(openDatabaseAsync).toHaveBeenCalledTimes(1);
    expect(migrate).toHaveBeenCalledTimes(1);
  });
});
