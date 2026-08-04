import { BrowserRouter } from 'react-router-dom';

import type { AuthClient } from '@/data/authClient';
import { getAuthClient } from '@/data/firebaseAuthClient';
import { getFirestoreClient } from '@/data/firestore';
import type { FirestoreClient } from '@/data/firestoreClient';
import { SignedInShell } from '@/features/auth/SignedInShell';
import { SignInScreen } from '@/features/auth/SignInScreen';
import { useAuth } from '@/features/auth/useAuth';

import './App.css';

export interface AppProps {
  authClientFactory?: () => AuthClient;
  firestoreClientFactory?: () => FirestoreClient;
}

export function App({
  authClientFactory = getAuthClient,
  firestoreClientFactory = getFirestoreClient,
}: AppProps) {
  const { user, loading, error, signIn, signOut } = useAuth(authClientFactory);

  return (
    <div className="stage">
      <div className="masthead">
        <p className="display mark">Chronicle</p>
        <p className="sub">A life, kept like a saga</p>
        <div className="divider" />
      </div>

      <div className="screen">
        {loading ? (
          <div data-testid="app-loading">Loading…</div>
        ) : !user ? (
          <SignInScreen onSignIn={() => void signIn()} error={error} />
        ) : (
          <BrowserRouter>
            <SignedInShell
              user={user}
              onSignOut={() => void signOut()}
              firestoreClientFactory={firestoreClientFactory}
            />
          </BrowserRouter>
        )}
      </div>
    </div>
  );
}
