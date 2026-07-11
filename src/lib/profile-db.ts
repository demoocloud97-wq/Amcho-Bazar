import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

// Per-user profile captured at sign-up (name/phone/city), reused to pre-fill the
// seller registration. Keyed by the Firebase Auth uid.
const USERS = "users";

export type UserProfile = { fullName?: string; phone?: string; city?: string; email?: string };

export async function saveUserProfile(uid: string, data: UserProfile): Promise<void> {
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v != null && v !== ""));
  await setDoc(doc(db, USERS, uid), { ...clean, updatedAt: serverTimestamp() }, { merge: true });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, USERS, uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}
