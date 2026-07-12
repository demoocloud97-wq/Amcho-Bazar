import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Download, Hourglass, Loader2, Receipt, Sparkles, Store, XCircle } from "lucide-react";
import { EVENT } from "@/lib/dummy-data";
import { RequireAuth } from "@/components/site/require-auth";
import { useAuth } from "@/lib/auth-context";
import { getMyRegistrations, type Registration } from "@/lib/db";
import { getSeason, type Season } from "@/lib/seasons-db";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/my-registration")({
  head: () => ({
    meta: [
      { title: "My Registration · Amcho Bazar" },
      { name: "description", content: "See your registration status, payment and assigned stall for Amcho Bazar Season 3." },
      { property: "og:title", content: "My Registration · Amcho Bazar" },
      { property: "og:description", content: "Track your owner registration status." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <MyRegistration />
    </RequireAuth>
  ),
});

function MyRegistration() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [reg, setReg] = useState<Registration | null>(null);
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getMyRegistrations(user.uid)
      .then((list) => {
        // Show the most recent registration for this user.
        const sorted = [...list].sort((a, b) => {
          const ta = (a.createdAt as { seconds?: number })?.seconds ?? 0;
          const tb = (b.createdAt as { seconds?: number })?.seconds ?? 0;
          return tb - ta;
        });
        const latest = sorted[0] ?? null;
        setReg(latest);
        if (latest?.seasonId) getSeason(latest.seasonId).then(setSeason).catch(() => {});
      })
      .catch((e) => console.error("Failed to load registration", e))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Signed in but no registration yet.
  if (!reg) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md rounded-3xl border border-border bg-card p-10 text-center shadow-card">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-festive text-white shadow-glow">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="mt-6 font-display text-2xl font-bold">{t("myreg.noneTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("myreg.noneBody")}
          </p>
          <Link to="/register" className="mt-6 inline-flex rounded-full bg-festive px-6 py-2.5 text-sm font-semibold text-white shadow-soft">
            {t("menu.becomeSeller")}
          </Link>
        </div>
      </div>
    );
  }

  const status = reg.status; // pending | approved | waitlist | paid
  const isPaid = status === "paid";
  const firstName = (reg.seller || user?.displayName || "Sister").split(" ")[0];

  const info: Record<string, string> = {
    fullName: reg.seller,
    phone: reg.phone,
    email: reg.email || user?.email || "",
    business: reg.business,
    category: reg.category,
    products: reg.products.join(", "),
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 md:px-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
          <Sparkles className="h-3 w-3" /> {t("menu.myRegistration")}
        </div>
      </div>
      <h1 className="font-display text-4xl font-black md:text-5xl">
        {t("myreg.welcome")} <span className="text-festive">{firstName}</span>.
      </h1>
      <p className="mt-2 text-muted-foreground">{t("myreg.bookingPre")} {EVENT.name} {season?.seasonName ?? EVENT.season} {t("myreg.bookingPost")}</p>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <StatusCard
          label={t("myreg.card.reg")}
          tone={status === "approved" || status === "paid" ? "green" : status === "pending" ? "gold" : "orange"}
          value={t(`myreg.status.${status}`)}
          icon={status === "approved" || status === "paid" ? <CheckCircle2 /> : status === "pending" ? <Clock3 /> : <Hourglass />}
        />
        <StatusCard label={t("myreg.card.payment")} tone={isPaid ? "green" : "gold"} value={isPaid ? t("myreg.paid") : t("myreg.unpaid")} icon={<Receipt />} />
        <StatusCard
          label={t("myreg.card.stall")}
          tone="primary"
          value={reg.stall != null ? `#${reg.stall.toString().padStart(2, "0")}` : t("myreg.notYet")}
          icon={reg.stall != null ? <Sparkles /> : <Store />}
        />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[1.5fr_1fr]">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-card md:p-8">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t("myreg.submitted")}</div>
          <div className="mt-4 divide-y divide-border">
            {Object.entries(info).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-3 text-sm">
                <span className="text-muted-foreground">{t(`myreg.info.${k}`)}</span>
                <span className="text-right font-medium">{v || <span className="italic text-muted-foreground">—</span>}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t("myreg.eventDetails")}</div>
            <div className="mt-3 font-display text-lg font-semibold">{season?.eventDate || EVENT.dateLabel}</div>
            <div className="text-sm text-muted-foreground">{season?.venue || EVENT.venue}, {EVENT.city}</div>
          </div>
          {isPaid ? (
            <button className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-festive px-5 py-3 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.02]">
              <Download className="h-4 w-4" /> {t("myreg.downloadReceipt")}
            </button>
          ) : (
            <Link to="/payment" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-festive px-5 py-3 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.02]">
              <Receipt className="h-4 w-4" /> {t("myreg.payFee")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusCard({ label, value, tone, icon }: { label: string; value: string; tone: "green" | "gold" | "orange" | "red" | "primary"; icon: React.ReactNode }) {
  const tones = {
    green: "bg-teal/15 text-teal border-teal/30",
    gold: "bg-accent/25 text-primary border-accent/40",
    orange: "bg-secondary/15 text-secondary border-secondary/30",
    red: "bg-destructive/10 text-destructive border-destructive/30",
    primary: "bg-primary/10 text-primary border-primary/30",
  } as const;
  return (
    <div className={`rounded-3xl border p-6 shadow-card ${tones[tone]} bg-card`}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="h-5 w-5">{icon}</div>
      </div>
      <div className="mt-3 font-display text-3xl font-black">{value}</div>
    </div>
  );
}
