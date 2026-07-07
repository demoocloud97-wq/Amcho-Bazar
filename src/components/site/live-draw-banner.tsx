import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Radio, ArrowRight } from "lucide-react";
import { watchDrawLive } from "@/lib/settings-db";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";

// Shown to EVERYONE (registered, non-registered, anonymous) while an admin has
// the draw broadcast on. Links to the read-only live presentation. Renders
// nothing when the broadcast is off.
export function LiveDrawBanner() {
  const { t } = useI18n();
  const { isAdmin } = useAuth();
  const [live, setLive] = useState(false);
  useEffect(() => watchDrawLive(setLive), []);
  if (!live || isAdmin) return null; // audience only — admins run the draw
  return (
    <Link
      to="/present"
      className="group flex items-center justify-center gap-2 bg-festive px-4 py-2 text-center text-sm font-semibold text-white shadow-glow"
    >
      <span className="inline-flex items-center gap-1.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
        </span>
        <Radio className="h-4 w-4" />
      </span>
      {t("live.banner")}
      <span className="inline-flex items-center gap-1 underline underline-offset-2">
        {t("live.watch")} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
