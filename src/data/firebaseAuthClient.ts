import {
  type User,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';

import type { AuthClient, AuthUser } from './authClient';
import { getFirebaseAuth } from './firebaseClient';

function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  };
}

let client: AuthClient | null = null;

/** The real, on-device Firebase Auth client (Google sign-in only). Lazily built so tests never construct it. */
export function getAuthClient(): AuthClient {
  if (!client) {
    client = {
      getCurrentUser(): AuthUser | null {
        const user = getFirebaseAuth().currentUser;
        return user ? toAuthUser(user) : null;
      },

      onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
        return onAuthStateChanged(getFirebaseAuth(), (user) => {
          callback(user ? toAuthUser(user) : null);
        });
      },

      async signInWithGoogle(): Promise<AuthUser> {
        const result = await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
        return toAuthUser(result.user);
      },

      async signOut(): Promise<void> {
        await firebaseSignOut(getFirebaseAuth());
      },
    };
  }
  return client;
}
