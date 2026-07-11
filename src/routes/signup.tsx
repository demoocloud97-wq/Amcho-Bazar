import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { Check, Eye, EyeOff, Heart, Lock, Mail, MapPin, Phone, Sparkles, User } from "lucide-react";
import { signUpWithEmail } from "@/lib/auth";
import { saveUserProfile } from "@/lib/profile-db";
import { friendlyAuthError } from "@/lib/firebase-errors";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create Account · Amcho Bazar" },
      { name: "description", content: "Join Amcho Bazar — create your Nawait Community account to register as a seller or explore the festival." },
      { property: "og:title", content: "Create Account · Amcho Bazar" },
      { property: "og:description", content: "Join the women-only community festival by the Nawait Community." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);

  const strength = scorePassword(password, t);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agree) return;
    setLoading(true);
    try {
      const user = await signUpWithEmail(email, password, fullName);
      // Persist name/phone/city so the seller registration can pre-fill them.
      await saveUserProfile(user.uid, { fullName, phone, city, email }).catch(() => {});
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.4 },
        colors: ["#7A1E3D", "#F26B2A", "#FFC94A", "#1FA7A6"],
      });
      toast.success(t("signup.toast"));
      setTimeout(() => navigate({ to: "/" }), 800);
    } catch (err) {
      toast.error(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -left-20 top-40 h-80 w-80 rounded-full bg-secondary/25 blur-3xl" />
        <div className="absolute bottom-0 right-1/3 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-2 md:px-8 md:py-16">
        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass order-2 mx-auto w-full max-w-md rounded-3xl border border-border/60 p-8 shadow-soft md:order-1"
        >
          <div className="text-center">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-festive text-white shadow-glow">
              <Heart className="h-5 w-5" />
            </div>
            <h2 className="mt-4 font-display text-3xl text-foreground">{t("signup.heading")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("signup.sub")}</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field icon={<User className="h-4 w-4" />} label={t("signup.fullName")}>
              <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your beautiful name" className="input-festive" />
            </Field>
            <Field icon={<Mail className="h-4 w-4" />} label={t("auth.email")}>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input-festive" />
            </Field>
            <Field icon={<Phone className="h-4 w-4" />} label={t("signup.phone")}>
              <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98xxxxxxxx" className="input-festive" />
            </Field>
            <Field icon={<MapPin className="h-4 w-4" />} label={t("signup.city")}>
              <input required type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Bhatkal" className="input-festive" />
            </Field>
            <Field icon={<Lock className="h-4 w-4" />} label={t("auth.password")}>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("signup.pwPlaceholder")}
                  className="input-festive pe-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 end-3 grid place-items-center text-muted-foreground"
                  aria-label="Toggle password"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          i < strength.score
                            ? strength.score <= 1
                              ? "bg-destructive"
                              : strength.score === 2
                              ? "bg-secondary"
                              : strength.score === 3
                              ? "bg-accent"
                              : "bg-primary"
                            : "bg-border"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{strength.label}</p>
                </div>
              )}
            </Field>

            <label className="flex cursor-pointer items-start gap-2 text-sm text-foreground/80">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border"
              />
              <span>
                {t("signup.agree1")}{" "}
                <span className="font-medium text-primary">{t("signup.guidelines")}</span> {t("signup.agree2")}
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !agree}
              className="w-full rounded-full bg-festive px-5 py-3 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              {loading ? t("signup.creating") : t("signup.create")}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("signup.already")}{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              {t("login.heading")}
            </Link>
          </p>
        </motion.div>

        {/* Story */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="order-1 hidden md:flex flex-col justify-between rounded-3xl border border-border/60 bg-festive p-10 text-white shadow-glow md:order-2"
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> {t("signup.badge")}
            </div>
            <h1 className="mt-6 font-display text-4xl leading-tight lg:text-5xl">
              {t("signup.storyTitle")} <span className="italic">{t("signup.byWomen")}</span> {t("signup.forWomen")}
            </h1>
            <p className="mt-4 max-w-sm text-white/85">
              {t("signup.storyBody")}
            </p>
          </div>

          <ul className="mt-10 space-y-3">
            {[
              t("signup.feat1"),
              t("signup.feat2"),
              t("signup.feat3"),
              t("signup.feat4"),
            ].map((f) => (
              <li key={f} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white/25">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm text-white/90">{f}</span>
              </li>
            ))}
          </ul>
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

function scorePassword(pw: string, t: (k: string) => string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = [t("signup.pw0"), t("signup.pw1"), t("signup.pw2"), t("signup.pw3"), t("signup.pw4")];
  return { score, label: labels[score] };
}
