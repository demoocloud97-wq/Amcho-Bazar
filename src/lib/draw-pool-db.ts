import { doc, setDoc, onSnapshot, serverTimestamp, type DocumentData } from "firebase/firestore";
import { db } from "./firebase";

// A season's applicant pool, NAME-ONLY (no phone/email) — safe to read publicly
// so the /present live map can show every applicant as a named cell. One doc per
// season, keyed by seasonId; the admin draw screen keeps it in sync. The same doc
// also carries a live `spinning` flag so the public map can start its random
// cell-hop the instant the admin begins a pick.
export type PoolApplicant = { id: string; seller: string; business: string; category: string };
export type DrawPool = { applicants: PoolApplicant[]; spinning: boolean };

const COL = "drawPools";

export async function publishDrawPool(seasonId: string, applicants: PoolApplicant[]) {
  await setDoc(doc(db, COL, seasonId), { seasonId, applicants, updatedAt: serverTimestamp() } as DocumentData, { merge: true });
}

// Broadcast whether the picker is currently spinning (admin → public map).
export async function setPoolSpinning(seasonId: string, spinning: boolean) {
  await setDoc(doc(db, COL, seasonId), { spinning, updatedAt: serverTimestamp() } as DocumentData, { merge: true });
}

export function watchDrawPool(seasonId: string, cb: (pool: DrawPool) => void) {
  return onSnapshot(doc(db, COL, seasonId), (snap) => {
    const d = snap.data();
    cb({ applicants: (d?.applicants ?? []) as PoolApplicant[], spinning: !!d?.spinning });
  });
}
