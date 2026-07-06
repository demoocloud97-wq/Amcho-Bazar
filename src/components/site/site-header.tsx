import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Logo } from "./logo";
import { MainMenu } from "./main-menu";
import { NotificationBell } from "./notification-bell";
import { LanguageSwitcher } from "./language-switcher";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";

type Vis = "all" | "auth" | "admin";
type NavItem = { to: string; tKey: string; show: Vis; highlight?: boolean };

// Primary links kept inline in the header. Everything else lives in the ⋮ menu.
const PRIMARY_NAV: NavItem[] = [
  { to: "/", tKey: "nav.home", show: "all" },
  { to: "/gallery", tKey: "nav.gallery", show: "all" },
  { to: "/stalls", tKey: "nav.stalls", show: "all" },
  { to: "/draw", tKey: "nav.liveDraw", show: "admin", highlight: true },
  { to: "/categories", tKey: "nav.categories", show: "admin" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, isAdmin } = useAuth();
  const { t } = useI18n();

  // Strengthen the header (shadow + border) once the page scrolls.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const canSee = (v: Vis) => v === "all" || (v === "auth" && !!user) || (v === "admin" && isAdmin);
  const nav = PRIMARY_NAV.filter((n) => canSee(n.show));
  const isActive = (to: string) => pathname === to || (to !== "/" && pathname.startsWith(to));

  return (
    <header className="sticky top-0 z-40">
      <div
        className={cn(
          "border-b border-border bg-card transition-shadow duration-300",
          scrolled && "shadow-soft"
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 md:px-8">
          <Link
            to="/"
            aria-label="Amcho Bazar — home"
            className="shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Logo withWordmark />
          </Link>

          <nav className="mx-auto hidden items-center gap-0.5 md:flex">
            {nav.map((n) => {
              const active = isActive(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    n.highlight
                      ? active ? "bg-secondary/15 text-secondary" : "text-secondary hover:bg-secondary/10"
                      : active ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-muted hover:text-primary"
                  )}
                >
                  {n.highlight && (
                    <span className="absolute right-1 top-1 flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-secondary" />
                    </span>
                  )}
                  {t(n.tKey)}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
            <LanguageSwitcher />
            <NotificationBell />
            <MainMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
