import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Search, Store, Loader2, Trash2, Upload, X, CheckSquare, Check, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/site/page-header";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/site/confirm-dialog";
import { getStallsBySeasonId, getStallsBySeason, createStall, deleteStallsBySeason, deleteStall, type Stall } from "@/lib/stalls-db";
import { getCategories, type Category } from "@/lib/categories-db";
import { useSeason } from "@/lib/season-context";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { EVENT } from "@/lib/dummy-data";
import { friendlyAuthError } from "@/lib/firebase-errors";

// A season tab: a real Season entity if seeded, else a numeric-season fallback
// so old-season stalls stay browsable before seasons are set up.
type Tab = { key: string; label: string; seasonId?: string; season: number };

export const Route = createFileRoute("/stalls")({
  head: () => ({
    meta: [
      { title: "Stall Directory · Amcho Bazar" },
      { name: "description", content: "Browse every stall at Amcho Bazar — meet each owner and their home business, season by season." },
      { property: "og:title", content: "Stall Directory · Amcho Bazar" },
      { property: "og:description", content: "Every stall, every owner, every category — searchable." },
    ],
  }),
  component: StallsPage,
});

// Explicit Season-1 name → category overrides (admin-provided, beat the name guess).
const NAME_CATEGORY: Record<string, string> = {
  "khao piyoo": "Food", "amchay nonchay stall": "Food", "choco bities": "Food", "taste fusion": "Food", "little star s": "Food",
  "aizal games": "Game", "play to win it": "Game", "the games and juice corner": "Game", "amcho bazar final": "Game",
  "the craft studio": "Jewellery", "hand craft and show pieces": "Jewellery", "shahkar": "Jewellery",
  "clean and gleam": "Shopping", "azlaan plastic & crockery": "Shopping", "house hold items": "Shopping",
  "bake shop": "Food",
};

