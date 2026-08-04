export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

/**
 * Structural interface shared by the production driver (a Firebase Auth
 * wrapper) and the in-memory fake used in tests — same pattern as the old
 * SqliteClient/NotificationClient seam.
 */
export interface AuthClient {
  getCurrentUser(): AuthUser | null;
  /** Fires immediately with the current user, then on every sign-in/sign-out. Returns an unsubscribe function. */
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void;
  signInWithGoogle(): Promise<AuthUser>;
  signOut(): Promise<void>;
}
