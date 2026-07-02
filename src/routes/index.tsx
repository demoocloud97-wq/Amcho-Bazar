import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Heart, Sparkles, Users, Store, Gift, ShieldCheck, PartyPopper, ChevronDown } from "lucide-react";
import logoAsset from "@/assets/amcho-bazar-logo.png.asset.json";
import { Countdown } from "@/components/site/countdown";
import { AnimatedCounter } from "@/components/site/animated-counter";
import { SectionHeading } from "@/components/site/section-heading";
import { FestiveDivider } from "@/components/site/festive-divider";
import { EVENT, STATS, CATEGORIES, SELLERS, HIGHLIGHTS, GUIDELINES, FAQS, GALLERY } from "@/lib/dummy-data";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="overflow-hidden">
      <Hero />
      <MissionBand />
      <About />
      <WomenEmpowerment />
      <CommunityStory />
      <StatsBand />
      <FeaturedCategories />
      <FeaturedSellers />
      <PreviousHighlights />
      <GalleryPreview />
      <VisitorGuidelines />
      <Faq />
      <BecomeASellerCta />
    </div>
  );
}

/* ============================================================
   HERO
============================================================ */
function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-hero pb-20 pt-10 text-white md:pb-32">
      {/* Festive top stripe */}
      <div className="absolute inset-x-0 top-0 h-2 pattern-stripes" />

      {/* Ambient glows */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-warm opacity-40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-40 h-72 w-72 rounded-full bg-accent/40 blur-3xl" />
      <div className="pointer-events-none absolute left-0 bottom-0 h-72 w-72 rounded-full bg-secondary/30 blur-3xl" />

      {/* Decorative floating shapes */}
      <div className="pointer-events-none absolute left-8 top-24 hidden md:block">
        <div className="animate-float text-4xl opacity-70">❁</div>
      </div>
      <div className="pointer-events-none absolute right-16 top-40 hidden md:block">
        <div className="animate-float text-5xl opacity-70" style={{ animationDelay: "1.2s" }}>✦</div>
      </div>
      <div className="pointer-events-none absolute right-8 bottom-32 hidden md:block">
        <div className="animate-float text-3xl opacity-70" style={{ animationDelay: "2.4s" }}>❋</div>
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 md:grid-cols-[1.15fr_1fr] md:items-center md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-wider text-white/90 backdrop-blur-md">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            {EVENT.organizer} presents · {EVENT.season}
          </div>

          <h1 className="mt-6 font-display text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            Amcho <span className="text-festive">Bazar</span>
          </h1>
          <p className="mt-3 font-script text-3xl text-accent md:text-4xl">Amchi Market · Amchi Manshay</p>

          <p className="mt-6 max-w-xl text-lg text-white/80">
            A women-only community festival where <strong className="text-white">120 women entrepreneurs</strong> open their
            home businesses to the neighbourhood — a day of shopping, feasting and sisterhood at {EVENT.venue}.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="group inline-flex items-center gap-2 rounded-full bg-festive px-6 py-3 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.03]"
            >
              Become a Seller
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/draw"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
            >
              <Sparkles className="h-4 w-4 text-accent" />
              Watch the Live Draw
            </Link>
          </div>

          <div className="mt-10 max-w-lg">
            <div className="mb-3 text-xs uppercase tracking-[0.3em] text-white/60">Doors open in</div>
            <Countdown target={EVENT.dateISO} />
            <div className="mt-3 text-sm text-white/70">{EVENT.dateLabel}</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotate: -6 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="relative mx-auto w-full max-w-md"
        >
          <div className="absolute inset-0 -z-10 rounded-full bg-warm blur-3xl opacity-40" />
          <div className="relative aspect-square">
            {/* Rotating decorative ring */}
            <div className="absolute inset-0 animate-spin-slow rounded-full border-2 border-dashed border-accent/40" />
            <div className="absolute inset-4 rounded-full bg-white/5 backdrop-blur-sm" />
            <img
              src={logoAsset.url}
              alt="Amcho Bazar Season 2 logo"
              className="relative h-full w-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
            />
          </div>

          {/* Floating chips */}
          <FloatingChip className="left-0 top-4" delay={0}>
            <span className="text-lg">🕌</span> Nawait Community
          </FloatingChip>
          <FloatingChip className="right-2 top-16" delay={0.6}>
            <Heart className="h-4 w-4 text-secondary" /> Women-only
          </FloatingChip>
          <FloatingChip className="right-6 bottom-10" delay={1.2}>
            <Store className="h-4 w-4 text-accent" /> 75 stalls
          </FloatingChip>
          <FloatingChip className="left-4 bottom-4" delay={1.8}>
            <PartyPopper className="h-4 w-4 text-accent" /> Live draw
          </FloatingChip>
        </motion.div>
      </div>

      <div className="relative mt-16 flex justify-center">
        <ChevronDown className="h-6 w-6 animate-bounce text-white/50" />
      </div>
    </section>
  );
}

