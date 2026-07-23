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
export type FooterContact = { phone: string; email: string; instagram: string; facebook: string };
export const DEFAULT_FOOTER: FooterContact = {
  phone: "+91 98800 12345",
  email: "hello@amchobazar.in",
  instagram: "@amcho.bazar",
  facebook: "",
};

function readFooter(data: Record<string, unknown> | undefined): FooterContact {
  return {
    phone: (data?.footerPhone as string)?.trim() || DEFAULT_FOOTER.phone,
    email: (data?.footerEmail as string)?.trim() || DEFAULT_FOOTER.email,
    instagram: (data?.footerInstagram as string)?.trim() || DEFAULT_FOOTER.instagram,
    facebook: (data?.footerFacebook as string)?.trim() || DEFAULT_FOOTER.facebook,
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
    { footerPhone: f.phone.trim(), footerEmail: f.email.trim(), footerInstagram: f.instagram.trim(), footerFacebook: f.facebook.trim(), updatedAt: serverTimestamp() },
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

/* ---- Live Draw optional controls: admin can hide any of these buttons on the
   draw screen. Play/Continue and Reset are always shown and not toggleable. ---- */
export type DrawOptionKey = "raise" | "finish" | "viewDraws" | "goLive" | "applyFinal";
export const DRAW_OPTION_KEYS: DrawOptionKey[] = ["raise", "finish", "viewDraws", "goLive", "applyFinal"];
export type DrawOptions = Record<DrawOptionKey, boolean>;
export const DEFAULT_DRAW_OPTIONS: DrawOptions = { raise: true, finish: true, viewDraws: true, goLive: true, applyFinal: true };

function readDrawOptions(d: Record<string, unknown> | undefined): DrawOptions {
  const o = (d?.drawOptions ?? {}) as Partial<DrawOptions>;
  const out = { ...DEFAULT_DRAW_OPTIONS };
  for (const k of DRAW_OPTION_KEYS) if (typeof o[k] === "boolean") out[k] = o[k] as boolean;
  return out;
}
export async function getDrawOptions(): Promise<DrawOptions> {
  try { const snap = await getDoc(doc(db, SETTINGS, SITE)); return readDrawOptions(snap.data()); } catch { return { ...DEFAULT_DRAW_OPTIONS }; }
}
export async function setDrawOptions(o: DrawOptions): Promise<void> {
  await setDoc(doc(db, SETTINGS, SITE), { drawOptions: o, updatedAt: serverTimestamp() }, { merge: true });
}
export function watchDrawOptions(cb: (o: DrawOptions) => void) {
  return onSnapshot(doc(db, SETTINGS, SITE), (snap) => cb(readDrawOptions(snap.data())));
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
// Admin sets this freely — wide range, no fixed presets.
export const COUNTDOWN_MIN = 0;
export const COUNTDOWN_MAX = 60;
const asCountdown = (v: unknown): number =>
  typeof v === "number" && v >= COUNTDOWN_MIN && v <= COUNTDOWN_MAX ? Math.round(v) : DEFAULT_COUNTDOWN;

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

/* ---- Free-form spin speed: admin picks any hop time (ms), no fixed presets.
       Falls back to the legacy slow/medium/fast value when not set yet. ---- */
export const SPIN_MS_MIN = 30;
export const SPIN_MS_MAX = 600;
const DEFAULT_SPIN_MS = HOP_MS.medium;
const asSpinMs = (v: unknown, legacy?: unknown): number => {
  if (typeof v === "number" && Number.isFinite(v)) return Math.min(SPIN_MS_MAX, Math.max(SPIN_MS_MIN, Math.round(v)));
  if (isSpeed(legacy)) return HOP_MS[legacy];
  return DEFAULT_SPIN_MS;
};
export async function getDrawSpinMs(): Promise<number> {
  try {
    const snap = await getDoc(doc(db, SETTINGS, SITE));
    const d = snap.exists() ? snap.data() : {};
    return asSpinMs(d?.drawSpinMs, d?.drawSpinSpeed);
  } catch {
    return DEFAULT_SPIN_MS;
  }
}
export async function setDrawSpinMs(ms: number): Promise<void> {
  await setDoc(doc(db, SETTINGS, SITE), { drawSpinMs: asSpinMs(ms), updatedAt: serverTimestamp() }, { merge: true });
}
export function watchDrawSpinMs(cb: (ms: number) => void) {
  return onSnapshot(
    doc(db, SETTINGS, SITE),
    (snap) => { const d = snap.exists() ? snap.data() : {}; cb(asSpinMs(d?.drawSpinMs, d?.drawSpinSpeed)); },
    () => cb(DEFAULT_SPIN_MS)
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

// Admin-defined extra fields for the registration form (beyond the built-in ones).
export type RegFieldType = "text" | "number" | "textarea" | "select";
export type CustomRegField = { id: string; label: string; type: RegFieldType; options?: string[]; required?: boolean };

export async function getCustomRegFields(): Promise<CustomRegField[]> {
  try {
    const snap = await getDoc(doc(db, SETTINGS, SITE));
    const list = snap.exists() ? (snap.data().customRegFields as CustomRegField[] | undefined) : undefined;
    return Array.isArray(list) ? list.filter((f) => f?.id && f?.label?.trim()) : [];
  } catch {
    return [];
  }
}
export async function saveCustomRegFields(fields: CustomRegField[]): Promise<void> {
  await setDoc(
    doc(db, SETTINGS, SITE),
    { customRegFields: fields.filter((f) => f.label.trim()).map((f) => ({ ...f, label: f.label.trim() })), updatedAt: serverTimestamp() },
    { merge: true }
  );
}

// Built-in registration fields (fixed) — admin may rename their labels (stored as
// overrides keyed by `key`; empty override falls back to the translated default).
export const BUILTIN_REG_FIELDS: { key: string; labelKey: string; section: "personal" | "business" }[] = [
  { key: "fullName", labelKey: "reg.f.fullName", section: "personal" },
  { key: "surname", labelKey: "reg.f.surname", section: "personal" },
  { key: "phone", labelKey: "reg.f.phone", section: "personal" },
  { key: "email", labelKey: "reg.f.email", section: "personal" },
  { key: "city", labelKey: "reg.f.city", section: "personal" },
  { key: "business", labelKey: "reg.f.business", section: "business" },
  { key: "tagline", labelKey: "reg.f.tagline", section: "business" },
  { key: "years", labelKey: "reg.f.years", section: "business" },
  { key: "instagram", labelKey: "reg.f.instagram", section: "business" },
  { key: "logo", labelKey: "reg.f.logo", section: "business" },
  { key: "products", labelKey: "reg.f.sell", section: "business" },
];

export async function getRegFieldLabels(): Promise<Record<string, string>> {
  try {
    const snap = await getDoc(doc(db, SETTINGS, SITE));
    const m = snap.exists() ? (snap.data().regFieldLabels as Record<string, string> | undefined) : undefined;
    return m && typeof m === "object" ? m : {};
  } catch {
    return {};
  }
}
export async function setRegFieldLabels(map: Record<string, string>): Promise<void> {
  const clean = Object.fromEntries(Object.entries(map).map(([k, v]) => [k, (v || "").trim()]).filter(([, v]) => v));
  await setDoc(doc(db, SETTINGS, SITE), { regFieldLabels: clean, updatedAt: serverTimestamp() }, { merge: true });
}

// Terms & Conditions text shown on the registration Review step (admin-editable).
export async function getTerms(): Promise<string> {
  try {
    const snap = await getDoc(doc(db, SETTINGS, SITE));
    return snap.exists() ? ((snap.data().terms as string) ?? "") : "";
  } catch {
    return "";
  }
}
export async function setTerms(text: string): Promise<void> {
  await setDoc(doc(db, SETTINGS, SITE), { terms: text, updatedAt: serverTimestamp() }, { merge: true });
}

/* ---- Payment account details shown on the registration payment step. ---- */
export type PaymentInfo = { bankName: string; accountTitle: string; accountNumber: string; instructions: string };
export const DEFAULT_PAYMENT: PaymentInfo = { bankName: "", accountTitle: "", accountNumber: "", instructions: "" };

function readPayment(d: Record<string, unknown> | undefined): PaymentInfo {
  return {
    bankName: ((d?.payBankName as string) ?? "").trim(),
    accountTitle: ((d?.payAccountTitle as string) ?? "").trim(),
    accountNumber: ((d?.payAccountNumber as string) ?? "").trim(),
    instructions: ((d?.payInstructions as string) ?? "").trim(),
  };
}
export async function getPaymentInfo(): Promise<PaymentInfo> {
  try {
    const snap = await getDoc(doc(db, SETTINGS, SITE));
    return readPayment(snap.exists() ? snap.data() : undefined);
  } catch {
    return DEFAULT_PAYMENT;
  }
}
export async function setPaymentInfo(p: PaymentInfo): Promise<void> {
  await setDoc(
    doc(db, SETTINGS, SITE),
    { payBankName: p.bankName.trim(), payAccountTitle: p.accountTitle.trim(), payAccountNumber: p.accountNumber.trim(), payInstructions: p.instructions.trim(), updatedAt: serverTimestamp() },
    { merge: true }
  );
}
export function watchPaymentInfo(cb: (p: PaymentInfo) => void) {
  return onSnapshot(
    doc(db, SETTINGS, SITE),
    (snap) => cb(readPayment(snap.exists() ? snap.data() : undefined)),
    () => cb(DEFAULT_PAYMENT)
  );
}

/* ---- Sign up on/off. Registration works without an account, so the admin can
       switch account sign-up off entirely and keep it direct. Default: on. ---- */
const asBool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);

export async function getSignupEnabled(): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, SETTINGS, SITE));
    return asBool(snap.exists() ? snap.data().signupEnabled : undefined, true);
  } catch {
    return true;
  }
}
export async function setSignupEnabled(enabled: boolean): Promise<void> {
  await setDoc(doc(db, SETTINGS, SITE), { signupEnabled: enabled, updatedAt: serverTimestamp() }, { merge: true });
}
export function watchSignupEnabled(cb: (on: boolean) => void) {
  return onSnapshot(
    doc(db, SETTINGS, SITE),
    (snap) => cb(asBool(snap.exists() ? snap.data().signupEnabled : undefined, true)),
    () => cb(true)
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
