import { useCallback, useEffect, useState } from 'react';

import type { AuthClient, AuthUser } from '@/data/authClient';
import { getAuthClient } from '@/data/firebaseAuthClient';

export interface UseAuthResult {
  user: AuthUser | null;
  loading: boolean;
  error: Error | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * Subscribes to the current Firebase Auth state. `authClientFactory` defaults
 * to the real on-device singleton; tests inject a fake instead — same
 * pattern as the old SqliteClient/NotificationClient-backed hooks. Pass a
 * stable reference (defined outside the component, or memoized) since it's
 * an effect dependency.
 */
export function useAuth(authClientFactory: () => AuthClient = getAuthClient): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = authClientFactory().onAuthStateChanged((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return unsubscribe;
  }, [authClientFactory]);

  const signIn = useCallback(async () => {
    try {
      await authClientFactory().signInWithGoogle();
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(String(caught)));
    }
  }, [authClientFactory]);

  const signOut = useCallback(async () => {
    try {
      await authClientFactory().signOut();
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(String(caught)));
    }
  }, [authClientFactory]);

  return { user, loading, error, signIn, signOut };
}
