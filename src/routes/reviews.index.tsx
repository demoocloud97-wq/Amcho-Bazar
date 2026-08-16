import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, MessageSquareQuote, Quote, Sparkles, Star, ThumbsUp, UserRound } from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { Stars } from "@/components/site/star-rating";
import { useI18n } from "@/lib/i18n";
import { useSeason } from "@/lib/season-context";
import { seasonHappened } from "@/lib/seasons-db";
import { normalizeImageUrl } from "@/lib/settings-db";
import { reviewDate, summarize, watchPublicReviews, type Review } from "@/lib/reviews-db";

export const Route = createFileRoute("/reviews/")({
  head: () => ({
    meta: [
      { title: "Customer Reviews · Amcho Bazar" },
      { name: "description", content: "What visitors say about Amcho Bazar — real reviews from real customers." },
      { property: "og:title", content: "Customer Reviews · Amcho Bazar" },
    ],
  }),
  component: PublicReviewsPage,
});

const PAGE = 9;
const FILTERS = [0, 5, 4, 3, 2, 1] as const;

function fmtDate(ts: unknown): string {
  const d = reviewDate(ts);
  return d ? d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";
}

function PublicReviewsPage() {
  const { t } = useI18n();
  const { seasons } = useSeason();
  const [all, setAll] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<number>(0); // 0 = all stars
  const [season, setSeason] = useState<string>("all"); // "all" | seasonId
  const [shown, setShown] = useState(PAGE);

  // Live: an admin publishing a review makes it appear here without a reload.
  // Guarded so an unreachable Firestore shows the empty state rather than blanking
  // this public page.
  useEffect(() => {
    try {
      const unsub = watchPublicReviews((list) => { setAll(list); setLoading(false); });
      return () => unsub();
    } catch (e) {
      console.error("Reviews are unavailable", e);
      setLoading(false);
    }
  }, []);

  // A season's reviews only go public once its event is over — newest season first.
  const seasonTabs = useMemo(() => seasons.filter(seasonHappened), [seasons]);
  const liveIds = useMemo(() => new Set(seasonTabs.map((s) => s.id)), [seasonTabs]);

  // Reviews stamped with a season that hasn't happened yet stay hidden. Reviews with no
  // seasonId (written before reviews were season-stamped) always count as public.
  const live = useMemo(() => all.filter((r) => !r.seasonId || liveIds.has(r.seasonId)), [all, liveIds]);
  const scoped = useMemo(
    () => (season === "all" ? live : live.filter((r) => r.seasonId === season)),
    [live, season],
  );

  const stats = useMemo(() => summarize(scoped), [scoped]);
  // Featured reviews lead, then newest first (the list already arrives sorted).
  const visible = useMemo(() => {
    const list = filter ? scoped.filter((r) => Math.round(r.overallRating) === filter) : scoped;
    return [...list].sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
  }, [scoped, filter]);

  useEffect(() => { setShown(PAGE); }, [filter, season]);

  return (
    <div>
      <PageHeader eyebrow={t("revs.eyebrow")} title={t("revs.title")} subtitle={t("revs.subtitle")} />

      <section className="mx-auto max-w-5xl px-4 pb-24 pt-8 md:px-8 md:pt-12">
        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : live.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* ---- Season tabs — only seasons whose event is already over ---- */}
            {seasonTabs.length > 1 && (
              <div className="mb-6 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {[{ id: "all", name: t("revs.allSeasons") }, ...seasonTabs.map((s) => ({ id: s.id!, name: s.seasonName }))].map((s) => {
                  const on = season === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSeason(s.id)}
                      aria-pressed={on}
                      className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        on ? "border-transparent bg-festive text-white shadow-soft" : "border-border bg-card text-foreground/70 hover:bg-muted"
                      }`}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ---- Summary: average + breakdown ---- */}
            <div className="grid gap-6 rounded-3xl border border-border bg-card p-6 shadow-card md:grid-cols-[auto_1fr] md:gap-10 md:p-8">
              <div className="text-center md:border-e md:border-border md:pe-10">
                <div className="font-display text-6xl font-black leading-none text-primary tabular-nums">
                  {stats.average.toFixed(1)}
                </div>
                <Stars value={stats.average} size="md" className="mt-3 justify-center" />
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("revs.basedOn").replace("{n}", String(stats.total))}
                </p>
                {stats.recommendRate != null && (
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-teal/12 px-3 py-1 text-xs font-semibold text-teal">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    {t("revs.recommend").replace("{n}", String(Math.round(stats.recommendRate)))}
                  </p>
                )}
              </div>

              <div className="space-y-2 self-center">
                {[5, 4, 3, 2, 1].map((n) => {
                  const count = stats.counts[n as 1 | 2 | 3 | 4 | 5];
                  const pct = stats.total ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={n} className="flex items-center gap-3">
                      <span className="inline-flex w-10 shrink-0 items-center gap-1 text-xs font-semibold tabular-nums text-muted-foreground">
                        {n} <Star className="h-3 w-3 fill-accent text-accent" />
                      </span>
                      <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <span className="block h-full rounded-full bg-warm transition-[width] duration-500" style={{ width: `${pct}%` }} />
                      </span>
                      <span className="w-8 shrink-0 text-end text-xs tabular-nums text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ---- Star filters ---- */}
            <div className="mt-6 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {FILTERS.map((n) => {
                const on = filter === n;
                const count = n ? stats.counts[n as 1 | 2 | 3 | 4 | 5] : stats.total;
                return (
                  <button
                    key={n}
                    onClick={() => setFilter(n)}
                    aria-pressed={on}
                    className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      on ? "border-transparent bg-festive text-white shadow-soft" : "border-border bg-card text-foreground/70 hover:bg-muted"
                    }`}
                  >
                    {n === 0 ? t("revs.all") : <>{n} <Star className={`h-3.5 w-3.5 ${on ? "fill-white text-white" : "fill-accent text-accent"}`} /></>}
                    <span className={`tabular-nums ${on ? "text-white/70" : "text-muted-foreground"}`}>({count})</span>
                  </button>
                );
              })}
            </div>

            {/* ---- Review cards ---- */}
            {visible.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
                {t("revs.noneForFilter")}
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {visible.slice(0, shown).map((r) => <ReviewCard key={r.id} r={r} />)}
              </div>
            )}

            {shown < visible.length && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setShown((s) => s + PAGE)}
                  className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-6 text-sm font-semibold text-primary shadow-soft transition-colors hover:bg-muted"
                >
                  {t("revs.loadMore")} ({visible.length - shown})
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function EmptyState() {
  const { t } = useI18n();
  return (
    <div className="rounded-3xl border border-dashed border-border p-12 text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-muted text-primary">
        <MessageSquareQuote className="h-8 w-8" />
      </span>
      <p className="mt-5 font-display text-lg font-bold">{t("revs.emptyTitle")}</p>
      <p className="mt-1.5 text-sm text-muted-foreground">{t("revs.emptyBody")}</p>
      <Link to="/review" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-festive px-6 text-sm font-bold text-white shadow-soft transition-transform hover:scale-[1.03]">
        {t("revs.writeOne")}
      </Link>
    </div>
  );
}

