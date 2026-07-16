import { useEffect, useState, type ReactNode } from "react";
import { Loader2, Plus, Trash2, TimerReset, Gauge, Sparkles, Pencil, Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { friendlyAuthError } from "@/lib/firebase-errors";
import { useI18n } from "@/lib/i18n";
import { useSeason } from "@/lib/season-context";
import { updateSeason } from "@/lib/seasons-db";
import {
  getHeroImage, setHeroImage, normalizeImageUrl, DEFAULT_HERO_IMAGE,
  getDrawNonStop, setDrawNonStop, getFillSubcatsEnabled, setFillSubcatsEnabled,
  getDrawSpeed, setDrawSpeed, type DrawSpeed,
  getDrawCountdown, setDrawCountdown, COUNTDOWN_MIN, COUNTDOWN_MAX,
  getDrawSpinMs, setDrawSpinMs, SPIN_MS_MIN, SPIN_MS_MAX,
  getRevealFields, setRevealFields, DEFAULT_REVEAL, type RevealFields,
  getRevealHold, setRevealHold,
  getDrawFbUrl, setDrawFbUrl,
  getFaqs, saveFaqs, type Faq,
  getFooterContact, setFooterContact, DEFAULT_FOOTER, type FooterContact,
  getCustomRegFields, saveCustomRegFields, type CustomRegField, type RegFieldType,
  BUILTIN_REG_FIELDS, getRegFieldLabels, setRegFieldLabels,
  getTerms, setTerms,
  getSignupEnabled, setSignupEnabled,
} from "@/lib/settings-db";

// Reusable on/off switch used by the toggle settings below.
function Switch({ on, busy, onToggle, label }: { on: boolean; busy: boolean; onToggle: () => void; label: string }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-end gap-3">
      <span className={`text-sm font-semibold ${on ? "text-primary" : "text-muted-foreground"}`}>{on ? t("adm.enabled") : t("adm.disabled")}</span>
      <button
        onClick={onToggle}
        disabled={busy}
        role="switch"
        aria-checked={on}
        aria-label={label}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${on ? "bg-festive" : "bg-muted"}`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${on ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

export function HeroImageEditor() {
  const { t } = useI18n();
  const [url, setUrl] = useState("");
  const [current, setCurrent] = useState<string>(DEFAULT_HERO_IMAGE);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getHeroImage()
      .then((u) => { setCurrent(u); setUrl(u === DEFAULT_HERO_IMAGE ? "" : u); })
      .catch(() => {});
  }, []);

  async function save() {
    const next = url.trim() || DEFAULT_HERO_IMAGE;
    setBusy(true);
    try {
      await setHeroImage(next);
      setCurrent(next);
      toast.success(t("adm.heroUpdated"));
    } catch (e) {
      toast.error(friendlyAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <img
        src={normalizeImageUrl(current)}
        alt="Current hero"
        referrerPolicy="no-referrer"
        className="h-28 w-28 shrink-0 rounded-2xl object-cover ring-1 ring-border"
      />
      <div className="flex-1 space-y-2">
        <label htmlFor="hero-url" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("adm.imageUrl")}</label>
        <input
          id="hero-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…  (blank = default poster)"
          className="w-full rounded-xl border border-border bg-white/70 px-3 py-2.5 text-sm outline-none ring-primary/20 focus:ring-4"
        />
        <button
          onClick={save}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-festive px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.03] disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} {t("adm.saveImage")}
        </button>
      </div>
    </div>
  );
}

export function FooterContactEditor() {
  const { t } = useI18n();
  const [f, setF] = useState<FooterContact>(DEFAULT_FOOTER);
  const [busy, setBusy] = useState(false);
  useEffect(() => { getFooterContact().then(setF).catch(() => {}); }, []);
  const upd = (k: keyof FooterContact) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  async function save() {
    setBusy(true);
    try {
      await setFooterContact(f);
      toast.success(t("adm.footerSaved"));
    } catch (e) {
      toast.error(friendlyAuthError(e));
    } finally {
      setBusy(false);
    }
  }
  const fields: { k: keyof FooterContact; label: string; ph: string }[] = [
    { k: "phone", label: t("adm.footerPhone"), ph: "+92 3XX XXXXXXX" },
    { k: "email", label: t("adm.footerEmail"), ph: "hello@amchobazar.com" },
    { k: "instagram", label: t("adm.footerInstagram"), ph: "@amcho.bazar" },
    { k: "facebook", label: t("adm.footerFacebook"), ph: "https://facebook.com/amchobazar" },
  ];
  return (
    <div className="space-y-3">
      {fields.map(({ k, label, ph }) => (
        <div key={k} className="space-y-1.5">
          <label htmlFor={`footer-${k}`} className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
          <input
            id={`footer-${k}`}
            value={f[k]}
            onChange={upd(k)}
            placeholder={ph}
            className="w-full rounded-xl border border-border bg-white/70 px-3 py-2.5 text-sm outline-none ring-primary/20 focus:ring-4"
          />
        </div>
      ))}
      <button
        onClick={save}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-full bg-festive px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.03] disabled:opacity-50"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} {t("adm.footerSave")}
      </button>
    </div>
  );
}

// Edit the ACTIVE season's event location — venue, address and the Google Maps
// directions link. These drive the home "Event Location" section + its map/button.
export function EventLocationEditor() {
  const { t } = useI18n();
  const { season, seasonId } = useSeason();
  const [form, setForm] = useState({ venue: "", fullAddress: "", googleMapsLink: "", eventDate: "", eventTime: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (season) setForm({ venue: season.venue ?? "", fullAddress: season.fullAddress ?? "", googleMapsLink: season.googleMapsLink ?? "", eventDate: season.eventDate ?? "", eventTime: season.eventTime ?? "" });
  }, [season?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [k]: e.target.value }));
  async function save() {
    if (!seasonId) { toast.error(t("adm.locNoSeason")); return; }
    setBusy(true);
    try {
      await updateSeason(seasonId, { venue: form.venue.trim(), fullAddress: form.fullAddress.trim(), googleMapsLink: form.googleMapsLink.trim(), eventDate: form.eventDate.trim(), eventTime: form.eventTime.trim() });
      toast.success(t("adm.locSaved"));
    } catch (e) {
      toast.error(friendlyAuthError(e));
    } finally {
      setBusy(false);
    }
  }
  if (!seasonId) return <p className="text-sm text-muted-foreground">{t("adm.locNoSeason")}</p>;
  const fields: { k: keyof typeof form; label: string; ph: string }[] = [
    { k: "venue", label: t("adm.locVenue"), ph: "Chandi Banquet" },
    { k: "fullAddress", label: t("adm.locAddress"), ph: "Chandi Banquet, Karachi" },
    { k: "googleMapsLink", label: t("adm.locDirections"), ph: "https://maps.app.goo.gl/…" },
    { k: "eventDate", label: t("adm.locDate"), ph: "August 2, 2026" },
    { k: "eventTime", label: t("adm.locTime"), ph: "10:00 AM – 9:00 PM" },
  ];
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{t("adm.locFor").replace("{s}", season?.seasonName ?? "")}</p>
      {fields.map(({ k, label, ph }) => (
        <div key={k} className="space-y-1.5">
          <label htmlFor={`loc-${k}`} className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
          <input
            id={`loc-${k}`}
            value={form[k]}
            onChange={upd(k)}
            placeholder={ph}
            inputMode={k === "googleMapsLink" ? "url" : "text"}
            className="w-full rounded-xl border border-border bg-white/70 px-3 py-2.5 text-sm outline-none ring-primary/20 focus:ring-4"
          />
        </div>
      ))}
      {form.googleMapsLink.trim() && (
        <a href={form.googleMapsLink.trim()} target="_blank" rel="noopener noreferrer" className="inline-block text-xs font-semibold text-primary underline underline-offset-2">{t("adm.locOpenMap")}</a>
      )}
      <div>
        <button
          onClick={save}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-festive px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.03] disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} {t("adm.locSave")}
        </button>
      </div>
    </div>
  );
}

// Paste the Facebook Live video link here → the public /present page embeds that
// player (with the presenter's voice) while Go Live is on. Blank = no FB player.
export function FbLiveEditor() {
  const { t } = useI18n();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { getDrawFbUrl().then(setUrl).catch(() => {}); }, []);
  async function save() {
    setBusy(true);
    try {
      await setDrawFbUrl(url);
      toast.success(url.trim() ? t("adm.fbLiveSaved") : t("adm.fbLiveCleared"));
    } catch (e) {
      toast.error(friendlyAuthError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-2">
      <label htmlFor="fb-live-url" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("adm.fbLiveLabel")}</label>
      <input
        id="fb-live-url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://www.facebook.com/…/videos/…"
        className="w-full rounded-xl border border-border bg-white/70 px-3 py-2.5 text-sm outline-none ring-primary/20 focus:ring-4"
      />
      <p className="text-xs leading-snug text-muted-foreground">{t("adm.fbLiveHint")}</p>
      <button
        onClick={save}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-full bg-festive px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.03] disabled:opacity-50"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} {t("adm.fbLiveSave")}
      </button>
    </div>
  );
}

// Sign up on/off. Registration never needs an account, so turning this off keeps
// the flow fully direct (no sign-up page, no "create account" link on login).
export function SignupToggle() {
  const { t } = useI18n();
  const [on, setOn] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => { getSignupEnabled().then(setOn).catch(() => {}); }, []);
  async function toggle() {
    const next = !on;
    setBusy(true);
    try {
      await setSignupEnabled(next);
      setOn(next);
      toast.success(next ? t("adm.signupOn") : t("adm.signupOff"));
    } catch (e) {
      toast.error(friendlyAuthError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-2">
      <Switch on={on} busy={busy} onToggle={toggle} label={t("adm.signupLabel")} />
      <p className="text-xs leading-snug text-muted-foreground">{t("adm.signupHint")}</p>
    </div>
  );
}

export function DrawNonStopToggle() {
  const { t } = useI18n();
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { getDrawNonStop().then(setOn).catch(() => {}); }, []);
  async function toggle() {
    const next = !on;
    setBusy(true);
    try {
      await setDrawNonStop(next);
      setOn(next);
      toast.success(next ? t("adm.nonstopOn") : t("adm.nonstopOff"));
    } catch (e) {
      toast.error(friendlyAuthError(e));
    } finally {
      setBusy(false);
    }
  }
  return <Switch on={on} busy={busy} onToggle={toggle} label="Toggle Non-Stop button on the Live Draw screen" />;
}

// One live-draw control: icon + label/hint, with a segmented pill picker. Laid out as
// a soft card so the settings panel reads as a tidy stack of distinct controls.
function PillRow({ icon, label, hint, value, options, onPick, busy }: {
  icon?: ReactNode; label: string; hint?: string; value: string; options: { v: string; label: string }[]; onPick: (v: string) => void; busy: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/60 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</span>
        )}
        <div className="min-w-0">
          <span className="block text-sm font-semibold text-foreground">{label}</span>
          {hint && <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{hint}</span>}
        </div>
      </div>
      <div
        role="radiogroup"
        aria-label={label}
        className="inline-flex shrink-0 self-start rounded-full border border-border bg-muted/50 p-1 sm:self-auto"
      >
        {options.map((o) => (
          <button
            key={o.v}
            onClick={() => onPick(o.v)}
            disabled={busy}
            role="radio"
            aria-checked={value === o.v}
            className={`min-w-[54px] rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${
              value === o.v
                ? "bg-festive text-white shadow-soft"
                : "text-muted-foreground hover:bg-white/60 hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Countdown + sweep speed are free-form: admin picks any value in range (no presets).
function NumberRow({ icon, label, hint, value, min, max, step, unit, onSave, busy }: {
  icon: ReactNode; label: string; hint: string; value: number; min: number; max: number; step: number; unit: string;
  onSave: (v: number) => void; busy: boolean;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const dirty = draft !== value;
  return (
    <div className="rounded-2xl border border-border bg-muted/20 p-3.5">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{label}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={draft}
          onChange={(e) => setDraft(Number(e.target.value))}
          aria-label={label}
          className="h-1.5 flex-1 cursor-pointer accent-[color:var(--color-primary)]"
        />
        <div className="flex shrink-0 items-center gap-1 rounded-xl border border-border bg-white/70 px-2.5 py-1.5">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={draft}
            onChange={(e) => setDraft(clamp(Number(e.target.value)))}
            aria-label={`${label} (${unit})`}
            className="w-16 bg-transparent text-sm font-semibold tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-xs font-medium text-muted-foreground">{unit}</span>
        </div>
        <button
          type="button"
          onClick={() => onSave(clamp(draft))}
          disabled={busy || !dirty}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-festive px-4 py-1.5 text-xs font-bold text-white shadow-soft transition-transform hover:scale-[1.03] disabled:opacity-40"
        >
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} {dirty ? "Save" : "Saved"}
        </button>
      </div>
      <div className="mt-1 flex justify-between text-[10px] font-medium tabular-nums text-muted-foreground/70">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

export function LiveDrawPace() {
  const { t } = useI18n();
  const [speed, setSpeed] = useState<DrawSpeed>("medium");
  const [spinMs, setSpinMs] = useState(150);
  const [secs, setSecs] = useState(3);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    getDrawSpeed().then(setSpeed).catch(() => {});
    getDrawSpinMs().then(setSpinMs).catch(() => {});
    getDrawCountdown().then(setSecs).catch(() => {});
  }, []);
  async function save(fn: () => Promise<void>, apply: () => void) {
    setBusy(true);
    try { await fn(); apply(); toast.success(t("adm.drawSpeedSaved")); }
    catch (e) { toast.error(friendlyAuthError(e)); } finally { setBusy(false); }
  }
  const speedOpts = (["slow", "medium", "fast"] as DrawSpeed[]).map((o) => ({ v: o, label: t(`adm.drawSpeed.${o}`) }));
  return (
    <div className="space-y-3">
      <NumberRow
        icon={<TimerReset className="h-4 w-4" />}
        label={t("adm.drawCountdownLabel")}
        hint={t("adm.drawCountdownHint")}
        value={secs}
        min={COUNTDOWN_MIN}
        max={COUNTDOWN_MAX}
        step={1}
        unit="s"
        onSave={(v) => save(() => setDrawCountdown(v), () => setSecs(v))}
        busy={busy}
      />
      <NumberRow
        icon={<Gauge className="h-4 w-4" />}
        label={t("adm.drawSpinLabel")}
        hint={t("adm.drawSpinHint")}
        value={spinMs}
        min={SPIN_MS_MIN}
        max={SPIN_MS_MAX}
        step={5}
        unit="ms"
        onSave={(v) => save(() => setDrawSpinMs(v), () => setSpinMs(v))}
        busy={busy}
      />
      <PillRow
        icon={<Sparkles className="h-4 w-4" />}
        label={t("adm.drawSpeedLabel")}
        hint={t("adm.drawSpeedHint")}
        value={speed}
        options={speedOpts}
        onPick={(v) => save(() => setDrawSpeed(v as DrawSpeed), () => setSpeed(v as DrawSpeed))}
        busy={busy}
      />
    </div>
  );
}

// Which applicant details show when a winner is announced in the live draw, and for
// how long the winner card stays up.
export function RevealFieldsEditor() {
  const { t } = useI18n();
  const [f, setF] = useState<RevealFields>(DEFAULT_REVEAL);
  const [hold, setHold] = useState(3);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    getRevealFields().then(setF).catch(() => {});
    getRevealHold().then(setHold).catch(() => {});
  }, []);
  async function toggle(k: keyof RevealFields) {
    const next = { ...f, [k]: !f[k] };
    setBusy(true);
    try { await setRevealFields(next); setF(next); toast.success(t("adm.revealSaved")); }
    catch (e) { toast.error(friendlyAuthError(e)); } finally { setBusy(false); }
  }
  async function pickHold(v: number) {
    setBusy(true);
    try { await setRevealHold(v); setHold(v); toast.success(t("adm.revealSaved")); }
    catch (e) { toast.error(friendlyAuthError(e)); } finally { setBusy(false); }
  }
  const rows: { k: keyof RevealFields; label: string; hint: string }[] = [
    { k: "tagline", label: t("adm.revealTagline"), hint: t("adm.revealTaglineHint") },
    { k: "products", label: t("adm.revealProducts"), hint: t("adm.revealProductsHint") },
    { k: "category", label: t("adm.revealCategory"), hint: t("adm.revealCategoryHint") },
  ];
  return (
    <div className="space-y-3">
      <PillRow
        icon={<TimerReset className="h-4 w-4" />}
        label={t("adm.revealHoldLabel")}
        hint={t("adm.revealHoldHint")}
        value={String(hold)}
        options={[{ v: "3", label: "3s" }, { v: "5", label: "5s" }, { v: "8", label: "8s" }]}
        onPick={(v) => pickHold(Number(v))}
        busy={busy}
      />
      {rows.map(({ k, label, hint }) => (
        <div key={k} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/60 p-3.5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Sparkles className="h-4 w-4" /></span>
            <div className="min-w-0">
              <span className="block text-sm font-semibold text-foreground">{label}</span>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{hint}</span>
            </div>
          </div>
          <Switch on={f[k]} busy={busy} onToggle={() => toggle(k)} label={label} />
        </div>
      ))}
    </div>
  );
}

export function FillSubcatsToggle() {
  const { t } = useI18n();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { getFillSubcatsEnabled().then(setEnabled).catch(() => {}); }, []);
  async function toggle() {
    const next = !enabled;
    setBusy(true);
    try {
      await setFillSubcatsEnabled(next);
      setEnabled(next);
      toast.success(next ? t("adm.fillOn") : t("adm.fillOff"));
    } catch (e) {
      toast.error(friendlyAuthError(e));
    } finally {
      setBusy(false);
    }
  }
  return <Switch on={enabled} busy={busy} onToggle={toggle} label="Toggle the Fill sub-categories button" />;
}

