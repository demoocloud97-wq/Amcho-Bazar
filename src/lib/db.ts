import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import { EVENT, type CategoryKey } from "./dummy-data";
import { AMCHO_BAZAR_EVENT_ID } from "./events-db";

// A seller registration stored in Firestore.
export type Registration = {
  id?: string;
  uid?: string; // Firebase Auth user id (if signed in)
  eventId?: string;
  seasonId?: string; // season this record belongs to (source of truth)
  season: number;    // legacy numeric season (kept during migration)
  seller: string;
  business: string;
  tagline?: string;        // one-line business tagline
  yearsRunning?: string;   // how long the business has run
  instagram?: string;      // seller's Instagram handle
  city?: string;
  category: CategoryKey;   // primary (first) category — kept for back-compat
  categoryId?: string;     // primary category doc id
  categories?: string[];   // all chosen category names (multi-select)
  categoryIds?: string[];  // all chosen category doc ids
  subcategoryId?: string; // primary (first) sub-category doc id
  subcategory?: string;   // its name (for display)
  subcategories?: string[];  // all chosen sub-category names (multi-select)
  subcategoryIds?: string[]; // all chosen sub-category doc ids
  phone: string;
  email?: string;
  logoUrl?: string; // Cloudinary URL of the business logo, if uploaded
  products: string[];
  status: "pending" | "approved" | "waitlist" | "paid";
  stall?: number | null;
  createdAt?: unknown;
};

const REGISTRATIONS = "registrations";
const byNewest = (a: Registration, b: Registration) =>
  ((b.createdAt as { seconds?: number })?.seconds ?? 0) - ((a.createdAt as { seconds?: number })?.seconds ?? 0);

export async function createRegistration(
  data: Omit<Registration, "id" | "createdAt" | "status" | "season"> & { status?: Registration["status"]; season?: number }
) {
  const payload: DocumentData = {
    seller: data.seller,
    business: data.business,
    category: data.category,
    phone: data.phone,
    products: data.products,
    season: data.season ?? EVENT.seasonNumber,
    eventId: data.eventId ?? AMCHO_BAZAR_EVENT_ID,
    status: data.status ?? "pending",
    stall: data.stall ?? null,
    createdAt: serverTimestamp(),
  };
  if (data.uid) payload.uid = data.uid;
  if (data.email) payload.email = data.email;
  if (data.seasonId) payload.seasonId = data.seasonId; // Firestore rejects undefined
  if (data.categoryId) payload.categoryId = data.categoryId;
  if (data.categories?.length) payload.categories = data.categories;
  if (data.categoryIds?.length) payload.categoryIds = data.categoryIds;
  if (data.subcategoryId) payload.subcategoryId = data.subcategoryId;
  if (data.subcategory) payload.subcategory = data.subcategory;
  if (data.subcategoryIds?.length) payload.subcategoryIds = data.subcategoryIds;
  if (data.subcategories?.length) payload.subcategories = data.subcategories;
  if (data.tagline) payload.tagline = data.tagline;
  if (data.yearsRunning) payload.yearsRunning = data.yearsRunning;
  if (data.instagram) payload.instagram = data.instagram;
  if (data.city) payload.city = data.city;
  if (data.logoUrl) payload.logoUrl = data.logoUrl;
  const ref = await addDoc(collection(db, REGISTRATIONS), payload);
  return ref.id;
}

// Legacy numeric-season read (kept for migration/back-compat).
export async function getRegistrations(season: number = EVENT.seasonNumber): Promise<Registration[]> {
  const q = query(collection(db, REGISTRATIONS), where("season", "==", season));
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as Registration[];
  return list.sort(byNewest);
}

// Season-scoped read (source of truth). Use this in the app.
export async function getRegistrationsBySeasonId(seasonId: string): Promise<Registration[]> {
  const q = query(collection(db, REGISTRATIONS), where("seasonId", "==", seasonId));
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as Registration[];
  return list.sort(byNewest);
}

// Live stream of all registrations (admin) — powers the request notifications.
export function watchRegistrations(cb: (regs: Registration[]) => void) {
  return onSnapshot(collection(db, REGISTRATIONS), (snap) => {
    cb((snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as Registration[]).sort(byNewest));
  });
}

// Which registrations belong to the season the admin is viewing. Mirrors the draw:
// match by seasonId, by legacy numeric season, OR orphans (no seasonId yet) — so the
// admin metrics/table see exactly the same applicants the draw pool does.
function belongsToSeason(r: Registration, seasonId: string, seasonNumber?: number): boolean {
  // Number()-tolerant on `season` — some older records store it as a string, which
  // a strict === would miss and drop the applicant from the admin view.
  return r.seasonId === seasonId || !r.seasonId || (seasonNumber != null && Number(r.season) === Number(seasonNumber));
}

// Admin view: this season's registrations PLUS orphans/legacy so a request submitted
// before a season was active (or matched only by number) still surfaces for review.
export async function getRegistrationsForAdmin(seasonId: string, seasonNumber?: number): Promise<Registration[]> {
  const snap = await getDocs(collection(db, REGISTRATIONS));
  const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as Registration[];
  return list.filter((r) => belongsToSeason(r, seasonId, seasonNumber)).sort(byNewest);
}

// Live version of getRegistrationsForAdmin — keeps the admin screen (metrics,
// category breakdown, table, activity) in sync with the live draw in real time.
export function watchRegistrationsForAdmin(seasonId: string, seasonNumber: number | undefined, cb: (regs: Registration[]) => void) {
  return onSnapshot(
    collection(db, REGISTRATIONS),
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as Registration[];
      cb(list.filter((r) => belongsToSeason(r, seasonId, seasonNumber)).sort(byNewest));
    },
    // If the listener drops (e.g. an auth-token race right after a refresh), fall back
    // to a one-time fetch so the admin metrics/table aren't stuck showing 0.
    (err) => {
      console.error("Registrations listener error — refetching", err);
      getRegistrationsForAdmin(seasonId, seasonNumber).then(cb).catch(() => {});
    }
  );
}

// Move a registration to another season (admin correction).
export async function moveRegistration(id: string, toSeasonId: string) {
  await updateDoc(doc(db, REGISTRATIONS, id), { seasonId: toSeasonId, updatedAt: serverTimestamp() } as DocumentData);
}

export async function getRegistration(id: string): Promise<Registration | null> {
  const snap = await getDoc(doc(db, REGISTRATIONS, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Registration) : null;
}

export async function getMyRegistrations(uid: string): Promise<Registration[]> {
  const q = query(collection(db, REGISTRATIONS), where("uid", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as Registration[];
}

export async function updateRegistration(id: string, patch: Partial<Registration>) {
  await updateDoc(doc(db, REGISTRATIONS, id), patch as DocumentData);
}

export async function deleteRegistration(id: string) {
  await deleteDoc(doc(db, REGISTRATIONS, id));
}
