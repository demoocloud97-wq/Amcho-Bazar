import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Lock, Mail, Sparkles } from "lucide-react";
import { signInWithEmail, signInWithGoogle, resetPassword } from "@/lib/auth";
import { PresentedBy } from "@/components/site/presented-by";
import { LoginFlow, FlowModal } from "@/components/site/auth-flow";
import { friendlyAuthError } from "@/lib/firebase-errors";
import { useI18n } from "@/lib/i18n";
import { useSeason } from "@/lib/season-context";
import { watchSignupEnabled } from "@/lib/settings-db";
import { EVENT } from "@/lib/dummy-data";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In · Amcho Bazar" },
      { name: "description", content: "Welcome back to Amcho Bazar — sign in to manage your stall-owner journey with the Nawait Community." },
      { property: "og:title", content: "Sign In · Amcho Bazar" },
      { property: "og:description", content: "Sign in to the women-only community festival platform." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { activeSeason } = useSeason();
  const [signupOn, setSignupOn] = useState(true); // hide "create account" when sign-up is off
  useEffect(() => watchSignupEnabled(setSignupOn), []);
  // Show the operationally-active season's details (falls back to static event data).
  const seasonLabel = activeSeason?.seasonName || EVENT.season;
  const seasonStalls = activeSeason?.maximumStalls || EVENT.totalStalls;
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      toast.success(t("auth.welcomeBack"));
      navigate({ to: "/" });
    } catch (err) {
      toast.error(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast.success(t("auth.welcomeBack"));
      navigate({ to: "/" });
    } catch (err) {
      toast.error(friendlyAuthError(err));
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleForgot() {
    if (!email.trim()) {
      toast.info(t("login.forgotEnter"));
      return;
    }
    try {
      await resetPassword(email.trim());
      toast.success(t("login.forgotSent"));
    } catch (err) {
      toast.error(friendlyAuthError(err));
    }
  }

  const busy = loading || googleLoading;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Festive background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-20 top-40 h-80 w-80 rounded-full bg-secondary/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 md:grid-cols-2 md:px-8 md:py-16">
        {/* Story panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden md:flex flex-col justify-between rounded-3xl border border-border/60 bg-festive p-10 text-white shadow-glow"
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> {EVENT.organizer}
            </div>
            <h1 className="mt-6 font-display text-4xl leading-tight lg:text-5xl">
              {t("login.storyTitle")} <span className="italic">{t("login.sister")}</span>
            </h1>
            <p className="mt-4 max-w-sm text-white/85">
              {t("login.storyBody")}
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {[
              { k: `${seasonStalls}`, v: t("login.statStalls") },
              { k: `${EVENT.registeredSellers}+`, v: t("login.statWomen") },
              { k: seasonLabel, v: t("login.statLive") },
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
            <h2 className="mt-4 font-display text-3xl text-foreground">{t("login.heading")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("login.sub")}</p>
          </div>

          {/* Google — primary social option */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy}
            className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-full border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-white/70 disabled:opacity-60"
          >
            {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
            {t("login.google")}
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            {t("login.orEmail")}
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field icon={<Mail className="h-4 w-4" />} label={t("auth.email")} htmlFor="login-email">
              <input
                id="login-email"
                name="email"
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-festive"
              />
            </Field>
            <Field icon={<Lock className="h-4 w-4" />} label={t("auth.password")} htmlFor="login-password">
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  required
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-festive pe-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 end-2 grid w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <div className="flex justify-end">
              <button type="button" onClick={handleForgot} className="text-sm font-medium text-primary hover:underline">
                {t("login.forgotQ")}
              </button>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-festive px-5 py-3 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? t("login.signingIn") : t("login.heading")}
            </button>
          </form>

          {signupOn && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t("login.new")}{" "}
              <Link to="/signup" className="font-semibold text-primary hover:underline">
                {t("login.create")}
              </Link>
            </p>
          )}

          <FlowModal
            label="View sign-in flow"
            buttonClassName="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-white/60 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
          >
            <LoginFlow />
          </FlowModal>
        </motion.div>
      </div>

      <PresentedBy className="-mt-8 pb-10" />
    </div>
  );
}

function Field({ icon, label, htmlFor, children }: { icon: React.ReactNode; label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground/70">
        <span className="text-primary">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  );
}
