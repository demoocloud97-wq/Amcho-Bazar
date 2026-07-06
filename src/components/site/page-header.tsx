import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: ReactNode; subtitle?: string }) {
  return (
    <section className="relative overflow-hidden bg-hero pb-16 pt-16 text-white md:pb-24 md:pt-20">
      <div className="pointer-events-none absolute inset-0 pattern-dots opacity-20" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-warm opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
      <div className="relative mx-auto max-w-4xl px-4 text-center md:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white/90 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {eyebrow}
        </div>
        <h1 className="mt-5 font-display text-4xl font-black leading-[1.1] md:text-6xl">{title}</h1>
        {subtitle && <p className="mx-auto mt-4 max-w-2xl text-white/80">{subtitle}</p>}
      </div>
    </section>
  );
}
