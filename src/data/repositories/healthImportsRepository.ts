import { generateId } from '../id';
import { healthImportFromRow, type HealthImport, type HealthImportRow } from '../schema';
import type { SqliteClient } from '../sqliteClient';

export interface CreateHealthImportInput {
  childStatId: string;
  date: string;
  appliedDelta: number;
}

export async function createHealthImport(
  db: SqliteClient,
  input: CreateHealthImportInput,
): Promise<HealthImport> {
  const id = generateId();
  const createdAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO health_imports (id, child_stat_id, date, applied_delta, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, input.childStatId, input.date, input.appliedDelta, createdAt],
  );

  const created = await getHealthImport(db, input.childStatId, input.date);
  if (!created) {
    throw new Error(`Failed to read back health import ${id} after insert`);
  }
  return created;
}

export async function getHealthImport(
  db: SqliteClient,
  childStatId: string,
  date: string,
): Promise<HealthImport | null> {
  const row = await db.getFirstAsync<HealthImportRow>(
    'SELECT * FROM health_imports WHERE child_stat_id = ? AND date = ?',
    [childStatId, date],
  );
  return row ? healthImportFromRow(row) : null;
}

/** The most recent import across every child stat — used to show "last synced" on the health screen. */
export async function getLatestHealthImport(db: SqliteClient): Promise<HealthImport | null> {
  const row = await db.getFirstAsync<HealthImportRow>(
    'SELECT * FROM health_imports ORDER BY created_at DESC, rowid DESC LIMIT 1',
    [],
  );
  return row ? healthImportFromRow(row) : null;
}
