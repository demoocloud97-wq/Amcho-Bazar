import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import { AMCHO_BAZAR_EVENT_ID } from "./events-db";

export type CategoryStatus = "active" | "inactive";

export type Category = {
  id?: string;
  eventId?: string;
  seasonId?: string;
  name: string;
  emoji: string;
  description: string;
  imageUrl?: string;   // admin-uploaded category cover (falls back to emoji tile)
  status: CategoryStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type SubCategory = {
  id?: string;
  eventId?: string;
  seasonId?: string;
  categoryId: string;
  name: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

const CATS = "categories";
const SUBS = "subcategories";

/* ---------------- Categories ---------------- */

export async function createCategory(data: Omit<Category, "id" | "createdAt" | "updatedAt">) {
  const payload: DocumentData = {
    name: data.name,
    emoji: data.emoji,
    description: data.description,
    status: data.status,
    eventId: data.eventId ?? AMCHO_BAZAR_EVENT_ID,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (data.seasonId) payload.seasonId = data.seasonId;
  if (data.imageUrl) payload.imageUrl = data.imageUrl;
  const ref = await addDoc(collection(db, CATS), payload);
  return ref.id;
}

// Legacy read (all categories). Prefer getCategoriesBySeasonId in the app.
export async function getCategories(): Promise<Category[]> {
  const q = query(collection(db, CATS), orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalizeCategory(d.id, d.data()));
}

export async function getCategory(id: string): Promise<Category | null> {
  const snap = await getDoc(doc(db, CATS, id));
  return snap.exists() ? normalizeCategory(snap.id, snap.data()) : null;
}

export async function updateCategory(id: string, patch: Partial<Category>) {
  await updateDoc(doc(db, CATS, id), { ...patch, updatedAt: serverTimestamp() } as DocumentData);
}

export async function deleteCategory(id: string) {
  // Remove the category and all of its sub-categories.
  const subs = await getDocs(query(collection(db, SUBS), where("categoryId", "==", id)));
  await Promise.all(subs.docs.map((d) => deleteDoc(doc(db, SUBS, d.id))));
  await deleteDoc(doc(db, CATS, id));
}

// Older docs may not have `status`; default to "active".
function normalizeCategory(id: string, data: DocumentData): Category {
  return {
    id,
    eventId: data.eventId,
    seasonId: data.seasonId,
    name: data.name ?? "",
    emoji: data.emoji ?? "🏷️",
    description: data.description ?? "",
    imageUrl: data.imageUrl,
    status: (data.status as CategoryStatus) ?? "active",
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/* ---------------- Sub-categories ---------------- */

export async function createSubCategory(data: Omit<SubCategory, "id" | "createdAt" | "updatedAt">) {
  const payload: DocumentData = {
    categoryId: data.categoryId,
    name: data.name,
    eventId: data.eventId ?? AMCHO_BAZAR_EVENT_ID,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (data.seasonId) payload.seasonId = data.seasonId;
  const ref = await addDoc(collection(db, SUBS), payload);
  return ref.id;
}

export async function getSubCategories(): Promise<SubCategory[]> {
  const snap = await getDocs(collection(db, SUBS));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as SubCategory[];
}

export async function getSubCategoriesByCategory(categoryId: string): Promise<SubCategory[]> {
  const q = query(collection(db, SUBS), where("categoryId", "==", categoryId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) })) as SubCategory[];
}

export async function updateSubCategory(id: string, patch: Partial<SubCategory>) {
  await updateDoc(doc(db, SUBS, id), { ...patch, updatedAt: serverTimestamp() } as DocumentData);
}

export async function deleteSubCategory(id: string) {
  await deleteDoc(doc(db, SUBS, id));
}

/* ---------------- Default sub-categories ---------------- */

// Sensible defaults per category (matched by category name).
export const DEFAULT_SUBCATEGORIES: Record<string, string[]> = {
  Food: ["Homemade Meals", "Bakes & Desserts", "Snacks & Chaat", "Beverages"],
  Clothing: ["Abayas & Modest Wear", "Kids' Wear", "Scarves & Hijabs"],
  Jewellery: ["Handmade", "Silver", "Resin & Beadwork"],
  Beauty: ["Skincare", "Henna", "Cosmetics"],
  Household: ["Home Décor", "Kitchen", "Candles & Gifts"],
  Kids: ["Toys", "Kidswear", "Learning Kits"],
  Handmade: ["Crochet", "Resin Art", "Embroidery"],
  Stationery: ["Islamic Art", "Planners", "Kids' Journals"],
  Others: ["Miscellaneous"],
};

// Fill every category with its default sub-categories PLUS a catch-all "Other"
// (idempotent). Categories with no defaults still get "Other". Returns count created.
export async function fillDefaultSubcategories(): Promise<number> {
  const [cats, subsAll] = await Promise.all([getCategories(), getSubCategories()]);
  let created = 0;
  for (const cat of cats) {
    const wanted = [...(DEFAULT_SUBCATEGORIES[cat.name] ?? []), "Other"];
    const existing = new Set(subsAll.filter((s) => s.categoryId === cat.id).map((s) => s.name.toLowerCase()));
    for (const name of wanted) {
      if (!existing.has(name.toLowerCase())) { await createSubCategory({ categoryId: cat.id!, name }); existing.add(name.toLowerCase()); created++; }
    }
  }
  return created;
}

/* ---------------- Helpers ---------------- */

// Firestore Timestamp -> readable date string.
export function formatTimestamp(ts: unknown): string {
  const seconds = (ts as { seconds?: number })?.seconds;
  if (!seconds) return "—";
  const d = new Date(seconds * 1000);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