function ReviewCard({ r }: { r: Review }) {
  const { t } = useI18n();
  const name = r.anonymous ? t("revs.anonymous") : r.customerName || t("revs.aCustomer");
  const cats = ([
    ["rev.product", r.productRating],
    ["rev.staff", r.staffRating],
    ["rev.delivery", r.deliveryRating],
  ] as const).filter(([, v]) => !!v);

  return (
    <article className="flex flex-col rounded-3xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-glow">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-sm font-bold text-primary">
          {r.anonymous || !r.customerName ? <UserRound className="h-5 w-5" /> : r.customerName.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-bold">{name}</span>
            {r.featured && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-foreground">
                <Sparkles className="h-3 w-3" /> {t("revs.featured")}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Stars value={r.overallRating} size="sm" />
            <span className="text-[11px] text-muted-foreground">{fmtDate(r.createdAt)}</span>
          </div>
        </div>
      </div>

      {r.businessName && (
        <div className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{r.businessName}</div>
      )}

      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{r.reviewText}</p>

      {r.photoUrl && (
        <img
          src={normalizeImageUrl(r.photoUrl)}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="mt-3 max-h-48 w-full rounded-2xl object-cover"
        />
      )}

      {cats.length > 0 && (
        <dl className="mt-4 space-y-1.5 border-t border-border/70 pt-3">
          {cats.map(([key, val]) => (
            <div key={key} className="flex items-center justify-between gap-2">
              <dt className="text-xs text-muted-foreground">{t(key)}</dt>
              <dd><Stars value={val!} size="sm" /></dd>
            </div>
          ))}
        </dl>
      )}

      {r.adminResponse && (
        <div className="mt-4 rounded-2xl bg-muted/60 p-3.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary">
            <Quote className="h-3 w-3" /> {t("revs.ourReply")}
          </div>
          <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-foreground/80">{r.adminResponse}</p>
        </div>
      )}
    </article>
  );
}
