import { useState, useEffect, type ReactNode } from "react";
import { ChevronDown, GitBranch, LogIn, Check, X, ShieldQuestion, Maximize2, Sparkles, User, Store, LayoutGrid, ClipboardCheck, Trophy } from "lucide-react";

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

function Node({ children, tone = "step", icon, className = "" }: { children: ReactNode; tone?: "step" | "term" | "decision" | "action"; icon?: ReactNode; className?: string }) {
  const tones: Record<string, string> = {
    step: "border-border bg-card hover:border-primary/25",
    term: "border-transparent bg-festive text-white",
    decision: "border-accent/60 bg-gradient-to-br from-accent/25 to-accent/10",
    action: "border-primary/25 bg-gradient-to-br from-primary/[0.07] to-secondary/[0.05]",
  };
  return (
    <div className={`flex w-full max-w-[420px] items-center gap-3 rounded-2xl border px-4 py-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${tones[tone]} ${className}`}>
      {icon && (
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone === "term" ? "bg-white/20 text-white" : tone === "decision" ? "bg-accent/40 text-primary" : "bg-primary/10 text-primary"}`}>
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

const Title = ({ children }: { children: ReactNode }) => <div className="text-sm font-semibold leading-snug">{children}</div>;
const Sub = ({ children }: { children: ReactNode }) => <div className="mt-0.5 text-xs opacity-80">{children}</div>;
const Fn = ({ children }: { children: ReactNode }) => <code className="rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] font-medium text-primary">{children}</code>;

// Directional connector — a soft gradient line ending in a chevron.
const Conn = ({ short = false }: { short?: boolean }) => (
  <div className="flex flex-col items-center" aria-hidden>
    <div className={`w-px bg-gradient-to-b from-border to-primary/30 ${short ? "h-4" : "h-6"}`} />
    <ChevronDown className="-mt-2 h-3.5 w-3.5 text-primary/40" />
  </div>
);

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

const BLabel = ({ children, tone = "opt" }: { children: ReactNode; tone?: "opt" | "yes" | "no" }) => {
  const tones = {
    opt: "border-primary/25 bg-primary/5 text-primary",
    yes: "border-emerald-200 bg-emerald-50 text-emerald-700",
    no: "border-rose-200 bg-rose-50 text-rose-700",
  } as const;
  return <span className={`rounded-full border px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide ${tones[tone]}`}>{children}</span>;
};

// A visual swim-lane grouping one branch's path.
function Lane({ label, tone, basis = "240px", children }: { label: string; tone?: "opt" | "yes" | "no"; basis?: string; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-muted/20 p-3" style={{ flexBasis: basis }}>
      <BLabel tone={tone}>{label}</BLabel>
      {children}
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

// Plain "done / here / next" key — no technical jargon.
function StepLegend() {
  return (
    <div className="mb-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 rounded-2xl border border-border bg-muted/30 px-4 py-2.5 text-[11px] font-medium text-muted-foreground">
      <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Done</span>
      <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-festive" /> You are here</span>
      <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" /> Next</span>
    </div>
  );
}

export function LoginFlow() {
  return (
    <Wrapper title="How signing in works" note="Three ways to sign in: Google, email &amp; password, or reset a forgotten password. Success takes you Home; if it fails, you stay and see a message." badge="3 ways">
      <Node tone="term" icon={<LogIn className="h-4 w-4" />} className="max-w-[320px]"><Title>User opens Sign In</Title></Node>
      <Conn />
      <Node icon={<GitBranch className="h-4 w-4" />}><Title>Choose a method</Title><Sub>Google · Email &amp; password · Forgot password</Sub></Node>
      <Conn />
      <div className="flex w-full flex-wrap justify-center gap-4">
        <Lane label="Google">
          <Node tone="action"><Title>Continue with Google</Title><Sub><Fn>signInWithGoogle()</Fn></Sub></Node>
          <Conn short />
          <Outcome tone="ok" title="Welcome back" sub="toast + redirect Home" />
          <Conn short />
          <Outcome tone="err" title="Sign-in failed" sub="error toast · stay" />
        </Lane>
        <Lane label="Email + password">
          <Node><Title>Submit credentials</Title><Sub>email · password (required)</Sub></Node>
          <Conn short />
          <Node tone="action"><Title>Authenticate</Title><Sub><Fn>signInWithEmail()</Fn></Sub></Node>
          <Conn short />
          <Outcome tone="ok" title="Welcome back" sub="toast + redirect Home" />
          <Conn short />
          <Outcome tone="err" title="Wrong email / password" sub="error toast · stay" />
        </Lane>
        <Lane label="Forgot password">
          <Node tone="decision" icon={<ShieldQuestion className="h-4 w-4" />}><Title>Email field filled?</Title></Node>
          <Conn short />
          <Outcome tone="muted" title="Empty → “Enter your email”" sub="info toast · no email" />
          <Conn short />
          <Node tone="action"><Title>Send reset link</Title><Sub><Fn>resetPassword()</Fn></Sub></Node>
          <Conn short />
          <Outcome tone="ok" title="Reset email sent" sub="check inbox" />
        </Lane>
      </div>
      <Conn />
      <Node><Title>New here?</Title><Sub>“Create account” → <Fn>/signup</Fn></Sub></Node>
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
          {active && <span className="ms-auto shrink-0 rounded-full bg-festive px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">You are here</span>}
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
    { icon: <Trophy className="h-4 w-4" />, title: "You’re on the waiting list! 🎉", sub: "Your registration is saved. Sellers are chosen live in the draw ceremony — if your name is drawn you become a confirmed seller and get a stall, then you’re asked to pay the fee." },
  ];
  const stateFor = (i: number): StepState => {
    if (i === 4) return currentStep >= 4 ? "done" : "todo";
    if (currentStep < 0) return "todo";
    return currentStep > i ? "done" : currentStep === i ? "active" : "todo";
  };
  return (
    <Wrapper
      title="How to become a seller"
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
