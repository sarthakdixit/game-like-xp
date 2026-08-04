import { DatabaseSync, type SQLInputValue, type StatementSync } from 'node:sqlite';

import { migrate } from '../migrate';
import type { SqliteBindParams, SqliteClient, SqliteRunResult } from '../sqliteClient';

/** Calls `run`/`all`/`get` with the right overload for array vs. named-object params. */
function bind<T>(
  stmt: StatementSync,
  params: SqliteBindParams,
  positional: (stmt: StatementSync, values: SQLInputValue[]) => T,
  named: (stmt: StatementSync, values: Record<string, SQLInputValue>) => T,
): T {
  if (Array.isArray(params)) {
    return positional(stmt, params as SQLInputValue[]);
  }
  return named(stmt, params as Record<string, SQLInputValue>);
}

/**
 * A `SqliteClient` backed by Node's built-in `node:sqlite`, used only under Jest.
 * Mirrors expo-sqlite's async surface so repositories run unchanged in both.
 */
export function createNodeSqliteClient(location = ':memory:'): SqliteClient {
  const db = new DatabaseSync(location);

  return {
    async execAsync(sql) {
      db.exec(sql);
    },

    async runAsync(sql, params): Promise<SqliteRunResult> {
      const stmt = db.prepare(sql);
      const result = bind(
        stmt,
        params,
        (s, values) => s.run(...values),
        (s, values) => s.run(values),
      );
      return {
        lastInsertRowId: Number(result.lastInsertRowid),
        changes: Number(result.changes),
      };
    },

    async getAllAsync<T>(sql: string, params: SqliteBindParams): Promise<T[]> {
      const stmt = db.prepare(sql);
      return bind(
        stmt,
        params,
        (s, values) => s.all(...values),
        (s, values) => s.all(values),
      ) as T[];
    },

    async getFirstAsync<T>(sql: string, params: SqliteBindParams): Promise<T | null> {
      const stmt = db.prepare(sql);
      const row = bind(
        stmt,
        params,
        (s, values) => s.get(...values),
        (s, values) => s.get(values),
      );
      return (row ?? null) as T | null;
    },

    async withTransactionAsync(task) {
      db.exec('BEGIN');
      try {
        await task();
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  };
}

/** A fresh in-memory database with every migration already applied. */
export async function createMigratedTestDb(): Promise<SqliteClient> {
  const db = createNodeSqliteClient();
  await migrate(db);
  return db;
}
