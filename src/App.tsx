import type { AuthClient } from '@/data/authClient';
import { getAuthClient } from '@/data/firebaseAuthClient';
import { SignedInShell } from '@/features/auth/SignedInShell';
import { SignInScreen } from '@/features/auth/SignInScreen';
import { useAuth } from '@/features/auth/useAuth';

export interface AppProps {
  authClientFactory?: () => AuthClient;
}

export function App({ authClientFactory = getAuthClient }: AppProps) {
  const { user, loading, error, signIn, signOut } = useAuth(authClientFactory);

  if (loading) {
    return <div data-testid="app-loading">Loading…</div>;
  }

  if (!user) {
    return <SignInScreen onSignIn={() => void signIn()} error={error} />;
  }

  return <SignedInShell user={user} onSignOut={() => void signOut()} />;
}
