import { type FirebaseApp, initializeApp } from 'firebase/app';
import { type Auth, getAuth } from 'firebase/auth';
import { type Firestore, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

function ensureApp(): FirebaseApp {
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

/** The real, on-device Firebase Auth instance. Lazily built so tests never construct it. */
export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(ensureApp());
  }
  return auth;
}

/** The real, on-device Firestore instance. Lazily built so tests never construct it. */
export function getFirebaseFirestore(): Firestore {
  if (!firestore) {
    firestore = getFirestore(ensureApp());
  }
  return firestore;
}
