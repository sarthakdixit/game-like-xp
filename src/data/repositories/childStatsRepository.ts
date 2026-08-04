import { generateId } from '../id';
import { childStatFromRow, type ChildStat, type ChildStatRow } from '../schema';
import type { SqliteClient } from '../sqliteClient';

export interface CreateChildStatInput {
  domainId: string;
  key: string;
  name: string;
  sortOrder: number;
  value?: number;
  lastActiveAt: string;
}

export interface UpdateChildStatValueInput {
  value: number;
  lastActiveAt: string;
}

export async function createChildStat(
  db: SqliteClient,
  input: CreateChildStatInput,
): Promise<ChildStat> {
  const id = generateId();
  const createdAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO child_stats (id, domain_id, key, name, sort_order, value, last_active_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.domainId,
      input.key,
      input.name,
      input.sortOrder,
      input.value ?? 0,
      input.lastActiveAt,
      createdAt,
    ],
  );

  const created = await getChildStatById(db, id);
  if (!created) {
    throw new Error(`Failed to read back child stat ${id} after insert`);
  }
  return created;
}

export async function getChildStatById(db: SqliteClient, id: string): Promise<ChildStat | null> {
  const row = await db.getFirstAsync<ChildStatRow>('SELECT * FROM child_stats WHERE id = ?', [id]);
  return row ? childStatFromRow(row) : null;
}

export async function getChildStatByDomainAndKey(
  db: SqliteClient,
  domainId: string,
  key: string,
): Promise<ChildStat | null> {
  const row = await db.getFirstAsync<ChildStatRow>(
    'SELECT * FROM child_stats WHERE domain_id = ? AND key = ?',
    [domainId, key],
  );
  return row ? childStatFromRow(row) : null;
}

export async function listChildStatsByDomain(
  db: SqliteClient,
  domainId: string,
): Promise<ChildStat[]> {
  const rows = await db.getAllAsync<ChildStatRow>(
    'SELECT * FROM child_stats WHERE domain_id = ? ORDER BY sort_order ASC',
    [domainId],
  );
  return rows.map(childStatFromRow);
}

export async function updateChildStatValue(
  db: SqliteClient,
  id: string,
  input: UpdateChildStatValueInput,
): Promise<void> {
  await db.runAsync('UPDATE child_stats SET value = ?, last_active_at = ? WHERE id = ?', [
    input.value,
    input.lastActiveAt,
    id,
  ]);
}

export async function deleteChildStat(db: SqliteClient, id: string): Promise<void> {
  await db.runAsync('DELETE FROM child_stats WHERE id = ?', [id]);
}
