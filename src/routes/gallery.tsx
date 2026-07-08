import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ImagePlus, Loader2, Trash2, Upload, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EVENT } from "@/lib/dummy-data";
import { PageHeader } from "@/components/site/page-header";
import { ConfirmDialog } from "@/components/site/confirm-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { useSeason } from "@/lib/season-context";
import { useI18n } from "@/lib/i18n";
import { friendlyAuthError } from "@/lib/firebase-errors";
import { createGalleryItem, getGalleryItemsBySeasonId, getGalleryItems, deleteGalleryItem, type GalleryItem } from "@/lib/gallery-db";
import { SEASON1_GALLERY } from "@/lib/season1-gallery";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery · Amcho Bazar" },
      { name: "description", content: "A photo journey through the seasons of Amcho Bazar — the Nawait Community's women-only festival." },
      { property: "og:title", content: "Gallery · Amcho Bazar" },
      { property: "og:description", content: "A season-by-season photo journey." },
    ],
  }),
  component: GalleryPage,
});

type Photo = { id?: string; src: string; caption: string };
// A season tab: a real Season entity if seeded, else a numeric-season fallback
// so old data stays browsable before seasons are set up.
type Tab = { key: string; label: string; seasonId?: string; season: number };

function GalleryPage() {
  const { isAdmin } = useAuth();
  const { seasons, loading: seasonsLoading } = useSeason();
  const { t } = useI18n();

  // Always show Season 1..N; a real Season entity (if seeded) supplies its name
  // + id, otherwise a numeric-season fallback keeps that tab browsable.
  const tabs = useMemo<Tab[]>(() => {
    const byNum = new Map<number, Tab>();
    const max = Math.max(EVENT.seasonNumber, ...seasons.map((s) => s.seasonNumber));
    for (let n = 1; n <= max; n++) byNum.set(n, { key: `n${n}`, label: `Season ${n}`, season: n });
    for (const s of seasons) byNum.set(s.seasonNumber, { key: s.id!, label: s.seasonName, seasonId: s.id, season: s.seasonNumber });
    return [...byNum.values()].sort((a, b) => a.season - b.season);
  }, [seasons]);

  const [tab, setTab] = useState<Tab | null>(null);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<number | null>(null);
  const [delTarget, setDelTarget] = useState<GalleryItem | null>(null);

  // Restore the last-viewed season (persists across refresh); else Season 1.
  useEffect(() => {
    if (tab || !tabs.length) return;
    const saved = Number(localStorage.getItem("gallery.season"));
    setTab(tabs.find((t) => t.season === saved) ?? tabs[0]);
  }, [tabs, tab]);

  // Remember the chosen season so a refresh reopens it.
  useEffect(() => {
    if (tab) localStorage.setItem("gallery.season", String(tab.season));
  }, [tab]);

  async function load(t: Tab) {
    setLoading(true);
    try {
      // Merge photos matched by real seasonId AND numeric season (legacy).
      const lists = [await getGalleryItems(t.season)];
      if (t.seasonId) lists.push(await getGalleryItemsBySeasonId(t.seasonId));
      const byId = new Map<string, GalleryItem>();
      lists.flat().forEach((i) => byId.set(i.id!, i));
      setItems([...byId.values()]);
    } catch (e) {
      console.error(e);
      toast.error(friendlyAuthError(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tab) load(tab);
    else if (!seasonsLoading) setLoading(false);
  }, [tab?.key, seasonsLoading]);

  // Firestore photos for the season; Season 1 falls back to the archive set.
  const photos: Photo[] = useMemo(() => {
    if (items.length) return items.map((i) => ({ id: i.id, src: i.src, caption: i.caption }));
    if (tab?.season === 1) return SEASON1_GALLERY;
    return [];
  }, [items, tab]);

  async function handleDelete() {
    if (!delTarget) return;
    try {
      await deleteGalleryItem(delTarget.id!);
      toast.success(t("gallery.photoRemoved"));
      setDelTarget(null);
      if (tab) await load(tab);
    } catch (e) {
      toast.error(friendlyAuthError(e));
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow={t("nav.gallery")}
        title={t("gallery.title")}
        subtitle={t("gallery.subtitle")}
      />

      <section className="mx-auto max-w-7xl px-4 pb-24 pt-6 md:px-8 md:pt-10">
        {/* Season tabs */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex flex-wrap gap-1 rounded-full border border-border bg-card p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${tab?.key === t.key ? "bg-festive text-white shadow" : "text-foreground/70 hover:text-primary"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {isAdmin && tab && (
            <div className="flex flex-wrap gap-2">
              <BulkImportButton tab={tab} onDone={() => load(tab)} />
              <UploadButton tab={tab} onUploaded={() => load(tab)} />
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : photos.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border py-20 text-center text-muted-foreground">
            {t("gallery.noPhotos")} {tab?.label ?? ""} {t("gallery.yet")}{isAdmin ? " " + t("gallery.addHint") : ""}
          </div>
        ) : (
          <div className="columns-2 gap-4 md:columns-3 lg:columns-4">
            {photos.map((p, i) => (
              <motion.div
                key={p.id ?? i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: (i % 8) * 0.04 }}
                className="group relative mb-4 block w-full break-inside-avoid overflow-hidden rounded-3xl shadow-card"
              >
                <button onClick={() => setActive(i)} className="block w-full">
                  <GalleryImg src={p.src} alt={p.caption} />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-left text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {p.caption}
                  </div>
                </button>
                {isAdmin && p.id && (
                  <button
                    onClick={() => setDelTarget(items.find((it) => it.id === p.id) ?? null)}
                    className="absolute end-2 top-2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white shadow-soft ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-destructive"
                    aria-label="Delete photo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <AnimatePresence>
        {active !== null && photos[active] && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
            onClick={() => setActive(null)}
          >
            <button
              type="button" aria-label="Close image" onClick={() => setActive(null)}
              className="absolute end-6 top-6 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <X className="h-5 w-5" />
            </button>
            <motion.img
              key={active}
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              src={photos[active].src} alt={photos[active].caption}
              referrerPolicy="no-referrer"
              className="max-h-[85vh] max-w-[90vw] rounded-3xl object-contain shadow-glow"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute inset-x-0 bottom-6 text-center text-sm font-medium text-white">{photos[active].caption}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!delTarget}
        onOpenChange={(o) => !o && setDelTarget(null)}
        title={t("gallery.deleteTitle")}
        description={delTarget ? `“${delTarget.caption}” will be removed from the gallery.` : ""}
        confirmLabel={t("gallery.delete")}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// Masonry photo with its own loading state — shows a shimmer + spinner until the image lands.
function GalleryImg({ src, alt }: { src: string; alt: string }) {
  const [done, setDone] = useState(false); // loaded OR errored — either way stop the spinner
  return (
    <div className={`relative w-full ${done ? "" : "min-h-44"}`}>
      {!done && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted animate-pulse">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/60" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => setDone(true)}
        onError={() => setDone(true)}
        className={`max-h-80 w-full object-cover transition-opacity duration-500 group-hover:scale-105 ${done ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}

// Any Google Drive link → lh3 CDN form that hotlinks in <img>; other hosts pass through.
function toImageUrl(url: string): string {
  if (!url.includes("google")) return url;
  const id = url.match(/[?&]id=([^&]+)/)?.[1] ?? url.match(/\/d\/([^/=?]+)/)?.[1];
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w1600` : url;
}

const SAMPLE_JSON = `[
  { "season": 1, "src": "https://images.unsplash.com/photo-1523240795612-9a054b0db644", "caption": "Opening ceremony — S1" },
  { "season": 2, "src": "https://drive.google.com/file/d/FILE_ID/view", "caption": "Biryani stall — S2" },
  { "season": 3, "src": "https://drive.google.com/uc?id=FILE_ID", "caption": "Jewellery corner — S3" }
]`;

// Bulk-import many photos, each into its own season (from the JSON `season`
// number). Rows without a season fall back to the currently selected tab.
function BulkImportButton({ tab, onDone }: { tab: Tab; onDone: () => void }) {
  const { seasons } = useSeason();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const idByNumber = useMemo(() => new Map(seasons.map((s) => [s.seasonNumber, s.id])), [seasons]);

  async function run() {
    let rows: { season?: number; src?: string; url?: string; caption?: string; title?: string }[];
    try {
      rows = JSON.parse(text);
      if (!Array.isArray(rows)) throw new Error("not an array");
    } catch {
      toast.error("Invalid JSON — paste an array of { season, src, caption }.");
      return;
    }
    const items = rows
      .map((r) => ({
        season: Number(r.season) || tab.season,
        src: (r.src || r.url || "").trim(),
        caption: (r.caption ?? r.title ?? "").trim(),
      }))
      .filter((r) => r.src);
    if (items.length === 0) { toast.error("No valid rows (each needs a src)."); return; }

    setBusy(true);
    try {
      let done = 0;
      for (const it of items) {
        const seasonId = idByNumber.get(it.season) ?? (it.season === tab.season ? tab.seasonId : undefined);
        await createGalleryItem({ seasonId, season: it.season, src: toImageUrl(it.src), caption: it.caption });
        done++;
      }
      toast.success(`${done} imported`);
      setText("");
      setOpen(false);
      onDone();
    } catch (err) {
      toast.error(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold text-primary shadow-soft transition-colors hover:bg-muted"
      >
        <Upload className="h-4 w-4" /> {t("gallery.bulkImport")}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("gallery.bulkImport")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Paste a JSON array of <code>{"{ season, src, caption }"}</code> — each photo goes into its own <code>season</code> (1, 2, 3…). Rows without a season use “{tab.label}”. Direct or Google Drive links both work.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={SAMPLE_JSON}
            spellCheck={false}
            className="mt-1 h-56 w-full rounded-2xl border border-border bg-background p-3 font-mono text-xs outline-none ring-primary/20 focus:ring-4"
          />
          <DialogFooter>
            <button onClick={() => setText(SAMPLE_JSON)} className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted">{t("gallery.insertSample")}</button>
            <button
              onClick={run}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-festive px-5 py-2 text-sm font-semibold text-white shadow-soft disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {t("gallery.import")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function UploadButton({ tab, onUploaded }: { tab: Tab; onUploaded: () => void }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);

  async function add() {
    const input = window.prompt("Paste image URL (direct link or Google Drive):", "")?.trim();
    if (!input) return;
    const caption = window.prompt("Caption for this photo?", "") ?? "";
    setBusy(true);
    try {
      await createGalleryItem({ seasonId: tab.seasonId, season: tab.season, src: toImageUrl(input), caption });
      toast.success(t("gallery.photoAdded"));
      onUploaded();
    } catch (err) {
      toast.error(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={add}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-full bg-festive px-5 py-2.5 text-sm font-semibold text-white shadow-soft disabled:opacity-60"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
      {busy ? t("gallery.adding") : t("gallery.addPhoto")}
    </button>
  );
}
