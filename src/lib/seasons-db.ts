import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, setDoc,
  query, where, limit, writeBatch, serverTimestamp, onSnapshot, type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import { AMCHO_BAZAR_EVENT_ID } from "./events-db";

export type SeasonStatus =
  | "Upcoming"
  | "RegistrationOpen"
  | "RegistrationClosed"
  | "DrawPending"
  | "DrawRunning"
  | "Completed"
  | "Archived";

export const SEASON_STATUSES: SeasonStatus[] = [
  "Upcoming", "RegistrationOpen", "RegistrationClosed",
  "DrawPending", "DrawRunning", "Completed", "Archived",
];

export type Season = {
  id?: string;
  eventId: string;
  seasonName: string;
  seasonNumber: number;
  year: number;
  bannerImage?: string;
  description?: string;
  registrationStartDate?: string;
  registrationEndDate?: string;
  eventDate?: string;
  venue?: string;
  city?: string;
  // Event location (all optional; drives the home "Event Location" section)
  fullAddress?: string;
  googleMapsLink?: string;
  latitude?: number;
  longitude?: number;
  eventTime?: string;
  parkingDetails?: string;
  nearbyLandmark?: string;
  contactNumber?: string;
  maximumStalls: number;
  maximumSelectedStalls: number;
  registrationFee: number;
  recordedRegistrations?: number; // display-only count for archived seasons (no reg docs)
  guidelines?: string[];   // season-wise visitor guidelines (admin-editable)
  status: SeasonStatus;
  isActive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

const SEASONS = "seasons";
// Season-scoped collections checked before a season can be deleted.
const CHILD_COLLECTIONS = ["registrations", "stalls", "categories", "subcategories", "gallery", "payments", "drawResults"];

function normalize(id: string, data: DocumentData): Season {
  return {
    id,
    eventId: data.eventId,
    seasonName: data.seasonName ?? "",
    seasonNumber: data.seasonNumber ?? 0,
    year: data.year ?? 0,
    bannerImage: data.bannerImage,
    description: data.description,
    registrationStartDate: data.registrationStartDate,
    registrationEndDate: data.registrationEndDate,
    eventDate: data.eventDate,
    venue: data.venue,
    city: data.city,
    fullAddress: data.fullAddress,
    googleMapsLink: data.googleMapsLink,
    latitude: typeof data.latitude === "number" ? data.latitude : undefined,
    longitude: typeof data.longitude === "number" ? data.longitude : undefined,
    eventTime: data.eventTime,
    parkingDetails: data.parkingDetails,
    nearbyLandmark: data.nearbyLandmark,
    contactNumber: data.contactNumber,
    maximumStalls: data.maximumStalls ?? 0,
    maximumSelectedStalls: data.maximumSelectedStalls ?? 0,
    registrationFee: data.registrationFee ?? 0,
    recordedRegistrations: typeof data.recordedRegistrations === "number" ? data.recordedRegistrations : undefined,
    guidelines: Array.isArray(data.guidelines) ? data.guidelines : undefined,
    status: (data.status as SeasonStatus) ?? "Upcoming",
    isActive: Boolean(data.isActive),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function getSeasons(eventId: string = AMCHO_BAZAR_EVENT_ID): Promise<Season[]> {
  // Single equality filter + client-side sort — avoids a composite index.
  const snap = await getDocs(query(collection(db, SEASONS), where("eventId", "==", eventId)));
  return snap.docs.map((d) => normalize(d.id, d.data())).sort((a, b) => b.seasonNumber - a.seasonNumber);
}

// Live seasons list — keeps fee / dates / active-season changes in sync everywhere
// (registration, home, admin) the moment an admin saves, without a page reload.
export function watchSeasons(eventId: string = AMCHO_BAZAR_EVENT_ID, cb: (list: Season[]) => void) {
  return onSnapshot(
    query(collection(db, SEASONS), where("eventId", "==", eventId)),
    (snap) => cb(snap.docs.map((d) => normalize(d.id, d.data())).sort((a, b) => b.seasonNumber - a.seasonNumber)),
    // Listener dropped (e.g. transient auth/network) → fall back to a one-time fetch
    // so the whole app doesn't get stuck with no active season selected.
    (err) => { console.error("Seasons listener error — refetching", err); getSeasons(eventId).then(cb).catch(() => {}); }
  );
}

export async function getSeason(id: string): Promise<Season | null> {
  const snap = await getDoc(doc(db, SEASONS, id));
  return snap.exists() ? normalize(snap.id, snap.data()) : null;
}

export async function getActiveSeason(eventId: string = AMCHO_BAZAR_EVENT_ID): Promise<Season | null> {
  // Single equality filter + client-side pick — avoids a composite index.
  const snap = await getDocs(query(collection(db, SEASONS), where("eventId", "==", eventId)));
  const d = snap.docs.find((x) => x.data().isActive === true);
  return d ? normalize(d.id, d.data()) : null;
}

export async function createSeason(
  data: Omit<Season, "id" | "isActive" | "createdAt" | "updatedAt"> & { isActive?: boolean }
): Promise<string> {
  // Firestore rejects `undefined` field values — drop them (e.g. eventDate/venue omitted).
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
  const ref = await addDoc(collection(db, SEASONS), {
    ...clean,
    isActive: data.isActive ?? false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateSeason(id: string, patch: Partial<Season>): Promise<void> {
  const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
  await updateDoc(doc(db, SEASONS, id), { ...clean, updatedAt: serverTimestamp() } as DocumentData);
}

/* Exactly one active season per event — flips all others off atomically. */
export async function activateSeason(id: string, eventId: string = AMCHO_BAZAR_EVENT_ID): Promise<void> {
  const all = await getDocs(query(collection(db, SEASONS), where("eventId", "==", eventId)));
  const batch = writeBatch(db);
  all.docs.forEach((d) => {
    if (d.id !== id && d.data().isActive === true) batch.update(d.ref, { isActive: false, updatedAt: serverTimestamp() });
  });
  batch.update(doc(db, SEASONS, id), { isActive: true, updatedAt: serverTimestamp() });
  batch.set(doc(db, "events", eventId), { activeSeasonId: id, updatedAt: serverTimestamp() }, { merge: true });
  await batch.commit();
}

export async function archiveSeason(id: string): Promise<void> {
  await updateDoc(doc(db, SEASONS, id), { status: "Archived", isActive: false, updatedAt: serverTimestamp() });
}

/* True if the season has any child records (⇒ cannot be deleted, archive instead). */
export async function seasonHasData(id: string): Promise<boolean> {
  for (const coll of CHILD_COLLECTIONS) {
    const snap = await getDocs(query(collection(db, coll), where("seasonId", "==", id), limit(1)));
    if (!snap.empty) return true;
  }
  return false;
}

export async function deleteSeason(id: string): Promise<void> {
  if (await seasonHasData(id)) {
    throw new Error("Season has data — archive it instead of deleting.");
  }
  await deleteDoc(doc(db, SEASONS, id));
}
