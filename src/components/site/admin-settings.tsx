import { useEffect, useState, type ReactNode } from "react";
import { Loader2, Plus, Trash2, TimerReset, Gauge, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { friendlyAuthError } from "@/lib/firebase-errors";
import { useI18n } from "@/lib/i18n";
import {
  getHeroImage, setHeroImage, normalizeImageUrl, DEFAULT_HERO_IMAGE,
  getDrawNonStop, setDrawNonStop, getFillSubcatsEnabled, setFillSubcatsEnabled,
  getDrawSpeed, setDrawSpeed, type DrawSpeed,
  getDrawCountdown, setDrawCountdown,
  getDrawSpinSpeed, setDrawSpinSpeed,
  getRevealFields, setRevealFields, DEFAULT_REVEAL, type RevealFields,
  getRevealHold, setRevealHold,
  getDrawFbUrl, setDrawFbUrl,
  getFaqs, saveFaqs, type Faq,
  getFooterContact, setFooterContact, DEFAULT_FOOTER, type FooterContact,
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

export function LiveDrawPace() {
  const { t } = useI18n();
  const [speed, setSpeed] = useState<DrawSpeed>("medium");
  const [spin, setSpin] = useState<DrawSpeed>("medium");
  const [secs, setSecs] = useState(3);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    getDrawSpeed().then(setSpeed).catch(() => {});
    getDrawSpinSpeed().then(setSpin).catch(() => {});
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
      <PillRow
        icon={<TimerReset className="h-4 w-4" />}
        label={t("adm.drawCountdownLabel")}
        hint={t("adm.drawCountdownHint")}
        value={String(secs)}
        options={[{ v: "3", label: "3s" }, { v: "5", label: "5s" }, { v: "10", label: "10s" }]}
        onPick={(v) => save(() => setDrawCountdown(Number(v)), () => setSecs(Number(v)))}
        busy={busy}
      />
      <PillRow
        icon={<Gauge className="h-4 w-4" />}
        label={t("adm.drawSpinLabel")}
        hint={t("adm.drawSpinHint")}
        value={spin}
        options={speedOpts}
        onPick={(v) => save(() => setDrawSpinSpeed(v as DrawSpeed), () => setSpin(v as DrawSpeed))}
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
