import { generateId, nextSequence } from '../id';
import type { FirestoreClient } from '../firestoreClient';
import { xpEventPath, xpEventsPath } from '../paths';
import type { XpEvent } from '../schema';

export interface CreateXpEventInput {
  domainId: string;
  amount: number;
  source: 'quest' | 'manual' | 'import';
  sourceId?: string | null;
}

export async function createXpEvent(
  client: FirestoreClient,
  uid: string,
  input: CreateXpEventInput,
): Promise<XpEvent> {
  const id = generateId();
  const xpEvent: XpEvent = {
    id,
    domainId: input.domainId,
    amount: input.amount,
    source: input.source,
    sourceId: input.sourceId ?? null,
    createdAt: new Date().toISOString(),
    seq: nextSequence(),
  };

  await client.setDoc(xpEventPath(uid, id), xpEvent);
  return xpEvent;
}

export async function getXpEventById(
  client: FirestoreClient,
  uid: string,
  id: string,
): Promise<XpEvent | null> {
  return client.getDoc<XpEvent>(xpEventPath(uid, id));
}

export async function listXpEventsByDomain(
  client: FirestoreClient,
  uid: string,
  domainId: string,
): Promise<XpEvent[]> {
  return client.listCollection<XpEvent>(xpEventsPath(uid), {
    where: [{ field: 'domainId', op: '==', value: domainId }],
    orderBy: { field: 'seq' },
  });
}

export async function getLatestXpEventForDomain(
  client: FirestoreClient,
  uid: string,
  domainId: string,
): Promise<XpEvent | null> {
  const events = await client.listCollection<XpEvent>(xpEventsPath(uid), {
    where: [{ field: 'domainId', op: '==', value: domainId }],
    orderBy: { field: 'seq', direction: 'desc' },
  });
  return events[0] ?? null;
}
