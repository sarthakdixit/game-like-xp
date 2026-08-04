import { generateId } from '../id';
import { dailyQuestFromRow, type DailyQuest, type DailyQuestRow } from '../schema';
import type { SqliteClient } from '../sqliteClient';

export interface CreateDailyQuestInput {
  questId: string;
  domainId: string;
  date: string;
}

export async function createDailyQuest(
  db: SqliteClient,
  input: CreateDailyQuestInput,
): Promise<DailyQuest> {
  const id = generateId();

  await db.runAsync(
    `INSERT INTO daily_quests (id, quest_id, domain_id, date, completed_at)
     VALUES (?, ?, ?, ?, NULL)`,
    [id, input.questId, input.domainId, input.date],
  );

  const created = await getDailyQuestById(db, id);
  if (!created) {
    throw new Error(`Failed to read back daily quest ${id} after insert`);
  }
  return created;
}

export async function getDailyQuestById(db: SqliteClient, id: string): Promise<DailyQuest | null> {
  const row = await db.getFirstAsync<DailyQuestRow>('SELECT * FROM daily_quests WHERE id = ?', [
    id,
  ]);
  return row ? dailyQuestFromRow(row) : null;
}

export async function listDailyQuestsByDate(db: SqliteClient, date: string): Promise<DailyQuest[]> {
  const rows = await db.getAllAsync<DailyQuestRow>(
    'SELECT * FROM daily_quests WHERE date = ? ORDER BY rowid ASC',
    [date],
  );
  return rows.map(dailyQuestFromRow);
}

export async function completeDailyQuest(
  db: SqliteClient,
  id: string,
  completedAt: string,
): Promise<void> {
  await db.runAsync('UPDATE daily_quests SET completed_at = ? WHERE id = ?', [completedAt, id]);
}

export async function deleteDailyQuest(db: SqliteClient, id: string): Promise<void> {
  await db.runAsync('DELETE FROM daily_quests WHERE id = ?', [id]);
}
