import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis,
} from "recharts";
import {
  Bell, BellOff, CheckCircle2, EyeOff, Filter, Loader2, MessageSquareQuote, Percent,
  QrCode as QrIcon, Search, Send, Sparkles, Star, ThumbsDown, ThumbsUp, Trash2, TrendingUp,
  Undo2, UserRound, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/site/page-header";
import { RequireAdmin } from "@/components/site/require-admin";
import { SidebarSections, type NavGroup } from "@/components/site/sidebar-sections";
import { ConfirmDialog } from "@/components/site/confirm-dialog";
import { QrCard } from "@/components/site/qr-code";
import { Stars } from "@/components/site/star-rating";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AnimatedCounter } from "@/components/site/animated-counter";
import { useI18n } from "@/lib/i18n";
import { AMCHO_BAZAR_EVENT_ID } from "@/lib/events-db";
import { getAllStalls, type Stall } from "@/lib/stalls-db";
import { normalizeImageUrl } from "@/lib/settings-db";
import { friendlyAuthError } from "@/lib/firebase-errors";
import {
  deleteReview, markReviewsRead, MAX, reviewDate, summarize, updateReview, watchAllReviews,
  type Review, type ReviewStatus,
} from "@/lib/reviews-db";

export const Route = createFileRoute("/reviews/manage")({
  head: () => ({ meta: [{ title: "Review Management · Amcho Bazar" }] }),
  component: () => (
    <RequireAdmin>
      <ManageReviewsPage />
    </RequireAdmin>
  ),
});

// The deployed site — the QR must resolve on a phone, so it defaults to the live
// domain rather than whatever host the admin happens to be browsing from.
const SITE_URL = "https://amchobazaar.alfajaryouthwing.com";
const QR_BASE_KEY = "abz-qr-base";

const STATUSES: ReviewStatus[] = ["pending", "approved", "published", "rejected", "hidden"];

const STATUS_STYLE: Record<ReviewStatus, string> = {
  pending: "bg-secondary/15 text-secondary",
  approved: "bg-accent/25 text-accent-foreground",
  published: "bg-teal/15 text-teal",
  rejected: "bg-destructive/12 text-destructive",
  hidden: "bg-muted text-muted-foreground",
};

