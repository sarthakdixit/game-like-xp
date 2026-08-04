import { generateId } from '../id';
import type { FirestoreClient } from '../firestoreClient';
import { dailyQuestPath, dailyQuestsPath } from '../paths';
import type { DailyQuest } from '../schema';

export interface CreateDailyQuestInput {
  questId: string;
  domainId: string;
  date: string;
}

export async function createDailyQuest(
  client: FirestoreClient,
  uid: string,
  input: CreateDailyQuestInput,
): Promise<DailyQuest> {
  const id = generateId();
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
