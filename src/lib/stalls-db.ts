import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import { EVENT } from "./dummy-data";
import { AMCHO_BAZAR_EVENT_ID } from "./events-db";

export type StallStatus = "available" | "assigned" | "pending";

export type Stall = {
  id?: string;
  eventId?: string;
  seasonId?: string; // season this stall belongs to (source of truth)
  season?: number;   // legacy numeric season (kept during migration)
  registrationId?: string; // set when the stall was materialised from an approved registration
  name: string;
  owner: string;
  status: StallStatus;
  categoryId: string;
  subcategoryId?: string | null;
  imageUrl?: string | null; // stall/seller photo or logo
  createdAt?: unknown;
  updatedAt?: unknown;
};

// Materialise (create/update) a stall for an approved registration. Uses a
// deterministic doc id so re-approving never creates a duplicate.
export async function setStallForRegistration(
  registrationId: string,
  data: { name: string; owner: string; categoryId: string; status?: StallStatus; season?: number; seasonId?: string; subcategoryId?: string | null }
) {
  const payload: DocumentData = {
    registrationId,
    name: data.name,
    owner: data.owner,
    status: data.status ?? "assigned",
    categoryId: data.categoryId,
    subcategoryId: data.subcategoryId ?? null,
    season: data.season ?? EVENT.seasonNumber,
    eventId: AMCHO_BAZAR_EVENT_ID,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (data.seasonId) payload.seasonId = data.seasonId;
  // One stall per (registration, category) — a seller may register in several categories.
  await setDoc(doc(db, STALLS, `reg_${registrationId}_${data.categoryId}`), payload, { merge: true });
}

// Remove every stall materialised from a registration (across its categories).
export async function deleteStallForRegistration(registrationId: string) {
  const snap = await getDocs(query(collection(db, STALLS), where("registrationId", "==", registrationId)));
  await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, STALLS, d.id))));
}

const STALLS = "stalls";

export async function createStall(data: Omit<Stall, "id" | "createdAt" | "updatedAt">) {
  const payload: DocumentData = {
    name: data.name,
    owner: data.owner,
    status: data.status,
    categoryId: data.categoryId,
    subcategoryId: data.subcategoryId ?? null,
    imageUrl: data.imageUrl ?? null,
    season: data.season ?? EVENT.seasonNumber,
    eventId: data.eventId ?? AMCHO_BAZAR_EVENT_ID,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (data.seasonId) payload.seasonId = data.seasonId; // Firestore rejects undefined
  const ref = await addDoc(collection(db, STALLS), payload);
  return ref.id;
}

export async function getStallsByCategory(categoryId: string): Promise<Stall[]> {
  const q = query(collection(db, STALLS), where("categoryId", "==", categoryId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as Stall[];
}

export async function getAllStalls(): Promise<Stall[]> {
  const snap = await getDocs(collection(db, STALLS));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as Stall[];
}

export async function getStallsBySeason(season: number): Promise<Stall[]> {
  const q = query(collection(db, STALLS), where("season", "==", season));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as Stall[];
}

// Season-scoped read (source of truth). Use this in the app.
export async function getStallsBySeasonId(seasonId: string): Promise<Stall[]> {
  const q = query(collection(db, STALLS), where("seasonId", "==", seasonId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as Stall[];
}

export async function updateStall(id: string, patch: Partial<Stall>) {
  await updateDoc(doc(db, STALLS, id), { ...patch, updatedAt: serverTimestamp() } as DocumentData);
}

export async function deleteStall(id: string) {
  await deleteDoc(doc(db, STALLS, id));
}
