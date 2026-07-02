import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import confetti from "canvas-confetti";
import { ArrowLeft, ArrowRight, Check, PartyPopper, Sparkles } from "lucide-react";
import { CATEGORIES } from "@/lib/dummy-data";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Become a Seller · Amcho Bazar" },
      { name: "description", content: "Register in 5 warm steps to become a seller at Amcho Bazar Season 2 — the Nawait Community's women-only festival." },
      { property: "og:title", content: "Become a Seller · Amcho Bazar" },
      { property: "og:description", content: "Multi-step, joyful seller registration for women entrepreneurs." },
    ],
  }),
  component: RegisterPage,
});

const STEPS = ["Personal", "Business", "Category", "Review", "Submitted"];

function RegisterPage() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    fullName: "",
    phone: "",
    email: "",
    city: "Bhatkal",
    business: "",
    tagline: "",
    yearsRunning: "",
    instagram: "",
    products: "",
    category: "",
  });

  function update<K extends keyof typeof data>(k: K, v: string) {
    setData((d) => ({ ...d, [k]: v }));
  }

  function next() {
    if (step === 3) {
      confetti({ particleCount: 160, spread: 90, origin: { y: 0.4 }, colors: ["#7A1E3D", "#F26B2A", "#FFC94A", "#1FA7A6"] });
    }
    setStep((s) => Math.min(4, s + 1));
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  const canContinue =
    (step === 0 && data.fullName && data.phone) ||
    (step === 1 && data.business) ||
    (step === 2 && data.category) ||
    step === 3;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* soft festive backdrop */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[720px] -translate-x-1/2 rounded-full bg-warm opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute -left-32 top-40 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-96 h-64 w-64 rounded-full bg-accent/40 blur-3xl" />

      <section className="relative mx-auto max-w-3xl px-4 py-16 md:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
            <Sparkles className="h-3 w-3" /> Season 2 Seller Registration
          </div>
          <h1 className="mt-4 font-display text-4xl font-black md:text-6xl">
            Bring your <span className="text-festive">home business</span> to the bazaar.
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Five gentle steps. Save your seat at Nawait's warmest festival.
          </p>
        </div>

        {/* Progress */}
        <div className="mt-10">
          <div className="flex items-center justify-between">
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-1 items-center">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    i < step
                      ? "bg-festive text-white shadow-soft"
                      : i === step
                      ? "bg-primary text-white ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`mx-1 h-0.5 flex-1 rounded transition-colors ${i < step ? "bg-festive" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between text-[10px] font-semibold uppercase tracking-widest text-muted-foreground md:text-xs">
            {STEPS.map((s) => <span key={s} className="flex-1 text-center">{s}</span>)}
          </div>
        </div>

        {/* Card */}
        <div className="mt-8 rounded-[32px] border border-border bg-card p-6 shadow-card md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 0 && (
                <StepPersonal data={data} update={update} />
              )}
              {step === 1 && (
                <StepBusiness data={data} update={update} />
              )}
              {step === 2 && (
                <StepCategory data={data} update={update} />
              )}
              {step === 3 && <StepReview data={data} />}
              {step === 4 && <StepSubmitted />}
            </motion.div>
          </AnimatePresence>

          {step < 4 && (
            <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
              <button
                onClick={back}
                disabled={step === 0}
                className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary disabled:opacity-30"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={next}
                disabled={!canContinue}
                className="inline-flex items-center gap-2 rounded-full bg-festive px-6 py-3 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              >
                {step === 3 ? "Submit registration" : "Continue"} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted-foreground/80">{hint}</span>}
    </label>
  );
}

const inputCls = "w-full rounded-2xl border border-border bg-white/70 px-4 py-3 text-sm outline-none ring-primary/20 transition-all focus:ring-4";

function StepPersonal({ data, update }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Let's get to know you</h2>
        <p className="mt-1 text-sm text-muted-foreground">A few personal details so we can reach you on the day.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Full name">
          <input value={data.fullName} onChange={(e) => update("fullName", e.target.value)} className={inputCls} placeholder="Ayesha Sherif" />
        </Field>
        <Field label="Phone (WhatsApp)">
          <input value={data.phone} onChange={(e) => update("phone", e.target.value)} className={inputCls} placeholder="+91 98800 12345" />
        </Field>
        <Field label="Email">
          <input value={data.email} onChange={(e) => update("email", e.target.value)} className={inputCls} placeholder="ayesha@example.com" />
        </Field>
        <Field label="City">
          <input value={data.city} onChange={(e) => update("city", e.target.value)} className={inputCls} />
        </Field>
      </div>
    </div>
  );
}