export function FaqEditor() {
  const { t } = useI18n();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { getFaqs().then((f) => { setFaqs(f); setLoaded(true); }).catch(() => setLoaded(true)); }, []);

  function update(i: number, patch: Partial<Faq>) { setFaqs((list) => list.map((f, j) => (j === i ? { ...f, ...patch } : f))); }
  function add() { setFaqs((list) => [...list, { q: "", a: "" }]); }
  function remove(i: number) { setFaqs((list) => list.filter((_, j) => j !== i)); }

  async function save() {
    setBusy(true);
    try {
      const clean = faqs.filter((f) => f.q.trim());
      await saveFaqs(clean);
      setFaqs(clean);
      toast.success(t("adm.faqSaved"));
    } catch (e) {
      toast.error(friendlyAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) return null;
  return (
    <div className="space-y-3">
      {faqs.length === 0 && <p className="rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">{t("adm.faqEmpty")}</p>}
      {faqs.map((f, i) => (
        <div key={i} className="rounded-2xl border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <input
              value={f.q}
              onChange={(e) => update(i, { q: e.target.value })}
              placeholder={t("adm.faqQ")}
              className="flex-1 rounded-xl border border-border bg-white/70 px-3 py-2 text-sm font-semibold outline-none ring-primary/20 focus:ring-4"
            />
            <button type="button" onClick={() => remove(i)} aria-label={t("adm.delete")} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <textarea
            value={f.a}
            onChange={(e) => update(i, { a: e.target.value })}
            placeholder={t("adm.faqA")}
            className="mt-2 min-h-[70px] w-full rounded-xl border border-border bg-white/70 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-4"
          />
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={add} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-muted">
          <Plus className="h-4 w-4" /> {t("adm.faqAdd")}
        </button>
        <button type="button" onClick={save} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-festive px-5 py-2 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.02] disabled:opacity-50">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} {t("adm.faqSave")}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">{t("adm.faqNote")}</p>
    </div>
  );
}

// Terms & Conditions shown on the registration Review step. Blank = no T&C step.
export function TermsEditor() {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { getTerms().then((v) => { setText(v); setLoaded(true); }).catch(() => setLoaded(true)); }, []);
  async function save() {
    setBusy(true);
    try {
      await setTerms(text.trim());
      toast.success(t("adm.termsSaved"));
    } catch (e) {
      toast.error(friendlyAuthError(e));
    } finally {
      setBusy(false);
    }
  }
  if (!loaded) return null;
  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("adm.termsPlaceholder")}
        className="min-h-[220px] w-full rounded-xl border border-border bg-white/70 px-3 py-2.5 text-sm outline-none ring-primary/20 focus:ring-4"
      />
      <button type="button" onClick={save} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-festive px-5 py-2 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.02] disabled:opacity-50">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} {t("adm.termsSave")}
      </button>
      <p className="text-xs text-muted-foreground">{t("adm.termsNote")}</p>
    </div>
  );
}

