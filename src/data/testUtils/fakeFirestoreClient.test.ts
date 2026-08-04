import { describe, expect, it } from 'vitest';

import { createFakeFirestoreClient } from './fakeFirestoreClient';

describe('createFakeFirestoreClient', () => {
  it('returns null for a doc that does not exist', async () => {
    const client = createFakeFirestoreClient();

    expect(await client.getDoc('users/u1/domains/d1')).toBeNull();
  });

  it('round-trips a doc through setDoc/getDoc', async () => {
    const client = createFakeFirestoreClient();

    await client.setDoc('users/u1/domains/d1', { key: 'health', level: 1 });

    expect(await client.getDoc('users/u1/domains/d1')).toEqual({ key: 'health', level: 1 });
  });

  it('merges partial data on updateDoc', async () => {
    const client = createFakeFirestoreClient();
    await client.setDoc('users/u1/domains/d1', { key: 'health', level: 1, xp: 0 });

    await client.updateDoc('users/u1/domains/d1', { level: 2, xp: 100 });

    expect(await client.getDoc('users/u1/domains/d1')).toEqual({
      key: 'health',
      level: 2,
      xp: 100,
    });
  });

  it('throws when updateDoc targets a doc that does not exist', async () => {
    const client = createFakeFirestoreClient();

    await expect(client.updateDoc('users/u1/domains/missing', { level: 2 })).rejects.toThrow();
  });

  it('removes a doc on deleteDoc', async () => {
    const client = createFakeFirestoreClient();
    await client.setDoc('users/u1/domains/d1', { key: 'health' });

    await client.deleteDoc('users/u1/domains/d1');

    expect(await client.getDoc('users/u1/domains/d1')).toBeNull();
  });

  it('lists only direct children of a collection, not nested subcollection docs', async () => {
    const client = createFakeFirestoreClient();
    await client.setDoc('users/u1/domains/d1', { key: 'health' });
    await client.setDoc('users/u1/domains/d2', { key: 'career' });
    await client.setDoc('users/u1/domains/d1/childStats/c1', { key: 'fitness' });

    const domains = await client.listCollection('users/u1/domains');

    expect(domains.map((d) => d.id).sort()).toEqual(['d1', 'd2']);
  });

  it('filters listCollection results with equality where clauses', async () => {
    const client = createFakeFirestoreClient();
    await client.setDoc('users/u1/dailyQuests/q1', { date: '2026-08-01', domainId: 'health' });
    await client.setDoc('users/u1/dailyQuests/q2', { date: '2026-08-02', domainId: 'health' });

    const results = await client.listCollection('users/u1/dailyQuests', {
      where: [{ field: 'date', op: '==', value: '2026-08-01' }],
    });

    expect(results).toEqual([{ id: 'q1', date: '2026-08-01', domainId: 'health' }]);
  });

  it('orders listCollection results ascending by default', async () => {
    const client = createFakeFirestoreClient();
    await client.setDoc('users/u1/domains/d1', { key: 'career', sortOrder: 1 });
    await client.setDoc('users/u1/domains/d2', { key: 'health', sortOrder: 0 });

    const results = await client.listCollection<{ key: string; sortOrder: number }>(
      'users/u1/domains',
      { orderBy: { field: 'sortOrder' } },
    );

    expect(results.map((d) => d.key)).toEqual(['health', 'career']);
  });

  it('orders listCollection results descending when requested', async () => {
    const client = createFakeFirestoreClient();
    await client.setDoc('users/u1/domains/d1', { key: 'career', sortOrder: 1 });
    await client.setDoc('users/u1/domains/d2', { key: 'health', sortOrder: 0 });

    const results = await client.listCollection<{ key: string; sortOrder: number }>(
      'users/u1/domains',
      { orderBy: { field: 'sortOrder', direction: 'desc' } },
    );

    expect(results.map((d) => d.key)).toEqual(['career', 'health']);
  });

  it('scopes listCollection to the exact user, not other users sharing a similar path prefix', async () => {
    const client = createFakeFirestoreClient();
    await client.setDoc('users/u1/domains/d1', { key: 'health' });
    await client.setDoc('users/u10/domains/d1', { key: 'career' });

    const results = await client.listCollection('users/u1/domains');

    expect(results).toEqual([{ id: 'd1', key: 'health' }]);
  });
});
