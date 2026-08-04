import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { updateDomainProgress } from './data/repositories/domainsRepository';
import { seedDomains } from './data/seed';
import { createFakeAuthClient } from './data/testUtils/fakeAuthClient';
import { createFakeFirestoreClient } from './data/testUtils/fakeFirestoreClient';
import { App } from './App';
import './index.css';
import './App.css';

/**
 * A dedicated entry point for the Playwright E2E golden-path test — never
 * referenced by `index.html`/`main.tsx`, so it never ships in the real
 * production build (`vite build` only processes `index.html`'s entry graph).
 *
 * It exists because the actual golden path can't be automated end-to-end on
 * this machine: Playwright can't drive the real Google OAuth popup (an
 * automated click isn't a "trusted" user gesture), and the Firestore
 * emulator can't be installed here (`winget` is disabled by this machine's
 * Group Policy). Instead this boots the real `App` component — same
 * production code as `main.tsx` — with a pre-authenticated fake `AuthClient`
 * and a pre-seeded fake `FirestoreClient`, the same test doubles already
 * used throughout this codebase's unit/component tests, just wired up for a
 * real Chromium run instead of jsdom.
 */
const UID = 'e2e-user';

async function bootstrap() {
  const authClient = createFakeAuthClient({
    uid: UID,
    displayName: 'E2E Adventurer',
    email: 'e2e@example.com',
    photoURL: null,
  });
  const firestoreClient = createFakeFirestoreClient();

  await seedDomains(firestoreClient, UID);
  // Pre-loaded one small quest reward (every template awards >=10xp) short of the 50xp
  // level-2 threshold, so completing Health's daily quest deterministically crosses it
  // regardless of which template today's random selection happens to pick.
  await updateDomainProgress(firestoreClient, UID, 'health', { level: 1, xp: 45, title: null });

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App authClientFactory={() => authClient} firestoreClientFactory={() => firestoreClient} />
    </StrictMode>,
  );
}

void bootstrap();
