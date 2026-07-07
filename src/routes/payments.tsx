import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Banknote, Loader2, Receipt, Trash2, Wallet, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { RequireAdmin } from "@/components/site/require-admin";
import { ConfirmDialog } from "@/components/site/confirm-dialog";
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

  const paidRegIds = useMemo(() => new Set(payments.map((p) => p.registrationId)), [payments]);
  // Confirmed sellers (approved/paid) who have no payment on record yet.
  const outstanding = useMemo(
    () => regs.filter((r) => (r.status === "approved" || r.status === "paid") && !paidRegIds.has(r.id!)),
    [regs, paidRegIds]
  );
  const collected = useMemo(() => payments.reduce((s, p) => s + p.amount, 0), [payments]);
  const expected = collected + outstanding.length * fee;

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

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {/* Awaiting payment */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">{t("pay.awaiting")}</h2>
                <span className="rounded-full bg-secondary/15 px-2.5 py-1 text-xs font-semibold text-secondary">{outstanding.length}</span>
              </div>
              {outstanding.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                  {t("pay.allPaid")}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {outstanding.map((r) => <OutstandingRow key={r.id} reg={r} fee={fee} onRecord={record} />)}
                </div>
              )}
            </div>

            {/* Ledger */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">{t("pay.ledger")}</h2>
                <span className="rounded-full bg-teal/15 px-2.5 py-1 text-xs font-semibold text-teal">{rupee(collected)}</span>
              </div>
              {payments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                  {t("pay.noPayments")}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {payments.map((p) => (
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

function OutstandingRow({ reg, fee, onRecord }: { reg: Registration; fee: number; onRecord: (r: Registration, amount: number, method: PaymentMethod) => Promise<void> }) {
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
