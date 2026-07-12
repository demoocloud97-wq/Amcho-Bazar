import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, Download, Hourglass, LayoutGrid, Loader2, MonitorPlay, MoreVertical, Plus, Receipt, Sparkles, Store, Trash2, TrendingUp, Users, Wrench } from "lucide-react";
import { toast } from "sonner";
import { EVENT } from "@/lib/dummy-data";
import { AnimatedCounter } from "@/components/site/animated-counter";
import { ConfirmDialog } from "@/components/site/confirm-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getRegistrationsForAdmin, watchRegistrationsForAdmin, getRegistrationsBySeasonId, createRegistration, updateRegistration, deleteRegistration, type Registration } from "@/lib/db";
import { getCategories, fillDefaultSubcategories, type Category } from "@/lib/categories-db";
import { deleteStallForRegistration, materializeRegistrationStalls } from "@/lib/stalls-db";
import { seedApprovedRegistrations, clearSeededRegistrations } from "@/lib/seed-registrations";
import { getFillSubcatsEnabled } from "@/lib/settings-db";
import { useSeason } from "@/lib/season-context";
import { friendlyAuthError } from "@/lib/firebase-errors";
import { RequireAdmin } from "@/components/site/require-admin";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin · Amcho Bazar Command Centre" },
      { name: "description", content: "Overview of registrations, payments, categories and stalls for Amcho Bazar Season 3." },
      { property: "og:title", content: "Admin · Amcho Bazar" },
      { property: "og:description", content: "Season 3 operations dashboard." },
    ],
  }),
  component: () => (
    <RequireAdmin>
      <AdminPage />
    </RequireAdmin>
  ),
});

