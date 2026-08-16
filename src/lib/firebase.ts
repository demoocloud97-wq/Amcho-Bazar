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

// True only when real credentials are present. Screens can use this to explain
// why they have no data, rather than silently showing an empty state.
export const firebaseReady = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

// Frontend-only demo: when the env vars are missing we still initialise, using a
// placeholder config. Leaving `db`/`auth` undefined is what actually breaks the
// app — `doc(undefined, …)` throws synchronously inside the effects that
// SiteHeader and SeasonProvider run on every page, which tears down the whole
// React tree. With a real (if useless) instance, calls fail asynchronously
// instead, and every call site already handles that path.
const config = firebaseReady
  ? firebaseConfig
  : {
      apiKey: "demo-mode-no-credentials",
      authDomain: "demo.firebaseapp.com",
      projectId: "amcho-bazar-demo",
      storageBucket: "demo.appspot.com",
      messagingSenderId: "000000000000",
      appId: "1:000000000000:web:demo",
    };

if (!firebaseReady && typeof window !== "undefined") {
  console.warn(
    "[firebase] VITE_FIREBASE_* env vars missing — running in UI-only demo mode. " +
    "Pages render but no data loads or saves. Copy .env.example to .env and fill in your Firebase config."
  );
}

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(config);

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

// Analytics only works in the browser — guard so it never runs during SSR, and
// skip it entirely in demo mode (a placeholder appId would only log errors).
if (typeof window !== "undefined" && firebaseReady) {
  import("firebase/analytics")
    .then(({ getAnalytics, isSupported }) => isSupported().then((ok) => { if (ok) getAnalytics(app); }))
    .catch(() => {});
}

export default app;
