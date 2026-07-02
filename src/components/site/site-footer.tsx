import { Link } from "@tanstack/react-router";
import { Instagram, Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "./logo";
import { EVENT } from "@/lib/dummy-data";

export function SiteFooter() {
  return (
    <footer className="relative mt-24 overflow-hidden bg-hero text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-3 pattern-stripes opacity-90" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-warm opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-accent/40 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 md:grid-cols-4 md:px-8">
        <div className="md:col-span-2">
          <Logo withWordmark className="h-12 w-12" />
          <p className="mt-4 max-w-md text-sm text-white/70">
            A women-only community festival by the <span className="font-medium text-accent">Nawait Community</span> —
            celebrating home-grown businesses, purposeful entertainment and the joy of sisterhood.
          </p>
          <p className="mt-6 font-script text-3xl text-accent">{EVENT.tagline}</p>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-accent/90">Explore</h4>
          <ul className="space-y-2 text-sm text-white/75">
            {[
              { to: "/categories", label: "Categories" },
              { to: "/stalls", label: "Stall Directory" },
              { to: "/draw", label: "Live Draw" },
              { to: "/gallery", label: "Gallery" },
              { to: "/register", label: "Become a Seller" },
            ].map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="transition-colors hover:text-white">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-accent/90">Reach us</h4>
          <ul className="space-y-3 text-sm text-white/75">
            <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-accent" /> {EVENT.venue}, {EVENT.city}</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-accent" /> +91 98800 12345</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-accent" /> hello@amchobazar.in</li>
            <li className="flex items-center gap-2"><Instagram className="h-4 w-4 text-accent" /> @amcho.bazar</li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-white/60 md:flex-row md:px-8">
          <p>© {new Date().getFullYear()} Nawait Community · Amcho Bazar Season 2.</p>
          <p>Handcrafted with love for the women of Bhatkal.</p>
        </div>
      </div>
    </footer>
  );
}