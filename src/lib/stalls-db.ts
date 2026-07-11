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
import { getCategories, getSubCategories } from "./categories-db";
import type { Registration } from "./db";

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
  data: { name: string; owner: string; categoryId: string; status?: StallStatus; season?: number; seasonId?: string; subcategoryId?: string | null; imageUrl?: string | null }
) {
  const payload: DocumentData = {
    registrationId,
    name: data.name,
    owner: data.owner,
    status: data.status ?? "assigned",
    categoryId: data.categoryId,
    subcategoryId: data.subcategoryId ?? null,
    imageUrl: data.imageUrl ?? null,
    season: data.season ?? EVENT.seasonNumber,
    eventId: AMCHO_BAZAR_EVENT_ID,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (data.seasonId) payload.seasonId = data.seasonId;
  // One stall per (registration, category) — a seller may register in several categories.
  await setDoc(doc(db, STALLS, `reg_${registrationId}_${data.categoryId}`), payload, { merge: true });
}

/** Approve-time side effect: list a registration in the stall directory across its
 *  chosen categories (resolving names→ids when needed). Returns how many category
 *  stalls were created — 0 means no matching category exists yet. Clears stale
 *  stalls first so re-running never duplicates. Shared by admin approve + live draw. */
export async function materializeRegistrationStalls(
  r: Registration, seasonId: string, seasonNumber?: number
): Promise<{ created: number }> {
  let categoryIds = (r.categoryIds?.length ? r.categoryIds : (r.categoryId ? [r.categoryId] : [])).filter(Boolean) as string[];
  if (categoryIds.length === 0) {
    const cats = await getCategories();
    const names = r.categories?.length ? r.categories : [r.category];
    categoryIds = names
      .map((n) => cats.find((c) => (c.name || "").toLowerCase() === (String(n) || "").toLowerCase())?.id)
      .filter(Boolean) as string[];
  }
  if (categoryIds.length === 0) { await deleteStallForRegistration(r.id!).catch(() => {}); return { created: 0 }; }
  let subParent: string | undefined;
  if (r.subcategoryId) subParent = (await getSubCategories()).find((s) => s.id === r.subcategoryId)?.categoryId;
  await deleteStallForRegistration(r.id!); // clear stale category stalls first
  for (const cid of categoryIds) {
    await setStallForRegistration(r.id!, {
      name: r.business || r.seller,
      owner: r.seller,
      categoryId: cid,
      subcategoryId: subParent === cid ? r.subcategoryId! : null,
      imageUrl: r.logoUrl ?? null, // seller's uploaded logo → shown on the stall card
      status: "assigned",
      season: seasonNumber,
      seasonId,
    });
  }
  return { created: categoryIds.length };
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

// Delete every stall for a season — matched by seasonId AND legacy numeric season, so
// it clears exactly what the directory shows (including stalls not linked to a
// registration). Returns how many were removed.
export async function deleteStallsBySeason(seasonId: string | undefined, season: number): Promise<number> {
  const snaps = await Promise.all([
    seasonId ? getDocs(query(collection(db, STALLS), where("seasonId", "==", seasonId))) : Promise.resolve(null),
    getDocs(query(collection(db, STALLS), where("season", "==", season))),
  ]);
  const ids = new Set<string>();
  snaps.forEach((snap) => snap?.docs.forEach((d) => ids.add(d.id)));
  await Promise.all([...ids].map((id) => deleteDoc(doc(db, STALLS, id))));
  return ids.size;
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
