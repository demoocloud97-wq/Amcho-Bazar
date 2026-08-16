import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where,
  onSnapshot, serverTimestamp, type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import { AMCHO_BAZAR_EVENT_ID } from "./events-db";

// A customer review captured from the QR-code feedback page.
// Lifecycle: pending → approved/published (public) | rejected/hidden (not public).
export type ReviewStatus = "pending" | "approved" | "published" | "rejected" | "hidden";

// The only statuses the public reviews page may read — mirrored in firestore.rules.
export const PUBLIC_STATUSES: ReviewStatus[] = ["approved", "published"];

export type Review = {
  id?: string;
  ref: string;              // human reference shown to the customer, "REV-XXXXXX"
  eventId?: string;
  seasonId?: string;
  businessId?: string;      // which QR was scanned — event id, or a registration id
  businessName?: string;
  customerName?: string;
  email?: string;
  phone?: string;
  orderId?: string;
  overallRating: number;    // 1–5, required
  productRating?: number;
  staffRating?: number;
  deliveryRating?: number;
  reviewText: string;       // required
  liked?: string;
  improvement?: string;
  recommend?: boolean;
  photoUrl?: string;
  anonymous?: boolean;
  status: ReviewStatus;
  adminResponse?: string;
  adminNotes?: string;
  featured?: boolean;
  adminRead?: boolean;      // notification read-state (admins only ever write this)
  createdAt?: unknown;
  updatedAt?: unknown;
};

const COL = "reviews";

// Firestore Timestamp | Date | null → Date. Same shape used across the other -db modules.
export function reviewDate(ts: unknown): Date | null {
  if (!ts) return null;
  const any = ts as { toDate?: () => Date; seconds?: number };
  if (typeof any.toDate === "function") return any.toDate();
  if (typeof any.seconds === "number") return new Date(any.seconds * 1000);
  return null;
}
const ms = (ts: unknown) => reviewDate(ts)?.getTime() ?? 0;
const byNewest = (a: Review, b: Review) => ms(b.createdAt) - ms(a.createdAt);

// Customer input is rendered as text (never HTML), but stored data is still cleaned
// and bounded: control characters out, angle brackets out, length capped. The class
// below is "any control/format character except newline", so multi-line feedback
// keeps its shape.
function clean(s: string | undefined | null, max: number): string {
  return (s ?? "")
    .replace(/[^\P{C}\n]/gu, " ")
    .replace(/[<>]/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
    .slice(0, max);
}

export const MAX = { name: 80, email: 120, phone: 32, orderId: 40, text: 2000, note: 600, response: 1000 };

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);

// Reference code for the success screen. Alphabet skips look-alike glyphs (0/O, 1/I/L)
// so a customer can read it off a phone and quote it back correctly.
function makeRef(): string {
  const A = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const n = new Uint32Array(6);
  crypto.getRandomValues(n);
  return "REV-" + Array.from(n, (v) => A[v % A.length]).join("");
}

const clamp5 = (n: number | undefined) => (typeof n === "number" && n >= 1 && n <= 5 ? Math.round(n) : undefined);

export type NewReview = {
  businessId?: string;
  businessName?: string;
  seasonId?: string;
  customerName?: string;
  email?: string;
  phone?: string;
  orderId?: string;
  overallRating: number;
  productRating?: number;
  staffRating?: number;
  deliveryRating?: number;
  reviewText: string;
  liked?: string;
  improvement?: string;
  recommend?: boolean;
  photoUrl?: string;
  anonymous?: boolean;
};

// Public write. Always lands as "pending" — the admin decides what goes live.
// Returns the reference code so the success screen can show it.
export async function createReview(data: NewReview): Promise<{ id: string; ref: string }> {
  const overall = clamp5(data.overallRating);
  const text = clean(data.reviewText, MAX.text);
  if (!overall) throw new Error("Please choose a star rating.");
  if (!text) throw new Error("Please write a short review.");

  const ref = makeRef();
  const payload: DocumentData = {
    ref,
    eventId: AMCHO_BAZAR_EVENT_ID,
    overallRating: overall,
    reviewText: text,
    status: "pending" as ReviewStatus,
    adminRead: false,
    featured: false,
    createdAt: serverTimestamp(),
  };
  // Firestore rejects undefined — only attach the optional fields that were filled in.
  const name = clean(data.customerName, MAX.name);
  const email = clean(data.email, MAX.email);
  const phone = clean(data.phone, MAX.phone);
  const orderId = clean(data.orderId, MAX.orderId);
  const liked = clean(data.liked, MAX.note);
  const improvement = clean(data.improvement, MAX.note);
  if (data.businessId) payload.businessId = data.businessId;
  if (data.businessName) payload.businessName = clean(data.businessName, MAX.name);
  if (data.seasonId) payload.seasonId = data.seasonId;
  if (data.anonymous) payload.anonymous = true;
  // An anonymous review deliberately drops the name. Contact details are still kept
  // so an admin can follow up on a complaint, but they are never shown publicly.
  if (!data.anonymous && name) payload.customerName = name;
  if (email) payload.email = email;
  if (phone) payload.phone = phone;
  if (orderId) payload.orderId = orderId;
  if (clamp5(data.productRating)) payload.productRating = clamp5(data.productRating);
  if (clamp5(data.staffRating)) payload.staffRating = clamp5(data.staffRating);
  if (clamp5(data.deliveryRating)) payload.deliveryRating = clamp5(data.deliveryRating);
  if (liked) payload.liked = liked;
  if (improvement) payload.improvement = improvement;
  if (typeof data.recommend === "boolean") payload.recommend = data.recommend;
  if (data.photoUrl) payload.photoUrl = data.photoUrl;

  const docRef = await addDoc(collection(db, COL), payload);
  return { id: docRef.id, ref };
}

