import { useEffect, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Lock, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";

// Wraps admin-only pages. Shows a loader while auth resolves, redirects
// guests to /login, and blocks signed-in non-admins with an access screen.
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
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
      <CenterCard icon={<Lock className="h-8 w-8" />} title={t("auth.guard.title")}>
        <p className="mt-2 text-sm text-muted-foreground">{t("adminGuard.forAdmins")}</p>
        <Link to="/login" className="mt-6 inline-flex rounded-full bg-festive px-6 py-2.5 text-sm font-semibold text-white shadow-soft">
          {t("auth.guard.cta")}
        </Link>
      </CenterCard>
    );
  }

  if (!isAdmin) {
    return (
      <CenterCard icon={<ShieldAlert className="h-8 w-8" />} title={t("adminGuard.denied")}>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("adminGuard.deniedBody").replace("{email}", user.email || "")}
        </p>
        <Link to="/" className="mt-6 inline-flex rounded-full border border-border bg-white/70 px-6 py-2.5 text-sm font-semibold text-primary">
          {t("common.backHome")}
        </Link>
      </CenterCard>
    );
  }

  return <>{children}</>;
}

function CenterCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md rounded-3xl border border-border bg-card p-10 text-center shadow-card">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-festive text-white shadow-glow">
          {icon}
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold">{title}</h1>
        {children}
      </div>
    </div>
  );
}
