import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Archive, Pencil, Plus, Trash2, CalendarDays, DatabaseZap, Loader2, Store, Trophy, Wallet } from "lucide-react";
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
  if (s.isActive) return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
  if (s.status === "Completed") return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
  if (s.status === "Archived") return "bg-muted text-muted-foreground";
  return "bg-primary/10 text-primary";
}

// Colour of the thin accent bar at the top of each season card.
function accentBar(s: Season): string {
  if (s.isActive) return "bg-emerald-500";
  if (s.status === "Completed") return "bg-amber-500";
  if (s.status === "Archived") return "bg-muted-foreground/40";
  return "bg-primary";
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-muted/50 px-2 py-2.5 text-center">
      <div className="mx-auto mb-1 flex h-5 w-5 items-center justify-center text-primary">{icon}</div>
      <div className="font-display text-sm font-bold tabular-nums leading-none">{value}</div>
      <div className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
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
              <div
                key={s.id}
                className={`group relative overflow-hidden rounded-3xl border bg-card shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow ${s.isActive ? "border-emerald-500/40 ring-1 ring-emerald-500/25" : "border-border"}`}
              >
                <div className={`absolute inset-x-0 top-0 h-1 ${accentBar(s)}`} />
                {s.isActive && <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-500/15 blur-2xl" />}

                <div className="relative p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-festive font-display text-lg font-black text-white shadow-soft">{s.seasonNumber}</span>
                      <div className="min-w-0">
                        <div className="truncate font-display text-lg font-bold leading-tight">{s.seasonName}</div>
                        <div className="text-xs text-muted-foreground">{t("sea.seasonWord")} {s.seasonNumber} · {s.year}</div>
                      </div>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusTone(s)}`}>
                      {s.isActive && (
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        </span>
                      )}
                      {s.isActive ? t("sea.active") : t(`sea.st.${s.status}`)}
                    </span>
                  </div>

                  {s.eventDate && (
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground/80">
                      <CalendarDays className="h-3.5 w-3.5 text-primary" /> {s.eventDate}
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <Stat icon={<Store className="h-full w-full" />} label={t("sea.stalls")} value={s.maximumStalls} />
                    <Stat icon={<Trophy className="h-full w-full" />} label={t("sea.winners")} value={s.maximumSelectedStalls} />
                    <Stat icon={<Wallet className="h-full w-full" />} label={t("sea.fee")} value={`Rs ${s.registrationFee}`} />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {!s.isActive && s.status !== "Archived" && (
                      <button onClick={() => activate(s)} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-emerald-500/15 px-3.5 py-1.5 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-500/25 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {t("sea.activate")}
                      </button>
                    )}
                    <button onClick={() => { setEditing(s); setFormOpen(true); }} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-muted px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/70">
                      <Pencil className="h-3.5 w-3.5" /> {t("sea.edit")}
                    </button>
                    {s.status !== "Archived" && (
                      <button onClick={() => archive(s)} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-muted px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/70">
                        <Archive className="h-3.5 w-3.5" /> {t("sea.archive")}
                      </button>
                    )}
                    <button onClick={() => setDelTarget(s)} className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5" /> {t("sea.delete")}
                    </button>
                  </div>
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
