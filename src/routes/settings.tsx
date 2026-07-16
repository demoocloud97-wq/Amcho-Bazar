import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { HelpCircle, Eye, EyeOff, Gauge, Image as ImageIcon, KeyRound, ListChecks, Loader2, Lock, LogOut, Mail, MapPin, Phone, Shield, ShieldCheck, Sparkles, User, UserCircle, UserPlus, Video, Zap } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/site/page-header";
import { RequireAuth } from "@/components/site/require-auth";
import { HeroImageEditor, DrawNonStopToggle, LiveDrawPace, RevealFieldsEditor, FillSubcatsToggle, FaqEditor, FooterContactEditor, FbLiveEditor, EventLocationEditor, SignupToggle } from "@/components/site/admin-settings";
import { SidebarSections, type NavGroup } from "@/components/site/sidebar-sections";
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

  const groups: NavGroup[] = [
    { label: t("settings.grpAccount"), items: [
      { id: "account", icon: <UserCircle className="h-4 w-4" />, title: t("settings.accountTitle"), desc: t("settings.accountDesc"), node: <AccountPanel /> },
      { id: "password", icon: <KeyRound className="h-4 w-4" />, title: t("settings.changePwTitle"), desc: t("settings.changePwDesc"), node: canChangePw ? <ChangePasswordForm /> : <GoogleNotice email={user?.email ?? ""} /> },
    ] },
  ];
  if (isAdmin) groups.push({ label: t("settings.grpAdmin"), items: [
    { id: "signup", icon: <UserPlus className="h-4 w-4" />, title: t("adm.signupTitle"), desc: t("adm.signupDesc"), node: <SignupToggle /> },
    { id: "location", icon: <MapPin className="h-4 w-4" />, title: t("adm.locTitle"), desc: t("adm.locDesc"), node: <EventLocationEditor /> },
    { id: "hero", icon: <ImageIcon className="h-4 w-4" />, title: t("adm.heroTitle"), desc: t("adm.heroDesc"), node: <HeroImageEditor /> },
    { id: "nonstop", icon: <Zap className="h-4 w-4" />, title: t("adm.nonstopTitle"), desc: t("adm.nonstopDesc"), node: <DrawNonStopToggle /> },
    { id: "drawpace", icon: <Gauge className="h-4 w-4" />, title: t("adm.drawPaceTitle"), desc: t("adm.drawPaceDesc"), node: <LiveDrawPace /> },
    { id: "reveal", icon: <Sparkles className="h-4 w-4" />, title: t("adm.revealTitle"), desc: t("adm.revealDesc"), node: <RevealFieldsEditor /> },
    { id: "fblive", icon: <Video className="h-4 w-4" />, title: t("adm.fbLiveTitle"), desc: t("adm.fbLiveDesc"), node: <FbLiveEditor /> },
    { id: "fillsub", icon: <ListChecks className="h-4 w-4" />, title: t("adm.fillTitle"), desc: t("adm.fillDesc"), node: <FillSubcatsToggle /> },
    { id: "faq", icon: <HelpCircle className="h-4 w-4" />, title: t("adm.faqTitle"), desc: t("adm.faqDesc"), node: <FaqEditor /> },
    { id: "footer", icon: <Phone className="h-4 w-4" />, title: t("adm.footerTitle"), desc: t("adm.footerDesc"), node: <FooterContactEditor /> },
  ] });

  return (
    <div>
      <PageHeader eyebrow={t("settings.eyebrow")} title={t("settings.title")} subtitle={t("settings.subtitle")} />
      <section className="mx-auto max-w-5xl px-4 pb-24 pt-8 md:px-8 md:pt-12">
        <SidebarSections groups={groups} />
      </section>
    </div>
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
      <Field label={t("settings.current")} value={cur} onChange={setCur} autoComplete="current-password" />
      <Field label={t("settings.new")} value={next} onChange={setNext} autoComplete="new-password" />
      <Field label={t("settings.confirm")} value={confirm} onChange={setConfirm} autoComplete="new-password" />

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

// Password input with its own show/hide eye button (same pattern as Log in / Sign up).
function Field({ label, value, onChange, autoComplete }: { label: string; value: string; onChange: (v: string) => void; autoComplete: string }) {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
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
          className="min-h-11 w-full rounded-xl border border-border bg-muted/40 py-2.5 ps-9 pe-11 text-sm outline-none ring-primary/20 transition focus:ring-4"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={t("settings.showPw")}
          aria-pressed={show}
          className="absolute end-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
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
