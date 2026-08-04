import type { AuthClient, AuthUser } from '../authClient';

export interface FakeAuthClient extends AuthClient {
  /** Test hook: push a user (or null) directly, notifying subscribers, without going through signInWithGoogle. */
  setUser(user: AuthUser | null): void;
}

const DEFAULT_GOOGLE_USER: AuthUser = {
  uid: 'test-uid',
  displayName: 'Test User',
  email: 'test@example.com',
  photoURL: null,
};

/** An in-memory AuthClient double — no real Firebase project involved. */
export function createFakeAuthClient(initialUser: AuthUser | null = null): FakeAuthClient {
  let currentUser = initialUser;
  const listeners = new Set<(user: AuthUser | null) => void>();

  function notify() {
    for (const listener of listeners) {
      listener(currentUser);
    }
  }

  return {
    getCurrentUser() {
      return currentUser;
    },
    onAuthStateChanged(callback) {
      listeners.add(callback);
      callback(currentUser);
      return () => {
        listeners.delete(callback);
      };
    },
    setUser(user) {
      currentUser = user;
      notify();
    },
    async signInWithGoogle() {
      currentUser = DEFAULT_GOOGLE_USER;
      notify();
      return currentUser;
    },
    async signOut() {
      currentUser = null;
      notify();
    },
  };
}
