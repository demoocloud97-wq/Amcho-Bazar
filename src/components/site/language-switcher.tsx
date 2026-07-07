import { Check } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n, LANGS } from "@/lib/i18n";

// English names (subtitle under native labels for script languages).
const EN_NAME: Record<string, string> = { en: "English", ur: "Urdu", "ur-roman": "Roman Urdu", hi: "Hindi", ar: "Arabic" };

// 🌐 globe-with-meridians icon (matches the emoji; recolourable via currentColor).
function GlobeGrid({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9.2" />
      <line x1="12" y1="2.8" x2="12" y2="21.2" />
      <line x1="2.9" y1="12" x2="21.1" y2="12" />
      <ellipse cx="12" cy="12" rx="4.3" ry="9.2" />
      <line x1="4.2" y1="7.6" x2="19.8" y2="7.6" />
      <line x1="4.2" y1="16.4" x2="19.8" y2="16.4" />
    </svg>
  );
}

// Dedicated header control to switch language (globe + current code).
export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  const current = LANGS.find((l) => l.code === lang);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={t("menu.language")}
          className="inline-flex h-11 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm font-semibold text-foreground/80 shadow-soft transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <GlobeGrid className="h-5 w-5 text-[#d32b2b]" />
          <span className="tabular-nums">{current?.short ?? "EN"}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-60 rounded-2xl p-1.5">
        <DropdownMenuLabel className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <GlobeGrid className="h-3.5 w-3.5 text-[#d32b2b]" /> {t("menu.language")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LANGS.map((l) => {
          const active = l.code === lang;
          const showSub = EN_NAME[l.code] && EN_NAME[l.code] !== l.label;
          return (
            <DropdownMenuItem
              key={l.code}
              onSelect={() => setLang(l.code)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 focus:bg-muted ${active ? "bg-primary/10 focus:bg-primary/10" : ""}`}
            >
              <span className={`grid h-8 w-10 shrink-0 place-items-center rounded-lg text-[11px] font-bold tabular-nums ${active ? "bg-festive text-white shadow-soft" : "bg-muted text-foreground/70"}`}>
                {l.short}
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-sm font-semibold text-foreground" dir={l.dir}>{l.label}</span>
                {showSub && <span className="block truncate text-[11px] text-muted-foreground">{EN_NAME[l.code]}</span>}
              </span>
              {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
