export interface SqliteRunResult {
  lastInsertRowId: number;
  changes: number;
}

export type SqliteBindParams = Record<string, string | number | null> | (string | number | null)[];

/**
 * Structural interface shared by the production driver (an opened expo-sqlite
 * `SQLiteDatabase`) and the Jest test double backed by `node:sqlite`. Repositories
 * and migrations depend on this, never on expo-sqlite directly, so they run
 * unchanged under both.
 */
export interface SqliteClient {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params: SqliteBindParams): Promise<SqliteRunResult>;
  getAllAsync<T>(sql: string, params: SqliteBindParams): Promise<T[]>;
  getFirstAsync<T>(sql: string, params: SqliteBindParams): Promise<T | null>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}
