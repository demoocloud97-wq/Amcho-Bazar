import { collection, doc, getDoc, getDocs, setDoc, updateDoc, serverTimestamp, orderBy, query, type DocumentData } from "firebase/firestore";
import { db } from "./firebase";

/* An Event is the root of the hierarchy (Amcho Bazar today; other recurring
   events later). Seasons hang off an Event. */
export type EventDoc = {
  id?: string;
  name: string;
  slug: string;
  type: string; // "bazaar" | "sports" | "gala" | …
  description?: string;
  logoImage?: string;
  activeSeasonId?: string | null; // cache of the current season for fast reads
  createdAt?: unknown;
  updatedAt?: unknown;
};

const EVENTS = "events";

// First implementation: a single fixed Amcho Bazar event.
export const AMCHO_BAZAR_EVENT_ID = "amcho-bazar";

export async function ensureAmchoBazarEvent(): Promise<EventDoc> {
  const ref = doc(db, EVENTS, AMCHO_BAZAR_EVENT_ID);
  const snap = await getDoc(ref);
  if (snap.exists()) return { id: snap.id, ...(snap.data() as DocumentData) } as EventDoc;
  const data: EventDoc = {
    name: "Amcho Bazar",
    slug: "amcho-bazar",
    type: "bazaar",
    description: "Nawait Community women-only community festival.",
    activeSeasonId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, data);
  return { id: AMCHO_BAZAR_EVENT_ID, ...data };
}

export async function getEvents(): Promise<EventDoc[]> {
  const snap = await getDocs(query(collection(db, EVENTS), orderBy("name", "asc")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as EventDoc[];
}

export async function getEvent(id: string): Promise<EventDoc | null> {
  const snap = await getDoc(doc(db, EVENTS, id));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as DocumentData) } as EventDoc) : null;
}

export async function setActiveSeasonId(eventId: string, seasonId: string | null): Promise<void> {
  await updateDoc(doc(db, EVENTS, eventId), { activeSeasonId: seasonId, updatedAt: serverTimestamp() });
}
