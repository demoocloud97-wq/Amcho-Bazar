import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/categories", label: "Categories" },
  { to: "/stalls", label: "Stall Directory" },
  { to: "/draw", label: "Live Draw", highlight: true },
  { to: "/gallery", label: "Gallery" },
  { to: "/admin", label: "Admin" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-40">
      <div className="glass border-b border-border/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <Link to="/" className="shrink-0">
            <Logo withWordmark />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => {
              const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    active ? "text-primary" : "text-foreground/70 hover:text-primary",
                    n.highlight && "text-secondary hover:text-secondary"
                  )}
                >
                  {n.highlight && (
                    <span className="absolute -right-1 -top-1 h-2 w-2 animate-ping rounded-full bg-secondary" />
                  )}
                  {n.label}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-festive" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Link
              to="/my-registration"
              className="rounded-full border border-primary/20 bg-white/60 px-4 py-2 text-sm font-medium text-primary hover:bg-white"
            >
              My Registration
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-festive px-5 py-2 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-105"
            >
              Become a Seller
            </Link>
          </div>

          <button
            className="rounded-full border border-border bg-white/70 p-2 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="border-t border-border/60 bg-white/95 px-4 py-3 lg:hidden">
            <div className="flex flex-col gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
                >
                  {n.label}
                </Link>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link to="/my-registration" onClick={() => setOpen(false)} className="rounded-full border border-primary/20 px-4 py-2 text-center text-sm font-medium text-primary">
                  My Registration
                </Link>
                <Link to="/register" onClick={() => setOpen(false)} className="rounded-full bg-festive px-4 py-2 text-center text-sm font-semibold text-white">
                  Become a Seller
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}