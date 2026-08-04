import { generateId } from '../id';
import { xpEventFromRow, type XpEvent, type XpEventRow } from '../schema';
import type { SqliteClient } from '../sqliteClient';

export interface CreateXpEventInput {
  domainId: string;
  amount: number;
  source: 'quest' | 'manual' | 'import';
  sourceId?: string | null;
}

export async function createXpEvent(db: SqliteClient, input: CreateXpEventInput): Promise<XpEvent> {
  const id = generateId();
  const createdAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO xp_events (id, domain_id, amount, source, source_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, input.domainId, input.amount, input.source, input.sourceId ?? null, createdAt],
  );

  const created = await getXpEventById(db, id);
  if (!created) {
    throw new Error(`Failed to read back xp event ${id} after insert`);
  }
  return created;
}

export async function getXpEventById(db: SqliteClient, id: string): Promise<XpEvent | null> {
  const row = await db.getFirstAsync<XpEventRow>('SELECT * FROM xp_events WHERE id = ?', [id]);
  return row ? xpEventFromRow(row) : null;
}

export async function listXpEventsByDomain(db: SqliteClient, domainId: string): Promise<XpEvent[]> {
  const rows = await db.getAllAsync<XpEventRow>(
    'SELECT * FROM xp_events WHERE domain_id = ? ORDER BY created_at ASC, rowid ASC',
    [domainId],
  );
  return rows.map(xpEventFromRow);
}

export async function getLatestXpEventForDomain(
  db: SqliteClient,
  domainId: string,
): Promise<XpEvent | null> {
  const row = await db.getFirstAsync<XpEventRow>(
    'SELECT * FROM xp_events WHERE domain_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 1',
    [domainId],
  );
  return row ? xpEventFromRow(row) : null;
}