// Rename the built-in registration fields. Each row shows the current label with a
// pencil to edit it inline; Save persists the overrides (empty = translated default).
export function BuiltinRegFieldsEditor() {
  const { t } = useI18n();
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [editKey, setEditKey] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({ personal: false, business: false }); // default collapsed
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { getRegFieldLabels().then((m) => { setLabels(m); setLoaded(true); }).catch(() => setLoaded(true)); }, []);
  async function save() {
    setBusy(true);
    try {
      await setRegFieldLabels(labels);
      toast.success(t("adm.rfSaved"));
      setEditKey(null);
    } catch (e) {
      toast.error(friendlyAuthError(e));
    } finally {
      setBusy(false);
    }
  }
  if (!loaded) return null;
  const sections: { s: "personal" | "business"; label: string }[] = [
    { s: "personal", label: t("reginfo.personal") },
    { s: "business", label: t("reginfo.business") },
  ];
  return (
    <div className="space-y-4">
      {sections.map(({ s, label }) => {
        const expanded = open[s] !== false;
        return (
        <div key={s}>
          <button type="button" onClick={() => setOpen((o) => ({ ...o, [s]: !expanded }))} className="mb-1.5 flex w-full items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground">
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "" : "-rotate-90"}`} /> {label}
          </button>
          {expanded && (
          <div className="divide-y divide-border rounded-2xl border border-border bg-muted/20">
            {BUILTIN_REG_FIELDS.filter((f) => f.section === s).map((f) => {
              const editing = editKey === f.key;
              return (
                <div key={f.key} className="flex items-center gap-2 px-3 py-2.5">
                  {editing ? (
                    <input
                      autoFocus
                      value={labels[f.key] ?? ""}
                      onChange={(e) => setLabels((m) => ({ ...m, [f.key]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter") setEditKey(null); }}
                      placeholder={t(f.labelKey)}
                      className="flex-1 rounded-lg border border-border bg-white/80 px-2.5 py-1.5 text-sm outline-none ring-primary/20 focus:ring-4"
                    />
                  ) : (
                    <span className="flex-1 truncate text-sm font-medium">{(labels[f.key] || "").trim() || t(f.labelKey)}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditKey(editing ? null : f.key)}
                    aria-label={t("adm.rfRename")}
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors ${editing ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-primary"}`}
                  >
                    {editing ? <Check className="h-4 w-4" /> : <Pencil className="h-3.5 w-3.5" />}
                  </button>
                </div>
              );
            })}
          </div>
          )}
        </div>
        );
      })}
      <button type="button" onClick={save} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-festive px-5 py-2 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.02] disabled:opacity-50">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} {t("adm.rfRenameSave")}
      </button>
      <p className="text-xs text-muted-foreground">{t("adm.rfRenameNote")}</p>
    </div>
  );
}