// Public read — constrained to the publishable statuses so it satisfies the
// security rules (a query must match only documents the caller may read).
export async function getPublicReviews(): Promise<Review[]> {
  const q = query(collection(db, COL), where("status", "in", PUBLIC_STATUSES));
  const snap = await getDocs(q);
  return (snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as Review[]).sort(byNewest);
}

export function watchPublicReviews(cb: (list: Review[]) => void) {
  const q = query(collection(db, COL), where("status", "in", PUBLIC_STATUSES));
  return onSnapshot(
    q,
    (snap) => cb((snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as Review[]).sort(byNewest)),
    (err) => {
      console.error("Public reviews listener error — refetching", err);
      getPublicReviews().then(cb).catch(() => {});
    }
  );
}

// Admin read — every review, any status.
export async function getAllReviews(): Promise<Review[]> {
  const snap = await getDocs(collection(db, COL));
  return (snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as Review[]).sort(byNewest);
}

export function watchAllReviews(cb: (list: Review[]) => void) {
  return onSnapshot(
    collection(db, COL),
    (snap) => cb((snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as Review[]).sort(byNewest)),
    // A dropped listener (e.g. an auth-token race after a refresh) shouldn't leave
    // the admin console stuck on zero — fall back to a one-time fetch.
    (err) => {
      console.error("Reviews listener error — refetching", err);
      getAllReviews().then(cb).catch(() => {});
    }
  );
}

// Admin-only patch. Text fields are cleaned the same way customer input is.
export async function updateReview(id: string, patch: Partial<Review>) {
  const out: DocumentData = { updatedAt: serverTimestamp() };
  if (patch.status !== undefined) out.status = patch.status;
  if (patch.featured !== undefined) out.featured = patch.featured;
  if (patch.adminRead !== undefined) out.adminRead = patch.adminRead;
  if (patch.adminResponse !== undefined) out.adminResponse = clean(patch.adminResponse, MAX.response);
  if (patch.adminNotes !== undefined) out.adminNotes = clean(patch.adminNotes, MAX.response);
  await updateDoc(doc(db, COL, id), out);
}

export async function deleteReview(id: string) {
  await deleteDoc(doc(db, COL, id));
}

// Clears the notification badge for the given reviews.
export async function markReviewsRead(ids: string[]) {
  await Promise.all(ids.map((id) => updateDoc(doc(db, COL, id), { adminRead: true } as DocumentData)));
}

export type CategoryKeyR = "productRating" | "staffRating" | "deliveryRating";

export type ReviewStats = {
  total: number;
  average: number;
  counts: Record<1 | 2 | 3 | 4 | 5, number>;  // how many reviews at each star
  byStatus: Record<ReviewStatus, number>;
  positive: number;                            // 4–5 stars
  negative: number;                            // 1–2 stars
  recommendRate: number | null;                // % of answers that were "yes"
  categories: { key: CategoryKeyR; label: string; average: number; count: number }[];
};

const CATEGORY_FIELDS: { key: CategoryKeyR; label: string }[] = [
  { key: "productRating", label: "Product / Service" },
  { key: "staffRating", label: "Staff / Support" },
  { key: "deliveryRating", label: "Delivery / Experience" },
];

// One pass over a review list → every number the dashboard, analytics page and
// public rating breakdown need.
export function summarize(list: Review[]): ReviewStats {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
  const byStatus = { pending: 0, approved: 0, published: 0, rejected: 0, hidden: 0 } as Record<ReviewStatus, number>;
  let sum = 0, yes = 0, answered = 0;
  for (const r of list) {
    const s = clamp5(r.overallRating);
    if (s) { counts[s as 1 | 2 | 3 | 4 | 5]++; sum += s; }
    if (r.status in byStatus) byStatus[r.status]++;
    if (typeof r.recommend === "boolean") { answered++; if (r.recommend) yes++; }
  }
  const rated = counts[1] + counts[2] + counts[3] + counts[4] + counts[5];
  return {
    total: list.length,
    average: rated ? sum / rated : 0,
    counts,
    byStatus,
    positive: counts[4] + counts[5],
    negative: counts[1] + counts[2],
    recommendRate: answered ? (yes / answered) * 100 : null,
    categories: CATEGORY_FIELDS.map(({ key, label }) => {
      const vals = list.map((r) => clamp5(r[key])).filter((n): n is number => !!n);
      return { key, label, average: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0, count: vals.length };
    }),
  };
}
