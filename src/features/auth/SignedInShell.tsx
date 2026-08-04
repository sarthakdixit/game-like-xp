import type { AuthUser } from '@/data/authClient';

export interface SignedInShellProps {
  user: AuthUser;
  onSignOut: () => void;
}

/**
 * The app shell once a user is signed in. For Batch 1 this is just an
 * identity check + sign-out control — the real character-sheet content
 * lands starting with the Home screen batch.
 */
export function SignedInShell({ user, onSignOut }: SignedInShellProps) {
  return (
    <div data-testid="signed-in-shell">
      <h1>Chronicle</h1>
      <p>Signed in as {user.displayName ?? user.email ?? user.uid}</p>
      <button type="button" onClick={onSignOut}>
        Sign out
      </button>
    </div>
  );
}
