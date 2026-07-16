import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { HelpCircle, ArrowRight, Lightbulb } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GUIDE, WHO_LABEL, gt, type Who } from "@/lib/guide-content";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";

// Map route → guide section. Screens not listed show no help button (e.g. draw/present).
const ROUTE_SECTION: Record<string, string> = {
  "/signup": "signup",
  "/register": "register",
  "/registration-info": "reginfo",
  "/admin": "admin",
  "/seasons": "seasons",
  "/payments": "payments",
  "/announcements": "announcements",
  "/reports": "reports",
  "/settings": "settings",
};

// Sellers/visitors only get help on their own screens; everything else is admin-only.
export const PUBLIC_SECTIONS = ["signup", "register"];

// Rendered once in the root layout — shows the current screen's guide button.
// Client-only (mounted guard) so the SSR/prerendered HTML never mismatches.
export function RouteHelp() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { isAdmin } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const section = ROUTE_SECTION[path];
  if (!mounted || !section) return null;
  if (!isAdmin && !PUBLIC_SECTIONS.includes(section)) return null;
  return <HelpButton section={section} />;
}

const WHO_CLS: Record<Who, string> = {
  all: "bg-white/15 text-accent",
  seller: "bg-white/15 text-teal-200",
  admin: "bg-white/15 text-white/90",
};

// A floating "?" button that opens this screen's guide.
export function HelpButton({ section }: { section: string }) {
  const [open, setOpen] = useState(false);
  const { t, lang } = useI18n();
  const { isAdmin } = useAuth();
  const g = GUIDE[section];
  if (!g) return null;
  const title = gt(g.title, lang);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${t("guide.help")}: ${title}`}
        title={`${t("guide.help")}: ${title}`}
        className="fixed bottom-6 right-6 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-festive text-white shadow-glow ring-1 ring-white/25 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-95"
      >
        <HelpCircle className="h-6 w-6" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
          {/* Header band */}
          <div className="relative overflow-hidden bg-hero px-6 py-5 text-white">
            <div className="pointer-events-none absolute inset-0 pattern-dots opacity-15" />
            <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-warm opacity-30 blur-2xl" />
            <div className="relative flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15 text-accent ring-1 ring-white/20">
                <HelpCircle className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/60">{t("guide.help")}</div>
                <DialogHeader className="space-y-0 text-left">
                  <DialogTitle className="mt-0.5 font-display text-xl font-bold text-white">{title}</DialogTitle>
                </DialogHeader>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {g.route && <span className="rounded-md bg-black/25 px-2 py-0.5 font-mono text-[11px] font-semibold text-accent">{g.route}</span>}
                  {g.who.map((w) => (
                    <span key={w} className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${WHO_CLS[w]}`}>{gt(WHO_LABEL[w], lang)}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="max-h-[58vh] overflow-y-auto px-6 py-5 [scrollbar-width:thin]">
            <ol className="space-y-4">
              {g.steps.map((s, i) => (
                <li key={i} className="flex gap-3.5">
                  <span className="mt-px grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-festive font-display text-xs font-black text-white shadow-soft">{i + 1}</span>
                  <p className="pt-0.5 text-[15px] leading-relaxed text-foreground/85">{gt(s, lang)}</p>
                </li>
              ))}
            </ol>

            {g.tip && (
              <div className="mt-5 flex gap-3 rounded-2xl bg-accent/10 p-4 ring-1 ring-inset ring-accent/25">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <p className="text-sm leading-relaxed text-foreground/75">{gt(g.tip, lang)}</p>
              </div>
            )}
          </div>

          {/* Footer — only admins get the cross-screen guide; sellers see just this screen. */}
          {isAdmin && (
            <div className="flex justify-end border-t border-border bg-muted/30 px-6 py-3">
              <Link to="/guide" onClick={() => setOpen(false)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80">
                {t("guide.full")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
