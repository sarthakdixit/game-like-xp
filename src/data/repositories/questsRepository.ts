import { generateId } from '../id';
import type { FirestoreClient } from '../firestoreClient';
import { questPath, questsPath } from '../paths';
import type { Quest } from '../schema';

export interface CreateQuestInput {
  domainId: string;
  text: string;
  xpReward: number;
  isBoss?: boolean;
}

export async function createQuest(
  client: FirestoreClient,
  uid: string,
  input: CreateQuestInput,
): Promise<Quest> {
  const id = generateId();
  const quest: Quest = {
    id,
    domainId: input.domainId,
    text: input.text,
    xpReward: input.xpReward,
    isBoss: input.isBoss ?? false,
    createdAt: new Date().toISOString(),
  };

  await client.setDoc(questPath(uid, id), quest);
  return quest;
}

export async function getQuestById(
  client: FirestoreClient,
  uid: string,
  id: string,
): Promise<Quest | null> {
  return client.getDoc<Quest>(questPath(uid, id));
}

export async function listQuestsByDomain(
  client: FirestoreClient,
  uid: string,
  domainId: string,
): Promise<Quest[]> {
  return client.listCollection<Quest>(questsPath(uid), {
    where: [{ field: 'domainId', op: '==', value: domainId }],
  });
}

export async function listAllQuests(client: FirestoreClient, uid: string): Promise<Quest[]> {
  return client.listCollection<Quest>(questsPath(uid));
}