// Add/remove custom fields shown on the registration form. Each field has a label,
// a type, an optional required flag, and (for select) comma-separated options.
export function CustomRegFieldsEditor() {
  const { t } = useI18n();
  const [fields, setFields] = useState<CustomRegField[]>([]);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { getCustomRegFields().then((f) => { setFields(f); setLoaded(true); }).catch(() => setLoaded(true)); }, []);
  function update(i: number, patch: Partial<CustomRegField>) { setFields((l) => l.map((f, j) => (j === i ? { ...f, ...patch } : f))); }
  function add() { setFields((l) => [...l, { id: crypto.randomUUID(), label: "", type: "text" }]); }
  function remove(i: number) { setFields((l) => l.filter((_, j) => j !== i)); }
  async function save() {
    setBusy(true);
    try {
      const clean = fields.filter((f) => f.label.trim());
      await saveCustomRegFields(clean);
      setFields(clean);
      toast.success(t("adm.rfSaved"));
    } catch (e) {
      toast.error(friendlyAuthError(e));
    } finally {
      setBusy(false);
    }
  }
  if (!loaded) return null;
  const TYPES: { v: RegFieldType; label: string }[] = [
    { v: "text", label: t("adm.rfText") },
    { v: "number", label: t("adm.rfNumber") },
    { v: "textarea", label: t("adm.rfTextarea") },
    { v: "select", label: t("adm.rfSelect") },
  ];
  return (
    <div className="space-y-3">
      {fields.length === 0 && <p className="rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">{t("adm.rfEmpty")}</p>}
      {fields.map((f, i) => (
        <div key={f.id} className="space-y-2 rounded-2xl border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <input
              value={f.label}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder={t("adm.rfLabel")}
              className="flex-1 rounded-xl border border-border bg-white/70 px-3 py-2 text-sm font-semibold outline-none ring-primary/20 focus:ring-4"
            />
            <button type="button" onClick={() => remove(i)} aria-label={t("adm.delete")} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select value={f.type} onChange={(e) => update(i, { type: e.target.value as RegFieldType })} className="rounded-xl border border-border bg-white/70 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-4">
              {TYPES.map((tp) => <option key={tp.v} value={tp.v}>{tp.label}</option>)}
            </select>
            <label className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <input type="checkbox" checked={!!f.required} onChange={(e) => update(i, { required: e.target.checked })} className="h-4 w-4 rounded border-border accent-[color:var(--color-primary)]" /> {t("adm.rfRequired")}
            </label>
          </div>
          {f.type === "select" && (
            <input
              value={(f.options ?? []).join(", ")}
              onChange={(e) => update(i, { options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })}
              placeholder={t("adm.rfOptions")}
              className="w-full rounded-xl border border-border bg-white/70 px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-4"
            />
          )}
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={add} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-muted">
          <Plus className="h-4 w-4" /> {t("adm.rfAdd")}
        </button>
        <button type="button" onClick={save} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-festive px-5 py-2 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.02] disabled:opacity-50">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} {t("adm.rfSave")}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">{t("adm.rfNote")}</p>
    </div>
  );
}
