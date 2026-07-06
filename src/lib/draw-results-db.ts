import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import { AMCHO_BAZAR_EVENT_ID } from "./events-db";

// One assigned stall from a season's draw. Season-scoped so running the draw
// in one season never touches another.
export type DrawResult = {
  id?: string;
  eventId?: string;
  seasonId: string;
  order: number;
  stallNo: number;
  candidateId: string; // registration id (or seed id) of the winner
  seller: string;
  business: string;
  category: string;
  at: string;
  createdAt?: unknown;
};

const COL = "drawResults";

export async function getDrawResultsBySeasonId(seasonId: string): Promise<DrawResult[]> {
  const snap = await getDocs(query(collection(db, COL), where("seasonId", "==", seasonId)));
  const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as DrawResult[];
  return list.sort((a, b) => a.order - b.order);
}

export async function saveDrawResult(r: Omit<DrawResult, "id" | "createdAt" | "eventId">) {
  const ref = await addDoc(collection(db, COL), {
    ...r,
    eventId: AMCHO_BAZAR_EVENT_ID,
    createdAt: serverTimestamp(),
  } as DocumentData);
  return ref.id;
}

// Live subscription — the presentation screen mirrors the admin's draw in
// real time (works across tabs/devices). Returns an unsubscribe function.
export function watchDrawResultsBySeasonId(seasonId: string, cb: (results: DrawResult[]) => void) {
  return onSnapshot(query(collection(db, COL), where("seasonId", "==", seasonId)), (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as DrawResult[];
    cb(list.sort((a, b) => a.order - b.order));
  });
}

export async function clearDrawResultsBySeasonId(seasonId: string) {
  const snap = await getDocs(query(collection(db, COL), where("seasonId", "==", seasonId)));
  await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, COL, d.id))));
}
