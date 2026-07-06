import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import { EVENT } from "./dummy-data";
import { AMCHO_BAZAR_EVENT_ID } from "./events-db";

export type GalleryItem = {
  id?: string;
  eventId?: string;
  seasonId?: string; // season this photo belongs to (source of truth)
  season: number;    // legacy numeric season (kept during migration)
  src: string;
  caption: string;
  createdAt?: unknown;
};

const GALLERY_COL = "gallery";
const byNewest = (a: GalleryItem, b: GalleryItem) =>
  ((b.createdAt as { seconds?: number })?.seconds ?? 0) - ((a.createdAt as { seconds?: number })?.seconds ?? 0);

export async function createGalleryItem(
  data: Omit<GalleryItem, "id" | "createdAt" | "season"> & { season?: number }
) {
  const payload: DocumentData = {
    src: data.src,
    caption: data.caption,
    season: data.season ?? EVENT.seasonNumber,
    eventId: data.eventId ?? AMCHO_BAZAR_EVENT_ID,
    createdAt: serverTimestamp(),
  };
  if (data.seasonId) payload.seasonId = data.seasonId; // Firestore rejects undefined
  const ref = await addDoc(collection(db, GALLERY_COL), payload);
  return ref.id;
}

// Legacy numeric-season read (kept for migration/back-compat).
export async function getGalleryItems(season: number = EVENT.seasonNumber): Promise<GalleryItem[]> {
  const q = query(collection(db, GALLERY_COL), where("season", "==", season));
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as GalleryItem[];
  return list.sort(byNewest);
}

// Season-scoped read (source of truth). Newest first, sorted client-side.
export async function getGalleryItemsBySeasonId(seasonId: string): Promise<GalleryItem[]> {
  const snap = await getDocs(query(collection(db, GALLERY_COL), where("seasonId", "==", seasonId)));
  const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as GalleryItem[];
  return list.sort(byNewest);
}

export async function deleteGalleryItem(id: string) {
  await deleteDoc(doc(db, GALLERY_COL, id));
}
