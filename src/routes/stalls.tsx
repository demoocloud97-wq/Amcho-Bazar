import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Search, Star, Store } from "lucide-react";
import { useMemo, useState } from "react";
import { CATEGORIES, SELLERS } from "@/lib/dummy-data";
import { PageHeader } from "./categories";

export const Route = createFileRoute("/stalls")({
  head: () => ({
    meta: [
      { title: "Stall Directory · Amcho Bazar" },
      { name: "description", content: "Search 75 stalls at Amcho Bazar Season 2 — meet each seller and their home business." },
      { property: "og:title", content: "Stall Directory · Amcho Bazar" },
      { property: "og:description", content: "Every stall, every seller, every category — searchable." },
    ],
  }),
  component: StallsPage,
});

function StallsPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [onlyFeatured, setOnlyFeatured] = useState(false);

  // Only first 75 sellers get stalls
  const stalls = useMemo(
    () => SELLERS.slice(0, 75).map((s, i) => ({ ...s, stallNo: i + 1 })),
    []
  );

  const filtered = stalls.filter((s) => {
    if (cat !== "All" && s.category !== cat) return false;
    if (onlyFeatured && !s.featured) return false;
    if (!q) return true;
    const hay = `${s.seller} ${s.business} ${s.category} ${s.products.join(" ")}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <div>
      <PageHeader
        eyebrow="Stall Directory"
        title={<>75 stalls, <span className="text-festive">one warm hall.</span></>}
        subtitle="Meet every entrepreneur setting up shop at Season 2 — search by name, category or product."
      />

      <section className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
        <div className="glass sticky top-20 z-20 -mt-8 mb-8 flex flex-col gap-3 rounded-3xl p-4 shadow-soft md:flex-row md:items-center md:p-5">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search sellers, products, business names…"
              className="w-full rounded-full border border-border bg-white/70 py-3 pl-11 pr-4 text-sm outline-none ring-primary/20 focus:ring-4"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="rounded-full border border-border bg-white/80 px-4 py-3 text-sm font-medium outline-none"
            >
              <option>All</option>
              {CATEGORIES.map((c) => (
                <option key={c.key}>{c.key}</option>
              ))}
            </select>
            <button
              onClick={() => setOnlyFeatured((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-3 text-sm font-semibold transition-colors ${
                onlyFeatured ? "bg-festive text-white shadow-soft" : "border border-border bg-white/80 text-foreground"
              }`}
            >
              <Star className="h-4 w-4" /> Featured
            </button>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>{filtered.length} stalls</span>
          <span className="inline-flex items-center gap-2"><Store className="h-4 w-4 text-primary" /> Nawait Community Hall</span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: (i % 12) * 0.03 }}
              className="group relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-1 hover:shadow-glow"
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-warm opacity-20 blur-2xl transition-opacity group-hover:opacity-40" />
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img src={s.avatar} className="h-14 w-14 rounded-2xl object-cover ring-2 ring-accent/50" alt="" />
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Stall</div>
                    <div className="font-display text-2xl font-bold text-primary">#{s.stallNo.toString().padStart(2, "0")}</div>
                  </div>
                </div>
                {s.featured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    <Star className="h-3 w-3" /> Featured
                  </span>
                )}
              </div>
              <div className="mt-4">
                <div className="font-display text-lg font-semibold">{s.business}</div>
                <div className="text-sm text-muted-foreground">by {s.seller}</div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {s.products.map((p) => (
                  <span key={p} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{p}</span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">{s.category}</span>
                <span className="font-mono text-muted-foreground">{s.id}</span>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No stalls match your filters.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}