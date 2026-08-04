import { openDatabaseAsync } from 'expo-sqlite';

import { migrate } from './migrate';
import type { SqliteClient } from './sqliteClient';

const DATABASE_NAME = 'chronicle.db';

let dbPromise: Promise<SqliteClient> | null = null;

/** Opens (once) and migrates the on-device database. Safe to call repeatedly. */
export function getDb(): Promise<SqliteClient> {
  if (!dbPromise) {
    dbPromise = openDatabaseAsync(DATABASE_NAME).then(async (db) => {
      await migrate(db);
      return db;
    });
  }
  return dbPromise;
}
