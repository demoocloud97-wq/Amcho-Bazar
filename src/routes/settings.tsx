import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { HelpCircle, Eye, EyeOff, Gauge, Image as ImageIcon, KeyRound, ListChecks, Loader2, Lock, LogOut, Mail, Shield, ShieldCheck, User, UserCircle, Zap } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/site/page-header";
import { RequireAuth } from "@/components/site/require-auth";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HeroImageEditor, DrawNonStopToggle, LiveDrawPace, FillSubcatsToggle, FaqEditor } from "@/components/site/admin-settings";
import { useAuth } from "@/lib/auth-context";
import { changePassword, hasPasswordProvider, logout } from "@/lib/auth";
import { friendlyAuthError } from "@/lib/firebase-errors";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · Amcho Bazar" }] }),
  component: () => (
    <RequireAuth>
      <SettingsPage />
    </RequireAuth>
  ),
});

function SettingsPage() {
  const { user, isAdmin } = useAuth();
  const { t } = useI18n();
  const canChangePw = user ? hasPasswordProvider(user) : false;

  return (
    <div>
      <PageHeader eyebrow={t("settings.eyebrow")} title={t("settings.title")} subtitle={t("settings.subtitle")} />
      <section className="mx-auto max-w-2xl px-4 pb-24 md:px-8">
        {/* Every feature is its own expand/collapse panel — add more items over time. */}
        <Accordion type="multiple" className="space-y-4">
          <SettingSection value="account" icon={<UserCircle className="h-5 w-5" />} title={t("settings.accountTitle")} desc={t("settings.accountDesc")}>
            <AccountPanel />
          </SettingSection>

          <SettingSection value="password" icon={<KeyRound className="h-5 w-5" />} title={t("settings.changePwTitle")} desc={t("settings.changePwDesc")}>
            {canChangePw ? <ChangePasswordForm /> : <GoogleNotice email={user?.email ?? ""} />}
          </SettingSection>

          {isAdmin && (
            <>
              <SettingSection value="hero" icon={<ImageIcon className="h-5 w-5" />} title={t("adm.heroTitle")} desc={t("adm.heroDesc")}>
                <HeroImageEditor />
              </SettingSection>
              <SettingSection value="nonstop" icon={<Zap className="h-5 w-5" />} title={t("adm.nonstopTitle")} desc={t("adm.nonstopDesc")}>
                <DrawNonStopToggle />
              </SettingSection>
              <SettingSection value="drawpace" icon={<Gauge className="h-5 w-5" />} title={t("adm.drawPaceTitle")} desc={t("adm.drawPaceDesc")}>
                <LiveDrawPace />
              </SettingSection>
              <SettingSection value="fillsub" icon={<ListChecks className="h-5 w-5" />} title={t("adm.fillTitle")} desc={t("adm.fillDesc")}>
                <FillSubcatsToggle />
              </SettingSection>
              <SettingSection value="faq" icon={<HelpCircle className="h-5 w-5" />} title={t("adm.faqTitle")} desc={t("adm.faqDesc")}>
                <FaqEditor />
              </SettingSection>
            </>
          )}
        </Accordion>
      </section>
    </div>
  );
}

// A collapsible card. New settings features just drop in as another <SettingSection>.
function SettingSection({ value, icon, title, desc, children }: { value: string; icon: React.ReactNode; title: string; desc: string; children: React.ReactNode }) {
  return (
    <AccordionItem
      value={value}
      className="group overflow-hidden rounded-3xl border border-border bg-card px-5 shadow-card transition-all hover:border-primary/20 data-[state=open]:border-primary/25 data-[state=open]:shadow-glow md:px-6"
    >
      <AccordionTrigger className="py-5 hover:no-underline">
        <div className="flex items-center gap-3 text-left">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-festive text-white shadow-soft ring-1 ring-inset ring-white/20 transition-transform group-hover:scale-105">{icon}</span>
          <div>
            <div className="font-display text-base font-bold leading-tight">{title}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-6">
        <div className="border-t border-border/70 pt-5">{children}</div>
      </AccordionContent>
    </AccordionItem>
  );
}

function AccountPanel() {
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
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-festive font-display text-xl font-black text-white shadow-glow">{initial}</div>
        <div className="min-w-0">
          <div className="truncate font-display text-lg font-bold">{name}</div>
          <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${isAdmin ? "bg-primary/10 text-primary" : "bg-teal/15 text-teal"}`}>
            <Shield className="h-3 w-3" /> {isAdmin ? t("profile.admin") : t("profile.member")}
          </span>
        </div>
      </div>

      <div className="mt-5 divide-y divide-border rounded-2xl border border-border">
        <Row icon={<User className="h-4 w-4" />} label={t("profile.rowName")} value={name} />
        <Row icon={<Mail className="h-4 w-4" />} label={t("auth.email")} value={user?.email || "—"} />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {!isAdmin && (
          <Link to="/my-registration" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-festive px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.02]">
            {t("menu.myRegistration")}
          </Link>
        )}
        <button onClick={handleLogout} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground/80 transition-colors hover:bg-muted">
          <LogOut className="h-4 w-4" /> {t("profile.signOut")}
        </button>
      </div>
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

function ChangePasswordForm() {
  const { t } = useI18n();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (next.length < 6) return setErr(t("settings.pwTooShort"));
    if (next !== confirm) return setErr(t("settings.pwMismatch"));
    setBusy(true);
    try {
      await changePassword(cur, next);
      toast.success(t("settings.pwChanged"));
      setCur(""); setNext(""); setConfirm("");
    } catch (e2) {
      setErr(friendlyAuthError(e2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label={t("settings.current")} value={cur} onChange={setCur} show={show} autoComplete="current-password" />
      <Field label={t("settings.new")} value={next} onChange={setNext} show={show} autoComplete="new-password" />
      <Field label={t("settings.confirm")} value={confirm} onChange={setConfirm} show={show} autoComplete="new-password" />

      <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="h-4 w-4 rounded border-border accent-[color:var(--color-primary)]" />
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {t("settings.showPw")}
      </label>

      {err && <p role="alert" className="text-sm font-medium text-destructive">{err}</p>}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-festive px-6 py-2.5 text-sm font-bold text-white shadow-soft transition-transform hover:scale-[1.02] disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} {t("settings.updatePw")}
      </button>
    </form>
  );
}

function Field({ label, value, onChange, show, autoComplete }: { label: string; value: string; onChange: (v: string) => void; show: boolean; autoComplete: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
          className="min-h-11 w-full rounded-xl border border-border bg-muted/40 py-2.5 ps-9 pe-4 text-sm outline-none ring-primary/20 transition focus:ring-4"
        />
      </div>
    </div>
  );
}

function GoogleNotice({ email }: { email: string }) {
  const { t } = useI18n();
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">{t("settings.googleOnly")}</p>
      <p className="mt-1">{t("settings.googleOnlyDesc")} {email && <span className="font-medium text-foreground">{email}</span>}</p>
    </div>
  );
}
