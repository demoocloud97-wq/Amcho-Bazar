import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import confetti from "canvas-confetti";
import { Check, CreditCard, Download, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { EVENT } from "@/lib/dummy-data";
import { useSeason } from "@/lib/season-context";

export const Route = createFileRoute("/payment")({
  head: () => ({
    meta: [
      { title: "Payment · Amcho Bazar" },
      { name: "description", content: "Complete your seller registration payment for Amcho Bazar Season 3." },
      { property: "og:title", content: "Payment · Amcho Bazar" },
      { property: "og:description", content: "Secure, simple payment for your stall." },
    ],
  }),
  component: PaymentPage,
});

function PaymentPage() {
  const { activeSeason } = useSeason();
  const fee = activeSeason?.registrationFee ?? EVENT.registrationFee;
  const [paid, setPaid] = useState(false);
  const [method, setMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [processing, setProcessing] = useState(false);

  function pay() {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setPaid(true);
      confetti({ particleCount: 180, spread: 100, origin: { y: 0.35 }, colors: ["#7A1E3D", "#F26B2A", "#FFC94A", "#1FA7A6"] });
    }, 1400);
  }

  const txn = "AMB2-" + (Date.now().toString(36).toUpperCase()).slice(-8);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 md:px-8">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
        <Sparkles className="h-3 w-3" /> Payment
      </div>
      <h1 className="font-display text-4xl font-black md:text-5xl">
        Complete your <span className="text-festive">registration.</span>
      </h1>
      <p className="mt-2 text-muted-foreground">A single, gentle payment secures your seat at Season 3.</p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[32px] border border-border bg-card p-6 shadow-card md:p-8">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Registration fee</div>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal/15 px-2 py-0.5 text-[11px] font-semibold text-teal">
              <ShieldCheck className="h-3 w-3" /> Refundable if rejected
            </span>
          </div>
          <div className="mt-2 font-display text-6xl font-black text-primary">Rs {fee.toLocaleString("en-PK")}</div>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <Row label="Stall + table + chair" v="Included" />
            <Row label="Décor & signage" v="Included" />
            <Row label="Community marketing" v="Included" />
            <Row label="Refreshments for seller" v="Included" />
          </div>

          {/* method */}
          <div className="mt-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Payment method</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {(["upi", "card", "netbanking"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${
                    method === m ? "border-transparent bg-festive text-white shadow-soft" : "border-border bg-white/70 hover:-translate-y-0.5"
                  }`}
                >
                  {m === "upi" && <Wallet className="h-4 w-4" />} {m === "card" && <CreditCard className="h-4 w-4" />} {m === "netbanking" && <ShieldCheck className="h-4 w-4" />}
                  <span className="capitalize">{m}</span>
                </button>
              ))}
            </div>
          </div>

          {!paid && (
            <button
              onClick={pay}
              disabled={processing}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-festive px-6 py-4 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.02] disabled:opacity-70"
            >
              {processing ? "Processing…" : `Pay Rs ${fee.toLocaleString("en-PK")} now`}
            </button>
          )}

          <AnimatePresence>
            {paid && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="mt-6 overflow-hidden rounded-3xl border border-teal/30 bg-teal/10 p-6"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-festive text-white shadow-glow">
                    <Check className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-display text-xl font-bold text-primary">Payment successful</div>
                    <div className="text-sm text-muted-foreground">Your seat at Season 3 is confirmed.</div>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 text-sm">
                  <Row label="Transaction ID" v={<span className="font-mono">{txn}</span>} />
                  <Row label="Amount" v={`Rs ${fee.toLocaleString("en-PK")}`} />
                  <Row label="Method" v={method.toUpperCase()} />
                  <Row label="Status" v={<span className="font-semibold text-teal">Paid</span>} />
                </div>
                <button className="mt-5 inline-flex items-center gap-2 rounded-full bg-festive px-4 py-2 text-sm font-semibold text-white">
                  <Download className="h-4 w-4" /> Download receipt
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Payment timeline</div>
            <ol className="mt-4 space-y-4">
              {[
                { t: "Registered", done: true },
                { t: "Approved by Nawait team", done: true },
                { t: paid ? "Payment received" : "Payment pending", done: paid },
                { t: "Stall assigned at draw", done: false },
              ].map((s, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${s.done ? "bg-festive text-white shadow-soft" : "border border-border bg-muted text-muted-foreground"}`}>
                    {s.done ? <Check className="h-3 w-3" /> : i + 1}
                  </div>
                  <span className={s.done ? "text-foreground" : "text-muted-foreground"}>{s.t}</span>
                </li>
              ))}
            </ol>
          </div>
          <Link to="/my-registration" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-white/70 px-4 py-3 text-sm font-semibold text-primary">
            Back to my registration
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, v }: { label: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}