import { useState, useEffect, type ReactNode } from "react";
import { ChevronDown, GitBranch, LogIn, Check, X, ShieldQuestion, Database, ArrowRight, Maximize2 } from "lucide-react";
import { AL_FAJR_LOGO } from "./presented-by";

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

const LEGEND: { c: string; label: string }[] = [
  { c: "bg-festive", label: "Start / step" },
  { c: "bg-accent", label: "Decision" },
  { c: "bg-primary/40", label: "Firebase call" },
  { c: "bg-emerald-400", label: "Success" },
  { c: "bg-rose-400", label: "Failure" },
];

function Wrapper({ title, route, note, badge, children }: { title: string; route: string; note: string; badge?: ReactNode; children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-border bg-card/80 p-6 shadow-card backdrop-blur-xl md:p-8">
      <img
        src={AL_FAJR_LOGO}
        alt=""
        referrerPolicy="no-referrer"
        className="pointer-events-none absolute left-1/2 top-1/2 w-[560px] max-w-[85%] -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.22]"
      />
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-festive text-white shadow-glow">
          <GitBranch className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl font-bold leading-tight md:text-2xl">{title}</h3>
          <code className="mt-0.5 inline-block rounded-md border border-secondary/30 bg-secondary/10 px-2 py-0.5 font-mono text-[11px] text-secondary">{route}</code>
        </div>
        {badge && (
          <span className="shrink-0 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-primary">{badge}</span>
        )}
      </div>
      <p className="relative mt-3 max-w-xl text-[13px] leading-relaxed text-muted-foreground">{note}</p>

      <div className="relative mt-4 flex flex-wrap gap-x-4 gap-y-1.5 rounded-2xl border border-border bg-muted/30 px-4 py-2.5">
        {LEGEND.map((l) => (
          <span key={l.label} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <span className={`h-2.5 w-2.5 rounded-full ${l.c}`} /> {l.label}
          </span>
        ))}
      </div>

      <div className="relative mt-7 flex flex-col items-center">{children}</div>
    </div>
  );
}

export function LoginFlow() {
  return (
    <Wrapper title="Sign-in flow" route="/login" note="Google, email + password, ya password reset. Success → Home; fail → toast, wahi rehte hain." badge="3 paths">
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

function Step({ n, title, sub, gate, state = "todo" }: { n: number; title: string; sub: ReactNode; gate: string; state?: "todo" | "active" | "done" }) {
  const box =
    state === "done" ? "border-emerald-300 bg-emerald-50/70"
    : state === "active" ? "border-primary ring-2 ring-primary/25 bg-primary/[0.06]"
    : "border-border bg-card opacity-70";
  const badge =
    state === "done" ? "bg-emerald-500 text-white"
    : state === "active" ? "bg-festive text-white animate-pulse-glow"
    : "bg-muted text-muted-foreground";
  return (
    <div className={`grid w-full max-w-[560px] grid-cols-[40px_1fr_auto] items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm transition-all duration-300 ${box}`}>
      <div className={`grid h-9 w-9 place-items-center rounded-full font-display text-sm font-bold shadow-soft ${badge}`}>{state === "done" ? <Check className="h-4 w-4" /> : n}</div>
      <div className="min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
      </div>
      <div className={`inline-flex items-center gap-1 whitespace-nowrap rounded-lg border px-2.5 py-1 text-[11px] font-bold ${state === "done" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : state === "active" ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-muted/50 text-muted-foreground"}`}>
        {state === "done" ? "done" : gate} {state !== "done" && <ArrowRight className="h-3 w-3" />}
      </div>
    </div>
  );
}

export function RegistrationFlow({ currentStep = -1 }: { currentStep?: number }) {
  // wizard step index → flow step: 0 Personal · 1 Business · 2 Category · 3 Review · 4 Submitted
  const st = (idx: number): "todo" | "active" | "done" =>
    currentStep < 0 ? "todo" : currentStep > idx ? "done" : currentStep === idx ? "active" : "todo";
  return (
    <Wrapper title="Seller registration flow" route="/register" note="Guarded 5-step wizard. Har step required field bharne pe next unlock; Review step Firestore mein save karta hai." badge={currentStep >= 0 ? `Step ${Math.min(currentStep + 1, 5)} of 5` : undefined}>
      <Node tone="decision" icon={<ShieldQuestion className="h-4 w-4" />}><Title>Signed in?</Title><Sub>route wrapped in <Fn>RequireAuth</Fn></Sub></Node>
      <Conn short />
      <div className="flex w-full max-w-[560px] flex-wrap justify-center gap-4">
        <Lane label="No" tone="no" basis="220px">
          <Outcome tone="err" title="Redirect to /login" sub="sign in, phir wapas" />
        </Lane>
        <Lane label="Yes" tone="yes" basis="220px">
          <Outcome tone="ok" title="Enter the wizard" sub="Step 1 se start" />
        </Lane>
      </div>
      <Conn />
      <div className="flex w-full flex-col items-center gap-2">
        <Step n={1} title="Personal details" sub="Full name * · Phone * · Email · City" gate="name + phone" state={st(0)} />
        <Conn short />
        <Step n={2} title="Business" sub="Business name * · tagline · years · Instagram · products" gate="business" state={st(1)} />
        <Conn short />
        <Step n={3} title="Category" sub="1+ category * · optional sub-category · live seller counts" gate="1+ chosen" state={st(2)} />
        <Conn short />
        <Step n={4} title="Review & submit" sub="Read-back + fee → createRegistration() → Firestore" gate="submit" state={st(3)} />
      </div>
      <Conn />
      <Node tone="action" icon={<Database className="h-4 w-4" />}><Title>Save registration</Title><Sub><Fn>createRegistration()</Fn> → Firestore</Sub></Node>
      <Conn short />
      <div className="flex w-full max-w-[560px] flex-wrap justify-center gap-4">
        <Lane label="Error" tone="no" basis="220px">
          <Outcome tone="err" title="Couldn’t submit" sub="toast · stay on Review" />
        </Lane>
        <Lane label="Saved" tone="yes" basis="220px">
          <Outcome tone="ok" title="🎉 Confetti + toast" sub="advance to Step 5" />
        </Lane>
      </div>
      <Conn />
      <Step n={5} title="You’re in — welcome!" sub="Success screen → My Registration or Home" gate="done" state={currentStep >= 4 ? "done" : "todo"} />
    </Wrapper>
  );
}
