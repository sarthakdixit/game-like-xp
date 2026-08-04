import type { AuthUser } from '@/data/authClient';
import type { FirestoreClient } from '@/data/firestoreClient';
import { useDomains } from '@/features/stats/useDomains';

export interface SignedInShellProps {
  user: AuthUser;
  onSignOut: () => void;
  firestoreClientFactory?: () => FirestoreClient;
}

/**
 * The app shell once a user is signed in. For Batch 2 this seeds/lists the
 * 5 domains as a live proof that Firestore reads/writes round-trip for a
 * real signed-in user — the actual character-sheet UI (radar chart, etc.)
 * lands with the Home screen batch and will replace this domain list.
 */
export function SignedInShell({ user, onSignOut, firestoreClientFactory }: SignedInShellProps) {
  const { domains, loading, error } = useDomains(user.uid, firestoreClientFactory);

  return (
    <div data-testid="signed-in-shell">
      <h1>Chronicle</h1>
      <p>Signed in as {user.displayName ?? user.email ?? user.uid}</p>
      <button type="button" onClick={onSignOut}>
        Sign out
      </button>

      {loading ? (
        <p data-testid="domains-loading">Loading your character sheet…</p>
      ) : error ? (
        <p role="alert" data-testid="domains-error">
          {error.message}
        </p>
      ) : (
        <ul data-testid="domains-list">
          {domains.map((domain) => (
            <li key={domain.id}>{domain.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
