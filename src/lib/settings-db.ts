import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { asset } from "./asset";

const SETTINGS = "settings";
const SITE = "site";

// Bundled poster in /public — used until an admin sets a custom URL.
export const DEFAULT_HERO_IMAGE = asset("/Amchi bazar.png");

// Google Drive links → Google's photo CDN (lh3), which hotlinks in <img> far more
// reliably than drive.google.com/thumbnail (that endpoint rate-limits under load and
// starts returning broken images). Works for "Anyone with the link" files, logged-out
// and mobile too. Anything else (other hosts, local /public paths) passes through.
export function normalizeImageUrl(url: string): string {
  if (!url.includes("google")) return url;
  const id = url.match(/[?&]id=([^&]+)/)?.[1] ?? url.match(/\/d\/([^/=?]+)/)?.[1];
  return id ? `https://lh3.googleusercontent.com/d/${id}=w1600` : url;
}

export async function getHeroImage(): Promise<string> {
  try {
    const snap = await getDoc(doc(db, SETTINGS, SITE));
    const url = snap.exists() ? (snap.data().heroImageUrl as string | undefined) : undefined;
    return url?.trim() ? url : DEFAULT_HERO_IMAGE;
  } catch {
    return DEFAULT_HERO_IMAGE;
  }
}

export async function setHeroImage(url: string): Promise<void> {
  await setDoc(
    doc(db, SETTINGS, SITE),
    { heroImageUrl: url.trim(), updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/* ---- Live Draw: show/hide the one-click "Non-Stop" button ---- */
export async function getDrawNonStop(): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, SETTINGS, SITE));
    return snap.exists() ? Boolean(snap.data().drawNonStopEnabled) : false;
  } catch {
    return false;
  }
}

export async function setDrawNonStop(enabled: boolean): Promise<void> {
  await setDoc(
    doc(db, SETTINGS, SITE),
    { drawNonStopEnabled: enabled, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/* ---- Live Draw broadcast: when ON, everyone sees a "watch live" link ---- */
export async function getDrawLive(): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, SETTINGS, SITE));
    return snap.exists() ? Boolean(snap.data().drawLiveEnabled) : false;
  } catch {
    return false;
  }
}

export async function setDrawLive(enabled: boolean): Promise<void> {
  await setDoc(
    doc(db, SETTINGS, SITE),
    { drawLiveEnabled: enabled, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

// Real-time subscription so the audience banner appears/disappears instantly.
export function watchDrawLive(cb: (on: boolean) => void) {
  return onSnapshot(
    doc(db, SETTINGS, SITE),
    (snap) => cb(snap.exists() ? Boolean(snap.data().drawLiveEnabled) : false),
    () => cb(false)
  );
}

/* ---- Live Draw countdown/reveal pace the admin picks (drives the audience view) ---- */
export type DrawSpeed = "slow" | "medium" | "fast";
const isSpeed = (v: unknown): v is DrawSpeed => v === "slow" || v === "medium" || v === "fast";

export async function getDrawSpeed(): Promise<DrawSpeed> {
  try {
    const snap = await getDoc(doc(db, SETTINGS, SITE));
    const v = snap.exists() ? snap.data().drawSpeed : undefined;
    return isSpeed(v) ? v : "medium";
  } catch {
    return "medium";
  }
}

export async function setDrawSpeed(speed: DrawSpeed): Promise<void> {
  await setDoc(doc(db, SETTINGS, SITE), { drawSpeed: speed, updatedAt: serverTimestamp() }, { merge: true });
}

// Live so the audience view picks up a pace change without a reload.
export function watchDrawSpeed(cb: (speed: DrawSpeed) => void) {
  return onSnapshot(
    doc(db, SETTINGS, SITE),
    (snap) => cb(isSpeed(snap.exists() ? snap.data().drawSpeed : undefined) ? (snap.data()!.drawSpeed as DrawSpeed) : "medium"),
    () => cb("medium")
  );
}

/* ---- Live Draw countdown: seconds counted down before each pick reveals ---- */
const DEFAULT_COUNTDOWN = 3;
const asCountdown = (v: unknown): number => (typeof v === "number" && v >= 0 && v <= 10 ? Math.round(v) : DEFAULT_COUNTDOWN);

export async function getDrawCountdown(): Promise<number> {
  try {
    const snap = await getDoc(doc(db, SETTINGS, SITE));
    return asCountdown(snap.exists() ? snap.data().drawCountdown : undefined);
  } catch {
    return DEFAULT_COUNTDOWN;
  }
}

export async function setDrawCountdown(seconds: number): Promise<void> {
  await setDoc(doc(db, SETTINGS, SITE), { drawCountdown: asCountdown(seconds), updatedAt: serverTimestamp() }, { merge: true });
}

export function watchDrawCountdown(cb: (seconds: number) => void) {
  return onSnapshot(
    doc(db, SETTINGS, SITE),
    (snap) => cb(asCountdown(snap.exists() ? snap.data().drawCountdown : undefined)),
    () => cb(DEFAULT_COUNTDOWN)
  );
}

/* ---- Admin-editable FAQ (single-language, overrides the built-in defaults) ---- */
export type Faq = { q: string; a: string };

export async function getFaqs(): Promise<Faq[]> {
  try {
    const snap = await getDoc(doc(db, SETTINGS, SITE));
    const list = snap.exists() ? (snap.data().faqs as Faq[] | undefined) : undefined;
    return Array.isArray(list) ? list.filter((f) => f?.q?.trim()) : [];
  } catch {
    return [];
  }
}

export async function saveFaqs(faqs: Faq[]): Promise<void> {
  await setDoc(
    doc(db, SETTINGS, SITE),
    { faqs: faqs.filter((f) => f.q.trim()), updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/* ---- Admin: show/hide the "Fill sub-categories" quick action ---- */
export async function getFillSubcatsEnabled(): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, SETTINGS, SITE));
    return snap.exists() ? Boolean(snap.data().fillSubcatsEnabled) : false;
  } catch {
    return false;
  }
}

export async function setFillSubcatsEnabled(enabled: boolean): Promise<void> {
  await setDoc(
    doc(db, SETTINGS, SITE),
    { fillSubcatsEnabled: enabled, updatedAt: serverTimestamp() },
    { merge: true }
  );
}
