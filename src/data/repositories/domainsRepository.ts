import { generateId } from '../id';
import { domainFromRow, type Domain, type DomainRow } from '../schema';
import type { SqliteClient } from '../sqliteClient';

export interface CreateDomainInput {
  key: string;
  name: string;
  sortOrder: number;
}

export interface UpdateDomainProgressInput {
  level: number;
  xp: number;
  title: string | null;
}

export async function createDomain(db: SqliteClient, input: CreateDomainInput): Promise<Domain> {
  const id = generateId();
  const createdAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO domains (id, key, name, sort_order, level, xp, title, created_at)
     VALUES (?, ?, ?, ?, 1, 0, NULL, ?)`,
    [id, input.key, input.name, input.sortOrder, createdAt],
  );

  const created = await getDomainById(db, id);
  if (!created) {
    throw new Error(`Failed to read back domain ${id} after insert`);
  }
  return created;
}

export async function getDomainById(db: SqliteClient, id: string): Promise<Domain | null> {
  const row = await db.getFirstAsync<DomainRow>('SELECT * FROM domains WHERE id = ?', [id]);
  return row ? domainFromRow(row) : null;
}

export async function getDomainByKey(db: SqliteClient, key: string): Promise<Domain | null> {
  const row = await db.getFirstAsync<DomainRow>('SELECT * FROM domains WHERE key = ?', [key]);
  return row ? domainFromRow(row) : null;
}

export async function listDomains(db: SqliteClient): Promise<Domain[]> {
  const rows = await db.getAllAsync<DomainRow>('SELECT * FROM domains ORDER BY sort_order ASC', []);
  return rows.map(domainFromRow);
}

export async function updateDomainProgress(
  db: SqliteClient,
  id: string,
  input: UpdateDomainProgressInput,
): Promise<void> {
  await db.runAsync('UPDATE domains SET level = ?, xp = ?, title = ? WHERE id = ?', [
    input.level,
    input.xp,
    input.title,
    id,
  ]);
}

export async function deleteDomain(db: SqliteClient, id: string): Promise<void> {
  await db.runAsync('DELETE FROM domains WHERE id = ?', [id]);
}
