import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Banknote, Loader2, Receipt, Search, ShieldCheck, Trash2, Wallet, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { RequireAdmin } from "@/components/site/require-admin";
import { ConfirmDialog } from "@/components/site/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSeason } from "@/lib/season-context";
import { EVENT } from "@/lib/dummy-data";
import { getRegistrationsBySeasonId, updateRegistration, type Registration } from "@/lib/db";
import { getPaymentsBySeasonId, createPayment, deletePayment, PAYMENT_METHODS, type Payment, type PaymentMethod } from "@/lib/payments-db";
import { friendlyAuthError } from "@/lib/firebase-errors";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/payments")({
  head: () => ({ meta: [{ title: "Payments · Amcho Bazar" }] }),
  component: () => (
    <RequireAdmin>
      <PaymentsPage />
    </RequireAdmin>
  ),
});

const rupee = (n: number) => `Rs ${n.toLocaleString("en-PK")}`;

function PaymentsPage() {
  const { season, seasonId } = useSeason();
  const { t } = useI18n();
  const fee = season?.registrationFee ?? EVENT.registrationFee;
  const [regs, setRegs] = useState<Registration[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [delTarget, setDelTarget] = useState<Payment | null>(null);

  async function load() {
    if (!seasonId) { setRegs([]); setPayments([]); setLoading(false); return; }
    setLoading(true);
    try {
      const [r, p] = await Promise.all([getRegistrationsBySeasonId(seasonId), getPaymentsBySeasonId(seasonId)]);
      setRegs(r);
      setPayments(p);
    } catch (e) {
      console.error(e);
      toast.error(friendlyAuthError(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [seasonId]);

  // On hold: fee paid at registration, proof not verified yet. Verifying moves
  // them to the waitlist — the live draw is still what approves anyone.
  const pending = useMemo(() => regs.filter((r) => r.status === "pending"), [regs]);
  const [proof, setProof] = useState<Registration | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<Registration | null>(null);

  async function verify(reg: Registration) {
    setVerifying(true);
    try {
      await updateRegistration(reg.id!, { status: "waitlist" });
      toast.success(`${reg.business} ${t("pay.verified")}`);
      setProof(null);
      await load();
    } catch (e) {
      toast.error(friendlyAuthError(e));
    } finally {
      setVerifying(false);
    }
  }
  async function reject() {
    if (!rejectTarget) return;
    setVerifying(true);
    try {
      await updateRegistration(rejectTarget.id!, { paymentProofUrl: "" });
      toast.success(`${rejectTarget.business} ${t("pay.rejected")}`);
      setRejectTarget(null);
      setProof(null);
      await load();
    } catch (e) {
      toast.error(friendlyAuthError(e));
    } finally {
      setVerifying(false);
    }
  }

  const paidRegIds = useMemo(() => new Set(payments.map((p) => p.registrationId)), [payments]);
  // Confirmed sellers (approved/paid) who have no payment on record yet.
  const outstanding = useMemo(
    () => regs.filter((r) => (r.status === "approved" || r.status === "paid") && !paidRegIds.has(r.id!)),
    [regs, paidRegIds]
  );
  const collected = useMemo(() => payments.reduce((s, p) => s + p.amount, 0), [payments]);
  const expected = collected + outstanding.length * fee;

  // Per-list search — filter Awaiting and Ledger independently by name/business (+ method).
  const [awaitQ, setAwaitQ] = useState("");
  const [ledgerQ, setLedgerQ] = useState("");
  const outstandingShown = useMemo(() => {
    const n = awaitQ.trim().toLowerCase();
    return n ? outstanding.filter((r) => `${r.business} ${r.seller} ${r.category}`.toLowerCase().includes(n)) : outstanding;
  }, [outstanding, awaitQ]);
  const paymentsShown = useMemo(() => {
    const n = ledgerQ.trim().toLowerCase();
    return n ? payments.filter((p) => `${p.business} ${p.seller} ${p.method}`.toLowerCase().includes(n)) : payments;
  }, [payments, ledgerQ]);

  async function record(reg: Registration, amount: number, method: PaymentMethod) {
    if (!seasonId) return;
    try {
      await createPayment({
        seasonId, registrationId: reg.id!, seller: reg.seller, business: reg.business,
        amount, method, at: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      });
      if (reg.status !== "paid") await updateRegistration(reg.id!, { status: "paid" });
      toast.success(`${t("pay.recorded")} ${reg.business}`);
      await load();
    } catch (e) {
      toast.error(friendlyAuthError(e));
    }
  }

  async function handleDelete() {
    if (!delTarget) return;
    try {
      await deletePayment(delTarget.id!);
      toast.success(t("pay.removed"));
      setDelTarget(null);
      await load();
    } catch (e) {
      toast.error(friendlyAuthError(e));
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow={t("pay.eyebrow")}
        title={t("pay.title")}
        subtitle={t("pay.subtitle").replace("{season}", season?.seasonName ?? "the season")}
      />

      <section className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard icon={<Wallet className="h-5 w-5" />} label={t("pay.collected")} value={rupee(collected)} tone="green" />
          <SummaryCard icon={<TrendingUp className="h-5 w-5" />} label={t("pay.outstanding")} value={rupee(outstanding.length * fee)} tone="orange" />
          <SummaryCard icon={<Banknote className="h-5 w-5" />} label={t("pay.expected")} value={rupee(expected)} tone="primary" />
          <SummaryCard icon={<Receipt className="h-5 w-5" />} label={t("pay.payments")} value={`${payments.length}`} tone="gold" />
        </div>

        {/* On hold — payment proof waiting for an admin to verify */}
        {!loading && pending.length > 0 && (
          <div className="mt-8 rounded-3xl border border-secondary/30 bg-secondary/5 p-6 shadow-card">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">{t("pay.verifyTitle")}</h2>
              <span className="rounded-full bg-secondary/15 px-2.5 py-1 text-xs font-semibold text-secondary">{pending.length}</span>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">{t("pay.verifySub")}</p>
            <ul className="space-y-2">
              {pending.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                  {r.paymentProofUrl ? (
                    <button type="button" onClick={() => setProof(r)} className="shrink-0">
                      <img src={r.paymentProofUrl} alt="" className="h-14 w-12 rounded-lg border border-border object-cover transition-transform hover:scale-105" />
                    </button>
                  ) : (
                    <span className="grid h-14 w-12 shrink-0 place-items-center rounded-lg border border-dashed border-border text-[10px] text-muted-foreground">{t("pay.noProof")}</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{r.business}</div>
                    <div className="truncate text-xs text-muted-foreground">{r.seller} · {r.phone}</div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => setProof(r)} disabled={!r.paymentProofUrl} className="rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-muted disabled:opacity-40">
                      {t("pay.viewProof")}
                    </button>
                    <button type="button" onClick={() => verify(r)} disabled={verifying} className="inline-flex items-center gap-1.5 rounded-full bg-festive px-4 py-1.5 text-xs font-bold text-white shadow-soft transition-transform hover:scale-[1.03] disabled:opacity-50">
                      <ShieldCheck className="h-3.5 w-3.5" /> {t("pay.verify")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {/* Awaiting payment */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-display text-lg font-bold">{t("pay.awaiting")}</h2>
                <CountPill n={outstandingShown.length} total={outstanding.length} tone="secondary" />
              </div>
              {outstanding.length > 0 && <SearchBox value={awaitQ} onChange={setAwaitQ} />}
              {outstanding.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                  {t("pay.allPaid")}
                </div>
              ) : outstandingShown.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                  {t("pay.noMatch")}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {outstandingShown.map((r) => <OutstandingRow key={r.id} reg={r} fee={fee} onRecord={record} onProof={setProof} />)}
                </div>
              )}
            </div>

            {/* Ledger */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-display text-lg font-bold">{t("pay.ledger")}</h2>
                <div className="flex shrink-0 items-center gap-2">
                  <CountPill n={paymentsShown.length} total={payments.length} tone="teal" />
                  <span className="rounded-full bg-teal/15 px-2.5 py-1 text-xs font-semibold text-teal tabular-nums">{rupee(collected)}</span>
                </div>
              </div>
              {payments.length > 0 && <SearchBox value={ledgerQ} onChange={setLedgerQ} />}
              {payments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                  {t("pay.noPayments")}
                </div>
              ) : paymentsShown.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                  {t("pay.noMatch")}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {paymentsShown.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-border bg-background/50 p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal/15 text-teal">
                        <Receipt className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold">{p.business}</div>
                        <div className="text-xs text-muted-foreground">{p.seller} · <span className="uppercase">{p.method}</span> · {p.at}</div>
                      </div>
                      <div className="shrink-0 font-display font-bold tabular-nums">{rupee(p.amount)}</div>
                      <button
                        onClick={() => setDelTarget(p)}
                        aria-label="Delete payment"
                        className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Proof viewer — see the screenshot full size, then verify or reject */}
      <Dialog open={!!proof} onOpenChange={(o) => !o && !verifying && setProof(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{proof?.business}</DialogTitle></DialogHeader>
          <p className="-mt-1 text-sm text-muted-foreground">{proof?.seller} · {proof?.phone}</p>
          {proof?.paymentProofUrl && (
            <a href={proof.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block">
              <img src={proof.paymentProofUrl} alt="" className="max-h-[55vh] w-full rounded-2xl border border-border object-contain" />
            </a>
          )}
          <div className="mt-4 flex justify-end gap-2">
            {proof?.status === "pending" ? (
              <>
                <button type="button" onClick={() => setRejectTarget(proof)} disabled={verifying} className="rounded-full border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50">
                  {t("pay.reject")}
                </button>
                <button type="button" onClick={() => proof && verify(proof)} disabled={verifying} className="inline-flex items-center gap-2 rounded-full bg-festive px-5 py-2 text-sm font-bold text-white shadow-soft disabled:opacity-50">
                  {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} {t("pay.verify")}
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setProof(null)} className="rounded-full border border-border px-5 py-2 text-sm font-semibold transition-colors hover:bg-muted">
                {t("pay.close")}
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!rejectTarget}
        onOpenChange={(o) => !o && !verifying && setRejectTarget(null)}
        title={t("pay.rejectTitle")}
        description={rejectTarget ? t("pay.rejectDesc").replace("{b}", rejectTarget.business) : ""}
        confirmLabel={t("pay.reject")}
        onConfirm={reject}
      />

      <ConfirmDialog
        open={!!delTarget}
        onOpenChange={(o) => !o && setDelTarget(null)}
        title={t("pay.deleteTitle")}
        description={delTarget ? t("pay.deleteDesc") : ""}
        confirmLabel={t("gallery.delete")}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// Count badge — shows "shown / total" while a filter is active, otherwise just the total.
function CountPill({ n, total, tone }: { n: number; total: number; tone: "secondary" | "teal" }) {
  const cls = tone === "teal" ? "bg-teal/15 text-teal" : "bg-secondary/15 text-secondary";
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${cls}`}>
      {n === total ? total : `${n} / ${total}`}
    </span>
  );
}

function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useI18n();
  return (
    <div className="relative mb-4">
      <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("pay.searchPh")}
        aria-label={t("pay.searchPh")}
        className="min-h-10 w-full rounded-full border border-border bg-background py-2 ps-9 pe-3 text-sm outline-none ring-primary/20 focus:ring-2"
      />
    </div>
  );
}

function OutstandingRow({ reg, fee, onRecord, onProof }: { reg: Registration; fee: number; onRecord: (r: Registration, amount: number, method: PaymentMethod) => Promise<void>; onProof: (r: Registration) => void }) {
  const { t } = useI18n();
  const [amount, setAmount] = useState(fee);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    await onRecord(reg, amount, method);
    setBusy(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-background/50 p-3">
      {reg.paymentProofUrl && (
        <button type="button" onClick={() => onProof(reg)} className="shrink-0" title={t("pay.viewProof")}>
          <img src={reg.paymentProofUrl} alt="" className="h-11 w-9 rounded-lg border border-border object-cover transition-transform hover:scale-105" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{reg.business}</div>
        <div className="truncate text-xs text-muted-foreground">{reg.seller} · {reg.category}</div>
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">Rs</span>
        <input
          type="number"
          min={0}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          aria-label="Amount"
          className="w-28 rounded-full border border-border bg-background py-2 ps-9 pe-2 text-sm outline-none ring-primary/20 focus:ring-2"
        />
      </div>
      <select
        value={method}
        onChange={(e) => setMethod(e.target.value as PaymentMethod)}
        aria-label="Payment method"
        className="rounded-full border border-border bg-background px-3 py-2 text-sm capitalize outline-none ring-primary/20 focus:ring-2"
      >
        {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{t(`pay.method.${m}`)}</option>)}
      </select>
      <button
        onClick={submit}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-full bg-festive px-4 py-2 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.02] disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />} {t("pay.record")}
      </button>
    </div>
  );
}

function SummaryCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "green" | "orange" | "primary" | "gold" }) {
  const tones = {
    green: "bg-teal/15 text-teal",
    orange: "bg-secondary/15 text-secondary",
    primary: "bg-primary/10 text-primary",
    gold: "bg-accent/25 text-primary",
  } as const;
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</span>
      </div>
      <div className="mt-3 font-display text-3xl font-black tabular-nums">{value}</div>
    </div>
  );
}