function StallsPage() {
  const { seasons } = useSeason();
  const { isAdmin } = useAuth();
  const { t } = useI18n();
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [refresh, setRefresh] = useState(0);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmClearSel, setConfirmClearSel] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  function toggleSelected(id: string) {
    setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function exitSelect() { setSelectMode(false); setSelectedIds(new Set()); }
  async function clearSeasonStalls() {
    if (!tab) return;
    setClearing(true);
    try {
      const n = await deleteStallsBySeason(tab.seasonId, tab.season);
      setConfirmClear(false);
      toast.success(`${n} ${t("stalls.cleared")}`);
      setRefresh((x) => x + 1);
    } catch (e) {
      toast.error(friendlyAuthError(e));
    } finally {
      setClearing(false);
    }
  }
  async function clearSelectedStalls() {
    if (selectedIds.size === 0) return;
    setClearing(true);
    try {
      const ids = [...selectedIds];
      await Promise.all(ids.map((id) => deleteStall(id)));
      setConfirmClearSel(false);
      exitSelect();
      toast.success(`${ids.length} ${t("stalls.cleared")}`);
      setRefresh((x) => x + 1);
    } catch (e) {
      toast.error(friendlyAuthError(e));
    } finally {
      setClearing(false);
    }
  }

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

  // Always land on Season 1 first when opening this screen.
  useEffect(() => {
    if (tab || !tabs.length) return;
    setTab(tabs[0]);
  }, [tabs, tab]);

  // Reload whenever the chosen season tab changes. Merge stalls matched by the
  // real seasonId AND the numeric season, so legacy (un-migrated) stalls show.
  useEffect(() => {
    if (!tab) return;
    setLoading(true);
    const queries = [getStallsBySeason(tab.season)];
    if (tab.seasonId) queries.push(getStallsBySeasonId(tab.seasonId));
    Promise.all([Promise.all(queries), getCategories()])
      .then(([lists, c]) => {
        const byId = new Map<string, Stall>();
        lists.flat().forEach((s) => byId.set(s.id!, s));
        // Only real (Firestore) stalls — no built-in Season 1 sample archive.
        setStalls([...byId.values()]);
        setCats(c);
      })
      .catch((e) => { console.error(e); toast.error(friendlyAuthError(e)); })
      .finally(() => setLoading(false));
  }, [tab?.key, refresh]);

  const catName = useMemo(() => new Map(cats.map((c) => [c.id!, c.name])), [cats]);
  const catByName = useMemo(() => new Map(cats.map((c) => [c.name.trim().toLowerCase(), c.name])), [cats]);
  // Guess a category from the stall name for Season 1 stalls (imported with no category
  // at all). ponytail: keyword heuristic — good-enough, not exhaustive; specific
  // categories are tested before the generic Food/Shopping catch-alls so they win.
  const guessCategory = (name: string): string => {
    const n = ` ${name.toLowerCase()} `;
    const RULES: [string, string[]][] = [
      ["Jewellery", ["jewel", "gems", "gehna", "adorn", "ornament", "bangle", "smj"]],
      ["Beauty", ["beauty", "cosmetic", "makeup", "make up", "skincare", "herbal", "glow", "aiesh", "salon", "henna", "mehndi"]],
      ["Clothing", ["cloth", "fashion", "hajar", "abaya", "dress", "apparel", "wear", "boutique", "stitch"]],
      ["Stationery", ["stationery", "calligraph", "journal", "planner", "notebook", "paper", "art print"]],
      ["Gifts", ["gift", "blissful", "surprise", "hamper", "keepsake"]],
      ["Kids", ["kids", "kid ", "toy", "baby", "children"]],
      ["Food", ["food", "biryani", "cake", "dhaba", "snack", "khana", "khaana", "khausey", "khausay", "khausy", "crave", "bites", "platter", "beverage", "chatkhara", "masala", "baker", "dessert", "sweet", "pizza", "burger", "kabab", "tasty", "foodi", "chai", "samosa", "pakora", "roll", "grill", "tikka", "karahi", "nihari", "haleem", "paratha", "cafe", "dhaaba", "peena"]],
      ["Shopping", ["store", "shop", "gadget", "mart", "one stop"]],
    ];
    for (const [cat, kws] of RULES) if (kws.some((k) => n.includes(k))) return catByName.get(cat.toLowerCase()) ?? cat;
    return "";
  };
  const canonical = (cat: string) => catByName.get(cat.toLowerCase()) ?? cat;
  // Resolve by id → name → raw categoryId; when nothing is stored, use an explicit
  // name override, else guess from the name.
  const resolveCat = (catId?: string, name?: string) => {
    const byIdOrName = catId ? (catName.get(catId) ?? catByName.get(catId.trim().toLowerCase()) ?? catId) : "";
    if (byIdOrName) return byIdOrName;
    if (!name) return "";
    const override = NAME_CATEGORY[name.trim().toLowerCase()];
    return override ? canonical(override) : guessCategory(name);
  };
  const catOptions = useMemo(
    () => [...new Set(stalls.map((s) => resolveCat(s.categoryId, s.name)).filter(Boolean))].sort(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stalls, catName, catByName]
  );

  const filtered = stalls.filter((s) => {
    const cname = resolveCat(s.categoryId, s.name);
    if (cat !== "All" && cname !== cat) return false;
    if (!q) return true;
    return `${s.name} ${s.owner} ${cname}`.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div>
      <PageHeader
        eyebrow={t("stalls.eyebrow")}
        title={t("stalls.title")}
        subtitle={t("stalls.subtitle")}
      />

      <section className="mx-auto max-w-7xl px-4 pb-24 pt-6 md:px-8">
        {/* Season tabs — browse past seasons' stalls */}
        <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${tab?.key === t.key ? "border-transparent bg-festive text-white shadow-soft" : "border-border bg-card text-foreground/70 hover:border-primary/30 hover:text-primary"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="sticky top-20 z-20 mb-8 flex flex-col gap-3 rounded-3xl border border-border bg-card p-4 shadow-soft md:flex-row md:items-center md:p-5">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("stalls.search")}
              aria-label="Search stalls"
              className="w-full rounded-full border border-border bg-white/70 py-3 ps-11 pe-11 text-sm outline-none ring-primary/20 transition focus:border-primary/30 focus:bg-white focus:ring-4"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                aria-label="Clear search"
                className="absolute end-2.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              aria-label="Filter by category"
              className="rounded-full border border-border bg-white/80 px-4 py-3 text-sm font-medium outline-none ring-primary/20 focus:ring-4"
            >
              <option value="All">{t("stalls.allCategories")}</option>
              {catOptions.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            {loading ? t("common.loading") : <><span className="tabular-nums font-semibold text-foreground">{filtered.length}</span> {t("stalls.count")}</>}
            {tab && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{tab.label}</span>}
          </span>
          {isAdmin && tab ? (
            <div className="flex items-center gap-2">
              {selectMode ? (
                <>
                  <button
                    onClick={() => setConfirmClearSel(true)}
                    disabled={clearing || selectedIds.size === 0}
                    className="inline-flex items-center gap-2 rounded-full border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                  >
                    {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} {t("stalls.clearSelected")} {selectedIds.size > 0 && `(${selectedIds.size})`}
                  </button>
                  <button
                    onClick={exitSelect}
                    disabled={clearing}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground/70 transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    <X className="h-4 w-4" /> {t("stalls.cancel")}
                  </button>
                </>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label={t("stalls.actions")}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground/70 shadow-soft transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 data-[state=open]:bg-muted data-[state=open]:text-primary"
                    >
                      {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem onSelect={() => setSelectMode(true)} disabled={stalls.length === 0}>
                      <CheckSquare className="h-4 w-4" /> {t("stalls.select")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setBulkOpen(true)}>
                      <Upload className="h-4 w-4" /> {t("stalls.bulkImport")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => setConfirmClear(true)}
                      disabled={stalls.length === 0 || clearing}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" /> {t("stalls.clear")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ) : (
            <span className="inline-flex items-center gap-2"><Store className="h-4 w-4 text-primary" /> {t("stalls.hall")}</span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
            {stalls.length === 0 ? t("stalls.none") : t("stalls.noMatch")}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((s, i) => {
              const selected = selectMode && !!s.id && selectedIds.has(s.id);
              return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: (i % 12) * 0.03 }}
                onClick={selectMode && s.id ? () => toggleSelected(s.id!) : undefined}
                className={`group relative overflow-hidden rounded-3xl border bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-glow ${selectMode ? "cursor-pointer" : ""} ${selected ? "border-primary ring-2 ring-primary" : "border-border"}`}
              >
                {selectMode && (
                  <div className={`absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 shadow-soft transition-colors ${selected ? "border-primary bg-primary text-white" : "border-white/70 bg-black/30 text-transparent backdrop-blur"}`}>
                    <Check className="h-4 w-4" />
                  </div>
                )}
                <StallImage src={s.imageUrl} alt={s.name} />
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                      {resolveCat(s.categoryId, s.name) || t("stalls.uncat")}
                    </span>
                    <span className="rounded-full bg-accent/20 px-2.5 py-1 text-[11px] font-semibold text-primary">
                      Season {s.season}
                    </span>
                  </div>
                  <div className="mt-2 font-display text-lg font-semibold leading-snug">{s.name}</div>
                  {s.owner && <div className="text-sm text-muted-foreground">by {s.owner}</div>}
                </div>
              </motion.div>
              );
            })}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={(o) => !o && !clearing && setConfirmClear(false)}
        title={t("stalls.clearTitle")}
        description={t("stalls.clearDesc").replace("{season}", tab?.label ?? "")}
        confirmLabel={t("stalls.clear")}
        onConfirm={clearSeasonStalls}
      />

      <ConfirmDialog
        open={confirmClearSel}
        onOpenChange={(o) => !o && !clearing && setConfirmClearSel(false)}
        title={t("stalls.clearSelTitle")}
        description={t("stalls.clearSelDesc").replace("{n}", String(selectedIds.size))}
        confirmLabel={t("stalls.clearSelected")}
        onConfirm={clearSelectedStalls}
      />

      {tab && <BulkImportStalls tab={tab} open={bulkOpen} onOpenChange={setBulkOpen} onDone={() => setRefresh((x) => x + 1)} />}
    </div>
  );
}

// Normalise any Google Drive link to the lh3 CDN form (the one that actually
// hotlinks in <img>). Files must be shared "anyone with the link". The image
// also needs referrerPolicy="no-referrer" or Google blocks the embed.
function normalizeDrive(url: string): string {
  if (!url.includes("google")) return url;
  const id = url.match(/[?&]id=([^&]+)/)?.[1] ?? url.match(/\/d\/([^/=?]+)/)?.[1];
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w1600` : url;
}

// Drive/CDN images can fail to load; fall back to a branded poster tile
// (stall initial on a warm gradient) so cards still look designed, not broken.
function StallImage({ src, alt }: { src?: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  if (!src || failed) {
    const initial = alt.trim().charAt(0).toUpperCase() || "?";
    return (
      <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-warm">
        <div className="pointer-events-none absolute inset-0 pattern-dots opacity-20" />
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
        <span className="relative font-display text-5xl font-black text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
          {initial}
        </span>
      </div>
    );
  }
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/60" />
        </div>
      )}
      <img
        src={normalizeDrive(src)}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`aspect-[4/3] w-full object-cover transition-all duration-500 group-hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}

// Admin: paste a JSON array of { season, src, caption } to create many stalls at once.
// Controlled from the parent's actions menu (no own trigger button).
function BulkImportStalls({ tab, open, onOpenChange, onDone }: { tab: Tab; open: boolean; onOpenChange: (o: boolean) => void; onDone: () => void }) {
  const { seasons } = useSeason();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const idByNumber = useMemo(() => new Map(seasons.map((s) => [s.seasonNumber, s.id])), [seasons]);

  async function run() {
    let rows: { season?: number; src?: string; url?: string; caption?: string; title?: string; name?: string; category?: string }[];
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
        name: (r.caption ?? r.title ?? r.name ?? "").trim(),
        category: (r.category ?? "").trim(),
      }))
      .filter((r) => r.src);
    if (items.length === 0) { toast.error("No valid rows (each needs a src)."); return; }

    setBusy(true);
    try {
      let done = 0;
      for (const it of items) {
        const seasonId = idByNumber.get(it.season) ?? (it.season === tab.season ? tab.seasonId : undefined);
        await createStall({ name: it.name || "Stall", owner: "", status: "assigned", categoryId: it.category, season: it.season, seasonId, imageUrl: it.src });
        done++;
      }
      toast.success(`${done} stalls imported`);
      setText("");
      onOpenChange(false);
      onDone();
    } catch (err) {
      toast.error(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Bulk import stalls</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Paste an array of {"{ season, src, caption }"} rows. Google Drive links work.</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'[ { "season": 1, "src": "https://…", "caption": "Stall name" } ]'}
          className="mt-2 min-h-[220px] w-full rounded-xl border border-border bg-white/70 p-3 font-mono text-xs outline-none ring-primary/20 focus:ring-4"
        />
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" onClick={() => onOpenChange(false)} className="rounded-full border border-border px-4 py-2 text-sm font-medium">Cancel</button>
          <button type="button" onClick={run} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-festive px-5 py-2 text-sm font-semibold text-white shadow-soft disabled:opacity-50">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Import
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