function AdminPage() {
  const { season, seasonId, seasons } = useSeason();
  const { t } = useI18n();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [cats, setCats] = useState<Category[]>([]);
  const [prevCount, setPrevCount] = useState<number | null>(null);
  useEffect(() => { getCategories().then(setCats).catch(() => {}); }, []);
  // Previous season's registration count — used for a real trend %, hidden if none.
  useEffect(() => {
    const prev = seasons.filter((s) => season && s.seasonNumber < season.seasonNumber).sort((a, b) => b.seasonNumber - a.seasonNumber)[0];
    if (!prev?.id) { setPrevCount(null); return; }
    getRegistrationsBySeasonId(prev.id).then((r) => setPrevCount(r.length)).catch(() => setPrevCount(null));
  }, [seasons, season?.seasonNumber]);

  // Manual refetch (used right after an admin action for instant feedback);
  // the live listener below also keeps this in sync, so no loading flash here.
  async function reload() {
    if (!seasonId) { setRegistrations([]); return; }
    try {
      setRegistrations(await getRegistrationsForAdmin(seasonId, season?.seasonNumber));
    } catch (e) {
      console.error("Failed to load registrations", e);
    }
  }

  // Live: every widget (metrics, category breakdown, table, activity) reflects the
  // selected season AND updates in real time as the live draw approves winners.
  useEffect(() => {
    if (!seasonId) { setRegistrations([]); setLoading(false); return; }
    setLoading(true);
    const unsub = watchRegistrationsForAdmin(seasonId, season?.seasonNumber, (regs) => { setRegistrations(regs); setLoading(false); });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seasonId, season?.seasonNumber]);

  // Approve / waitlist a request — always assign it to the season the admin is
  // viewing, so an approved seller shows up in that season everywhere (admin
  // list, draw pool, reports).
  async function setStatus(r: Registration, status: Registration["status"], opts?: { silent?: boolean }) {
    if (!seasonId) { toast.error(t("adm.selectFirst")); return; }
    try {
      await updateRegistration(r.id!, { status, seasonId, season: season?.seasonNumber });
      // Approved/paid sellers become a stall in their category's directory;
      // otherwise remove any stall that was materialised earlier.
      if (status === "approved" || status === "paid") {
        const { created } = await materializeRegistrationStalls(r, seasonId, season?.seasonNumber);
        if (!created) toast.message(t("adm.noCatYet"));
      } else {
        await deleteStallForRegistration(r.id!).catch(() => {});
      }
      if (opts?.silent) return;
      toast.success(`${t("adm.marked")} ${t(`myreg.status.${status}`)} ${t("adm.in")} ${season?.seasonName ?? ""}`);
      await reload();
    } catch (e) {
      if (opts?.silent) throw e;
      toast.error(friendlyAuthError(e));
    }
  }

  const [fillEnabled, setFillEnabled] = useState(false);
  useEffect(() => { getFillSubcatsEnabled().then(setFillEnabled).catch(() => {}); }, []);

  const [delTarget, setDelTarget] = useState<Registration | null>(null);
  async function removeRegistration() {
    if (!delTarget) return;
    try {
      await deleteRegistration(delTarget.id!);
      await deleteStallForRegistration(delTarget.id!).catch(() => {});
      toast.success(t("adm.regDeleted"));
      setDelTarget(null);
      await reload();
    } catch (e) {
      toast.error(friendlyAuthError(e));
    }
  }

  // Multi-select + bulk delete for the review table.
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [page, setPage] = useState(0);
  useEffect(() => { setSel(new Set()); setPage(0); }, [seasonId]);
  function toggleSel(id: string) {
    setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  async function bulkDelete() {
    const ids = [...sel];
    if (ids.length === 0) return;
    setBulkBusy(true);
    try {
      await Promise.all(ids.map(async (id) => { await deleteRegistration(id); await deleteStallForRegistration(id).catch(() => {}); }));
      toast.success(`${ids.length} ${t("adm.bulkDeleted")}`);
      setSel(new Set());
      setConfirmBulk(false);
      await reload();
    } catch (e) {
      toast.error(friendlyAuthError(e));
    } finally {
      setBulkBusy(false);
    }
  }
  // Apply a status (approve / waitlist …) to every selected seller at once.
  async function bulkStatus(status: Registration["status"]) {
    const regs = registrations.filter((r) => sel.has(r.id!));
    if (regs.length === 0) return;
    setBulkBusy(true);
    try {
      for (const r of regs) await setStatus(r, status, { silent: true });
      toast.success(`${regs.length} ${t("adm.marked")} ${t(`myreg.status.${status}`)}`);
      setSel(new Set());
      await reload();
    } catch (e) {
      toast.error(friendlyAuthError(e));
    } finally {
      setBulkBusy(false);
    }
  }

  const [fillingSubs, setFillingSubs] = useState(false);
  async function fillSubcategories() {
    setFillingSubs(true);
    try {
      const created = await fillDefaultSubcategories();
      toast.success(created ? `${created} ${t("cat.subsAdded")}` : t("cat.subsAllHave"));
    } catch (e) {
      toast.error(friendlyAuthError(e));
    } finally {
      setFillingSubs(false);
    }
  }

  const [addingTest, setAddingTest] = useState(false);
  async function addTestSeller() {
    if (!seasonId) { toast.error(t("adm.selectFirst")); return; }
    setAddingTest(true);
    try {
      const n = registrations.length + 1;
      await createRegistration({
        seasonId,
        season: season?.seasonNumber,
        seller: `Test Seller ${n}`,
        business: `Test Food Stall ${n}`,
        category: "Food",
        phone: "0000000000",
        products: ["Biryani", "Samosa"],
        status: "waitlist",
      });
      toast.success(t("adm.dummyAdded"));
      await reload();
    } catch (e) {
      toast.error(friendlyAuthError(e));
    } finally {
      setAddingTest(false);
    }
  }

  const [seeding, setSeeding] = useState(false);
  async function seedSellers() {
    if (!seasonId || season?.seasonNumber == null) { toast.error(t("adm.selectFirst")); return; }
    setSeeding(true);
    try {
      const n = await seedApprovedRegistrations(seasonId, season.seasonNumber, 48);
      toast.success(t("adm.seeded").replace("{n}", String(n)));
      await reload();
    } catch (e) {
      toast.error(friendlyAuthError(e));
    } finally {
      setSeeding(false);
    }
  }

  const [clearingDummy, setClearingDummy] = useState(false);
  const [confirmClearDummy, setConfirmClearDummy] = useState(false);
  async function clearDummy() {
    if (!seasonId) { toast.error(t("adm.selectFirst")); return; }
    setClearingDummy(true);
    try {
      const n = await clearSeededRegistrations(seasonId);
      setConfirmClearDummy(false);
      toast.success(t("adm.dummyCleared").replace("{n}", String(n)));
      await reload();
    } catch (e) {
      toast.error(friendlyAuthError(e));
    } finally {
      setClearingDummy(false);
    }
  }

  // Export every seller's full details for this season as a CSV (opens in Excel).
  function exportCsv() {
    if (registrations.length === 0) { toast.message(t("adm.noRegs")); return; }
    const cols = ["Seller", "Business", "Tagline", "Years", "Instagram", "City", "Category", "Sub-category", "Phone", "Email", "Products", "Status", "Season"];
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = registrations.map((r) => [
      r.seller, r.business, r.tagline ?? "", r.yearsRunning ?? "", r.instagram ?? "", r.city ?? "",
      r.categories?.length ? r.categories.join(" | ") : r.category, r.subcategories?.length ? r.subcategories.join(" | ") : (r.subcategory ?? ""),
      r.phone, r.email ?? "", (r.products ?? []).join(" | "), r.status, r.season ?? "",
    ].map(esc).join(","));
    const csv = "﻿" + [cols.join(","), ...rows].join("\n"); // BOM so Excel reads UTF-8
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `sellers-${(season?.seasonName ?? "season").replace(/\s+/g, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalRegistrations = registrations.length;
  const approved = registrations.filter((r) => r.status === "approved").length;
  const waitingList = registrations.filter((r) => r.status === "waitlist").length;
  const paid = registrations.filter((r) => r.status === "paid").length;

  // Live breakdown of drawn winners (approved/paid) per category — fills as the draw
  // approves sellers and empties on reset (winners revert to waitlist).
  const breakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of registrations) {
      if (r.status !== "approved" && r.status !== "paid") continue;
      const names = r.categories?.length ? r.categories : [r.category];
      for (const n of names) if (n) counts.set(n, (counts.get(n) ?? 0) + 1);
    }
    return cats
      .map((c) => ({ name: c.name, emoji: c.emoji, count: counts.get(c.name) ?? 0 }))
      .sort((a, b) => b.count - a.count);
  }, [registrations, cats]);

  const trendPct = prevCount && prevCount > 0 ? Math.round(((totalRegistrations - prevCount) / prevCount) * 100) : null;

  // Recent activity derived from real registrations (newest first), labelled by status.
  const activityPhrase: Record<Registration["status"], string> = {
    pending: t("adm.actSubmitted"),
    approved: t("adm.actApproved"),
    waitlist: t("adm.actWaitlisted"),
    paid: t("adm.actPayment"),
  };
  const activity = useMemo(() => {
    return registrations
      .map((r) => ({ r, ts: toDate(r.createdAt) }))
      .filter((x): x is { r: Registration; ts: Date } => x.ts != null)
      .sort((a, b) => b.ts.getTime() - a.ts.getTime())
      .slice(0, 6);
  }, [registrations]);

  const PAGE_SIZE = 12;
  const pageCount = Math.max(1, Math.ceil(registrations.length / PAGE_SIZE));
  const curPage = Math.min(page, pageCount - 1); // clamp when the list shrinks (e.g. after a bulk delete)
  useEffect(() => { if (page > pageCount - 1) setPage(pageCount - 1); }, [page, pageCount]);
  const shown = registrations.slice(curPage * PAGE_SIZE, curPage * PAGE_SIZE + PAGE_SIZE);
  // "Select all" grabs every seller in the season, not just the visible rows.
  const allSel = registrations.length > 0 && registrations.every((r) => sel.has(r.id!));
  function toggleAll() { setSel(allSel ? new Set() : new Set(registrations.map((r) => r.id!))); }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
            <Sparkles className="h-3 w-3" /> {t("adm.controlRoom")}
          </div>
          <h1 className="mt-3 font-display text-4xl font-black md:text-5xl">
            {season?.seasonName ?? "Amcho Bazar"} <span className="text-festive">{t("adm.commandCentre")}</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            {season ? `${t("adm.everythingIn")} ${season.seasonName}${season.isActive ? " " + t("adm.active") : ""}.` : t("adm.selectSeason")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Primary CTA */}
          <Link to="/draw" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-festive px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Sparkles className="h-4 w-4" /> {t("adm.openDraw")}
          </Link>
          {/* Secondary actions — unified style */}
          <Link to="/stalls" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <LayoutGrid className="h-4 w-4" /> {t("adm.stallDir")}
          </Link>
          {fillEnabled && (
            <button
              onClick={fillSubcategories}
              disabled={fillingSubs}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {fillingSubs ? <Loader2 className="h-4 w-4 animate-spin" /> : <LayoutGrid className="h-4 w-4" />} {t("cat.fill")}
            </button>
          )}
          {/* Data / dev tools — tucked into a menu so the header stays clean */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex min-h-11 items-center gap-2 rounded-full border border-dashed border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Wrench className="h-4 w-4" /> {t("adm.tools")}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <DropdownMenuItem onSelect={seedSellers} disabled={seeding} className="gap-2">
                {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />} {seeding ? t("adm.seeding") : t("adm.seedBtn")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={addTestSeller} disabled={addingTest} className="gap-2">
                {addingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {addingTest ? t("adm.adding") : t("adm.addTest")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setConfirmClearDummy(true)} disabled={clearingDummy} className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive">
                <Trash2 className="h-4 w-4" /> {t("adm.clearDummy")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Metric cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={<ClipboardList />} label={t("adm.mRegistrations")} value={totalRegistrations} tone="primary" />
        <Metric icon={<CheckCircle2 />} label={t("adm.mApproved")} value={approved} tone="teal" />
        <Metric icon={<Receipt />} label={t("adm.mPayments")} value={paid} tone="orange" />
        <Metric icon={<Users />} label={t("adm.mWaiting")} value={waitingList} tone="gold" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Analytics */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><BarChart3 className="h-4 w-4" /></span>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{t("adm.byCategory")}</div>
                <div className="font-display text-lg font-semibold leading-tight">{t("adm.liveBreakdown")}</div>
              </div>
            </div>
            {trendPct != null && (
              <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${trendPct >= 0 ? "bg-teal/15 text-teal" : "bg-destructive/15 text-destructive"}`}>
                <TrendingUp className={`h-3 w-3 ${trendPct < 0 ? "rotate-180" : ""}`} /> {trendPct >= 0 ? "+" : ""}{trendPct}%
              </span>
            )}
          </div>
          <BarChart data={breakdown} />
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            {breakdown.slice(0, 6).map((c) => (
              <div key={c.name} className="rounded-2xl bg-muted/50 p-3 ring-1 ring-transparent transition-colors hover:bg-muted hover:ring-border">
                <div className="text-2xl">{c.emoji}</div>
                <div className="mt-1 truncate text-xs font-semibold text-foreground">{c.name}</div>
                <div className="text-[11px] tabular-nums text-muted-foreground">{c.count} {t("adm.sellersWord")}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Activity className="h-4 w-4" /></span>
            <div className="font-display text-lg font-semibold">{t("adm.recentActivity")}</div>
          </div>
          {activity.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">{t("adm.noActivity")}</div>
          ) : (
            <ul className="space-y-4">
              {activity.map(({ r, ts }, i) => (
                <motion.li
                  key={r.id ?? i}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="flex items-start gap-3 text-sm"
                >
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-festive" />
                  <div className="flex-1">
                    <div><strong className="text-foreground">{r.seller}</strong> <span className="text-muted-foreground">{activityPhrase[r.status]}</span></div>
                    <div className="text-xs text-muted-foreground">{timeAgo(ts)}</div>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent registrations table */}
      <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><ClipboardList className="h-4 w-4" /></span>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{t("adm.recentRegs")}</div>
              <div className="font-display text-lg font-semibold leading-tight">{t("adm.readyReview")}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-muted/60 px-3 py-1 text-xs font-medium tabular-nums text-muted-foreground">
              {loading ? t("common.loading") : `${t("adm.showing")} ${registrations.length === 0 ? 0 : curPage * PAGE_SIZE + 1}–${Math.min((curPage + 1) * PAGE_SIZE, registrations.length)} ${t("adm.of")} ${registrations.length}`}
            </span>
            <button
              onClick={exportCsv}
              disabled={registrations.length === 0}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-muted disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" /> {t("adm.export")}
            </button>
          </div>
        </div>
        {/* Bulk action bar */}
        {sel.size > 0 && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-primary/25 bg-primary/5 px-4 py-2.5">
            <span className="text-sm font-semibold text-foreground">{sel.size} {t("adm.bulkSelected")}</span>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setSel(new Set())} className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted">{t("adm.bulkClear")}</button>
              <button disabled={bulkBusy} onClick={() => bulkStatus("waitlist")} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-1.5 text-xs font-bold text-white shadow-soft transition-transform hover:scale-[1.03] disabled:opacity-50">
                <Hourglass className="h-3.5 w-3.5" /> {t("adm.waitlist")}
              </button>
              <button disabled={bulkBusy} onClick={() => setConfirmBulk(true)} className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-4 py-1.5 text-xs font-bold text-white shadow-soft transition-transform hover:scale-[1.03] disabled:opacity-50">
                <Trash2 className="h-3.5 w-3.5" /> {t("adm.bulkDelete")} ({sel.size})
              </button>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="space-y-2 py-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-11 animate-pulse rounded-xl bg-muted/60" />
              ))}
            </div>
          ) : registrations.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-muted-foreground"><ClipboardList className="h-5 w-5" /></span>
              <p className="text-sm font-medium text-muted-foreground">{t("adm.noRegs")}</p>
            </div>
          ) : (
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="rounded-xl text-[11px] uppercase tracking-wider text-muted-foreground [&>th]:bg-muted/40 [&>th]:py-2.5 [&>th:first-child]:rounded-l-xl [&>th:last-child]:rounded-r-xl">
                  <th className="pl-3 pr-2 w-8">
                    <input type="checkbox" checked={allSel} onChange={toggleAll} aria-label={t("adm.bulkSelectAll")} className="h-4 w-4 cursor-pointer rounded border-border accent-[color:var(--color-primary)]" />
                  </th>
                  <th className="px-3">{t("adm.thSeller")}</th>
                  <th className="px-3">{t("adm.thBusiness")}</th>
                  <th className="px-3">{t("adm.thCategory")}</th>
                  <th className="px-3">{t("adm.thPhone")}</th>
                  <th className="px-3">{t("adm.thStatus")}</th>
                  <th className="px-3 text-right">{t("adm.thActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shown.map((r) => (
                  <tr key={r.id} className={`text-foreground/90 transition-colors ${sel.has(r.id!) ? "bg-primary/5" : "hover:bg-muted/40"}`}>
                    <td className="py-3.5 pl-3 pr-2 align-middle">
                      <input type="checkbox" checked={sel.has(r.id!)} onChange={() => toggleSel(r.id!)} aria-label={`Select ${r.seller}`} className="h-4 w-4 cursor-pointer rounded border-border accent-[color:var(--color-primary)]" />
                    </td>
                    <td className="px-3 py-3.5 align-middle">
                      <div className="flex items-center gap-2.5">
                        {r.logoUrl ? (
                          <img src={r.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-accent/40" />
                        ) : (
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-festive text-xs font-bold text-white ring-2 ring-accent/40">
                            {(r.seller || "?").charAt(0).toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-foreground">{r.seller}</span>
                            {!r.seasonId && <span className="rounded-full bg-secondary/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-secondary" title="No season yet">{t("adm.unassigned")}</span>}
                          </div>
                          {r.email && <div className="truncate text-xs text-muted-foreground">{r.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 align-middle">
                      <div className="font-medium text-foreground">{r.business}</div>
                      {r.tagline && <div className="max-w-[220px] truncate text-xs text-muted-foreground">{r.tagline}</div>}
                    </td>
                    <td className="px-3 py-3.5 align-middle">
                      <div className="flex flex-wrap gap-1">
                        {(r.categories?.length ? r.categories : [r.category]).map((c) => (
                          <span key={c} className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{c}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3.5 align-middle tabular-nums text-muted-foreground">{r.phone || "—"}</td>
                    <td className="px-3 py-3.5 align-middle">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                        r.status === "approved" || r.status === "paid" ? "bg-teal/15 text-teal" : r.status === "pending" ? "bg-accent/25 text-primary" : "bg-secondary/15 text-secondary"
                      }`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                        {t(`myreg.status.${r.status}`)}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 align-middle">
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              aria-label="Registration actions"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            {r.status !== "waitlist" && (
                              <DropdownMenuItem onSelect={() => setStatus(r, "waitlist")} className="gap-2">
                                <Hourglass className="h-4 w-4 text-secondary" /> {t("adm.waitlist")}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setDelTarget(r)} className="gap-2 text-destructive focus:text-destructive">
                              <Trash2 className="h-4 w-4" /> {t("adm.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {/* Pagination — only when the list spills past one page */}
        {!loading && pageCount > 1 && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={curPage === 0}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> {t("adm.prev")}
            </button>
            <span className="text-xs font-medium tabular-nums text-muted-foreground">{t("adm.page")} {curPage + 1} / {pageCount}</span>
            <button
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={curPage >= pageCount - 1}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("adm.next")} <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!delTarget}
        onOpenChange={(o) => !o && setDelTarget(null)}
        title={t("adm.deleteRegTitle")}
        description={delTarget ? t("adm.deleteRegDesc") : ""}
        confirmLabel={t("adm.delete")}
        onConfirm={removeRegistration}
      />

      <ConfirmDialog
        open={confirmBulk}
        onOpenChange={(o) => !o && !bulkBusy && setConfirmBulk(false)}
        title={t("adm.bulkDeleteTitle")}
        description={t("adm.bulkDeleteDesc").replace("{n}", String(sel.size))}
        confirmLabel={t("adm.bulkDelete")}
        onConfirm={bulkDelete}
      />

      <ConfirmDialog
        open={confirmClearDummy}
        onOpenChange={(o) => !o && !clearingDummy && setConfirmClearDummy(false)}
        title={t("adm.clearDummyTitle")}
        description={t("adm.clearDummyDesc")}
        confirmLabel={t("adm.clearDummy")}
        onConfirm={clearDummy}
      />
    </div>
  );
}

function Metric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "primary" | "teal" | "orange" | "gold" }) {
  const tones = {
    primary: { glow: "from-primary/20 to-primary/5 text-primary", bar: "bg-primary" },
    teal: { glow: "from-teal/25 to-teal/5 text-teal", bar: "bg-teal" },
    orange: { glow: "from-secondary/25 to-secondary/5 text-secondary", bar: "bg-secondary" },
    gold: { glow: "from-accent/40 to-accent/5 text-primary", bar: "bg-accent" },
  } as const;
  const tn = tones[tone];
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-glow">
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 opacity-80 ${tn.bar}`} />
      <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br opacity-70 blur-2xl transition-opacity group-hover:opacity-100 ${tn.glow}`} />
      <div className="relative flex items-center gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ring-1 ring-inset ring-white/30 ${tn.glow}`}>
          <div className="h-5 w-5">{icon}</div>
        </div>
        <div className="min-w-0">
          <div className="truncate text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="mt-0.5 font-display text-3xl font-black tabular-nums text-foreground">
            <AnimatedCounter value={value} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Firestore Timestamp | Date | null → Date. Runtime Date.now() is available here.
function toDate(ts: unknown): Date | null {
  if (!ts) return null;
  const any = ts as { toDate?: () => Date; seconds?: number };
  if (typeof any.toDate === "function") return any.toDate();
  if (typeof any.seconds === "number") return new Date(any.seconds * 1000);
  return null;
}

function timeAgo(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function BarChart({ data }: { data: { name: string; emoji: string; count: number }[] }) {
  const top = data.slice(0, 9);
  const max = Math.max(1, ...top.map((c) => c.count));
  if (top.every((c) => c.count === 0)) {
    return <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">—</div>;
  }
  return (
    <div className="flex h-56 items-end gap-2 md:gap-3">
      {top.map((c, i) => {
        const h = (c.count / max) * 100;
        return (
          <div key={c.name} className="group flex flex-1 flex-col items-center gap-2">
            <div className="relative flex h-full w-full items-end">
              <motion.div
                initial={{ height: 0 }}
                whileInView={{ height: `${Math.max(2, h)}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="w-full rounded-t-2xl bg-festive shadow-soft"
              />
              <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white opacity-0 shadow-soft transition-opacity group-hover:opacity-100">
                {c.count}
              </div>
            </div>
            <div className="w-full truncate text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{c.name}</div>
          </div>
        );
      })}
    </div>
  );
}