import { useEffect, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";

// Wraps pages that any signed-in user may see (but guests may not).
// Shows a loader while auth resolves, then redirects guests to /login.
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md rounded-3xl border border-border bg-card p-10 text-center shadow-card">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-festive text-white shadow-glow">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="mt-6 font-display text-2xl font-bold">{t("auth.guard.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("auth.guard.sub")}</p>
          <Link to="/login" className="mt-6 inline-flex rounded-full bg-festive px-6 py-2.5 text-sm font-semibold text-white shadow-soft">
            {t("auth.guard.cta")}
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
