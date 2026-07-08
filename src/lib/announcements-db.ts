import {
  collection, addDoc, getDocs, doc, deleteDoc, serverTimestamp, type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import { AMCHO_BAZAR_EVENT_ID } from "./events-db";

export type Announcement = {
  id?: string;
  eventId?: string;
  title: string;
  body: string;
  imageUrl?: string;
  createdAt?: unknown;
};

const COL = "announcements";
const byNewest = (a: Announcement, b: Announcement) =>
  ((b.createdAt as { seconds?: number })?.seconds ?? 0) - ((a.createdAt as { seconds?: number })?.seconds ?? 0);

export async function createAnnouncement(data: { title: string; body: string; imageUrl?: string }) {
  const payload: DocumentData = {
    title: data.title,
    body: data.body,
    eventId: AMCHO_BAZAR_EVENT_ID,
    createdAt: serverTimestamp(),
  };
  if (data.imageUrl) payload.imageUrl = data.imageUrl; // Firestore rejects undefined
  const ref = await addDoc(collection(db, COL), payload);
  return ref.id;
}

// Newest first (sorted client-side, no composite index needed).
export async function getAnnouncements(): Promise<Announcement[]> {
  const snap = await getDocs(collection(db, COL));
  return (snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as Announcement[]).sort(byNewest);
}

export async function deleteAnnouncement(id: string) {
  await deleteDoc(doc(db, COL, id));
}
