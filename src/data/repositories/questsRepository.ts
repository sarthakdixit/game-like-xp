import { generateId } from '../id';
import { questFromRow, type Quest, type QuestRow } from '../schema';
import type { SqliteClient } from '../sqliteClient';

export interface CreateQuestInput {
  domainId: string;
  text: string;
  xpReward: number;
  isBoss?: boolean;
}

export async function createQuest(db: SqliteClient, input: CreateQuestInput): Promise<Quest> {
  const id = generateId();
  const createdAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO quests (id, domain_id, text, xp_reward, is_boss, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, input.domainId, input.text, input.xpReward, input.isBoss ? 1 : 0, createdAt],
  );

  const created = await getQuestById(db, id);
  if (!created) {
    throw new Error(`Failed to read back quest ${id} after insert`);
  }
  return created;
}

export async function getQuestById(db: SqliteClient, id: string): Promise<Quest | null> {
  const row = await db.getFirstAsync<QuestRow>('SELECT * FROM quests WHERE id = ?', [id]);
  return row ? questFromRow(row) : null;
}

export async function listQuestsByDomain(db: SqliteClient, domainId: string): Promise<Quest[]> {
  const rows = await db.getAllAsync<QuestRow>(
    'SELECT * FROM quests WHERE domain_id = ? ORDER BY created_at ASC, rowid ASC',
    [domainId],
  );
  return rows.map(questFromRow);
}

export async function deleteQuest(db: SqliteClient, id: string): Promise<void> {
  await db.runAsync('DELETE FROM quests WHERE id = ?', [id]);
}
