import { generateId } from './id';

describe('generateId', () => {
  it('uses crypto.randomUUID when available', () => {
    expect(generateId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('falls back to a generated id when crypto.randomUUID is unavailable', () => {
    const original = globalThis.crypto;
    // @ts-expect-error -- deliberately removing crypto to exercise the fallback path
    delete globalThis.crypto;

    try {
      expect(generateId()).toMatch(/^id_[0-9a-z]+_[0-9a-z]+$/);
    } finally {
      globalThis.crypto = original;
    }
  });

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});
