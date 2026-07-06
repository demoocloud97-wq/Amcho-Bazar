import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Archive, Pencil, Plus, Trash2, CalendarDays, DatabaseZap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/site/page-header";
import { RequireAdmin } from "@/components/site/require-admin";
import { ConfirmDialog } from "@/components/site/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSeason } from "@/lib/season-context";
import { runSeasonMigration } from "@/lib/migrate-seasons";
import { friendlyAuthError } from "@/lib/firebase-errors";
import { useI18n } from "@/lib/i18n";
import {
  createSeason, updateSeason, deleteSeason, activateSeason, archiveSeason,
  SEASON_STATUSES, type Season, type SeasonStatus,
} from "@/lib/seasons-db";

export const Route = createFileRoute("/seasons")({
  head: () => ({ meta: [{ title: "Seasons · Amcho Bazar" }] }),
  component: () => (
    <RequireAdmin>
      <SeasonsPage />
    </RequireAdmin>
  ),
});

function statusTone(s: Season): string {
  if (s.isActive) return "bg-emerald-500/15 text-emerald-600";
  if (s.status === "Completed") return "bg-amber-500/15 text-amber-600";
  if (s.status === "Archived") return "bg-muted text-muted-foreground";
  return "bg-primary/10 text-primary";
}

function SeasonsPage() {
  const { eventId, seasons, refresh } = useSeason();
  const { t } = useI18n();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Season | null>(null);
  const [delTarget, setDelTarget] = useState<Season | null>(null);
  const [migrating, setMigrating] = useState(false);

  async function migrate() {
    setMigrating(true);
    try {
      const r = await runSeasonMigration();
      await refresh();
      toast.success(
        t("sea.migrateDone")
      );
    } catch (e) {
      toast.error(friendlyAuthError(e));
    } finally {
      setMigrating(false);
    }
  }

  async function activate(s: Season) {
    try { await activateSeason(s.id!, eventId); await refresh(); toast.success(`${s.seasonName} ${t("sea.nowActive")}`); }
    catch (e) { toast.error(friendlyAuthError(e)); }
  }
  async function archive(s: Season) {
    try { await archiveSeason(s.id!); await refresh(); toast.success(`${s.seasonName} ${t("sea.archived")}`); }
    catch (e) { toast.error(friendlyAuthError(e)); }
  }
  async function remove() {
    if (!delTarget) return;
    try { await deleteSeason(delTarget.id!); setDelTarget(null); await refresh(); toast.success(t("sea.deleted")); }
    catch (e) { toast.error(e instanceof Error ? e.message : friendlyAuthError(e)); }
  }

  return (
    <div>
      <PageHeader
        eyebrow={t("sea.eyebrow")}
        title={t("sea.title")}
        subtitle={t("sea.subtitle")}
      />

      <section className="mx-auto max-w-5xl px-4 pb-24 md:px-8">
        <div className="mt-6 mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={migrate}
            disabled={migrating}
            title="One-time: seed S1/S2/S3 and tag existing records with a season. Safe to re-run."
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-soft transition-colors hover:bg-muted disabled:opacity-50"
          >
            {migrating ? <Loader2 className="h-4 w-4 animate-spin" /> : <DatabaseZap className="h-4 w-4 text-primary" />}
            {migrating ? t("sea.migrating") : t("sea.migrate")}
          </button>
          <button
            onClick={() => { setEditing(null); setFormOpen(true); }}
            className="inline-flex items-center gap-2 rounded-full bg-festive px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.03]"
          >
            <Plus className="h-4 w-4" /> {t("sea.new")}
          </button>
        </div>

        {seasons.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
            {t("sea.none")}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {seasons.map((s) => (
              <div key={s.id} className="rounded-3xl border border-border bg-card p-5 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-display text-lg font-semibold">{s.seasonName}</div>
                    <div className="text-sm text-muted-foreground">{t("sea.seasonWord")} {s.seasonNumber} · {s.year}</div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusTone(s)}`}>
                    {s.isActive ? t("sea.active") : t(`sea.st.${s.status}`)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {s.eventDate && <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {s.eventDate}</span>}
                  <span>{s.maximumStalls} {t("sea.stalls")} · {s.maximumSelectedStalls} {t("sea.winners")}</span>
                  <span>₹{s.registrationFee} {t("sea.fee")}</span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {!s.isActive && s.status !== "Archived" && (
                    <button onClick={() => activate(s)} className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/25">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {t("sea.activate")}
                    </button>
                  )}
                  <button onClick={() => { setEditing(s); setFormOpen(true); }} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/70">
                    <Pencil className="h-3.5 w-3.5" /> {t("sea.edit")}
                  </button>
                  {s.status !== "Archived" && (
                    <button onClick={() => archive(s)} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/70">
                      <Archive className="h-3.5 w-3.5" /> {t("sea.archive")}
                    </button>
                  )}
                  <button onClick={() => setDelTarget(s)} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-3.5 w-3.5" /> {t("sea.delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <SeasonFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editing} eventId={eventId} onSaved={refresh} />
      <ConfirmDialog
        open={!!delTarget}
        onOpenChange={(o) => !o && setDelTarget(null)}
        title={t("sea.deleteTitle")}
        description={delTarget ? t("sea.deleteDesc") : ""}
        confirmLabel={t("sea.delete")}
        onConfirm={remove}
      />
    </div>
  );
}

type FormState = Omit<Season, "id" | "isActive" | "createdAt" | "updatedAt">;

function blankForm(eventId: string): FormState {
  return {
    eventId, seasonName: "", seasonNumber: 1, year: new Date().getFullYear(),
    bannerImage: "", description: "", registrationStartDate: "", registrationEndDate: "", eventDate: "",
    venue: "", city: "", maximumStalls: 75, maximumSelectedStalls: 45, registrationFee: 1500,
    status: "Upcoming",
  };
}

function SeasonFormDialog({
  open, onOpenChange, editing, eventId, onSaved,
}: { open: boolean; onOpenChange: (o: boolean) => void; editing: Season | null; eventId: string; onSaved: () => Promise<void> }) {
  const { t } = useI18n();
  const [form, setForm] = useState<FormState>(blankForm(eventId));
  const [busy, setBusy] = useState(false);
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);

  // Sync form to the season being edited (or reset for a new one) when the dialog opens.
  const key = editing?.id ?? "new";
  if (open && hydratedFor !== key) {
    setHydratedFor(key);
    setForm(editing ? { ...blankForm(eventId), ...editing } : blankForm(eventId));
  }
  if (!open && hydratedFor !== null) setHydratedFor(null);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.seasonName.trim()) { toast.error(t("sea.nameReq")); return; }
    setBusy(true);
    try {
      const data = { ...form, guidelines: (form.guidelines ?? []).map((g) => g.trim()).filter(Boolean) };
      if (editing?.id) await updateSeason(editing.id, data);
      else await createSeason(data);
      await onSaved();
      toast.success(editing ? t("sea.updated") : t("sea.created"));
      onOpenChange(false);
    } catch (err) { toast.error(friendlyAuthError(err)); }
    finally { setBusy(false); }
  }

  const inputCls = "w-full rounded-xl border border-border bg-white/70 px-3 py-2.5 text-sm outline-none ring-primary/20 focus:ring-4";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{editing ? t("sea.editTitle") : t("sea.new")}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          <Field label={t("sea.f.name")}><input value={form.seasonName} onChange={(e) => set("seasonName", e.target.value)} placeholder="Amcho Bazar Season 3" className={inputCls} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("sea.f.number")}><input type="number" value={form.seasonNumber} onChange={(e) => set("seasonNumber", Number(e.target.value))} className={inputCls} /></Field>
            <Field label={t("sea.f.year")}><input type="number" value={form.year} onChange={(e) => set("year", Number(e.target.value))} className={inputCls} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("sea.f.venue")}><input value={form.venue} onChange={(e) => set("venue", e.target.value)} className={inputCls} /></Field>
            <Field label={t("sea.f.city")}><input value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} /></Field>
          </div>
          <Field label={t("sea.f.eventDate")}><input value={form.eventDate} onChange={(e) => set("eventDate", e.target.value)} placeholder="August 2, 2026 · 10:00 AM – 9:00 PM" className={inputCls} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("sea.f.regOpens")}><input type="date" value={form.registrationStartDate} onChange={(e) => set("registrationStartDate", e.target.value)} className={inputCls} /></Field>
            <Field label={t("sea.f.regCloses")}><input type="date" value={form.registrationEndDate} onChange={(e) => set("registrationEndDate", e.target.value)} className={inputCls} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label={t("sea.f.maxStalls")}><input type="number" value={form.maximumStalls} onChange={(e) => set("maximumStalls", Number(e.target.value))} className={inputCls} /></Field>
            <Field label={t("sea.f.maxWinners")}><input type="number" value={form.maximumSelectedStalls} onChange={(e) => set("maximumSelectedStalls", Number(e.target.value))} className={inputCls} /></Field>
            <Field label={t("sea.f.fee")}><input type="number" value={form.registrationFee} onChange={(e) => set("registrationFee", Number(e.target.value))} className={inputCls} /></Field>
          </div>
          <Field label={t("sea.f.status")}>
            <select value={form.status} onChange={(e) => set("status", e.target.value as SeasonStatus)} className={inputCls}>
              {SEASON_STATUSES.map((s) => <option key={s} value={s}>{t(`sea.st.${s}`)}</option>)}
            </select>
          </Field>
          <Field label={t("sea.f.banner")}><input value={form.bannerImage} onChange={(e) => set("bannerImage", e.target.value)} placeholder="https://…" className={inputCls} /></Field>
          <Field label={t("sea.f.desc")}><textarea value={form.description} onChange={(e) => set("description", e.target.value)} className={`min-h-[60px] ${inputCls}`} /></Field>
          <Field label={t("sea.f.guidelines")}><textarea value={(form.guidelines ?? []).join("\n")} onChange={(e) => set("guidelines", e.target.value.split("\n"))} placeholder={"Women & children only\nBring reusable bags\nPrayer & feeding rooms available"} className={`min-h-[80px] ${inputCls}`} /></Field>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => onOpenChange(false)} className="rounded-full border border-border px-4 py-2 text-sm font-medium">{t("sea.cancel")}</button>
            <button type="submit" disabled={busy} className="rounded-full bg-festive px-5 py-2 text-sm font-semibold text-white shadow-soft disabled:opacity-50">
              {busy ? t("sea.saving") : editing ? t("sea.save") : t("sea.createBtn")}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
