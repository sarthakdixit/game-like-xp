import {
  collection,
  deleteDoc as deleteFirestoreDoc,
  doc,
  getDoc as getFirestoreDoc,
  getDocs,
  orderBy as firestoreOrderBy,
  query,
  setDoc as setFirestoreDoc,
  updateDoc as updateFirestoreDoc,
  where as firestoreWhere,
} from 'firebase/firestore';

import type { DocData, FirestoreClient, ListOptions } from './firestoreClient';
import { getFirebaseFirestore } from './firebaseClient';

let client: FirestoreClient | null = null;

/** The real, on-device Firestore client. Lazily built so tests never construct it. */
export function getFirestoreClient(): FirestoreClient {
  if (!client) {
    client = {
      async getDoc<T extends object>(path: string): Promise<T | null> {
        const snapshot = await getFirestoreDoc(doc(getFirebaseFirestore(), path));
        return snapshot.exists() ? (snapshot.data() as T) : null;
      },

      async setDoc<T extends object>(path: string, data: T): Promise<void> {
        await setFirestoreDoc(doc(getFirebaseFirestore(), path), data as DocData);
      },

      async updateDoc(path: string, data: object): Promise<void> {
        await updateFirestoreDoc(doc(getFirebaseFirestore(), path), data as DocData);
      },

      async deleteDoc(path: string): Promise<void> {
        await deleteFirestoreDoc(doc(getFirebaseFirestore(), path));
      },

      async listCollection<T extends object>(
        collectionPath: string,
        options?: ListOptions,
      ): Promise<(T & { id: string })[]> {
        const constraints = [
          ...(options?.where ?? []).map((w) => firestoreWhere(w.field, w.op, w.value)),
          ...(options?.orderBy
            ? [firestoreOrderBy(options.orderBy.field, options.orderBy.direction ?? 'asc')]
            : []),
        ];
        const snapshot = await getDocs(
          query(collection(getFirebaseFirestore(), collectionPath), ...constraints),
        );
        return snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...(docSnapshot.data() as T),
        }));
      },
    };
  }
  return client;
}
