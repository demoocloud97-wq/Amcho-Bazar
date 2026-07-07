import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, CheckCircle2, ClipboardList, HelpCircle, Hourglass, Image as ImageIcon, LayoutGrid, ListChecks, Loader2, MonitorPlay, MoreVertical, Plus, Receipt, SlidersHorizontal, Sparkles, Store, Trash2, TrendingUp, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import { EVENT } from "@/lib/dummy-data";
import { AnimatedCounter } from "@/components/site/animated-counter";
import { ConfirmDialog } from "@/components/site/confirm-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getRegistrationsForAdmin, getRegistrationsBySeasonId, createRegistration, updateRegistration, deleteRegistration, type Registration } from "@/lib/db";
import { getCategories, getSubCategories, fillDefaultSubcategories, type Category } from "@/lib/categories-db";
import { setStallForRegistration, deleteStallForRegistration } from "@/lib/stalls-db";
import { getHeroImage, setHeroImage, normalizeImageUrl, DEFAULT_HERO_IMAGE, getDrawNonStop, setDrawNonStop, getFillSubcatsEnabled, setFillSubcatsEnabled, getFaqs, saveFaqs, type Faq } from "@/lib/settings-db";
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

  async function reload() {
    if (!seasonId) { setRegistrations([]); setLoading(false); return; }
    setLoading(true);
    try {
      setRegistrations(await getRegistrationsForAdmin(seasonId));
    } catch (e) {
      console.error("Failed to load registrations", e);
    } finally {
      setLoading(false);
    }
  }

  // Every widget reflects the season selected in the global switcher.
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [seasonId]);

  // Approve / waitlist a request — always assign it to the season the admin is
  // viewing, so an approved seller shows up in that season everywhere (admin
  // list, draw pool, reports).
  async function setStatus(r: Registration, status: Registration["status"]) {
    if (!seasonId) { toast.error(t("adm.selectFirst")); return; }
    try {
      await updateRegistration(r.id!, { status, seasonId, season: season?.seasonNumber });
      // Approved/paid sellers become a stall in their category's directory;
      // otherwise remove any stall that was materialised earlier.
      if (status === "approved" || status === "paid") {
        // Resolve every chosen category to an id (fall back to name matching).
        let categoryIds = (r.categoryIds?.length ? r.categoryIds : (r.categoryId ? [r.categoryId] : [])).filter(Boolean);
        if (categoryIds.length === 0) {
          const cats = await getCategories();
          const names = r.categories?.length ? r.categories : [r.category];
          categoryIds = names.map((n) => cats.find((c) => (c.name || "").toLowerCase() === (n || "").toLowerCase())?.id).filter(Boolean) as string[];
        }
        if (categoryIds.length) {
          // The sub-category (if any) only applies to the category it belongs to.
          let subParent: string | undefined;
          if (r.subcategoryId) subParent = (await getSubCategories()).find((s) => s.id === r.subcategoryId)?.categoryId;
          await deleteStallForRegistration(r.id!); // clear stale category stalls first
          for (const cid of categoryIds) {
            await setStallForRegistration(r.id!, {
              name: r.business || r.seller,
              owner: r.seller,
              categoryId: cid,
              subcategoryId: subParent === cid ? r.subcategoryId! : null,
              status: "assigned",
              season: season?.seasonNumber,
              seasonId,
            });
          }
        } else {
          toast.message(t("adm.noCatYet"));
        }
      } else {
        await deleteStallForRegistration(r.id!).catch(() => {});
      }
      toast.success(`${t("adm.marked")} ${t(`myreg.status.${status}`)} ${t("adm.in")} ${season?.seasonName ?? ""}`);
      await reload();
    } catch (e) {
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
        status: "pending",
      });
      toast.success(t("adm.dummyAdded"));
      await reload();
    } catch (e) {
      toast.error(friendlyAuthError(e));
    } finally {
      setAddingTest(false);
    }
  }

  const totalRegistrations = registrations.length;
  const approved = registrations.filter((r) => r.status === "approved").length;
  const pending = registrations.filter((r) => r.status === "pending").length;
  const waitingList = registrations.filter((r) => r.status === "waitlist").length;
  const paid = registrations.filter((r) => r.status === "paid").length;
  const remainingStalls = (season?.maximumStalls ?? EVENT.totalStalls) - registrations.filter((r) => r.stall != null).length;

  // Real category breakdown from this season's registrations.
  const breakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of registrations) {
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
          {/* Dev utility — visually de-emphasised */}
          <button
            onClick={addTestSeller}
            disabled={addingTest}
            title={t("adm.addTest")}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-dashed border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {addingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {addingTest ? t("adm.adding") : t("adm.addTest")}
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Metric icon={<ClipboardList />} label={t("adm.mRegistrations")} value={totalRegistrations} tone="primary" />
        <Metric icon={<CheckCircle2 />} label={t("adm.mApproved")} value={approved} tone="teal" />
        <Metric icon={<Receipt />} label={t("adm.mPayments")} value={paid} tone="orange" />
        <Metric icon={<Users />} label={t("adm.mWaiting")} value={waitingList} tone="gold" />
        <Metric icon={<Store />} label={t("adm.mRemaining")} value={remainingStalls} tone="primary" />
        <Metric icon={<Hourglass />} label={t("adm.mPending")} value={pending} tone="orange" />
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

          <div className="mt-6 grid grid-cols-2 gap-2">
            {[t("adm.approveBatch"), t("adm.sendWhatsapp"), t("adm.exportCsv"), t("adm.triggerDraw")].map((q) => (
              <button key={q} disabled title={t("adm.comingSoon")} className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground opacity-70">
                {q} <span className="rounded-full bg-accent/30 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">{t("adm.soon")}</span>
              </button>
            ))}
          </div>
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
          <span className="rounded-full bg-muted/60 px-3 py-1 text-xs font-medium tabular-nums text-muted-foreground">
            {loading ? t("common.loading") : `${t("adm.showing")} ${Math.min(8, registrations.length)} ${t("adm.of")} ${registrations.length}`}
          </span>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="space-y-2 py-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-11 animate-pulse rounded-xl bg-muted/60" />
              ))}
            </div>
          ) : registrations.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {t("adm.noRegs")}
            </div>
          ) : (
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3">{t("adm.thSeller")}</th>
                  <th className="pb-3">{t("adm.thBusiness")}</th>
                  <th className="pb-3">{t("adm.thCategory")}</th>
                  <th className="pb-3">{t("adm.thPhone")}</th>
                  <th className="pb-3">{t("adm.thStatus")}</th>
                  <th className="pb-3 text-right">{t("adm.thActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {registrations.slice(0, 12).map((r) => (
                  <tr key={r.id} className="text-foreground/90 transition-colors hover:bg-muted/40">
                    <td className="py-3 pl-2">
                      <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-festive text-xs font-bold text-white ring-2 ring-accent/40">
                          {(r.seller || "?").charAt(0).toUpperCase()}
                        </span>
                        <span className="font-medium">{r.seller}</span>
                        {!r.seasonId && <span className="rounded-full bg-secondary/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-secondary" title="No season yet">{t("adm.unassigned")}</span>}
                      </div>
                    </td>
                    <td className="py-3">{r.business}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {(r.categories?.length ? r.categories : [r.category]).map((c) => (
                          <span key={c} className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{c}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 text-muted-foreground">{r.phone || "—"}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                        r.status === "approved" || r.status === "paid" ? "bg-teal/15 text-teal" : r.status === "pending" ? "bg-accent/25 text-primary" : "bg-secondary/15 text-secondary"
                      }`}>{t(`myreg.status.${r.status}`)}</span>
                    </td>
                    <td className="py-3">
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
                            {r.status !== "approved" && r.status !== "paid" && (
                              <DropdownMenuItem onSelect={() => setStatus(r, "approved")} className="gap-2">
                                <CheckCircle2 className="h-4 w-4 text-teal" /> {t("adm.approve")}
                              </DropdownMenuItem>
                            )}
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
      </div>

      {/* Settings — secondary controls, below the dashboard */}
      <div className="mt-12">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <h2 className="font-display text-xl font-semibold">{t("adm.settings")}</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{t("adm.settingsDesc")}</p>
        <div className="mt-4 space-y-4">
          <HeroImageEditor />
          <DrawNonStopToggle />
          <FillSubcatsToggle enabled={fillEnabled} onChange={setFillEnabled} />
          <FaqEditor />
        </div>
      </div>

      <ConfirmDialog
        open={!!delTarget}
        onOpenChange={(o) => !o && setDelTarget(null)}
        title={t("adm.deleteRegTitle")}
        description={delTarget ? t("adm.deleteRegDesc") : ""}
        confirmLabel={t("adm.delete")}
        onConfirm={removeRegistration}
      />
    </div>
  );
}

function FillSubcatsToggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  async function toggle() {
    const next = !enabled;
    setBusy(true);
    try {
      await setFillSubcatsEnabled(next);
      onChange(next);
      toast.success(next ? t("adm.fillOn") : t("adm.fillOff"));
    } catch (e) {
      toast.error(friendlyAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ListChecks className="h-5 w-5" />
        </div>
        <div>
          <div className="font-display text-lg font-semibold">{t("adm.fillTitle")}</div>
          <div className="text-sm text-muted-foreground">{t("adm.fillDesc")}</div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className={`text-sm font-semibold ${enabled ? "text-primary" : "text-muted-foreground"}`}>{enabled ? t("adm.enabled") : t("adm.disabled")}</span>
        <button
          onClick={toggle}
          disabled={busy}
          role="switch"
          aria-checked={enabled}
          aria-label="Toggle the Fill sub-categories button"
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${enabled ? "bg-festive" : "bg-muted"}`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      </div>
    </div>
  );
}

function HeroImageEditor() {
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
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ImageIcon className="h-5 w-5" />
        </div>
        <div>
          <div className="font-display text-lg font-semibold">{t("adm.heroTitle")}</div>
          <div className="text-sm text-muted-foreground">{t("adm.heroDesc")}</div>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
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
    </div>
  );
}

function DrawNonStopToggle() {
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

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <div className="font-display text-lg font-semibold">{t("adm.nonstopTitle")}</div>
          <div className="text-sm text-muted-foreground">{t("adm.nonstopDesc")}</div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className={`text-sm font-semibold ${on ? "text-primary" : "text-muted-foreground"}`}>{on ? t("adm.enabled") : t("adm.disabled")}</span>
        <button
          onClick={toggle}
          disabled={busy}
          role="switch"
          aria-checked={on}
          aria-label="Toggle Non-Stop button on the Live Draw screen"
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${on ? "bg-festive" : "bg-muted"}`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${on ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      </div>
    </div>
  );
}

function FaqEditor() {
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

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <HelpCircle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="font-display text-lg font-semibold">{t("adm.faqTitle")}</div>
          <div className="text-sm text-muted-foreground">{t("adm.faqDesc")}</div>
        </div>
      </div>

      {loaded && (
        <div className="mt-4 space-y-3">
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
      )}
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