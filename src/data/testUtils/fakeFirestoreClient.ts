import type { DocData, FirestoreClient, ListOptions, WhereClause } from '../firestoreClient';

function matchesWhere(data: DocData, where: WhereClause[]): boolean {
  return where.every((clause) => {
    const actual = data[clause.field];
    switch (clause.op) {
      case '==':
        return actual === clause.value;
      case '<':
        return (actual as number) < (clause.value as number);
      case '<=':
        return (actual as number) <= (clause.value as number);
      case '>':
        return (actual as number) > (clause.value as number);
      case '>=':
        return (actual as number) >= (clause.value as number);
    }
  });
}

/**
 * An in-memory FirestoreClient double — no real Firebase project involved.
 * Stores documents in a flat `path -> data` map; `listCollection` scans for
 * direct children of a collection path (one path segment deeper, not nested
 * subcollections) and applies equality `where`/single-field `orderBy`
 * in-memory, which covers every query the repositories actually issue.
 */
export function createFakeFirestoreClient(): FirestoreClient {
  const store = new Map<string, DocData>();

  return {
    async getDoc<T extends object>(path: string): Promise<T | null> {
      const data = store.get(path);
      return data ? (data as T) : null;
    },

    async setDoc<T extends object>(path: string, data: T): Promise<void> {
      store.set(path, { ...(data as DocData) });
    },

    async updateDoc(path: string, data: object): Promise<void> {
      const existing = store.get(path);
      if (!existing) {
        throw new Error(`No document at ${path} to update`);
      }
      store.set(path, { ...existing, ...(data as DocData) });
    },

    async deleteDoc(path: string): Promise<void> {
      store.delete(path);
    },

    async listCollection<T extends object>(
      collectionPath: string,
      options?: ListOptions,
    ): Promise<(T & { id: string })[]> {
      const prefix = `${collectionPath}/`;
      let results: (T & { id: string })[] = [];

      for (const [path, data] of store.entries()) {
        if (!path.startsWith(prefix)) {
          continue;
        }
        const rest = path.slice(prefix.length);
        if (rest.includes('/')) {
          continue; // a doc in a nested subcollection, not a direct child of this collection
        }
        results.push({ id: rest, ...(data as T) });
      }

      if (options?.where) {
        results = results.filter((doc) => matchesWhere(doc as DocData, options.where!));
      }

      if (options?.orderBy) {
        const { field, direction = 'asc' } = options.orderBy;
        results.sort((a, b) => {
          const left = a[field as keyof typeof a];
          const right = b[field as keyof typeof b];
          if (left === right) {
            return 0;
          }
          const comparison = (left as number) < (right as number) ? -1 : 1;
          return direction === 'asc' ? comparison : -comparison;
        });
      }

      return results;
    },
  };
}
