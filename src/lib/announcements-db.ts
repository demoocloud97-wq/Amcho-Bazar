import {
  collection, addDoc, getDocs, doc, deleteDoc, updateDoc, serverTimestamp, type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import { AMCHO_BAZAR_EVENT_ID } from "./events-db";

export type Announcement = {
  id?: string;
  eventId?: string;
  seasonId?: string; // the season this belongs to — hidden once that season is archived
  season?: number;
  title: string;
  body: string;
  imageUrl?: string;
  createdAt?: unknown;
};

const COL = "announcements";
const byNewest = (a: Announcement, b: Announcement) =>
  ((b.createdAt as { seconds?: number })?.seconds ?? 0) - ((a.createdAt as { seconds?: number })?.seconds ?? 0);

export async function createAnnouncement(data: { title: string; body: string; imageUrl?: string; seasonId?: string; season?: number }) {
  const payload: DocumentData = {
    title: data.title,
    body: data.body,
    eventId: AMCHO_BAZAR_EVENT_ID,
    createdAt: serverTimestamp(),
  };
  if (data.imageUrl) payload.imageUrl = data.imageUrl; // Firestore rejects undefined
  if (data.seasonId) payload.seasonId = data.seasonId;
  if (data.season != null) payload.season = data.season;
  const ref = await addDoc(collection(db, COL), payload);
  return ref.id;
}

// Newest first (sorted client-side, no composite index needed).
export async function getAnnouncements(): Promise<Announcement[]> {
  const snap = await getDocs(collection(db, COL));
  return (snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as Announcement[]).sort(byNewest);
}

// Only the given season's announcements (plus legacy posts with no season tag).
// Archived seasons aren't the active season, so their announcements stop showing.
export async function getAnnouncementsForSeason(seasonId?: string, season?: number): Promise<Announcement[]> {
  const all = await getAnnouncements();
  return all.filter((a) => {
    if (a.seasonId == null && a.season == null) return true; // legacy — always visible
    if (seasonId && a.seasonId === seasonId) return true;
    if (season != null && a.season != null && Number(a.season) === Number(season)) return true;
    return false;
  });
}

export async function updateAnnouncement(id: string, data: { title: string; body: string; imageUrl?: string }) {
  await updateDoc(doc(db, COL, id), {
    title: data.title,
    body: data.body,
    imageUrl: data.imageUrl ?? null, // null clears the image (Firestore rejects undefined)
  });
}

export async function deleteAnnouncement(id: string) {
  await deleteDoc(doc(db, COL, id));
}
