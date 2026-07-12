import { useState, useEffect, type ReactNode } from "react";
import { GitBranch, Check, X, ShieldQuestion, Maximize2, Sparkles, User, Store, LayoutGrid, ClipboardCheck, Trophy, Chrome, Mail, KeyRound } from "lucide-react";

/* Lightweight, theme-matched flow charts for the auth screens.
   Opened in a modal popup from the Login and Register pages. */

// "View flow" button that opens the chart in a centered modal popup.
export function FlowModal({ label, buttonClassName, children }: { label: string; buttonClassName?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  const defaultBtn = "inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-primary shadow-soft transition-colors hover:bg-primary/5";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClassName ?? defaultBtn}>
        <span className="grid h-6 w-6 place-items-center rounded-lg bg-primary/10 text-primary"><GitBranch className="h-3.5 w-3.5" /></span>
        {label}
        <Maximize2 className="h-3.5 w-3.5 opacity-60" />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm md:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={label}
          onClick={() => setOpen(false)}
        >
          <div className="relative my-4 w-full max-w-4xl animate-rise-in md:my-8" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute -right-2 -top-2 z-10 grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-primary shadow-card transition-colors hover:bg-primary/5 md:-right-3 md:-top-3"
            >
              <X className="h-5 w-5" />
            </button>
            {children}
          </div>
        </div>
      )}
    </>
  );
}

function Outcome({ tone, title, sub }: { tone: "ok" | "err" | "muted"; title: ReactNode; sub?: ReactNode }) {
  const tones = {
    ok: "border-emerald-200 bg-emerald-50 text-emerald-700",
    err: "border-rose-200 bg-rose-50 text-rose-700",
    muted: "border-border bg-muted/50 text-muted-foreground",
  } as const;
  const Icon = tone === "ok" ? Check : tone === "err" ? X : ShieldQuestion;
  return (
    <div className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 ${tones[tone]}`}>
      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${tone === "ok" ? "bg-emerald-500/15" : tone === "err" ? "bg-rose-500/15" : "bg-foreground/10"}`}>
        <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
      <div className="min-w-0">
        <div className="text-[13px] font-bold leading-tight">{title}</div>
        {sub && <div className="mt-0.5 text-[11px] opacity-90">{sub}</div>}
      </div>
    </div>
  );
}

function Wrapper({ title, note, badge, children }: { title: string; note: string; badge?: ReactNode; children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-border bg-card p-6 shadow-card md:p-8">
      <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-accent/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-festive text-white shadow-glow">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl font-bold leading-tight md:text-2xl">{title}</h3>
        </div>
        {badge && (
          <span className="shrink-0 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-primary">{badge}</span>
        )}
      </div>
      <p className="relative mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{note}</p>
      <div className="relative mt-7 flex flex-col items-center">{children}</div>
    </div>
  );
}

// Plain key — the markers match the timeline dots so it's obvious what each means.
function StepLegend() {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-xs font-semibold text-foreground">
      <span className="inline-flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>
        Done
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-festive text-[10px] font-bold text-white shadow-glow">▶</span>
        In progress
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-full border border-border bg-muted text-[10px] font-bold text-muted-foreground">•</span>
        Incomplete
      </span>
    </div>
  );
}

// One sign-in method as a clear card: icon, numbered steps, and what happens next.
function MethodCard({ icon, title, steps, children }: { icon: ReactNode; title: string; steps: string[]; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-festive text-white">{icon}</span>
        <span className="font-display text-base font-bold leading-tight">{title}</span>
      </div>
      <ol className="space-y-1.5">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-2 text-[13px] leading-relaxed text-muted-foreground">
            <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
      <div className="mt-auto space-y-1.5 pt-1">{children}</div>
    </div>
  );
}

export function LoginFlow() {
  return (
    <Wrapper title="How signing in works" note="Pick one of three ways to sign in. If it works, you’re taken Home. If not, you stay on the page and see a friendly message telling you what to fix." badge="3 ways">
      <div className="grid w-full gap-4 sm:grid-cols-3">
        <MethodCard icon={<Chrome className="h-4 w-4" />} title="With Google" steps={["Tap “Continue with Google”.", "Choose your Google account."]}>
          <Outcome tone="ok" title="Signed in" sub="Taken to Home" />
          <Outcome tone="err" title="Didn’t work" sub="Stay and see a message" />
        </MethodCard>
        <MethodCard icon={<Mail className="h-4 w-4" />} title="Email & password" steps={["Type your email and password.", "Tap Sign in."]}>
          <Outcome tone="ok" title="Signed in" sub="Taken to Home" />
          <Outcome tone="err" title="Wrong email or password" sub="Try again" />
        </MethodCard>
        <MethodCard icon={<KeyRound className="h-4 w-4" />} title="Forgot password" steps={["Type your email in the box.", "Tap “Forgot password?”."]}>
          <Outcome tone="ok" title="Reset link sent" sub="Check your inbox" />
          <Outcome tone="muted" title="No email typed?" sub="You’ll be asked to add it first" />
        </MethodCard>
      </div>
      <p className="mt-5 text-center text-sm text-muted-foreground">New here? Tap <span className="font-semibold text-primary">Create account</span> to sign up.</p>
    </Wrapper>
  );
}

