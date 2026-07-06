import { Link } from "@tanstack/react-router";
import { Instagram, Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "./logo";
import { EVENT } from "@/lib/dummy-data";
import { useAuth } from "@/lib/auth-context";
import { useSeason } from "@/lib/season-context";
import { useI18n } from "@/lib/i18n";

export function SiteFooter() {
  const { user, isAdmin } = useAuth();
  const { activeSeason } = useSeason();
  const { t } = useI18n();
  const venue = activeSeason?.venue?.trim()
    ? `${activeSeason.venue}${activeSeason.city ? `, ${activeSeason.city}` : ""}`
    : t("footer.venueSoon");

  const exploreLinks = [
    { to: "/", tKey: "nav.home" },
    { to: "/gallery", tKey: "nav.gallery" },
    ...(user ? [{ to: "/my-registration", tKey: "menu.myRegistration" }] : []),
    ...(isAdmin ? [] : [{ to: "/register", tKey: "menu.becomeSeller" }]),
    ...(isAdmin
      ? [
          { to: "/categories", tKey: "nav.categories" },
          { to: "/stalls", tKey: "nav.stalls" },
          { to: "/draw", tKey: "nav.liveDraw" },
          { to: "/admin", tKey: "nav.admin" },
        ]
      : []),
  ];

  return (
    <footer className="relative mt-24 overflow-hidden bg-hero text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-3 pattern-stripes opacity-90" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-warm opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-accent/40 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 md:grid-cols-4 md:px-8">
        <div className="md:col-span-2">
          <Logo withWordmark className="h-12 w-12" />
          <p className="mt-4 max-w-md text-sm text-white/70">{t("footer.blurb")}</p>
          <p className="mt-6 font-script text-3xl text-accent">{EVENT.tagline}</p>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-accent/90">{t("footer.explore")}</h4>
          <ul className="space-y-2 text-sm text-white/75">
            {exploreLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="transition-colors hover:text-white">{t(l.tKey)}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-accent/90">{t("footer.reach")}</h4>
          <ul className="space-y-3 text-sm text-white/75">
            <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-accent" /> {venue}</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-accent" /> +91 98800 12345</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-accent" /> hello@amchobazar.in</li>
            <li className="flex items-center gap-2"><Instagram className="h-4 w-4 text-accent" /> @amcho.bazar</li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-6 text-xs text-white/75 md:flex-row md:justify-between md:px-8">
          <p className="inline-flex items-center gap-1.5 font-medium">
            {t("footer.poweredBy")} <span className="text-accent">Al Fajar Youth Wing</span>
          </p>
          <p>{t("footer.handcrafted")}</p>
          <p>© {new Date().getFullYear()} {t("footer.org")}</p>
        </div>
      </div>
    </footer>
  );
}