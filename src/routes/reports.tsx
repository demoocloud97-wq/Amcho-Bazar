import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, Users, Wallet, TrendingUp, Store, Clock3, Hourglass, CheckCircle2, Loader2, Download, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { RequireAdmin } from "@/components/site/require-admin";
import { useSeason } from "@/lib/season-context";
import { EVENT } from "@/lib/dummy-data";
import { getRegistrationsBySeasonId, type Registration } from "@/lib/db";
import { getPaymentsBySeasonId, type Payment } from "@/lib/payments-db";
import { getDrawResultsBySeasonId } from "@/lib/draw-results-db";
import { colorFor } from "@/lib/category-colors";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports & Analytics · Amcho Bazar" }] }),
  component: ReportsPage,
});

const rupee = (n: number) => `Rs ${n.toLocaleString("en-PK")}`;

function ReportsPage() {
  const { t } = useI18n();
  const { season, seasonId } = useSeason();
  const fee = season?.registrationFee ?? EVENT.registrationFee;
  const target = season && season.maximumSelectedStalls > 0 ? season.maximumSelectedStalls : EVENT.totalWinners;

  const [regs, setRegs] = useState<Registration[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [drawn, setDrawn] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    if (!seasonId) { setRegs([]); setPayments([]); setDrawn(0); setLoading(false); return; }
    setLoading(true);
    Promise.all([getRegistrationsBySeasonId(seasonId), getPaymentsBySeasonId(seasonId), getDrawResultsBySeasonId(seasonId)])
      .then(([r, p, d]) => { if (!alive) return; setRegs(r); setPayments(p); setDrawn(d.length); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [seasonId]);

  const m = useMemo(() => {
    const by = (s: string) => regs.filter((r) => r.status === s).length;
    const collected = payments.reduce((s, p) => s + p.amount, 0);
    const confirmed = regs.filter((r) => r.status === "approved" || r.status === "paid");
    const paidIds = new Set(payments.map((p) => p.registrationId));
    const outstanding = confirmed.filter((r) => !paidIds.has(r.id!)).length;
    // Payment method split (from the ledger).
    const methods = payments.reduce<Record<string, { count: number; sum: number }>>((acc, p) => {
      const k = acc[p.method] ?? (acc[p.method] = { count: 0, sum: 0 });
      k.count++; k.sum += p.amount;
      return acc;
    }, {});
    // Category split (every applicant, by primary category).
    const cats = regs.reduce<Record<string, number>>((acc, r) => {
      const k = r.category || "Others";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});
    const catRows = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    // Per-seller payment roster — every confirmed seller (approved/paid). Paid is the
    // LEDGER truth (a recorded payment), not the status field, so the counts match the
    // Revenue card exactly: paid = money received, approved = still owes the fee.
    const paidById = new Map(payments.map((p) => [p.registrationId, p.amount]));
    const roster = confirmed
      .map((r) => {
        const isPaid = paidById.has(r.id!);
        return { id: r.id!, seller: r.seller, business: r.business, category: r.category as string, isPaid, amount: paidById.get(r.id!) ?? 0 };
      })
      .sort((a, b) => Number(a.isPaid) - Number(b.isPaid) || a.business.localeCompare(b.business));
    const paidCount = roster.filter((r) => r.isPaid).length;
    return {
      total: regs.length, pending: by("pending"), waitlist: by("waitlist"),
      approved: confirmed.length - paidCount, paid: paidCount,
      collected, outstanding, expected: collected + outstanding * fee,
      methods, catRows, catMax: Math.max(1, ...catRows.map(([, n]) => n)), roster,
    };
  }, [regs, payments, fee]);

  // Export the whole report as one CSV — headline + status + revenue + method + category.
  function downloadCsv() {
    const esc = (v: unknown) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const row = (...c: unknown[]) => c.map(esc).join(",");
    const lines = [
      row("Section", "Metric", "Value"),
      row("Overview", "Season", season?.seasonName ?? ""),
      row("Overview", "Registrations", m.total),
      row("Overview", "Stalls filled", `${drawn}/${target}`),
      row("Revenue", "Collected", m.collected),
      row("Revenue", "Outstanding", m.outstanding * fee),
      row("Revenue", "Expected total", m.expected),
      row("Status", "On hold", m.pending),
      row("Status", "Waitlist", m.waitlist),
      row("Status", "Unpaid", m.approved),
      row("Status", "Paid", m.paid),
      ...Object.entries(m.methods).map(([k, v]) => row("By method", k, `${v.count} · ${v.sum}`)),
      ...m.catRows.map(([cat, n]) => row("By category", cat, n)),
      "",
      row("Owner", "Business", "Category", "Amount", "Payment"),
      ...m.roster.map((s) => row(s.seller, s.business, s.category, s.amount, s.isPaid ? "Paid" : "Unpaid")),
    ];
    const csv = "﻿" + lines.join("\n"); // BOM so Excel reads UTF-8
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `amcho-report-${season?.seasonName ?? "season"}.csv`.replace(/\s+/g, "-");
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <RequireAdmin>
      <div>
        <PageHeader eyebrow={t("reports.eyebrow")} title={t("reports.title")} subtitle={t("reports.subtitle")} />
        <section className="mx-auto max-w-7xl px-4 pb-24 pt-8 md:px-8 md:pt-12">
          {loading ? (
            <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={downloadCsv}
                  disabled={m.total === 0}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full bg-festive px-5 py-2 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.03] disabled:opacity-50"
                >
                  <Download className="h-4 w-4" /> {t("reports.export")}
                </button>
              </div>

              {/* Headline stats */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Stat icon={<Users className="h-5 w-5" />} label={t("reports.registrations")} value={`${m.total}`} tone="primary" />
                <Stat icon={<Wallet className="h-5 w-5" />} label={t("pay.collected")} value={rupee(m.collected)} tone="green" />
                <Stat icon={<TrendingUp className="h-5 w-5" />} label={t("pay.outstanding")} value={rupee(m.outstanding * fee)} tone="orange" />
                <Stat icon={<Store className="h-5 w-5" />} label={t("reports.stallsFilled")} value={`${drawn} / ${target}`} tone="gold" />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Registration funnel */}
                <Card title={t("reports.funnel")}>
                  <div className="grid grid-cols-2 gap-3">
                    <Pill icon={<Clock3 className="h-4 w-4" />} label={t("myreg.status.pending").split(" —")[0]} value={m.pending} tone="secondary" />
                    <Pill icon={<Hourglass className="h-4 w-4" />} label={t("myreg.status.waitlist")} value={m.waitlist} tone="orange" />
                    <Pill icon={<CheckCircle2 className="h-4 w-4" />} label={t("myreg.unpaid")} value={m.approved} tone="orange" />
                    <Pill icon={<Wallet className="h-4 w-4" />} label={t("myreg.paid")} value={m.paid} tone="green" />
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">{t("reports.funnelNote")}</p>
                </Card>

                {/* Revenue */}
                <Card title={t("reports.revenue")}>
                  <div className="space-y-3">
                    <BarRow label={t("pay.collected")} value={m.collected} max={Math.max(1, m.expected)} display={rupee(m.collected)} color="#22C55E" />
                    <BarRow label={t("pay.outstanding")} value={m.outstanding * fee} max={Math.max(1, m.expected)} display={rupee(m.outstanding * fee)} color="#F26B2A" />
                    <BarRow label={t("pay.expected")} value={m.expected} max={Math.max(1, m.expected)} display={rupee(m.expected)} color="#7A1E3D" />
                  </div>
                  {Object.keys(m.methods).length > 0 && (
                    <div className="mt-5 border-t border-border pt-4">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("reports.byMethod")}</div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(m.methods).map(([k, v]) => (
                          <span key={k} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/50 px-3 py-1 text-xs">
                            <span className="font-semibold capitalize">{t(`pay.method.${k}`)}</span>
                            <span className="text-muted-foreground tabular-nums">{v.count} · {rupee(v.sum)}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              {/* Category breakdown */}
              <Card title={t("reports.byCategory")}>
                {m.catRows.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">{t("reports.noData")}</p>
                ) : (
                  <div className="space-y-2.5">
                    {m.catRows.map(([cat, n]) => (
                      <BarRow key={cat} label={cat} value={n} max={m.catMax} display={`${n}`} color={colorFor(cat).bg} />
                    ))}
                  </div>
                )}
              </Card>

              {/* Per-seller payment roster */}
              <SellerRoster roster={m.roster} />
            </div>
          )}
        </section>
      </div>
    </RequireAdmin>
  );
}

type RosterRow = { id: string; seller: string; business: string; category: string; isPaid: boolean; amount: number };

const PAGE_SIZE = 10;

function SellerRoster({ roster }: { roster: RosterRow[] }) {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [page, setPage] = useState(0);
  const paidCount = roster.filter((r) => r.isPaid).length;
  const rows = roster
    .filter((r) => (filter === "all" ? true : filter === "paid" ? r.isPaid : !r.isPaid))
    .filter((r) => { const n = q.trim().toLowerCase(); return !n || `${r.business} ${r.seller} ${r.category}`.toLowerCase().includes(n); });
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const clamped = Math.min(page, pageCount - 1); // filter/search may shrink the list below the current page
  const paged = rows.slice(clamped * PAGE_SIZE, clamped * PAGE_SIZE + PAGE_SIZE);
  // Any filter/search change resets to the first page.
  useEffect(() => { setPage(0); }, [q, filter]);

  const tabs: { k: typeof filter; label: string; n: number }[] = [
    { k: "all", label: t("reports.all"), n: roster.length },
    { k: "paid", label: t("myreg.paid"), n: paidCount },
    { k: "unpaid", label: t("myreg.unpaid"), n: roster.length - paidCount },
  ];

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-bold">{t("reports.roster")}</h2>
        </div>
        <div className="ms-auto flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-border bg-background/50 p-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.k}
                onClick={() => setFilter(tab.k)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold tabular-nums transition-colors ${filter === tab.k ? "bg-festive text-white shadow-soft" : "text-muted-foreground hover:text-foreground"}`}
              >
                {tab.label} {tab.n}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("pay.searchPh")}
              aria-label={t("pay.searchPh")}
              className="min-h-10 w-full rounded-full border border-border bg-background py-2 ps-9 pe-3 text-sm outline-none ring-primary/20 focus:ring-2 sm:w-56"
            />
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{roster.length === 0 ? t("reports.noData") : t("pay.noMatch")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pe-3">{t("reports.colOwner")}</th>
                <th className="py-2 pe-3">{t("reports.colBusiness")}</th>
                <th className="hidden py-2 pe-3 sm:table-cell">{t("reports.colCategory")}</th>
                <th className="py-2 pe-3 text-right">{t("reports.colAmount")}</th>
                <th className="py-2 text-right">{t("reports.colStatus")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.map((r) => (
                <tr key={r.id}>
                  <td className="py-2.5 pe-3 font-medium">{r.seller}</td>
                  <td className="py-2.5 pe-3 text-muted-foreground">{r.business}</td>
                  <td className="hidden py-2.5 pe-3 sm:table-cell">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colorFor(r.category).bg }} /> {r.category}
                    </span>
                  </td>
                  <td className="py-2.5 pe-3 text-right tabular-nums">{r.amount ? rupee(r.amount) : "—"}</td>
                  <td className="py-2.5 text-right">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.isPaid ? "bg-teal/15 text-teal" : "bg-secondary/15 text-secondary"}`}>
                      {r.isPaid ? t("myreg.paid") : t("myreg.unpaid")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
          <span className="text-xs text-muted-foreground tabular-nums">
            {clamped * PAGE_SIZE + 1}–{Math.min(rows.length, clamped * PAGE_SIZE + PAGE_SIZE)} / {rows.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(clamped - 1)}
              disabled={clamped === 0}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors hover:bg-muted disabled:opacity-40"
              aria-label={t("reports.prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold tabular-nums">{clamped + 1} / {pageCount}</span>
            <button
              onClick={() => setPage(clamped + 1)}
              disabled={clamped >= pageCount - 1}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors hover:bg-muted disabled:opacity-40"
              aria-label={t("reports.next")}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h2 className="font-display text-lg font-bold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

const TONES = {
  primary: "bg-primary/10 text-primary",
  green: "bg-teal/15 text-teal",
  orange: "bg-secondary/15 text-secondary",
  gold: "bg-accent/25 text-primary",
  teal: "bg-teal/15 text-teal",
  secondary: "bg-secondary/15 text-secondary",
} as const;

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: keyof typeof TONES }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${TONES[tone]}`}>{icon}</span>
      </div>
      <div className="mt-3 font-display text-3xl font-black tabular-nums">{value}</div>
    </div>
  );
}

function Pill({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: keyof typeof TONES }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/50 p-3">
      <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}>{icon}</span>
      <div className="min-w-0">
        <div className="font-display text-xl font-black leading-none tabular-nums">{value}</div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function BarRow({ label, value, max, display, color }: { label: string; value: number; max: number; display: string; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
        <span className="truncate font-medium">{label}</span>
        <span className="shrink-0 font-semibold tabular-nums">{display}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
