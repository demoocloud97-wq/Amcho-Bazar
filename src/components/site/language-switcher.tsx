import { Globe } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n, LANGS, type Lang } from "@/lib/i18n";

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
          <Globe className="h-5 w-5" />
          <span className="tabular-nums">{current?.short ?? "EN"}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="rounded-xl">
        <DropdownMenuRadioGroup value={lang} onValueChange={(v) => setLang(v as Lang)}>
          {LANGS.map((l) => (
            <DropdownMenuRadioItem key={l.code} value={l.code}>{l.label}</DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
