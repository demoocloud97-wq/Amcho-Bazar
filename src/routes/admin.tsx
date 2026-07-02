import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Activity, CheckCircle2, ClipboardList, Hourglass, LayoutGrid, Receipt, Sparkles, Store, TrendingUp, Users } from "lucide-react";
import { ADMIN_ACTIVITY, CATEGORIES, EVENT, SELLERS } from "@/lib/dummy-data";
import { AnimatedCounter } from "@/components/site/animated-counter";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin · Amcho Bazar Command Centre" },
      { name: "description", content: "Overview of registrations, payments, categories and stalls for Amcho Bazar Season 2." },
      { property: "og:title", content: "Admin · Amcho Bazar" },
      { property: "og:description", content: "Season 2 operations dashboard." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const approved = 63;
  const pending = EVENT.registeredSellers - approved - 12;
  const waitingList = 12;
  const paid = 48;
  const remainingStalls = EVENT.totalStalls - 32;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
            <Sparkles className="h-3 w-3" /> Admin Control Room
          </div>
          <h1 className="mt-3 font-display text-4xl font-black md:text-5xl">
            Season 2 <span className="text-festive">command centre.</span>
          </h1>
          <p className="mt-1 text-muted-foreground">A quick view of everything happening behind the bazaar.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/draw" className="inline-flex items-center gap-2 rounded-full bg-festive px-4 py-2 text-sm font-semibold text-white shadow-soft">
            <Sparkles className="h-4 w-4" /> Open live draw
          </Link>
          <Link to="/stalls" className="inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-4 py-2 text-sm font-semibold text-primary">
            <LayoutGrid className="h-4 w-4" /> Stall directory
          </Link>
        </div>
      </div>

      {/* Metric cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Metric icon={<ClipboardList />} label="Registrations" value={EVENT.registeredSellers} tone="primary" />
        <Metric icon={<CheckCircle2 />} label="Approved sellers" value={approved} tone="teal" />
        <Metric icon={<Receipt />} label="Payments received" value={paid} tone="orange" />
        <Metric icon={<Users />} label="Waiting list" value={waitingList} tone="gold" />
        <Metric icon={<Store />} label="Remaining stalls" value={remainingStalls} tone="primary" />
        <Metric icon={<Hourglass />} label="Pending review" value={pending} tone="orange" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Analytics */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Registrations by category</div>
              <div className="mt-1 font-display text-xl font-semibold">Live breakdown</div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal/15 px-2 py-0.5 text-[11px] font-semibold text-teal">
              <TrendingUp className="h-3 w-3" /> +18% vs Season 1
            </span>
          </div>
          <BarChart />
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            {CATEGORIES.slice(0, 6).map((c) => (
              <div key={c.key} className="rounded-2xl bg-muted/60 p-3">
                <div className="text-2xl">{c.emoji}</div>
                <div className="mt-1 text-xs font-semibold text-foreground">{c.key}</div>
                <div className="text-[11px] text-muted-foreground">{c.sellers} sellers</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <div className="font-display text-xl font-semibold">Recent activity</div>
          </div>
          <ul className="space-y-4">
            {ADMIN_ACTIVITY.map((a, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex items-start gap-3 text-sm"
              >
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-festive" />
                <div className="flex-1">
                  <div><strong className="text-foreground">{a.who}</strong> <span className="text-muted-foreground">{a.what}</span></div>
                  <div className="text-xs text-muted-foreground">{a.time}</div>
                </div>
              </motion.li>
            ))}
          </ul>

          <div className="mt-6 grid grid-cols-2 gap-2">
            {["Approve batch", "Send WhatsApp", "Export CSV", "Trigger draw"].map((q) => (
              <button key={q} className="rounded-2xl border border-border bg-white/70 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/5">
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent registrations table */}
      <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recent registrations</div>
            <div className="mt-1 font-display text-xl font-semibold">Ready for review</div>
          </div>
          <span className="text-xs text-muted-foreground">Showing 8 of {EVENT.registeredSellers}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="pb-3">Seller</th>
                <th className="pb-3">Business</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {SELLERS.slice(0, 8).map((s, i) => {
                const status = ["Approved", "Pending", "Waiting", "Approved", "Approved", "Pending", "Waiting", "Approved"][i];
                const pay = ["Paid", "Unpaid", "—", "Paid", "Paid", "Unpaid", "—", "Paid"][i];
                return (
                  <tr key={s.id} className="text-foreground/90">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <img src={s.avatar} className="h-8 w-8 rounded-full object-cover ring-2 ring-accent/40" alt="" />
                        <span className="font-medium">{s.seller}</span>
                      </div>
                    </td>
                    <td className="py-3">{s.business}</td>
                    <td className="py-3"><span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{s.category}</span></td>
                    <td className="py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        status === "Approved" ? "bg-teal/15 text-teal" : status === "Pending" ? "bg-accent/25 text-primary" : "bg-secondary/15 text-secondary"
                      }`}>{status}</span>
                    </td>
                    <td className="py-3 text-right font-medium">{pay}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "primary" | "teal" | "orange" | "gold" }) {
  const tones = {
    primary: "from-primary/20 to-primary/5 text-primary",
    teal: "from-teal/25 to-teal/5 text-teal",
    orange: "from-secondary/25 to-secondary/5 text-secondary",
    gold: "from-accent/40 to-accent/5 text-primary",
  } as const;
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br opacity-70 blur-2xl ${tones[tone]}`} />
      <div className="relative flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${tones[tone]}`}>
          <div className="h-5 w-5">{icon}</div>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="mt-0.5 font-display text-3xl font-black text-foreground">
            <AnimatedCounter value={value} />
          </div>
        </div>
      </div>
    </div>
  );
}

function BarChart() {
  const max = Math.max(...CATEGORIES.map((c) => c.sellers));
  return (
    <div className="flex h-56 items-end gap-2 md:gap-3">
      {CATEGORIES.map((c, i) => {
        const h = (c.sellers / max) * 100;
        return (
          <div key={c.key} className="group flex flex-1 flex-col items-center gap-2">
            <div className="relative flex h-full w-full items-end">
              <motion.div
                initial={{ height: 0 }}
                whileInView={{ height: `${h}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="w-full rounded-t-2xl bg-festive shadow-soft"
              />
              <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white opacity-0 shadow-soft transition-opacity group-hover:opacity-100">
                {c.sellers}
              </div>
            </div>
            <div className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{c.key}</div>
          </div>
        );
      })}
    </div>
  );
}