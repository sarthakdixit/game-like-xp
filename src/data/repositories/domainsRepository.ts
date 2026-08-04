import type { FirestoreClient } from '../firestoreClient';
import { domainPath, domainsPath } from '../paths';
import type { Domain } from '../schema';

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

/**
 * `key` doubles as the document id (there is exactly one domain per key per
 * user) rather than a generated id. This makes `createDomain` naturally
 * idempotent — calling it twice for the same key overwrites the same
 * document instead of creating a duplicate, which matters because React
 * effects (StrictMode's intentional double-invoke in dev, or any other
 * double-mount) can otherwise race two concurrent seed calls into writing
 * two copies of every domain.
 */
export async function createDomain(
  client: FirestoreClient,
  uid: string,
  input: CreateDomainInput,
): Promise<Domain> {
  const domain: Domain = {
    id: input.key,
    key: input.key,
    name: input.name,
    sortOrder: input.sortOrder,
    level: 1,
    xp: 0,
    title: null,
    createdAt: new Date().toISOString(),
  };

  await client.setDoc(domainPath(uid, input.key), domain);
  return domain;
}

export async function getDomainById(
  client: FirestoreClient,
  uid: string,
  id: string,
): Promise<Domain | null> {
  return client.getDoc<Domain>(domainPath(uid, id));
}

export async function getDomainByKey(
  client: FirestoreClient,
  uid: string,
  key: string,
): Promise<Domain | null> {
  return client.getDoc<Domain>(domainPath(uid, key));
}

export async function listDomains(client: FirestoreClient, uid: string): Promise<Domain[]> {
  return client.listCollection<Domain>(domainsPath(uid), {
    orderBy: { field: 'sortOrder' },
  });
}

export async function updateDomainProgress(
  client: FirestoreClient,
  uid: string,
  id: string,
  input: UpdateDomainProgressInput,
): Promise<void> {
  await client.updateDoc(domainPath(uid, id), input);
}

export async function deleteDomain(
  client: FirestoreClient,
  uid: string,
  id: string,
): Promise<void> {
  await client.deleteDoc(domainPath(uid, id));
}
