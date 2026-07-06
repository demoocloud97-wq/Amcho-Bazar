import { createFileRoute, Link } from "@tanstack/react-router";
import { LogOut, Mail, Shield, User } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/site/page-header";
import { RequireAuth } from "@/components/site/require-auth";
import { useAuth } from "@/lib/auth-context";
import { logout } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "My Profile · Amcho Bazar" }] }),
  component: () => (
    <RequireAuth>
      <ProfilePage />
    </RequireAuth>
  ),
});

function ProfilePage() {
  const { user, isAdmin } = useAuth();
  const { t } = useI18n();
  const name = user?.displayName || (user?.email ? user.email.split("@")[0] : "Sister");
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  async function handleLogout() {
    await logout();
    toast.success(t("profile.signedOut"));
  }

  return (
    <div>
      <PageHeader eyebrow={t("profile.eyebrow")} title={t("profile.title")} subtitle={t("profile.subtitle")} />

      <section className="mx-auto max-w-2xl px-4 pb-24 md:px-8">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-card md:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-festive font-display text-2xl font-black text-white shadow-glow">
              {initial}
            </div>
            <div className="min-w-0">
              <div className="truncate font-display text-xl font-bold">{name}</div>
              <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${isAdmin ? "bg-primary/10 text-primary" : "bg-teal/15 text-teal"}`}>
                <Shield className="h-3 w-3" /> {isAdmin ? t("profile.admin") : t("profile.member")}
              </span>
            </div>
          </div>

          <div className="mt-6 divide-y divide-border rounded-2xl border border-border">
            <Row icon={<User className="h-4 w-4" />} label={t("profile.rowName")} value={name} />
            <Row icon={<Mail className="h-4 w-4" />} label={t("auth.email")} value={user?.email || "—"} />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {!isAdmin && (
              <Link to="/my-registration" className="inline-flex items-center gap-2 rounded-full bg-festive px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.02]">
                {t("menu.myRegistration")}
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground/80 transition-colors hover:bg-muted"
            >
              <LogOut className="h-4 w-4" /> {t("profile.signOut")}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
      <span className="inline-flex items-center gap-2 text-muted-foreground">{icon} {label}</span>
      <span className="truncate text-right font-medium">{value}</span>
    </div>
  );
}
