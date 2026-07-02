import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { useState } from "react";
import { SectionHeading } from "@/components/site/section-heading";
import { CATEGORIES } from "@/lib/dummy-data";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Categories · Amcho Bazar Season 2" },
      { name: "description", content: "Browse every category of women-led businesses at Amcho Bazar — food, clothing, jewellery, beauty and more." },
      { property: "og:title", content: "Categories · Amcho Bazar" },
      { property: "og:description", content: "Discover the categories at the Nawait Community's women-only festival." },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const [q, setQ] = useState("");
  const filtered = CATEGORIES.filter(
    (c) => c.key.toLowerCase().includes(q.toLowerCase()) || c.description.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div>
      <PageHeader
        eyebrow="Categories"
        title={<>A festival of <span className="text-festive">every craft.</span></>}
        subtitle="From steaming kitchens to hand-stitched abayas — nine warm categories, each brimming with women-led home businesses."
      />

      <section className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
        <div className="mx-auto mb-10 max-w-xl">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search categories…"
              className="w-full rounded-full border border-border bg-card py-3.5 pl-12 pr-4 text-sm outline-none ring-primary/20 shadow-soft transition-all focus:ring-4"
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c, i) => (
            <motion.div
              key={c.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: (i % 6) * 0.05 }}
            >
              <Link
                to="/stalls"
                className="group relative block overflow-hidden rounded-[28px] border border-border bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-glow"
              >
                <div className={`relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br ${c.hue}`}>
                  <div className="pointer-events-none absolute inset-0 pattern-dots opacity-20" />
                  <div className="text-7xl drop-shadow-lg transition-transform duration-500 group-hover:scale-110">{c.emoji}</div>
                  <div className="absolute right-3 top-3 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-primary backdrop-blur">
                    {c.sellers} sellers
                  </div>
                </div>
                <div className="p-6">
                  <div className="font-display text-2xl font-semibold">{c.key}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Explore stalls <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No categories match "{q}".
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: React.ReactNode; subtitle?: string }) {
  return (
    <section className="relative overflow-hidden bg-hero pb-16 pt-16 text-white md:pb-24 md:pt-20">
      <div className="pointer-events-none absolute inset-0 pattern-dots opacity-20" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-warm opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
      <div className="relative mx-auto max-w-4xl px-4 text-center md:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white/90 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {eyebrow}
        </div>
        <h1 className="mt-5 font-display text-4xl font-black leading-[1.05] md:text-6xl">{title}</h1>
        {subtitle && <p className="mx-auto mt-4 max-w-2xl text-white/80">{subtitle}</p>}
      </div>
    </section>
  );
}