import { useMemo, useState } from "react";

// A premium two-pane "dashboard settings" layout (sidebar nav + content panel),
// à la Stripe / Linear / Vercel. Collapses to a horizontal pill row on mobile.
export type NavSection = { id: string; icon: React.ReactNode; title: string; desc: string; node: React.ReactNode };
export type NavGroup = { label: string; items: NavSection[] };

export function SidebarSections({ groups }: { groups: NavGroup[] }) {
  const all = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const [active, setActive] = useState(all[0]?.id ?? "");
  const current = all.find((i) => i.id === active) ?? all[0];
  if (!current) return null;
  return (
    <div className="grid gap-4 md:grid-cols-[13rem_1fr] md:gap-8 lg:grid-cols-[14rem_1fr]">
      {/* Sidebar */}
      <nav className="flex gap-1.5 overflow-x-auto pb-1 md:sticky md:top-24 md:h-fit md:flex-col md:gap-0.5 md:overflow-visible md:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {groups.map((g) => (
          <div key={g.label} className="contents md:mt-3 md:block md:first:mt-0">
            <div className="hidden px-2.5 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/80 md:block">{g.label}</div>
            {g.items.map((it) => {
              const on = it.id === current.id;
              return (
                <button
                  key={it.id}
                  onClick={() => setActive(it.id)}
                  aria-current={on ? "page" : undefined}
                  className={`group inline-flex shrink-0 items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:w-full ${on ? "bg-festive text-white shadow-soft" : "text-foreground/75 hover:bg-muted/70"}`}
                >
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-colors ${on ? "bg-white/20 text-white" : "bg-muted text-primary/70 group-hover:text-primary"}`}>{it.icon}</span>
                  <span className="whitespace-nowrap md:whitespace-normal md:text-left">{it.title}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Content */}
      <div className="min-w-0 rounded-2xl border border-border/70 bg-card p-5 shadow-[0_16px_50px_-24px_rgba(122,30,61,0.35)] md:p-8">
        <div className="mb-6 border-b border-border/60 pb-5">
          <h2 className="font-display text-xl font-bold leading-tight md:text-2xl">{current.title}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{current.desc}</p>
        </div>
        {current.node}
      </div>
    </div>
  );
}
