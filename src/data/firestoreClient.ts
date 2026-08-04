export type WhereOp = '==' | '<' | '<=' | '>' | '>=';

export interface WhereClause {
  field: string;
  op: WhereOp;
  value: unknown;
}

export interface OrderByClause {
  field: string;
  direction?: 'asc' | 'desc';
}

export interface ListOptions {
  where?: WhereClause[];
  orderBy?: OrderByClause;
}

export type DocData = Record<string, unknown>;

/**
 * Structural interface shared by the production driver (a Firestore
 * wrapper) and the in-memory fake used in tests — same pattern as the old
 * SqliteClient/NotificationClient seam. Deliberately minimal: just enough to
 * express every access pattern the repositories actually need (get/set/
 * update/delete a doc by path, list a collection with equality `where` and
 * single-field `orderBy`).
 *
 * Generic bounds use `object`, not `Record<string, unknown>` — schema types
 * like `Domain`/`ChildStat` are plain interfaces with no index signature, and
 * TypeScript's generic-constraint checking (unlike normal structural
 * assignability) requires the type argument to literally have one to satisfy
 * a `Record<string, unknown>` bound.
 */
export interface FirestoreClient {
  getDoc<T extends object>(path: string): Promise<T | null>;
  setDoc<T extends object>(path: string, data: T): Promise<void>;
  updateDoc(path: string, data: object): Promise<void>;
  deleteDoc(path: string): Promise<void>;
  listCollection<T extends object>(
    collectionPath: string,
    options?: ListOptions,
  ): Promise<(T & { id: string })[]>;
}