function StatusBadge({ status }: { status: ReviewStatus }) {
  const { t } = useI18n();
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLE[status]}`}>
      {t(`rv.status.${status}`)}
    </span>
  );
}

function fmtDateTime(ts: unknown): string {
  const d = reviewDate(ts);
  return d ? d.toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
}
function fmtDate(ts: unknown): string {
  const d = reviewDate(ts);
  return d ? d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";
}

function ManageReviewsPage() {
  const { t } = useI18n();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Review | null>(null);   // detail dialog
  const [delTarget, setDelTarget] = useState<Review | null>(null);

  // One live subscription feeds every section — dashboard, list, analytics and the bell.
  useEffect(() => {
    try {
      const unsub = watchAllReviews((list) => { setReviews(list); setLoading(false); });
      return () => unsub();
    } catch (e) {
      console.error("Reviews are unavailable", e);
      setLoading(false);
    }
  }, []);

  // Keep the open dialog pointed at the latest version of its review after an edit.
  const openLive = open ? reviews.find((r) => r.id === open.id) ?? open : null;

  async function patch(id: string, data: Partial<Review>, msg: string) {
    try { await updateReview(id, data); toast.success(msg); }
    catch (e) { toast.error(friendlyAuthError(e)); }
  }

  async function remove() {
    if (!delTarget?.id) return;
    try {
      await deleteReview(delTarget.id);
      setDelTarget(null);
      setOpen(null);
      toast.success(t("rv.deleted"));
    } catch (e) { toast.error(friendlyAuthError(e)); }
  }

  const groups: NavGroup[] = [
    {
      label: t("rv.grpReviews"),
      items: [
        { id: "dashboard", icon: <TrendingUp className="h-4 w-4" />, title: t("rv.dashboard"), desc: t("rv.dashboardDesc"), node: <DashboardSection reviews={reviews} loading={loading} /> },
        { id: "list", icon: <MessageSquareQuote className="h-4 w-4" />, title: t("rv.allReviews"), desc: t("rv.allReviewsDesc"), node: <ListSection reviews={reviews} loading={loading} onOpen={setOpen} /> },
      ],
    },
    {
      label: t("rv.grpInsights"),
      items: [
        { id: "analytics", icon: <Percent className="h-4 w-4" />, title: t("rv.analytics"), desc: t("rv.analyticsDesc"), node: <AnalyticsSection reviews={reviews} loading={loading} /> },
      ],
    },
    {
      label: t("rv.grpTools"),
      items: [
        { id: "qr", icon: <QrIcon className="h-4 w-4" />, title: t("rv.qr"), desc: t("rv.qrDesc"), node: <QrSection /> },
        { id: "notifications", icon: <Bell className="h-4 w-4" />, title: t("rv.notifications"), desc: t("rv.notificationsDesc"), node: <NotificationsSection reviews={reviews} onOpen={setOpen} /> },
      ],
    },
  ];

  return (
    <div>
      <PageHeader eyebrow={t("rv.eyebrow")} title={t("rv.title")} subtitle={t("rv.subtitle")} />
      <section className="mx-auto max-w-7xl px-4 pb-24 pt-8 md:px-8 md:pt-12">
        <SidebarSections groups={groups} />
      </section>

      <ReviewDetailDialog
        review={openLive}
        onClose={() => setOpen(null)}
        onPatch={patch}
        onDelete={(r) => setDelTarget(r)}
      />

      <ConfirmDialog
        open={!!delTarget}
        onOpenChange={(o) => !o && setDelTarget(null)}
        title={t("rv.deleteTitle")}
        description={delTarget ? t("rv.deleteDesc").replace("{ref}", delTarget.ref || "") : ""}
        confirmLabel={t("rv.delete")}
        onConfirm={remove}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ Dashboard */

function Stat({ label, value, decimals = 0, tone = "primary", icon }: { label: string; value: number; decimals?: number; tone?: "primary" | "teal" | "orange" | "gold"; icon?: React.ReactNode }) {
  const tones = {
    primary: { glow: "from-primary/20 to-primary/5 text-primary", bar: "bg-primary" },
    teal: { glow: "from-teal/25 to-teal/5 text-teal", bar: "bg-teal" },
    orange: { glow: "from-secondary/25 to-secondary/5 text-secondary", bar: "bg-secondary" },
    gold: { glow: "from-accent/40 to-accent/5 text-primary", bar: "bg-accent" },
  } as const;
  const tn = tones[tone];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow">
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 opacity-80 ${tn.bar}`} />
      <div className={`pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-gradient-to-br opacity-70 blur-2xl ${tn.glow}`} />
      <div className="relative flex items-center gap-2.5">
        {icon && <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${tn.glow}`}>{icon}</span>}
        <div className="min-w-0">
          <div className="truncate text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="mt-0.5 font-display text-2xl font-black tabular-nums">
            {decimals ? value.toFixed(decimals) : <AnimatedCounter value={value} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Groups reviews into the last `months` calendar months → chart rows.
function monthlySeries(reviews: Review[], months = 12) {
  const now = new Date();
  const buckets: { key: string; label: string; count: number; sum: number }[] = [];
  const index = new Map<string, number>();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    index.set(key, buckets.length);
    buckets.push({ key, label: d.toLocaleDateString(undefined, { month: "short" }), count: 0, sum: 0 });
  }
  for (const r of reviews) {
    const d = reviewDate(r.createdAt);
    if (!d) continue;
    const i = index.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (i === undefined) continue;
    buckets[i].count++;
    buckets[i].sum += r.overallRating || 0;
  }
  return buckets.map((b) => ({ label: b.label, count: b.count, average: b.count ? +(b.sum / b.count).toFixed(2) : null }));
}

const CHART_CONFIG = {
  count: { label: "Reviews", color: "var(--chart-2)" },
  average: { label: "Avg rating", color: "var(--chart-1)" },
};

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card md:p-5">
      <h3 className="mb-3 font-display text-sm font-bold">{title}</h3>
      {children}
    </div>
  );
}

function DashboardSection({ reviews, loading }: { reviews: Review[]; loading: boolean }) {
  const { t } = useI18n();
  const s = useMemo(() => summarize(reviews), [reviews]);
  const series = useMemo(() => monthlySeries(reviews), [reviews]);

  if (loading) return <Loading />;
  if (!reviews.length) return <Empty text={t("rv.emptyAll")} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t("rv.total")} value={s.total} tone="primary" icon={<MessageSquareQuote className="h-4 w-4" />} />
        <Stat label={t("rv.average")} value={s.average} decimals={1} tone="gold" icon={<Star className="h-4 w-4" />} />
        <Stat label={t("rv.status.pending")} value={s.byStatus.pending} tone="orange" icon={<Bell className="h-4 w-4" />} />
        <Stat label={t("rv.status.published")} value={s.byStatus.published} tone="teal" icon={<CheckCircle2 className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[5, 4, 3, 2, 1].map((n) => (
          <div key={n} className="rounded-2xl border border-border bg-card p-4 text-center shadow-card">
            <div className="flex items-center justify-center gap-1 text-xs font-bold text-muted-foreground">
              {n} <Star className="h-3.5 w-3.5 fill-accent text-accent" />
            </div>
            <div className="mt-1 font-display text-2xl font-black tabular-nums">{s.counts[n as 1 | 2 | 3 | 4 | 5]}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t("rv.chartOverTime")}>
          <ChartContainer config={CHART_CONFIG} className="aspect-auto h-52 w-full">
            <AreaChart data={series} margin={{ left: -20, right: 6, top: 6 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area dataKey="count" type="monotone" stroke="var(--color-count)" fill="var(--color-count)" fillOpacity={0.18} strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        </Panel>

        <Panel title={t("rv.chartTrend")}>
          <ChartContainer config={CHART_CONFIG} className="aspect-auto h-52 w-full">
            <LineChart data={series} margin={{ left: -20, right: 6, top: 6 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line dataKey="average" type="monotone" stroke="var(--color-average)" strokeWidth={2} dot={false} connectNulls />
            </LineChart>
          </ChartContainer>
        </Panel>

        <Panel title={t("rv.chartDistribution")}>
          <ChartContainer config={CHART_CONFIG} className="aspect-auto h-52 w-full">
            <BarChart
              data={[5, 4, 3, 2, 1].map((n) => ({ label: `${n}★`, count: s.counts[n as 1 | 2 | 3 | 4 | 5] }))}
              margin={{ left: -20, right: 6, top: 6 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </Panel>

        <Panel title={t("rv.chartSentiment")}>
          <SentimentSplit positive={s.positive} negative={s.negative} neutral={s.counts[3]} />
        </Panel>
      </div>
    </div>
  );
}

function SentimentSplit({ positive, negative, neutral }: { positive: number; negative: number; neutral: number }) {
  const { t } = useI18n();
  const total = positive + negative + neutral || 1;
  const rows = [
    { label: t("rv.positive"), n: positive, cls: "bg-teal", icon: <ThumbsUp className="h-3.5 w-3.5" /> },
    { label: t("rv.neutral"), n: neutral, cls: "bg-accent", icon: <Star className="h-3.5 w-3.5" /> },
    { label: t("rv.negative"), n: negative, cls: "bg-secondary", icon: <ThumbsDown className="h-3.5 w-3.5" /> },
  ];
  return (
    <div className="flex h-52 flex-col justify-center gap-4">
      <div className="flex h-4 overflow-hidden rounded-full bg-muted">
        {rows.map((r) => r.n > 0 && (
          <span key={r.label} className={r.cls} style={{ width: `${(r.n / total) * 100}%` }} title={`${r.label}: ${r.n}`} />
        ))}
      </div>
      <dl className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-2.5">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${r.cls}`} />
            <dt className="flex flex-1 items-center gap-1.5 text-sm text-muted-foreground">{r.icon} {r.label}</dt>
            <dd className="text-sm font-bold tabular-nums">{r.n}</dd>
            <dd className="w-12 text-end text-xs tabular-nums text-muted-foreground">{Math.round((r.n / total) * 100)}%</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ----------------------------------------------------------------- All reviews */

