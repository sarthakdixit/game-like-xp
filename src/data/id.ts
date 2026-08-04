export function generateId(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) {
    return g.crypto.randomUUID();
  }
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

let sequenceCounter = 0;

/**
 * A monotonically increasing number, safe to use as a tiebreak-safe
 * ordering field — Firestore has no native auto-increment/rowid, and two
 * documents created within the same millisecond otherwise sort arbitrarily
 * when ordering by a millisecond-precision timestamp.
 */
export function nextSequence(): number {
  sequenceCounter = (sequenceCounter + 1) % 1000;
  return Date.now() * 1000 + sequenceCounter;
}
