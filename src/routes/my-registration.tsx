import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock3, Download, Hourglass, Receipt, Sparkles, XCircle } from "lucide-react";
import { EVENT } from "@/lib/dummy-data";

export const Route = createFileRoute("/my-registration")({
  head: () => ({
    meta: [
      { title: "My Registration · Amcho Bazar" },
      { name: "description", content: "See your registration status, payment and assigned stall for Amcho Bazar Season 2." },
      { property: "og:title", content: "My Registration · Amcho Bazar" },
      { property: "og:description", content: "Track your seller registration status." },
    ],
  }),
  component: MyRegistration,
});

function MyRegistration() {
  // Dummy: user is Approved with stall assigned
  const status: "Pending" | "Approved" | "Rejected" | "Waiting List" = "Approved";
  const payment: "Unpaid" | "Paid" | "Refunded" = "Paid";
  const stall = 17;
  const info = {
    fullName: "Ayesha Sherif",
    phone: "+91 98800 12345",
    email: "ayesha@example.com",
    business: "Ayesha's Kitchen",
    category: "Food",
    products: "Bhatkali biryani, kheema samosa, date rolls",
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 md:px-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
          <Sparkles className="h-3 w-3" /> My Registration
        </div>
      </div>
      <h1 className="font-display text-4xl font-black md:text-5xl">
        Welcome, <span className="text-festive">Ayesha</span>.
      </h1>
      <p className="mt-2 text-muted-foreground">Here's everything about your Amcho Bazar Season 2 booking.</p>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <StatusCard label="Registration" tone={status === "Approved" ? "green" : status === "Pending" ? "gold" : status === "Waiting List" ? "orange" : "red"} value={status}
          icon={status === "Approved" ? <CheckCircle2 /> : status === "Pending" ? <Clock3 /> : status === "Waiting List" ? <Hourglass /> : <XCircle />} />
        <StatusCard label="Payment" tone={payment === "Paid" ? "green" : "gold"} value={payment} icon={<Receipt />} />
        <StatusCard label="Assigned Stall" tone="primary" value={`#${stall.toString().padStart(2, "0")}`} icon={<Sparkles />} />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[1.5fr_1fr]">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-card md:p-8">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Submitted information</div>
          <div className="mt-4 divide-y divide-border">
            {Object.entries(info).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-3 text-sm">
                <span className="capitalize text-muted-foreground">{k.replace(/([A-Z])/g, " $1")}</span>
                <span className="text-right font-medium">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Event details</div>
            <div className="mt-3 font-display text-lg font-semibold">{EVENT.dateLabel}</div>
            <div className="text-sm text-muted-foreground">{EVENT.venue}, {EVENT.city}</div>
          </div>
          <button className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-festive px-5 py-3 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.02]">
            <Download className="h-4 w-4" /> Download receipt
          </button>
          <Link to="/payment" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-white/70 px-5 py-3 text-sm font-semibold text-primary">
            View payment page
          </Link>
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