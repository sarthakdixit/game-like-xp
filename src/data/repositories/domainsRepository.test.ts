import { beforeEach, describe, expect, it } from 'vitest';

import { createFakeFirestoreClient } from '../testUtils/fakeFirestoreClient';
import type { FirestoreClient } from '../firestoreClient';
import {
  createDomain,
  deleteDomain,
  getDomainById,
  getDomainByKey,
  listDomains,
  updateDomainProgress,
} from './domainsRepository';

const UID = 'user-1';

describe('domainsRepository', () => {
  let client: FirestoreClient;

  beforeEach(() => {
    client = createFakeFirestoreClient();
  });

  it('creates a domain starting at level 1, 0 xp, no title', async () => {
    const domain = await createDomain(client, UID, { key: 'health', name: 'Health', sortOrder: 0 });

    expect(domain).toMatchObject({
      key: 'health',
      name: 'Health',
      sortOrder: 0,
      level: 1,
      xp: 0,
      title: null,
    });
  });

  it('reads a domain back by id', async () => {
    const created = await createDomain(client, UID, {
      key: 'health',
      name: 'Health',
      sortOrder: 0,
    });

    expect(await getDomainById(client, UID, created.id)).toEqual(created);
  });

  it('returns null for a missing id', async () => {
    expect(await getDomainById(client, UID, 'missing')).toBeNull();
  });

  it('reads a domain back by key', async () => {
    const created = await createDomain(client, UID, {
      key: 'health',
      name: 'Health',
      sortOrder: 0,
    });

    expect(await getDomainByKey(client, UID, 'health')).toEqual(created);
  });

  it('returns null for a key that does not exist', async () => {
    expect(await getDomainByKey(client, UID, 'missing')).toBeNull();
  });

  it('lists domains for a user ordered by sortOrder', async () => {
    await createDomain(client, UID, { key: 'growth', name: 'Growth', sortOrder: 4 });
    await createDomain(client, UID, { key: 'health', name: 'Health', sortOrder: 0 });

    const domains = await listDomains(client, UID);

    expect(domains.map((d) => d.key)).toEqual(['health', 'growth']);
  });

  it('scopes domains to the requesting user only', async () => {
    await createDomain(client, UID, { key: 'health', name: 'Health', sortOrder: 0 });
    await createDomain(client, 'other-user', { key: 'career', name: 'Career', sortOrder: 0 });

    const domains = await listDomains(client, UID);

    expect(domains.map((d) => d.key)).toEqual(['health']);
  });

  it('updates level/xp/title', async () => {
    const created = await createDomain(client, UID, {
      key: 'health',
      name: 'Health',
      sortOrder: 0,
    });

    await updateDomainProgress(client, UID, created.id, { level: 2, xp: 120, title: 'Adept' });

    expect(await getDomainById(client, UID, created.id)).toMatchObject({
      level: 2,
      xp: 120,
      title: 'Adept',
    });
  });

  it('deletes a domain', async () => {
    const created = await createDomain(client, UID, {
      key: 'health',
      name: 'Health',
      sortOrder: 0,
    });

    await deleteDomain(client, UID, created.id);

    expect(await getDomainById(client, UID, created.id)).toBeNull();
  });
});