type StepState = "todo" | "active" | "done";

// One row of the registration timeline — a numbered dot on a connecting line.
function TimelineStep({ n, icon, title, sub, state, last }: { n: number; icon: ReactNode; title: string; sub: ReactNode; state: StepState; last?: boolean }) {
  const done = state === "done", active = state === "active";
  return (
    <li className={`relative flex gap-4 ${last ? "" : "pb-4"}`}>
      <span
        className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full font-display text-sm font-bold ring-4 ring-card transition-all ${
          done ? "bg-emerald-500 text-white" : active ? "bg-festive text-white shadow-glow" : "border border-border bg-muted text-muted-foreground"
        }`}
      >
        {done ? <Check className="h-5 w-5" strokeWidth={2.5} /> : n}
      </span>
      <div
        className={`flex-1 rounded-2xl border p-4 transition-all ${
          done ? "border-emerald-200 bg-emerald-50/60" : active ? "border-primary/40 bg-primary/[0.05] shadow-sm ring-2 ring-primary/15" : "border-border bg-card"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${done ? "bg-emerald-500/15 text-emerald-600" : active ? "bg-festive text-white" : "bg-primary/10 text-primary"}`}>
            {icon}
          </span>
          <span className="font-display text-base font-bold leading-tight">{title}</span>
          {active && <span className="ms-auto shrink-0 rounded-full bg-festive px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">In progress</span>}
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{sub}</p>
      </div>
    </li>
  );
}

export function RegistrationFlow({ currentStep = -1 }: { currentStep?: number }) {
  const steps: { icon: ReactNode; title: string; sub: ReactNode }[] = [
    { icon: <User className="h-4 w-4" />, title: "Your details", sub: "Tell us who you are. Your full name and phone number are required — we’ll contact you on this number. City and email are optional." },
    { icon: <Store className="h-4 w-4" />, title: "Your business", sub: "Your business name is required. Add how long you’ve been running and list what you sell (separate items with commas). A tagline, Instagram, and a logo are optional — the logo shows on your stall card." },
    { icon: <LayoutGrid className="h-4 w-4" />, title: "Choose categories", sub: "Pick every category that fits what you sell — you can choose more than one. Then choose one or more sub-categories under it (required); this helps us place your stall in the right corner." },
    { icon: <ClipboardCheck className="h-4 w-4" />, title: "Review & send", sub: "See all your details in one place, go back and fix anything, then tap Submit. There’s a registration fee, but you only pay it after you’re approved." },
    { icon: <Trophy className="h-4 w-4" />, title: "You’re on the waiting list! 🎉", sub: "Your registration is saved. Owners are chosen live in the draw ceremony — if your name is drawn you become a confirmed stall owner and get a stall, then you’re asked to pay the fee." },
  ];
  const stateFor = (i: number): StepState => {
    if (i === 4) return currentStep >= 4 ? "done" : "todo";
    if (currentStep < 0) return "todo";
    return currentStep > i ? "done" : currentStep === i ? "active" : "todo";
  };
  return (
    <Wrapper
      title="How to become a stall owner"
      note="Just 5 easy steps — a couple of minutes, and no account needed. Fill each step and tap Continue; you can only move on once the required fields (marked *) are filled."
      badge={currentStep >= 0 ? `Step ${Math.min(currentStep + 1, 5)} of 5` : undefined}
    >
      <div className="w-full max-w-[520px]">
        <StepLegend />
        <ol className="relative mt-3">
          {/* the line that links the numbered dots */}
          <span aria-hidden className="absolute bottom-6 left-5 top-6 w-0.5 -translate-x-1/2 bg-border" />
          {steps.map((s, i) => (
            <TimelineStep key={i} n={i + 1} icon={s.icon} title={s.title} sub={s.sub} state={stateFor(i)} last={i === steps.length - 1} />
          ))}
        </ol>
      </div>
    </Wrapper>
  );
}
