import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarDays, ImagePlus, Loader2, Megaphone, Pencil, Save, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/site/page-header";
import { ConfirmDialog } from "@/components/site/confirm-dialog";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { createAnnouncement, updateAnnouncement, getAnnouncements, deleteAnnouncement, type Announcement } from "@/lib/announcements-db";
import { normalizeImageUrl } from "@/lib/settings-db";
import { friendlyAuthError } from "@/lib/firebase-errors";

export const Route = createFileRoute("/announcements")({
  head: () => ({ meta: [{ title: "Announcements · Amcho Bazar" }] }),
  component: AnnouncementsPage,
});

function fmtDate(ts: unknown): string {
  const any = ts as { toDate?: () => Date; seconds?: number };
  const d = typeof any?.toDate === "function" ? any.toDate() : typeof any?.seconds === "number" ? new Date(any.seconds * 1000) : null;
  return d ? d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";
}

function AnnouncementsPage() {
  const { isAdmin } = useAuth();
  const { t } = useI18n();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [delTarget, setDelTarget] = useState<Announcement | null>(null);
  const [editing, setEditing] = useState<Announcement | null>(null);

  async function load() {
    setLoading(true);
    try { setItems(await getAnnouncements()); }
    catch (e) { toast.error(friendlyAuthError(e)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function remove() {
    if (!delTarget) return;
    try { await deleteAnnouncement(delTarget.id!); setDelTarget(null); await load(); toast.success(t("ann.deleted")); }
    catch (e) { toast.error(friendlyAuthError(e)); }
  }

  return (
    <div>
      <PageHeader eyebrow={t("ann.eyebrow")} title={t("ann.title")} subtitle={t("ann.subtitle")} />

      <section className="mx-auto max-w-2xl px-4 pb-24 md:px-8">
        {isAdmin && (
          <ComposeForm
            key={editing?.id ?? "new"}
            editing={editing}
            onDone={async () => { await load(); setEditing(null); }}
            onCancel={() => setEditing(null)}
          />
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
            {t("ann.none")}
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {items.map((a) => (
              <article key={a.id} className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
                {a.imageUrl && (
                  <img src={normalizeImageUrl(a.imageUrl)} alt={a.title} loading="lazy" referrerPolicy="no-referrer" className="max-h-72 w-full object-cover" />
                )}
                <div className="p-5 md:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-lg font-bold leading-tight">{a.title}</h3>
                    {isAdmin && (
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => { setEditing(a); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                          aria-label={t("ann.edit")}
                          className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDelTarget(a)}
                          aria-label={t("ann.deleteTitle")}
                          className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  {fmtDate(a.createdAt) && (
                    <div className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" /> {fmtDate(a.createdAt)}
                    </div>
                  )}
                  {a.body && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{a.body}</p>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={!!delTarget}
        onOpenChange={(o) => !o && setDelTarget(null)}
        title={t("ann.deleteTitle")}
        description={delTarget ? t("ann.deleteDesc") : ""}
        confirmLabel={t("sea.delete")}
        onConfirm={remove}
      />
    </div>
  );
}

function ComposeForm({ editing, onDone, onCancel }: { editing: Announcement | null; onDone: () => Promise<void>; onCancel: () => void }) {
  const { t } = useI18n();
  const isEdit = !!editing;
  const [title, setTitle] = useState(editing?.title ?? "");
  const [body, setBody] = useState(editing?.body ?? "");
  const [imageUrl, setImageUrl] = useState(editing?.imageUrl ?? "");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast.error(t("ann.titleReq")); return; }
    setBusy(true);
    try {
      const payload = { title: title.trim(), body: body.trim(), imageUrl: imageUrl.trim() || undefined };
      if (isEdit) await updateAnnouncement(editing!.id!, payload);
      else await createAnnouncement(payload);
      toast.success(isEdit ? t("ann.updated") : t("ann.posted"));
      if (!isEdit) { setTitle(""); setBody(""); setImageUrl(""); }
      await onDone();
    } catch (e2) {
      toast.error(friendlyAuthError(e2));
    } finally {
      setBusy(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-border bg-white/70 px-3 py-2.5 text-sm outline-none ring-primary/20 focus:ring-4";

  return (
    <form onSubmit={submit} className={`rounded-3xl border bg-card p-5 shadow-card md:p-6 ${isEdit ? "border-primary/40 ring-1 ring-primary/20" : "border-border"}`}>
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-festive text-white shadow-soft">{isEdit ? <Pencil className="h-5 w-5" /> : <Megaphone className="h-5 w-5" />}</span>
        <div>
          <h2 className="font-display text-lg font-bold leading-tight">{isEdit ? t("ann.editTitle") : t("ann.postTitle")}</h2>
          <p className="text-xs text-muted-foreground">{t("ann.postDesc")}</p>
        </div>
      </div>

      <div className="space-y-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("ann.titleField")} className={inputCls} />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={t("ann.bodyField")} className={`min-h-[90px] ${inputCls}`} />

        <div>
          <div className="relative">
            <ImagePlus className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder={t("ann.addImage")}
              className={`${inputCls} ps-9`}
            />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">{t("ann.imageHint")}</p>
        </div>

        {imageUrl.trim() && (
          <div className="relative overflow-hidden rounded-2xl border border-border">
            <img src={normalizeImageUrl(imageUrl.trim())} alt="preview" referrerPolicy="no-referrer" className="max-h-56 w-full object-cover" />
            <button type="button" onClick={() => setImageUrl("")} aria-label={t("ann.removeImage")} className="absolute end-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition-colors hover:bg-destructive">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        {isEdit && (
          <button type="button" onClick={onCancel} className="inline-flex min-h-11 items-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground/80 transition-colors hover:bg-muted">
            {t("common.cancel")}
          </button>
        )}
        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-festive px-6 py-2.5 text-sm font-bold text-white shadow-soft transition-transform hover:scale-[1.02] disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? <Save className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          {busy ? t("ann.posting") : isEdit ? t("ann.update") : t("ann.post")}
        </button>
      </div>
    </form>
  );
}