type SortKey = "newest" | "oldest" | "highest" | "lowest";

const inputCls = "w-full rounded-xl border border-border bg-white/70 px-3 py-2.5 text-sm outline-none ring-primary/20 focus:ring-4";

function ListSection({ reviews, loading, onOpen }: { reviews: Review[]; loading: boolean; onOpen: (r: Review) => void }) {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState<"" | ReviewStatus>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    // Local end-of-day so a "to" date includes reviews left that same day.
    const fromMs = from ? new Date(`${from}T00:00:00`).getTime() : null;
    const toMs = to ? new Date(`${to}T23:59:59`).getTime() : null;
    const out = reviews.filter((r) => {
      if (rating && Math.round(r.overallRating) !== rating) return false;
      if (status && r.status !== status) return false;
      const ms = reviewDate(r.createdAt)?.getTime() ?? 0;
      if (fromMs && ms < fromMs) return false;
      if (toMs && ms > toMs) return false;
      if (!needle) return true;
      return [r.ref, r.customerName, r.email, r.phone, r.orderId, r.reviewText, r.businessName, r.adminResponse]
        .some((v) => (v || "").toLowerCase().includes(needle));
    });
    const ms = (r: Review) => reviewDate(r.createdAt)?.getTime() ?? 0;
    return out.sort((a, b) =>
      sort === "newest" ? ms(b) - ms(a)
      : sort === "oldest" ? ms(a) - ms(b)
      : sort === "highest" ? b.overallRating - a.overallRating || ms(b) - ms(a)
      : a.overallRating - b.overallRating || ms(b) - ms(a)
    );
  }, [reviews, q, rating, status, from, to, sort]);

  const filtered = q || rating || status || from || to;

  if (loading) return <Loading />;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="space-y-3 rounded-2xl border border-border bg-muted/40 p-3.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("rv.searchPh")} className={`${inputCls} pl-9`} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))} aria-label={t("rv.filterRating")} className={inputCls}>
            <option value={0}>{t("rv.allRatings")}</option>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as ReviewStatus | "")} aria-label={t("rv.filterStatus")} className={inputCls}>
            <option value="">{t("rv.allStatuses")}</option>
            {STATUSES.map((s) => <option key={s} value={s}>{t(`rv.status.${s}`)}</option>)}
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label={t("rv.dateFrom")} className={inputCls} />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label={t("rv.dateTo")} className={inputCls} />
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label={t("rv.sort")} className={inputCls}>
            <option value="newest">{t("rv.sortNewest")}</option>
            <option value="oldest">{t("rv.sortOldest")}</option>
            <option value="highest">{t("rv.sortHighest")}</option>
            <option value="lowest">{t("rv.sortLowest")}</option>
          </select>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> {t("rv.showing").replace("{n}", String(rows.length)).replace("{total}", String(reviews.length))}
          </span>
          {filtered && (
            <button
              onClick={() => { setQ(""); setRating(0); setStatus(""); setFrom(""); setTo(""); }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <Undo2 className="h-3.5 w-3.5" /> {t("rv.clearFilters")}
            </button>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <Empty text={reviews.length ? t("rv.noMatches") : t("rv.emptyAll")} />
      ) : (
        <ul className="space-y-2.5">
          {rows.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => onOpen(r)}
                className="flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-sm font-bold text-primary">
                  {r.anonymous || !r.customerName ? <UserRound className="h-5 w-5" /> : r.customerName.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold">
                      {r.anonymous ? t("revs.anonymous") : r.customerName || t("revs.aCustomer")}
                    </span>
                    <StatusBadge status={r.status} />
                    {r.featured && <Sparkles className="h-3.5 w-3.5 text-accent" aria-label={t("revs.featured")} />}
                    {!r.adminRead && <span className="h-2 w-2 rounded-full bg-secondary" aria-label={t("rv.unread")} />}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-2">
                    <Stars value={r.overallRating} size="sm" />
                    <span className="text-[11px] text-muted-foreground">{fmtDate(r.createdAt)}</span>
                    <code className="text-[10px] text-muted-foreground">{r.ref}</code>
                  </span>
                  <span className="mt-1.5 line-clamp-2 block text-sm text-foreground/75">{r.reviewText}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Analytics */

const RANGES = [
  { id: "today", days: 0 }, { id: "7d", days: 7 }, { id: "30d", days: 30 },
  { id: "3m", days: 90 }, { id: "6m", days: 180 }, { id: "year", days: 365 }, { id: "custom", days: -1 },
] as const;

function AnalyticsSection({ reviews, loading }: { reviews: Review[]; loading: boolean }) {
  const { t } = useI18n();
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("30d");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const scoped = useMemo(() => {
    if (range === "custom") {
      const a = from ? new Date(`${from}T00:00:00`).getTime() : 0;
      const b = to ? new Date(`${to}T23:59:59`).getTime() : Infinity;
      return reviews.filter((r) => { const ms = reviewDate(r.createdAt)?.getTime() ?? 0; return ms >= a && ms <= b; });
    }
    const days = RANGES.find((r) => r.id === range)!.days;
    // "Today" is from local midnight; every other preset is a rolling window.
    const start = days === 0 ? new Date(new Date().setHours(0, 0, 0, 0)).getTime() : Date.now() - days * 86_400_000;
    return reviews.filter((r) => (reviewDate(r.createdAt)?.getTime() ?? 0) >= start);
  }, [reviews, range, from, to]);

  const s = useMemo(() => summarize(scoped), [scoped]);
  const series = useMemo(() => monthlySeries(scoped, 12), [scoped]);
  const rated = s.total ? s.positive + s.negative + s.counts[3] : 0;
  // Growth: this range's volume against the immediately preceding window of equal length.
  const growth = useMemo(() => {
    const days = RANGES.find((r) => r.id === range)?.days ?? -1;
    if (days <= 0) return null;
    const now = Date.now(), span = days * 86_400_000;
    const prev = reviews.filter((r) => {
      const ms = reviewDate(r.createdAt)?.getTime() ?? 0;
      return ms >= now - span * 2 && ms < now - span;
    }).length;
    if (!prev) return null;
    return ((scoped.length - prev) / prev) * 100;
  }, [reviews, scoped, range]);

  if (loading) return <Loading />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            aria-pressed={range === r.id}
            className={`inline-flex min-h-9 items-center rounded-full border px-3.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              range === r.id ? "border-transparent bg-festive text-white shadow-soft" : "border-border bg-card text-foreground/70 hover:bg-muted"
            }`}
          >
            {t(`rv.range.${r.id}`)}
          </button>
        ))}
      </div>

      {range === "custom" && (
        <div className="grid gap-2 sm:grid-cols-2">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label={t("rv.dateFrom")} className={inputCls} />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label={t("rv.dateTo")} className={inputCls} />
        </div>
      )}

      {scoped.length === 0 ? (
        <Empty text={t("rv.noneInRange")} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label={t("rv.total")} value={s.total} tone="primary" icon={<MessageSquareQuote className="h-4 w-4" />} />
            <Stat label={t("rv.average")} value={s.average} decimals={1} tone="gold" icon={<Star className="h-4 w-4" />} />
            <Stat label={t("rv.positivePct")} value={rated ? (s.positive / rated) * 100 : 0} decimals={0} tone="teal" icon={<ThumbsUp className="h-4 w-4" />} />
            <Stat label={t("rv.negativePct")} value={rated ? (s.negative / rated) * 100 : 0} decimals={0} tone="orange" icon={<ThumbsDown className="h-4 w-4" />} />
          </div>

          {(growth != null || s.recommendRate != null) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {growth != null && (
                <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{t("rv.growth")}</div>
                  <div className={`mt-1 font-display text-2xl font-black tabular-nums ${growth >= 0 ? "text-teal" : "text-secondary"}`}>
                    {growth >= 0 ? "+" : ""}{growth.toFixed(0)}%
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t("rv.growthDesc")}</p>
                </div>
              )}
              {s.recommendRate != null && (
                <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{t("rv.recommendRate")}</div>
                  <div className="mt-1 font-display text-2xl font-black tabular-nums text-primary">{Math.round(s.recommendRate)}%</div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t("rv.recommendDesc")}</p>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title={t("rv.chartMonthly")}>
              <ChartContainer config={CHART_CONFIG} className="aspect-auto h-52 w-full">
                <BarChart data={series} margin={{ left: -20, right: 6, top: 6 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </Panel>

            <Panel title={t("rv.categoryPerf")}>
              <div className="flex h-52 flex-col justify-center gap-4">
                {s.categories.map((c) => (
                  <div key={c.key}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-semibold">{c.label}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {c.count ? `${c.average.toFixed(1)} / 5` : "—"}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-warm transition-[width] duration-500" style={{ width: `${(c.average / 5) * 100}%` }} />
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {t("rv.basedOnN").replace("{n}", String(c.count))}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------- QR code */

function QrSection() {
  const { t } = useI18n();
  const [base, setBase] = useState(SITE_URL);
  const [target, setTarget] = useState(AMCHO_BAZAR_EVENT_ID);
  const [stalls, setStalls] = useState<Stall[]>([]);

  // The base URL is remembered per browser so an admin on a staging domain doesn't
  // have to retype it every visit.
  useEffect(() => {
    setBase(localStorage.getItem(QR_BASE_KEY) || SITE_URL);
    getAllStalls()
      .then((list) => {
        // One entry per seller, even when they hold several category stalls.
        const seen = new Set<string>();
        setStalls(list.filter((s) => s.registrationId && !seen.has(s.registrationId) && seen.add(s.registrationId)));
      })
      .catch(() => {});
  }, []);

  function saveBase(v: string) {
    setBase(v);
    localStorage.setItem(QR_BASE_KEY, v);
  }

  const clean = base.trim().replace(/\/+$/, "");
  const url = target === AMCHO_BAZAR_EVENT_ID ? `${clean}/review` : `${clean}/review/${target}`;
  const stall = stalls.find((s) => s.registrationId === target);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("rv.qrSite")}</span>
          <input value={base} onChange={(e) => saveBase(e.target.value)} inputMode="url" className={inputCls} />
          <span className="mt-1 block text-[11px] text-muted-foreground">{t("rv.qrSiteHint")}</span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("rv.qrTarget")}</span>
          <select value={target} onChange={(e) => setTarget(e.target.value)} className={inputCls}>
            <option value={AMCHO_BAZAR_EVENT_ID}>{t("rv.qrWholeBazaar")}</option>
            {stalls.map((s) => <option key={s.registrationId} value={s.registrationId!}>{s.name} — {s.owner}</option>)}
          </select>
          <span className="mt-1 block text-[11px] text-muted-foreground">{t("rv.qrTargetHint")}</span>
        </label>
      </div>

      <QrCard
        url={url}
        title={t("rv.qrCardTitle")}
        caption={t("rv.qrCardCaption")}
        filename={stall ? `review-qr-${stall.name}`.replace(/[^a-z0-9-]+/gi, "-").toLowerCase() : "amcho-review-qr"}
      />
    </div>
  );
}

/* -------------------------------------------------------------- Notifications */

function NotificationsSection({ reviews, onOpen }: { reviews: Review[]; onOpen: (r: Review) => void }) {
  const { t } = useI18n();
  const unread = useMemo(() => reviews.filter((r) => !r.adminRead), [reviews]);
  const [busy, setBusy] = useState(false);

  async function markAll() {
    setBusy(true);
    try {
      await markReviewsRead(unread.map((r) => r.id!).filter(Boolean));
      toast.success(t("rv.allRead"));
    } catch (e) { toast.error(friendlyAuthError(e)); }
    finally { setBusy(false); }
  }

  async function markOne(r: Review) {
    try { await markReviewsRead([r.id!]); } catch { /* the badge simply stays until the next try */ }
  }

  if (!unread.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-12 text-center">
        <BellOff className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">{t("rv.noNotifications")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">{t("rv.unreadCount").replace("{n}", String(unread.length))}</span>
        <button
          onClick={markAll}
          disabled={busy}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-xs font-semibold text-primary transition-colors hover:bg-muted disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} {t("rv.markAllRead")}
        </button>
      </div>

      <ul className="space-y-2.5">
        {unread.map((r) => {
          const low = r.overallRating <= 2;
          const who = r.anonymous ? t("revs.anonymous") : r.customerName || t("revs.aCustomer");
          return (
            <li key={r.id} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${low ? "bg-secondary/15 text-secondary" : "bg-teal/15 text-teal"}`}>
                {low ? <ThumbsDown className="h-4 w-4" /> : <Star className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {(low ? t("rv.notifLow") : t("rv.notifNew"))
                    .replace("{n}", String(r.overallRating))
                    .replace("{name}", who)}
                </p>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{r.reviewText}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{fmtDateTime(r.createdAt)}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <button onClick={() => onOpen(r)} className="rounded-full bg-festive px-3 py-1.5 text-[11px] font-bold text-white shadow-soft">
                  {t("rv.open")}
                </button>
                <button onClick={() => markOne(r)} className="rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted">
                  {t("rv.markRead")}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------- Detail dialog */

function ReviewDetailDialog({
  review, onClose, onPatch, onDelete,
}: {
  review: Review | null;
  onClose: () => void;
  onPatch: (id: string, data: Partial<Review>, msg: string) => Promise<void>;
  onDelete: (r: Review) => void;
}) {
  const { t } = useI18n();
  const [response, setResponse] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const loadedFor = useRef<string | null>(null);

  // Reset the drafts when a different review is opened — but never while the admin
  // is mid-edit on the same one (the live listener re-renders on every keystroke's save).
  useEffect(() => {
    if (review && loadedFor.current !== review.id) {
      loadedFor.current = review.id ?? null;
      setResponse(review.adminResponse ?? "");
      setNotes(review.adminNotes ?? "");
    }
    if (!review) loadedFor.current = null;
  }, [review]);

  // Opening a review is the natural moment to clear its notification badge.
  useEffect(() => {
    if (review?.id && !review.adminRead) markReviewsRead([review.id]).catch(() => {});
  }, [review?.id, review?.adminRead]);

  if (!review) return null;
  const r = review;

  async function act(data: Partial<Review>, msg: string) {
    setBusy(true);
    await onPatch(r.id!, data, msg);
    setBusy(false);
  }

  const cats = ([
    ["rev.product", r.productRating],
    ["rev.staff", r.staffRating],
    ["rev.delivery", r.deliveryRating],
  ] as const).filter(([, v]) => !!v);

  const action = "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-bold transition-transform hover:scale-[1.03] disabled:opacity-50";

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 font-display text-lg">
            {r.anonymous ? t("revs.anonymous") : r.customerName || t("revs.aCustomer")}
            <StatusBadge status={r.status} />
            {r.featured && <Sparkles className="h-4 w-4 text-accent" />}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <Stars value={r.overallRating} size="md" />
            <span className="font-display text-lg font-black tabular-nums">{r.overallRating}/5</span>
            <code className="text-xs text-muted-foreground">{r.ref}</code>
          </div>

          {cats.length > 0 && (
            <dl className="grid gap-2 rounded-2xl bg-muted/50 p-3.5 sm:grid-cols-3">
              {cats.map(([key, val]) => (
                <div key={key}>
                  <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{t(key)}</dt>
                  <dd className="mt-0.5"><Stars value={val!} size="sm" /></dd>
                </div>
              ))}
            </dl>
          )}

          <p className="whitespace-pre-wrap rounded-2xl border border-border bg-card p-3.5 leading-relaxed">{r.reviewText}</p>

          {r.photoUrl && (
            <img src={normalizeImageUrl(r.photoUrl)} alt="" referrerPolicy="no-referrer" className="max-h-64 w-full rounded-2xl object-cover" />
          )}

          {(r.liked || r.improvement) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {r.liked && <Field label={t("rev.liked")} value={r.liked} />}
              {r.improvement && <Field label={t("rev.improve")} value={r.improvement} />}
            </div>
          )}

          <dl className="grid gap-x-4 gap-y-2 rounded-2xl bg-muted/50 p-3.5 sm:grid-cols-2">
            <Row label={t("rev.recommend")} value={typeof r.recommend === "boolean" ? (r.recommend ? t("common.yes") : t("common.no")) : "—"} />
            <Row label={t("rv.submitted")} value={fmtDateTime(r.createdAt)} />
            {r.businessName && <Row label={t("rv.business")} value={r.businessName} />}
            {r.orderId && <Row label={t("rev.orderId")} value={r.orderId} />}
            {r.email && <Row label={t("rev.email")} value={r.email} />}
            {r.phone && <Row label={t("rev.phone")} value={r.phone} />}
          </dl>

          {/* Public reply + private notes */}
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("rv.adminResponse")}</span>
              <textarea value={response} onChange={(e) => setResponse(e.target.value)} maxLength={MAX.response} placeholder={t("rv.adminResponsePh")} className={`min-h-20 ${inputCls}`} />
              <span className="mt-1 block text-[11px] text-muted-foreground">{t("rv.adminResponseHint")}</span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("rv.adminNotes")}</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={MAX.response} placeholder={t("rv.adminNotesPh")} className={`min-h-16 ${inputCls}`} />
              <span className="mt-1 block text-[11px] text-muted-foreground">{t("rv.adminNotesHint")}</span>
            </label>
            <button
              onClick={() => act({ adminResponse: response, adminNotes: notes }, t("rv.replySaved"))}
              disabled={busy}
              className={`${action} w-full bg-festive text-white shadow-soft`}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {t("rv.saveReply")}
            </button>
          </div>

          {/* Status actions */}
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <button onClick={() => act({ status: "approved" }, t("rv.approved"))} disabled={busy} className={`${action} bg-accent/25 text-accent-foreground`}>
              <CheckCircle2 className="h-3.5 w-3.5" /> {t("rv.approve")}
            </button>
            <button onClick={() => act({ status: "published" }, t("rv.published"))} disabled={busy} className={`${action} bg-teal/15 text-teal`}>
              <Send className="h-3.5 w-3.5" /> {t("rv.publish")}
            </button>
            <button onClick={() => act({ status: "hidden" }, t("rv.hidden"))} disabled={busy} className={`${action} bg-muted text-muted-foreground`}>
              <EyeOff className="h-3.5 w-3.5" /> {t("rv.hide")}
            </button>
            <button onClick={() => act({ status: "rejected" }, t("rv.rejected"))} disabled={busy} className={`${action} bg-destructive/12 text-destructive`}>
              <XCircle className="h-3.5 w-3.5" /> {t("rv.reject")}
            </button>
            <button onClick={() => act({ featured: !r.featured }, r.featured ? t("rv.unfeatured") : t("rv.featured"))} disabled={busy} className={`${action} bg-accent/20 text-accent-foreground`}>
              <Sparkles className="h-3.5 w-3.5" /> {r.featured ? t("rv.unfeature") : t("rv.feature")}
            </button>
            <button onClick={() => onDelete(r)} disabled={busy} className={`${action} ms-auto bg-destructive text-destructive-foreground`}>
              <Trash2 className="h-3.5 w-3.5" /> {t("rv.delete")}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="truncate text-sm">{value}</dd>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border p-3">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{value}</p>
    </div>
  );
}

function Loading() {
  return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">{text}</div>;
}
