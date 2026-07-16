import { createFileRoute, Navigate } from "@tanstack/react-router";
import { BarChart3, ClipboardList, CreditCard, LayoutDashboard, ListTree, Megaphone, Pencil, Settings as SettingsIcon, UserPlus } from "lucide-react";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/site/page-header";
import { SidebarSections, type NavGroup } from "@/components/site/sidebar-sections";
import { PUBLIC_SECTIONS } from "@/components/site/help-button";
import { GUIDE, WHO_LABEL, gt, type GuideSection, type Who } from "@/lib/guide-content";
import { useI18n, type Lang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "Guide · Amcho Bazar" },
      { name: "description", content: "How every Amcho Bazar screen works — sign up, registration, seasons, payments, admin and settings." },
    ],
  }),
  component: GuidePage,
});

const ICONS: Record<string, ReactNode> = {
  signup: <UserPlus className="h-4 w-4" />,
  register: <ClipboardList className="h-4 w-4" />,
  reginfo: <Pencil className="h-4 w-4" />,
  admin: <LayoutDashboard className="h-4 w-4" />,
  seasons: <ListTree className="h-4 w-4" />,
  payments: <CreditCard className="h-4 w-4" />,
  announcements: <Megaphone className="h-4 w-4" />,
  reports: <BarChart3 className="h-4 w-4" />,
  settings: <SettingsIcon className="h-4 w-4" />,
};

const WHO_CLS: Record<Who, string> = {
  all: "bg-accent/25 text-primary",
  seller: "bg-teal/15 text-teal",
  admin: "bg-primary/10 text-primary",
};

// One section's body: who it's for, the steps, and the tip.
function GuideBody({ g, lang }: { g: GuideSection; lang: Lang }) {
  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-1.5">
        {g.who.map((w) => (
          <span key={w} className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${WHO_CLS[w]}`}>{gt(WHO_LABEL[w], lang)}</span>
        ))}
      </div>

      <ol className="space-y-3.5">
        {g.steps.map((s, i) => (
          <li key={i} className="flex gap-3.5">
            <span className="mt-px grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-festive font-display text-xs font-black text-white shadow-soft">{i + 1}</span>
            <p className="pt-0.5 text-[15px] leading-relaxed text-foreground/85">{gt(s, lang)}</p>
          </li>
        ))}
      </ol>

      {g.tip && (
        <div className="mt-6 rounded-2xl bg-accent/10 p-4 ring-1 ring-inset ring-accent/25">
          <p className="text-sm leading-relaxed text-foreground/75">{gt(g.tip, lang)}</p>
        </div>
      )}
    </div>
  );
}

function GuidePage() {
  const { t, lang } = useI18n();
  const { isAdmin } = useAuth();

  const item = (key: string) => {
    const g = GUIDE[key];
    return { id: key, icon: ICONS[key], title: gt(g.title, lang), desc: g.route ?? "", node: <GuideBody g={g} lang={lang} /> };
  };

  // Cross-screen guide is admin-only — sellers get their own screen's help popup
  // (Sign up on /signup, Registration on /register) and nothing else.
  if (!isAdmin) return <Navigate to="/register" replace />;

  const groups: NavGroup[] = [
    { label: t("guide.grpStart"), items: ["signup", "register", "reginfo"].map(item) },
    { label: t("guide.grpManage"), items: ["admin", "seasons", "payments", "announcements", "reports", "settings"].map(item) },
  ];

  return (
    <div>
      <PageHeader eyebrow={t("guide.eyebrow")} title={t("guide.title")} subtitle={t("guide.subtitle")} />
      <section className="mx-auto max-w-5xl px-4 pb-24 pt-8 md:px-8 md:pt-12">
        <SidebarSections groups={groups} />
      </section>
    </div>
  );
}
