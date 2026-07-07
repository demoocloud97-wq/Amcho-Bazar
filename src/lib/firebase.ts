import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Config values come from your Firebase Console → Project settings → "Your apps".
// They are read from environment variables (.env). All VITE_ vars are exposed
// to the browser — that is expected and safe for Firebase web config.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Frontend-only demo: if Firebase env vars are missing, skip initialization
// so the UI still renders instead of crashing with auth/invalid-api-key.
const hasConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

if (hasConfig) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} else if (typeof window !== "undefined") {
  console.warn("[firebase] VITE_FIREBASE_* env vars missing — running in UI-only demo mode.");
}

export { auth, db, storage };

// Analytics only works in the browser — guard so it never runs during SSR.
// Analytics is non-critical — load it lazily so it stays out of the initial bundle.
if (typeof window !== "undefined" && app) {
  import("firebase/analytics")
    .then(({ getAnalytics, isSupported }) => isSupported().then((ok) => { if (ok && app) getAnalytics(app); }))
    .catch(() => {});
}

export default app;
