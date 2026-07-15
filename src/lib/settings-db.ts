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

/* ---- Footer contact details (editable from Settings) ---- */
export type FooterContact = { phone: string; email: string; instagram: string };
export const DEFAULT_FOOTER: FooterContact = {
  phone: "+91 98800 12345",
  email: "hello@amchobazar.in",
  instagram: "@amcho.bazar",
};

function readFooter(data: Record<string, unknown> | undefined): FooterContact {
  return {
    phone: (data?.footerPhone as string)?.trim() || DEFAULT_FOOTER.phone,
    email: (data?.footerEmail as string)?.trim() || DEFAULT_FOOTER.email,
    instagram: (data?.footerInstagram as string)?.trim() || DEFAULT_FOOTER.instagram,
  };
}

export async function getFooterContact(): Promise<FooterContact> {
  try {
    const snap = await getDoc(doc(db, SETTINGS, SITE));
    return readFooter(snap.exists() ? snap.data() : undefined);
  } catch {
    return DEFAULT_FOOTER;
  }
}

export async function setFooterContact(f: FooterContact): Promise<void> {
  await setDoc(
    doc(db, SETTINGS, SITE),
    { footerPhone: f.phone.trim(), footerEmail: f.email.trim(), footerInstagram: f.instagram.trim(), updatedAt: serverTimestamp() },
    { merge: true }
  );
}

// Live so the footer updates for everyone the moment an admin saves.
export function watchFooterContact(cb: (f: FooterContact) => void) {
  return onSnapshot(
    doc(db, SETTINGS, SITE),
    (snap) => cb(readFooter(snap.exists() ? snap.data() : undefined)),
    () => cb(DEFAULT_FOOTER)
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

/* ---- Live Draw: optional Facebook Live video URL, embedded on the public /present ---- */
export async function getDrawFbUrl(): Promise<string> {
  try {
    const snap = await getDoc(doc(db, SETTINGS, SITE));
    return snap.exists() ? ((snap.data().drawFbUrl as string | undefined)?.trim() ?? "") : "";
  } catch {
    return "";
  }
}

export async function setDrawFbUrl(url: string): Promise<void> {
  await setDoc(doc(db, SETTINGS, SITE), { drawFbUrl: url.trim(), updatedAt: serverTimestamp() }, { merge: true });
}

// Live so the audience player appears/updates the moment the admin pastes the link.
export function watchDrawFbUrl(cb: (url: string) => void) {
  return onSnapshot(
    doc(db, SETTINGS, SITE),
    (snap) => cb(snap.exists() ? ((snap.data().drawFbUrl as string | undefined)?.trim() ?? "") : ""),
    () => cb("")
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

/* ---- Live Draw spin speed: per-cell hop time (ms) so each cell stays visible ---- */
const HOP_MS: Record<DrawSpeed, number> = { slow: 220, medium: 150, fast: 90 };
export const spinMsFor = (s: DrawSpeed) => HOP_MS[s];

export async function getDrawSpinSpeed(): Promise<DrawSpeed> {
  try {
    const snap = await getDoc(doc(db, SETTINGS, SITE));
    const v = snap.exists() ? snap.data().drawSpinSpeed : undefined;
    return isSpeed(v) ? v : "medium";
  } catch { return "medium"; }
}
export async function setDrawSpinSpeed(speed: DrawSpeed): Promise<void> {
  await setDoc(doc(db, SETTINGS, SITE), { drawSpinSpeed: speed, updatedAt: serverTimestamp() }, { merge: true });
}
export function watchDrawSpinSpeed(cb: (s: DrawSpeed) => void) {
  return onSnapshot(
    doc(db, SETTINGS, SITE),
    (snap) => { const v = snap.exists() ? snap.data().drawSpinSpeed : undefined; cb(isSpeed(v) ? v : "medium"); },
    () => cb("medium")
  );
}

/* ---- Live Draw reveal: which applicant details to show when a winner is announced ---- */
export type RevealFields = { tagline: boolean; products: boolean; category: boolean };
export const DEFAULT_REVEAL: RevealFields = { tagline: true, products: true, category: false };
function readReveal(d: Record<string, unknown> | undefined): RevealFields {
  return {
    tagline: d?.revealTagline !== false,     // default on
    products: d?.revealProducts !== false,   // default on
    category: d?.revealCategory === true,    // default off
  };
}
export async function getRevealFields(): Promise<RevealFields> {
  try { const snap = await getDoc(doc(db, SETTINGS, SITE)); return readReveal(snap.exists() ? snap.data() : undefined); }
  catch { return DEFAULT_REVEAL; }
}
export async function setRevealFields(f: RevealFields): Promise<void> {
  await setDoc(doc(db, SETTINGS, SITE), { revealTagline: f.tagline, revealProducts: f.products, revealCategory: f.category, updatedAt: serverTimestamp() }, { merge: true });
}
export function watchRevealFields(cb: (f: RevealFields) => void) {
  return onSnapshot(
    doc(db, SETTINGS, SITE),
    (snap) => cb(readReveal(snap.exists() ? snap.data() : undefined)),
    () => cb(DEFAULT_REVEAL)
  );
}

/* ---- Live Draw: how long the winner's detail card stays on screen (seconds) ---- */
const DEFAULT_HOLD = 3;
const asHold = (v: unknown): number => (typeof v === "number" && v >= 1 && v <= 15 ? Math.round(v) : DEFAULT_HOLD);
export async function getRevealHold(): Promise<number> {
  try { const snap = await getDoc(doc(db, SETTINGS, SITE)); return asHold(snap.exists() ? snap.data().revealHold : undefined); }
  catch { return DEFAULT_HOLD; }
}
export async function setRevealHold(seconds: number): Promise<void> {
  await setDoc(doc(db, SETTINGS, SITE), { revealHold: asHold(seconds), updatedAt: serverTimestamp() }, { merge: true });
}
export function watchRevealHold(cb: (seconds: number) => void) {
  return onSnapshot(
    doc(db, SETTINGS, SITE),
    (snap) => cb(asHold(snap.exists() ? snap.data().revealHold : undefined)),
    () => cb(DEFAULT_HOLD)
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
