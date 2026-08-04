import { migrate, rollback } from './migrate';
import { createNodeSqliteClient } from './testUtils/nodeSqliteClient';

async function getUserVersion(db: ReturnType<typeof createNodeSqliteClient>) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []);
  return row?.user_version ?? 0;
}

async function tableExists(db: ReturnType<typeof createNodeSqliteClient>, name: string) {
  const row = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    [name],
  );
  return row !== null;
}

describe('migrate', () => {
  it('creates all tables and sets user_version', async () => {
    const db = createNodeSqliteClient();

    await migrate(db);

    expect(await getUserVersion(db)).toBe(2);
    for (const table of [
      'domains',
      'child_stats',
      'quests',
      'daily_quests',
      'xp_events',
      'health_imports',
    ]) {
      expect(await tableExists(db, table)).toBe(true);
    }
  });

  it('is idempotent when run twice', async () => {
    const db = createNodeSqliteClient();

    await migrate(db);
    await expect(migrate(db)).resolves.not.toThrow();
    expect(await getUserVersion(db)).toBe(2);
  });

  it('rolls back to version 0 and drops every table', async () => {
    const db = createNodeSqliteClient();
    await migrate(db);

    await rollback(db, 0);

    expect(await getUserVersion(db)).toBe(0);
    for (const table of [
      'domains',
      'child_stats',
      'quests',
      'daily_quests',
      'xp_events',
      'health_imports',
    ]) {
      expect(await tableExists(db, table)).toBe(false);
    }
  });
});
