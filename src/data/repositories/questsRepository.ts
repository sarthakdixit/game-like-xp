import { generateId } from '../id';
import type { FirestoreClient } from '../firestoreClient';
import { questPath, questsPath } from '../paths';
import type { Quest } from '../schema';

export interface CreateQuestInput {
  domainId: string;
  text: string;
  xpReward: number;
  isBoss?: boolean;
  /**
   * Optional stable id, e.g. for seeding a fixed template bank idempotently
   * (re-seeding overwrites the same doc instead of creating a duplicate —
   * see the domains/child-stats repositories for the same pattern). Runtime-
   * created quests omit this and get a random generated id.
   */
  id?: string;
}

export async function createQuest(
  client: FirestoreClient,
  uid: string,
  input: CreateQuestInput,
): Promise<Quest> {
  const id = input.id ?? generateId();
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
