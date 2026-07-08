import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { friendlyAuthError } from "@/lib/firebase-errors";
import { useI18n } from "@/lib/i18n";
import {
  getHeroImage, setHeroImage, normalizeImageUrl, DEFAULT_HERO_IMAGE,
  getDrawNonStop, setDrawNonStop, getFillSubcatsEnabled, setFillSubcatsEnabled,
  getFaqs, saveFaqs, type Faq,
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
