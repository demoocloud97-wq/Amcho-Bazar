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
import { AMCHO_BAZAR_EVENT_ID } from "./events-db";

export type PaymentMethod = "cash" | "upi" | "bank" | "other";
export const PAYMENT_METHODS: PaymentMethod[] = ["cash", "upi", "bank", "other"];

// A received registration-fee payment. Season-scoped ledger — reports read by season.
export type Payment = {
  id?: string;
  eventId?: string;
  seasonId: string;
  registrationId: string;
  seller: string;
  business: string;
  amount: number;
  method: PaymentMethod;
  at: string;
  createdAt?: unknown;
};

const COL = "payments";
const byNewest = (a: Payment, b: Payment) =>
  ((b.createdAt as { seconds?: number })?.seconds ?? 0) - ((a.createdAt as { seconds?: number })?.seconds ?? 0);

export async function getPaymentsBySeasonId(seasonId: string): Promise<Payment[]> {
  const snap = await getDocs(query(collection(db, COL), where("seasonId", "==", seasonId)));
  return (snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as Payment[]).sort(byNewest);
}

export async function createPayment(data: Omit<Payment, "id" | "createdAt" | "eventId">) {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    eventId: AMCHO_BAZAR_EVENT_ID,
    createdAt: serverTimestamp(),
  } as DocumentData);
  return ref.id;
}

export async function deletePayment(id: string) {
  await deleteDoc(doc(db, COL, id));
}
