import type { AuthUser } from '@/data/authClient';
import type { FirestoreClient } from '@/data/firestoreClient';
import { HomeScreen } from '@/features/stats/HomeScreen';

import './SignedInShell.css';

export interface SignedInShellProps {
  user: AuthUser;
  onSignOut: () => void;
  firestoreClientFactory?: () => FirestoreClient;
}

/** The app shell once a user is signed in — an identity strip above the character sheet. */
export function SignedInShell({ user, onSignOut, firestoreClientFactory }: SignedInShellProps) {
  return (
    <div className="signedInShell" data-testid="signed-in-shell">
      <div className="account">
        <span>Signed in as {user.displayName ?? user.email ?? user.uid}</span>
        <button className="signOutLink" type="button" onClick={onSignOut}>
          Sign out
        </button>
      </div>

      <HomeScreen uid={user.uid} firestoreClientFactory={firestoreClientFactory} />
    </div>
  );
}
