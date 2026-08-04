import type { FirestoreClient } from '../firestoreClient';
import { childStatPath, childStatsPath } from '../paths';
import type { ChildStat } from '../schema';

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

/**
 * `key` doubles as the document id (there is exactly one child stat per key
 * per domain) rather than a generated id — same reasoning as
 * `domainsRepository.createDomain`: makes seeding naturally idempotent
 * against concurrent/duplicate calls instead of relying on a race-prone
 * check-then-create guard.
 */
export async function createChildStat(
  client: FirestoreClient,
  uid: string,
  input: CreateChildStatInput,
): Promise<ChildStat> {
  const childStat: ChildStat = {
    id: input.key,
    domainId: input.domainId,
    key: input.key,
    name: input.name,
    sortOrder: input.sortOrder,
    value: input.value ?? 0,
    lastActiveAt: input.lastActiveAt,
    createdAt: new Date().toISOString(),
  };

  await client.setDoc(childStatPath(uid, input.domainId, input.key), childStat);
  return childStat;
}

export async function getChildStatById(
  client: FirestoreClient,
  uid: string,
  domainId: string,
  id: string,
): Promise<ChildStat | null> {
  return client.getDoc<ChildStat>(childStatPath(uid, domainId, id));
}

export async function getChildStatByDomainAndKey(
  client: FirestoreClient,
  uid: string,
  domainId: string,
  key: string,
): Promise<ChildStat | null> {
  return client.getDoc<ChildStat>(childStatPath(uid, domainId, key));
}

export async function listChildStatsByDomain(
  client: FirestoreClient,
  uid: string,
  domainId: string,
): Promise<ChildStat[]> {
  return client.listCollection<ChildStat>(childStatsPath(uid, domainId), {
    orderBy: { field: 'sortOrder' },
  });
}

export async function updateChildStatValue(
  client: FirestoreClient,
  uid: string,
  domainId: string,
  id: string,
  input: UpdateChildStatValueInput,
): Promise<void> {
  await client.updateDoc(childStatPath(uid, domainId, id), input);
}

export async function deleteChildStat(
  client: FirestoreClient,
  uid: string,
  domainId: string,
  id: string,
): Promise<void> {
  await client.deleteDoc(childStatPath(uid, domainId, id));
}
