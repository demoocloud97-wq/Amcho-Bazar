import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, Phone, Sparkles } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In · Amcho Bazar" },
      { name: "description", content: "Welcome back to Amcho Bazar — sign in to manage your seller journey with the Nawait Community." },
      { property: "og:title", content: "Sign In · Amcho Bazar" },
      { property: "og:description", content: "Sign in to the women-only community festival platform." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate({ to: "/my-registration" });
    }, 900);
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Festive background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-20 top-40 h-80 w-80 rounded-full bg-secondary/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-2 md:px-8 md:py-16">
        {/* Story panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden md:flex flex-col justify-between rounded-3xl border border-border/60 bg-festive p-10 text-white shadow-glow"
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Nawait Community
            </div>
            <h1 className="mt-6 font-display text-4xl leading-tight lg:text-5xl">
              Welcome back, <span className="italic">Sister.</span>
            </h1>
            <p className="mt-4 max-w-sm text-white/85">
              Continue your Amcho Bazar journey — check stall status, manage your registration and get ready for the festival.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {[
              { k: "45", v: "Stalls Available" },
              { k: "120+", v: "Women Registered" },
              { k: "2 Days", v: "Of Celebration" },
            ].map((s) => (
              <div key={s.v} className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                <span className="text-sm text-white/80">{s.v}</span>
                <span className="font-display text-2xl">{s.k}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Form panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass mx-auto w-full max-w-md rounded-3xl border border-border/60 p-8 shadow-soft"
        >
          <div className="text-center">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-festive text-white shadow-glow">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="mt-4 font-display text-3xl text-foreground">Sign in</h2>
            <p className="mt-1 text-sm text-muted-foreground">Welcome back to Amcho Bazar</p>
          </div>

          {/* Mode toggle */}
          <div className="mt-6 grid grid-cols-2 gap-1 rounded-full border border-border/60 bg-white/60 p-1">
            {(["email", "phone"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  mode === m ? "bg-festive text-white shadow" : "text-foreground/70"
                }`}
              >
                {m === "email" ? "Email" : "Phone / OTP"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "email" ? (
              <>
                <Field icon={<Mail className="h-4 w-4" />} label="Email">
                  <input required type="email" placeholder="you@example.com" className="input-festive" />
                </Field>
                <Field icon={<Lock className="h-4 w-4" />} label="Password">
                  <div className="relative">
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="input-festive pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute inset-y-0 right-3 grid place-items-center text-muted-foreground"
                      aria-label="Toggle password"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>
              </>
            ) : (
              <>
                <Field icon={<Phone className="h-4 w-4" />} label="Phone Number">
                  <input required type="tel" placeholder="+91 98xxxxxxxx" className="input-festive" />
                </Field>
                <Field icon={<Lock className="h-4 w-4" />} label="OTP">
                  <input required type="text" inputMode="numeric" maxLength={6} placeholder="6-digit code" className="input-festive tracking-[0.5em]" />
                </Field>
              </>
            )}

            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 text-foreground/70">
                <input type="checkbox" className="h-4 w-4 rounded border-border" />
                Remember me
              </label>
              <button type="button" className="font-medium text-primary hover:underline">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-festive px-5 py-3 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.02] disabled:opacity-70"
            >
              {loading ? "Signing you in…" : mode === "email" ? "Sign in" : "Verify & Continue"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            or continue with
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="rounded-full border border-border bg-white/70 px-4 py-2 text-sm font-medium hover:bg-white">
              Google
            </button>
            <button type="button" className="rounded-full border border-border bg-white/70 px-4 py-2 text-sm font-medium hover:bg-white">
              WhatsApp
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to Amcho Bazar?{" "}
            <Link to="/signup" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground/70">
        <span className="text-primary">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}
