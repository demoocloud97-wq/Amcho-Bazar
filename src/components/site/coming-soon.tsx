import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n";

// Lightweight placeholder for modules that are wired into navigation but not
// built yet — keeps links from dead-ending on a blank page.
export function ComingSoon({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-2xl px-4 pb-24 md:px-8">
      <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center shadow-soft">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>
        <h2 className="mt-5 font-display text-2xl font-bold">{title}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
        <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-primary">{t("common.comingSoon")}</span>
      </div>
    </section>
  );
}