function FloatingChip({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 + delay }}
      className={`absolute inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-xl ${className ?? ""}`}
    >
      {children}
    </motion.div>
  );
}

/* ============================================================
   MISSION BAND (ticker-style)
============================================================ */
function MissionBand() {
  const items = ["Support women entrepreneurs", "Celebrate home businesses", "A safe space by design", "Community over commerce", "Purposeful entertainment", "Beyond a single day"];
  return (
    <div className="relative -mt-1 border-y border-primary/15 bg-cream py-4 overflow-hidden">
      <div className="flex animate-[shimmer_30s_linear_infinite] gap-10 whitespace-nowrap text-sm font-semibold uppercase tracking-widest text-primary/80" style={{ backgroundSize: "200% 100%" }}>
        {[...items, ...items, ...items].map((t, i) => (
          <span key={i} className="inline-flex items-center gap-3">
            <span className="text-secondary">✦</span> {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   ABOUT
============================================================ */
function About() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-24 md:px-8">
      <div className="grid gap-12 md:grid-cols-[1.1fr_1fr] md:items-center">
        <div>
          <SectionHeading
            align="left"
            eyebrow="About Amcho Bazar"
            title={<>A festival that <span className="text-festive">belongs to her.</span></>}
            subtitle="Amcho Bazar is a women-only community event — a whole festive day where mothers, sisters, aunts and daughters set up their kitchens, boutiques and craft tables under one warm roof. It was born from the Nawait Community's belief that when women trade, teach and dream together, whole neighbourhoods bloom."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              { icon: <ShieldCheck className="h-5 w-5" />, title: "Safe by design", body: "Women-only, curated, family friendly." },
              { icon: <Store className="h-5 w-5" />, title: "Home-grown", body: "Every seller is a home-based entrepreneur." },
              { icon: <Users className="h-5 w-5" />, title: "Community first", body: "Zero commission. Every rupee stays with her." },
              { icon: <Gift className="h-5 w-5" />, title: "Beyond the day", body: "Year-round mentoring & pop-ups." },
            ].map((c) => (
              <div key={c.title} className="rounded-2xl border border-border bg-card p-5 shadow-card transition-transform hover:-translate-y-1">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {c.icon}
                </div>
                <div className="font-display text-lg font-semibold">{c.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{c.body}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-8 -z-10 rounded-[40px] bg-warm opacity-20 blur-2xl" />
          <div className="grid grid-cols-6 gap-3">
            <img className="col-span-4 aspect-[4/3] rounded-3xl object-cover shadow-card" src="https://images.unsplash.com/photo-1552071860-9b492bcd8c56?auto=format&fit=crop&w=800&q=80" alt="" />
            <img className="col-span-2 aspect-[3/4] rounded-3xl object-cover shadow-card" src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80" alt="" />
            <img className="col-span-2 aspect-[3/4] rounded-3xl object-cover shadow-card" src="https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=600&q=80" alt="" />
            <img className="col-span-4 aspect-[4/3] rounded-3xl object-cover shadow-card" src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80" alt="" />
          </div>
          <div className="glass absolute -bottom-6 left-1/2 -translate-x-1/2 rounded-full px-5 py-2 text-sm font-medium text-primary shadow-soft">
            {EVENT.city} · {EVENT.dateLabel.split("·")[0]}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   WOMEN EMPOWERMENT
============================================================ */
function WomenEmpowerment() {
  const pillars = [
    { emoji: "💫", title: "Visibility", body: "Every seller is featured on our directory, socials and stage — not lost in a crowd." },
    { emoji: "🌱", title: "First customers", body: "For many, Amcho Bazar is the day their business truly begins — real orders, real fans." },
    { emoji: "🤝", title: "Mentoring circles", body: "Older sellers guide newcomers; every month, small workshops on pricing, packaging and stories." },
    { emoji: "🎓", title: "Confidence", body: "Public speaking, styling their booth, meeting hundreds of women — a leap that lasts a lifetime." },
  ];
  return (
    <section className="relative bg-cream py-24">
      <div className="pointer-events-none absolute inset-0 pattern-dots opacity-40" />
      <div className="relative mx-auto max-w-7xl px-4 md:px-8">
        <SectionHeading
          eyebrow="Why we do this"
          title={<>When <span className="text-festive">she rises</span>, we all do.</>}
          subtitle="Amcho Bazar is more than a market day — it is a scaffolding for women's businesses to stand tall, together."
        />
        <FestiveDivider />
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-card transition-all hover:-translate-y-2 hover:shadow-glow"
            >
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-warm opacity-20 blur-2xl transition-opacity group-hover:opacity-40" />
              <div className="text-4xl">{p.emoji}</div>
              <div className="mt-4 font-display text-xl font-semibold">{p.title}</div>
              <div className="mt-2 text-sm text-muted-foreground">{p.body}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   COMMUNITY STORY
============================================================ */
function CommunityStory() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-24 md:px-8">
      <div className="grid gap-12 md:grid-cols-[1fr_1.2fr] md:items-center">
        <div className="relative">
          <div className="absolute -inset-6 -z-10 rounded-[36px] bg-accent/30 blur-2xl" />
          <img
            className="rounded-[32px] object-cover shadow-card"
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80"
            alt="Nawait Community women together"
          />
          <div className="glass absolute -bottom-6 -right-6 max-w-[220px] rounded-2xl p-4 text-sm shadow-soft">
            <div className="font-display text-lg font-semibold text-primary">"She was my first customer."</div>
            <div className="mt-1 text-muted-foreground">— Ayesha, Season 1 seller</div>
          </div>
        </div>
        <div>
          <SectionHeading
            align="left"
            eyebrow="Community story"
            title={<>Rooted in <span className="text-festive">Nawait</span>, blooming for Bhatkal.</>}
            subtitle="The Nawait Community has, for generations, held Bhatkal's women in a warm circle of mentorship, faith and enterprise. Amcho Bazar is our modern celebration of that circle — where recipes travel across streets, where a stitch becomes a livelihood, where a tea break becomes a partnership."
          />
          <div className="mt-8 grid grid-cols-3 gap-3">
            {["Est. 1968", "Nawayath heritage", "50+ chapters"].map((t) => (
              <div key={t} className="rounded-2xl border border-border bg-card p-4 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   STATS
============================================================ */
function StatsBand() {
  return (
    <section className="relative overflow-hidden bg-hero py-16 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-25 pattern-dots" />
      <div className="pointer-events-none absolute -left-16 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-warm opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-accent/30 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 md:grid-cols-4 md:px-8">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <div className="font-display text-4xl font-bold text-accent md:text-6xl">
              <AnimatedCounter value={s.value} suffix={s.suffix} />
            </div>
            <div className="mt-2 text-xs font-semibold uppercase tracking-widest text-white/70 md:text-sm">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   FEATURED CATEGORIES
============================================================ */
function FeaturedCategories() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          align="left"
          eyebrow="Featured categories"
          title={<>Every corner, a <span className="text-festive">new discovery.</span></>}
        />
        <Link to="/categories" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-secondary">
          Explore all categories <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {CATEGORIES.slice(0, 8).map((c, i) => (
          <motion.div
            key={c.key}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <Link
              to="/categories"
              className="group relative block h-full overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-glow"
            >
              <div className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${c.hue} opacity-30 blur-2xl transition-opacity group-hover:opacity-60`} />
              <div className="text-4xl">{c.emoji}</div>
              <div className="mt-4 font-display text-xl font-semibold">{c.key}</div>
              <div className="mt-1 text-sm text-muted-foreground">{c.sellers} sellers</div>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                Explore <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   FEATURED SELLERS
============================================================ */
function FeaturedSellers() {
  const featured = SELLERS.filter((s) => s.featured).slice(0, 6);
  return (
    <section className="relative bg-cream py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <SectionHeading
          eyebrow="Featured sellers"
          title={<>Meet the women behind the <span className="text-festive">magic.</span></>}
          subtitle="A tiny glimpse of the entrepreneurs preparing for Season 2 — you'll meet many more at the bazaar."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-card transition-all hover:-translate-y-2"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-festive opacity-70" />
              <div className="flex items-start gap-4">
                <img src={s.avatar} alt={s.seller} className="h-16 w-16 rounded-2xl object-cover ring-2 ring-accent/50" />
                <div className="flex-1">
                  <div className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    <Sparkles className="h-3 w-3" /> Featured
                  </div>
                  <div className="mt-1 font-display text-lg font-semibold">{s.business}</div>
                  <div className="text-sm text-muted-foreground">by {s.seller}</div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {s.products.map((p) => (
                  <span key={p} className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">{p}</span>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between text-xs">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">{s.category}</span>
                <span className="text-muted-foreground">Stall coming soon</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   PREVIOUS HIGHLIGHTS (timeline)
============================================================ */
function PreviousHighlights() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 md:px-8">
      <SectionHeading
        eyebrow="Previous highlights"
        title={<>A festival that <span className="text-festive">grew with us.</span></>}
      />
      <div className="relative mt-14">
        <div className="absolute left-6 top-0 h-full w-px bg-gradient-to-b from-primary/40 via-secondary/40 to-transparent md:left-1/2" />
        <div className="space-y-10">
          {HIGHLIGHTS.map((h, i) => (
            <motion.div
              key={h.year}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative flex flex-col gap-4 pl-16 md:flex-row md:pl-0 ${i % 2 === 0 ? "md:pr-[52%]" : "md:pl-[52%] md:pr-0"}`}
            >
              <div className="absolute left-3 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-festive text-white shadow-glow md:left-[calc(50%-12px)]">
                <span className="text-[10px]">✦</span>
              </div>
              <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
                <div className="text-xs font-semibold uppercase tracking-widest text-secondary">{h.year}</div>
                <div className="mt-2 font-display text-2xl font-semibold">{h.title}</div>
                <div className="mt-2 text-sm text-muted-foreground">{h.body}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   GALLERY PREVIEW
============================================================ */
function GalleryPreview() {
  const pics = GALLERY.slice(0, 6);
  return (
    <section className="relative overflow-hidden bg-cream py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading align="left" eyebrow="Gallery" title={<>Season 1, in <span className="text-festive">frames.</span></>} />
          <Link to="/gallery" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-secondary">
            Open full gallery <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid auto-rows-[160px] grid-cols-2 gap-3 md:grid-cols-4">
          {pics.map((p, i) => (
            <div
              key={p.id}
              className={`group relative overflow-hidden rounded-3xl shadow-card ${
                i === 0 ? "row-span-2 col-span-2" : i === 3 ? "row-span-2" : ""
              }`}
            >
              <img src={p.src} alt={p.caption} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                {p.caption}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   VISITOR GUIDELINES
============================================================ */
function VisitorGuidelines() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 md:px-8">
      <SectionHeading
        eyebrow="Visitor guidelines"
        title={<>Come dressed as your <span className="text-festive">favourite self.</span></>}
        subtitle="A few gentle notes to help everyone feel warm and welcome on the day."
      />
      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {GUIDELINES.map((g, i) => (
          <motion.div
            key={g.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="flex gap-4 rounded-3xl border border-border bg-card p-5 shadow-card"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-warm text-2xl">
              {g.icon}
            </div>
            <div>
              <div className="font-display text-lg font-semibold">{g.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{g.body}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   FAQ
============================================================ */
function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="relative bg-cream py-24">
      <div className="mx-auto max-w-3xl px-4 md:px-8">
        <SectionHeading
          eyebrow="Frequently asked"
          title={<>Everything you might <span className="text-festive">wonder.</span></>}
        />
        <div className="mt-10 space-y-3">
          {FAQS.map((f, i) => (
            <div
              key={f.q}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
            >
              <button
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-display text-base font-semibold text-foreground">{f.q}</span>
                <ChevronDown className={`h-5 w-5 shrink-0 text-primary transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              <div className={`grid transition-all duration-300 ease-out ${open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden">
                  <div className="px-5 pb-5 text-sm text-muted-foreground">{f.a}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   BECOME A SELLER CTA
============================================================ */
function BecomeASellerCta() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-24 md:px-8">
      <div className="relative overflow-hidden rounded-[40px] bg-hero p-8 text-white md:p-16">
        <div className="pointer-events-none absolute inset-0 pattern-dots opacity-25" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-warm opacity-40 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium tracking-wider text-white/90 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Season 2 registrations open
            </div>
            <h3 className="mt-5 font-display text-4xl font-black leading-tight md:text-6xl">
              Your table at Amcho Bazar is <span className="text-festive">waiting.</span>
            </h3>
            <p className="mt-4 max-w-xl text-white/80">
              Whether you cook for your street, stitch after Fajr, or paint on Sundays — bring your home-grown business to the festival. Five simple steps, one warm community.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-festive px-6 py-3 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-105"
              >
                Start registration <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/my-registration"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
              >
                Check my status
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="grid gap-3">
              {["Personal details", "Business details", "Category", "Review", "Submitted"].map((s, i) => (
                <div key={s} className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xl">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-festive text-sm font-bold text-white shadow-glow">
                    {i + 1}
                  </div>
                  <div className="text-sm font-medium">{s}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
