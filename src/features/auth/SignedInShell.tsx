import { NavLink } from 'react-router-dom';

import type { AuthUser } from '@/data/authClient';
import type { FirestoreClient } from '@/data/firestoreClient';
import { AppRoutes } from '@/navigation/AppRoutes';

import './SignedInShell.css';

export interface SignedInShellProps {
  user: AuthUser;
  onSignOut: () => void;
  firestoreClientFactory?: () => FirestoreClient;
}

/** The app shell once a user is signed in — an identity strip and primary nav above the routed screens. */
export function SignedInShell({ user, onSignOut, firestoreClientFactory }: SignedInShellProps) {
  return (
    <div className="signedInShell" data-testid="signed-in-shell">
      <div className="account">
        <span>Signed in as {user.displayName ?? user.email ?? user.uid}</span>
        <button className="signOutLink" type="button" onClick={onSignOut}>
          Sign out
        </button>
      </div>

      <nav className="mainNav" aria-label="Primary">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : undefined)}>
          Character sheet
        </NavLink>
        <NavLink to="/quests" className={({ isActive }) => (isActive ? 'active' : undefined)}>
          Daily quests
        </NavLink>
      </nav>

      <AppRoutes uid={user.uid} firestoreClientFactory={firestoreClientFactory} />
    </div>
  );
}
