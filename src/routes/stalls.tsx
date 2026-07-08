import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Search, Store, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/site/page-header";
import { getStallsBySeasonId, getStallsBySeason, type Stall } from "@/lib/stalls-db";
import { getCategories, type Category } from "@/lib/categories-db";
import { useSeason } from "@/lib/season-context";
import { useI18n } from "@/lib/i18n";
import { EVENT } from "@/lib/dummy-data";
import { SEASON1_STALLS } from "@/lib/season1-gallery";
import { friendlyAuthError } from "@/lib/firebase-errors";

// A season tab: a real Season entity if seeded, else a numeric-season fallback
// so old-season stalls stay browsable before seasons are set up.
type Tab = { key: string; label: string; seasonId?: string; season: number };

export const Route = createFileRoute("/stalls")({
  head: () => ({
    meta: [
      { title: "Stall Directory · Amcho Bazar" },
      { name: "description", content: "Browse every stall at Amcho Bazar — meet each seller and their home business, season by season." },
      { property: "og:title", content: "Stall Directory · Amcho Bazar" },
      { property: "og:description", content: "Every stall, every seller, every category — searchable." },
    ],
  }),
  component: StallsPage,
});

function StallsPage() {
  const { seasons } = useSeason();
  const { t } = useI18n();
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");

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
        let merged = [...byId.values()];
        let cats = c;
        // Season 1 has no Firestore stalls — fall back to the real archive list.
        if (tab.season === 1 && merged.length === 0) {
          const idByName = new Map(c.map((cc) => [cc.name.toLowerCase(), cc.id!]));
          const extraCats: Category[] = [];
          merged = SEASON1_STALLS.map((s, i) => {
            let cid = idByName.get(s.category.toLowerCase());
            if (!cid) {
              cid = s.category;
              if (!extraCats.some((e) => e.id === cid)) extraCats.push({ id: cid, name: s.category, emoji: "", description: "", status: "active" });
            }
            return { id: `s1-${i}`, name: s.name, owner: "", status: "assigned", season: 1, categoryId: cid, subcategoryId: null, imageUrl: s.imageUrl };
          });
          cats = [...c, ...extraCats];
        }
        setStalls(merged);
        setCats(cats);
      })
      .catch((e) => { console.error(e); toast.error(friendlyAuthError(e)); })
      .finally(() => setLoading(false));
  }, [tab?.key]);

  const catName = useMemo(() => new Map(cats.map((c) => [c.id!, c.name])), [cats]);
  const catOptions = useMemo(
    () => [...new Set(stalls.map((s) => catName.get(s.categoryId) ?? "").filter(Boolean))].sort(),
    [stalls, catName]
  );

  const filtered = stalls.filter((s) => {
    const cname = catName.get(s.categoryId) ?? "";
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

        <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            {loading ? t("common.loading") : <><span className="tabular-nums font-semibold text-foreground">{filtered.length}</span> {t("stalls.count")}</>}
            {tab && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{tab.label}</span>}
          </span>
          <span className="inline-flex items-center gap-2"><Store className="h-4 w-4 text-primary" /> {t("stalls.hall")}</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
            {stalls.length === 0 ? t("stalls.none") : t("stalls.noMatch")}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: (i % 12) * 0.03 }}
                className="group overflow-hidden rounded-3xl border border-border bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-glow"
              >
                <StallImage src={s.imageUrl} alt={s.name} />
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                      {catName.get(s.categoryId) ?? t("stalls.uncat")}
                    </span>
                    <span className="rounded-full bg-accent/20 px-2.5 py-1 text-[11px] font-semibold text-primary">
                      Season {s.season}
                    </span>
                  </div>
                  <div className="mt-2 font-display text-lg font-semibold leading-snug">{s.name}</div>
                  {s.owner && <div className="text-sm text-muted-foreground">by {s.owner}</div>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// Normalise any Google Drive link to the lh3 CDN form (the one that actually
// hotlinks in <img>). Files must be shared "anyone with the link". The image
// also needs referrerPolicy="no-referrer" or Google blocks the embed.
function normalizeDrive(url: string): string {
  if (!url.includes("google")) return url;
  const id = url.match(/[?&]id=([^&]+)/)?.[1] ?? url.match(/\/d\/([^/=?]+)/)?.[1];
  return id ? `https://lh3.googleusercontent.com/d/${id}=w1000` : url;
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
