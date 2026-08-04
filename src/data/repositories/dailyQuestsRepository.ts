import { generateId } from '../id';
import type { FirestoreClient } from '../firestoreClient';
import { dailyQuestPath, dailyQuestsPath } from '../paths';
import type { DailyQuest } from '../schema';

export interface CreateDailyQuestInput {
  questId: string;
  domainId: string;
  date: string;
  /**
   * Optional stable id. There is exactly one daily quest per (quest
   * template, date), so callers that want that uniqueness enforced
   * regardless of concurrent generation — e.g. `${date}_${questId}` — can
   * pass it here instead of getting a random generated id. See the
   * domains/quests repositories for the same idempotent-id pattern.
   */
  id?: string;
}

export async function createDailyQuest(
  client: FirestoreClient,
  uid: string,
  input: CreateDailyQuestInput,
): Promise<DailyQuest> {
  const id = input.id ?? generateId();
  const dailyQuest: DailyQuest = {
    id,
    questId: input.questId,
    domainId: input.domainId,
    date: input.date,
    completedAt: null,
  };

  await client.setDoc(dailyQuestPath(uid, id), dailyQuest);
  return dailyQuest;
}

export async function getDailyQuestById(
  client: FirestoreClient,
  uid: string,
  id: string,
): Promise<DailyQuest | null> {
  return client.getDoc<DailyQuest>(dailyQuestPath(uid, id));
}

export async function listDailyQuestsByDate(
  client: FirestoreClient,
  uid: string,
  date: string,
): Promise<DailyQuest[]> {
  return client.listCollection<DailyQuest>(dailyQuestsPath(uid), {
    where: [{ field: 'date', op: '==', value: date }],
  });
}

export async function completeDailyQuest(
  client: FirestoreClient,
  uid: string,
  id: string,
  completedAt: string,
): Promise<void> {
  await client.updateDoc(dailyQuestPath(uid, id), { completedAt });
}
