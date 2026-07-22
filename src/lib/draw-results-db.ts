import {
  collection,
  getDocs,
  doc,
  setDoc,
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
  tagline?: string;
  products?: string[];
  at: string;
  createdAt?: unknown;
};

const COL = "drawResults";

// A winner can end up with more than one result doc (a re-run, or a normal draw
// followed by Apply-final-list). Collapse to one row per registration — keep the
// lowest order — so the draw never lists the same seller twice.
function dedupe(list: DrawResult[]): DrawResult[] {
  const byCand = new Map<string, DrawResult>();
  for (const r of list) {
    const prev = byCand.get(r.candidateId);
    if (!prev || r.order < prev.order) byCand.set(r.candidateId, r);
  }
  return [...byCand.values()].sort((a, b) => a.order - b.order);
}

export async function getDrawResultsBySeasonId(seasonId: string): Promise<DrawResult[]> {
  const snap = await getDocs(query(collection(db, COL), where("seasonId", "==", seasonId)));
  const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as DrawResult[];
  return dedupe(list);
}

export async function saveDrawResult(r: Omit<DrawResult, "id" | "createdAt" | "eventId">) {
  // Deterministic id per season+winner: saving the same winner again overwrites
  // their row instead of creating a duplicate.
  const id = `${r.seasonId}_${r.candidateId}`;
  await setDoc(doc(db, COL, id), {
    ...r,
    eventId: AMCHO_BAZAR_EVENT_ID,
    createdAt: serverTimestamp(),
  } as DocumentData);
  return id;
}

// Live subscription — the presentation screen mirrors the admin's draw in
// real time (works across tabs/devices). Returns an unsubscribe function.
export function watchDrawResultsBySeasonId(seasonId: string, cb: (results: DrawResult[]) => void) {
  return onSnapshot(query(collection(db, COL), where("seasonId", "==", seasonId)), (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as DrawResult[];
    cb(dedupe(list));
  });
}

// Drop one winner from a season's draw (frees their stall number for a re-draw).
export async function deleteDrawResultByCandidate(seasonId: string, candidateId: string) {
  const snap = await getDocs(
    query(collection(db, COL), where("seasonId", "==", seasonId), where("candidateId", "==", candidateId))
  );
  await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, COL, d.id))));
}

export async function clearDrawResultsBySeasonId(seasonId: string) {
  const snap = await getDocs(query(collection(db, COL), where("seasonId", "==", seasonId)));
  await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, COL, d.id))));
}
