import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import confetti from "canvas-confetti";
import { Check, Eye, EyeOff, Heart, Lock, Mail, Phone, Sparkles, User } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);

  const strength = scorePassword(password);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agree) return;
    setLoading(true);
    setTimeout(() => {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.4 },
        colors: ["#B23A48", "#F08A4B", "#E8C547", "#2A9D8F"],
      });
      setLoading(false);
      setTimeout(() => navigate({ to: "/register" }), 800);
    }, 900);
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
            <h2 className="mt-4 font-display text-3xl text-foreground">Join Amcho Bazar</h2>
            <p className="mt-1 text-sm text-muted-foreground">Create your account in seconds</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field icon={<User className="h-4 w-4" />} label="Full Name">
              <input required type="text" placeholder="Your beautiful name" className="input-festive" />
            </Field>
            <Field icon={<Mail className="h-4 w-4" />} label="Email">
              <input required type="email" placeholder="you@example.com" className="input-festive" />
            </Field>
            <Field icon={<Phone className="h-4 w-4" />} label="Phone Number">
              <input required type="tel" placeholder="+91 98xxxxxxxx" className="input-festive" />
            </Field>
            <Field icon={<Lock className="h-4 w-4" />} label="Password">
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
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
                I agree to the{" "}
                <span className="font-medium text-primary">Community Guidelines</span> and celebrate the Nawait sisterhood.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !agree}
              className="w-full rounded-full bg-festive px-5 py-3 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              {loading ? "Creating your account…" : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already part of the sisterhood?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign in
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
              <Sparkles className="h-3.5 w-3.5" /> Season 2 is Live
            </div>
            <h1 className="mt-6 font-display text-4xl leading-tight lg:text-5xl">
              A festival made <span className="italic">by women,</span> for women.
            </h1>
            <p className="mt-4 max-w-sm text-white/85">
              Create your Amcho Bazar account and step into a warm circle of entrepreneurs, artists, home chefs and dreamers.
            </p>
          </div>

          <ul className="mt-10 space-y-3">
            {[
              "Register as a seller in 5 warm steps",
              "Join the live stall draw ceremony",
              "Showcase your craft to the community",
              "Celebrate 2 days of joyful shopping",
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

function scorePassword(pw: string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["Too short", "Weak", "Okay", "Strong", "Excellent"];
  return { score, label: labels[score] };
}