function StepBusiness({ data, update }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Tell us about your business</h2>
        <p className="mt-1 text-sm text-muted-foreground">The name that will greet visitors at your stall.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Business name">
          <input value={data.business} onChange={(e) => update("business", e.target.value)} className={inputCls} placeholder="Ayesha's Kitchen" />
        </Field>
        <Field label="Tagline" hint="A one-line invitation to your world.">
          <input value={data.tagline} onChange={(e) => update("tagline", e.target.value)} className={inputCls} placeholder="Bhatkali biryani, made with love." />
        </Field>
        <Field label="Years running">
          <input value={data.yearsRunning} onChange={(e) => update("yearsRunning", e.target.value)} className={inputCls} placeholder="2 years" />
        </Field>
        <Field label="Instagram (optional)">
          <input value={data.instagram} onChange={(e) => update("instagram", e.target.value)} className={inputCls} placeholder="@ayeshas.kitchen" />
        </Field>
        <div className="md:col-span-2">
          <Field label="What will you sell?" hint="Comma-separated is perfect.">
            <textarea value={data.products} onChange={(e) => update("products", e.target.value)} className={`${inputCls} min-h-[100px]`} placeholder="Bhatkali biryani, kheema samosa, date rolls…" />
          </Field>
        </div>
      </div>
    </div>
  );
}

function StepCategory({ data, update }: any) {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold">Choose your category</h2>
      <p className="mt-1 text-sm text-muted-foreground">You can pick just one for the main stall.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {CATEGORIES.map((c) => {
          const active = data.category === c.key;
          return (
            <button
              key={c.key}
              onClick={() => update("category", c.key)}
              className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all ${
                active ? "border-transparent bg-festive text-white shadow-glow" : "border-border bg-white/70 hover:-translate-y-0.5 hover:shadow-soft"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-3xl">{c.emoji}</div>
                {active && <Check className="h-5 w-5" />}
              </div>
              <div className="mt-3 font-display text-lg font-semibold">{c.key}</div>
              <div className={`mt-1 text-xs ${active ? "text-white/80" : "text-muted-foreground"}`}>{c.sellers} sellers so far</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepReview({ data }: any) {
  const rows = [
    ["Name", data.fullName], ["Phone", data.phone], ["Email", data.email], ["City", data.city],
    ["Business", data.business], ["Tagline", data.tagline], ["Years", data.yearsRunning], ["Instagram", data.instagram],
    ["Products", data.products], ["Category", data.category],
  ];
  return (
    <div>
      <h2 className="font-display text-2xl font-bold">Review your registration</h2>
      <p className="mt-1 text-sm text-muted-foreground">Take a last look before submitting — you can edit anything.</p>
      <div className="mt-6 divide-y divide-border rounded-2xl border border-border">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
            <div className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{k}</div>
            <div className="flex-1 text-right font-medium text-foreground">{v || <span className="italic text-muted-foreground">Not provided</span>}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl bg-accent/20 p-4 text-sm text-primary">
        A ₹1,500 registration fee will be requested only after your registration is approved. Payment can be done from your dashboard.
      </div>
    </div>
  );
}

function StepSubmitted() {
  return (
    <div className="py-6 text-center">
      <motion.div
        initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-festive text-white shadow-glow"
      >
        <PartyPopper className="h-10 w-10" />
      </motion.div>
      <h2 className="mt-6 font-display text-3xl font-bold md:text-4xl">
        You're on the list! <span className="text-festive">Welcome, sister.</span>
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
        We've received your details. You'll hear from the Nawait team on WhatsApp within 48 hours, and your stall will be revealed at the live draw ceremony.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/my-registration" className="inline-flex items-center gap-2 rounded-full bg-festive px-6 py-3 text-sm font-semibold text-white shadow-soft">
          Go to my registration <ArrowRight className="h-4 w-4" />
        </Link>
        <Link to="/draw" className="inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-6 py-3 text-sm font-semibold text-primary">
          Watch the draw
        </Link>
      </div>
    </div>
  );
}