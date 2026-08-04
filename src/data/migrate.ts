import { migrations } from './migrations';
import type { SqliteClient } from './sqliteClient';

interface UserVersionRow {
  user_version: number;
}

async function getUserVersion(db: SqliteClient): Promise<number> {
  const row = await db.getFirstAsync<UserVersionRow>('PRAGMA user_version', []);
  return row?.user_version ?? 0;
}

/** Applies every migration newer than the database's current `user_version`, in order. */
export async function migrate(db: SqliteClient): Promise<void> {
  const currentVersion = await getUserVersion(db);
  const pending = migrations
    .filter((migration) => migration.version > currentVersion)
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(migration.up);
      await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
  }
}

/** Rolls the database back to `targetVersion`, running `down` for every migration above it. */
export async function rollback(db: SqliteClient, targetVersion: number): Promise<void> {
  const currentVersion = await getUserVersion(db);
  const toRollback = migrations
    .filter((migration) => migration.version > targetVersion && migration.version <= currentVersion)
    .sort((a, b) => b.version - a.version);

  for (const migration of toRollback) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(migration.down);
      await db.execAsync(`PRAGMA user_version = ${migration.version - 1}`);
    });
  }
}
