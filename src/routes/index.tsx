import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Heart, Sparkles, Sparkle, Users, Store, Gift, ShieldCheck, PartyPopper, ChevronDown, Flower2, Star, Sprout, HandHeart, GraduationCap, Megaphone, CalendarDays } from "lucide-react";
import { Countdown } from "@/components/site/countdown";
import { AnimatedCounter } from "@/components/site/animated-counter";
import { SectionHeading } from "@/components/site/section-heading";
import { FestiveDivider } from "@/components/site/festive-divider";
import { EVENT } from "@/lib/dummy-data";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { useHomeData, type HomeData } from "@/lib/home-data";
import { getFaqs, type Faq as FaqItem, getHeroImage, normalizeImageUrl, DEFAULT_HERO_IMAGE } from "@/lib/settings-db";
import { getAnnouncements, type Announcement } from "@/lib/announcements-db";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const d = useHomeData();
  return (
    <div className="overflow-hidden">
      <Hero season={d.activeSeason} />
      <AnnouncementsHome />
      <MissionBand />
      <About />
      <WomenEmpowerment />
      <CommunityStory />
      <StatsBand d={d} />
      <FeaturedCategories d={d} />
      <PreviousHighlights d={d} />
      <GalleryPreview d={d} />
      <VisitorGuidelines season={d.activeSeason} />
      <Faq />
      <BecomeASellerCta />
    </div>
  );
}

/* ============================================================
   HERO
============================================================ */
function Hero({ season }: { season: import("@/lib/seasons-db").Season | null }) {
  const { isAdmin } = useAuth();
  const { t } = useI18n();
  const [heroImg, setHeroImg] = useState(DEFAULT_HERO_IMAGE);
  const [heroFailed, setHeroFailed] = useState(false);
  useEffect(() => {
    getHeroImage().then((u) => {
      if (!u || u === DEFAULT_HERO_IMAGE) return; // already showing it — no swap, no flash
      // Preload the stored poster; swap the src in only once it's ready (avoids a white gap mid-swap).
      const pre = new Image();
      pre.referrerPolicy = "no-referrer";
      pre.onload = () => { setHeroImg(u); setHeroFailed(false); };
      pre.src = normalizeImageUrl(u);
    }).catch(() => {});
  }, []);
  const seasonName = season?.seasonName ?? EVENT.season;
  const eventDate = season?.eventDate ?? EVENT.dateLabel;
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
        <Flower2 className="h-9 w-9 animate-float text-accent/60" />
      </div>
      <div className="pointer-events-none absolute right-16 top-40 hidden md:block">
        <Sparkle className="h-11 w-11 animate-float text-accent/50" style={{ animationDelay: "1.2s" }} />
      </div>
      <div className="pointer-events-none absolute right-8 bottom-32 hidden md:block">
        <Star className="h-7 w-7 animate-float text-secondary/60" style={{ animationDelay: "2.4s" }} />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 md:grid-cols-[1.15fr_1fr] md:items-center md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-wider text-white/90 backdrop-blur-md">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            {EVENT.organizer} {t("home.presents")} · {seasonName}
          </div>

          <h1 className="mt-6 font-display text-5xl font-black leading-[1.1] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            Amcho <span className="text-warm">Bazar</span>
          </h1>
          <p className="mt-3 font-script text-3xl text-accent md:text-4xl">Amchi Market · Amchi Manshay</p>

          <p className="mt-6 max-w-xl text-lg text-white/80">{t("home.hero.blurb")}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="group inline-flex items-center gap-2 rounded-full bg-festive px-6 py-3 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.03]"
            >
              {t("menu.becomeSeller")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            {isAdmin && (
              <Link
                to="/draw"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
              >
                <Sparkles className="h-4 w-4 text-accent" />
                {t("home.hero.watchDraw")}
              </Link>
            )}
          </div>

          <div className="mt-10 max-w-lg">
            <div className="mb-3 text-xs uppercase tracking-[0.3em] text-white/60">{t("home.hero.doorsOpen")}</div>
            <Countdown target={EVENT.dateISO} />
            <div className="mt-3 text-sm text-white/70">{eventDate}</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotate: -6 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="relative mx-auto w-full max-w-sm"
        >
          <div className="absolute -inset-6 -z-10 rounded-[40px] bg-warm blur-3xl opacity-40" />
          <div className="relative aspect-square">
            {/* Rotating festive ring around the poster */}
            <div className="pointer-events-none absolute -inset-3 animate-spin-slow rounded-[40px] border-2 border-dashed border-accent/40" />
            <img
              src={heroFailed ? DEFAULT_HERO_IMAGE : normalizeImageUrl(heroImg)}
              onError={() => setHeroFailed(true)}
              alt="Amcho Bazar Season 3 — Amchi Market, Amchi Manshay"
              referrerPolicy="no-referrer"
              loading="eager"
              fetchPriority="high"
              className="relative h-full w-full rounded-[32px] object-cover shadow-glow ring-1 ring-accent/30 drop-shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
            />
          </div>

          {/* Floating chips */}
          <FloatingChip className="left-0 top-4" delay={0}>
            <Users className="h-4 w-4 text-accent" /> Nawait Community
          </FloatingChip>
          <FloatingChip className="right-2 top-16" delay={0.6}>
            <Heart className="h-4 w-4 text-secondary" /> {t("home.chip.womenOnly")}
          </FloatingChip>
          <FloatingChip className="right-6 bottom-10" delay={1.2}>
            <Store className="h-4 w-4 text-accent" /> {t("home.chip.stalls")}
          </FloatingChip>
          <FloatingChip className="left-4 bottom-4" delay={1.8}>
            <PartyPopper className="h-4 w-4 text-accent" /> {t("home.chip.liveDraw")}
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
  const { t } = useI18n();
  const items = ["home.mission.1", "home.mission.2", "home.mission.3", "home.mission.4", "home.mission.5", "home.mission.6"];
  return (
    <div className="relative -mt-1 border-y border-primary/15 bg-cream py-4 overflow-hidden">
      <div className="flex animate-[shimmer_30s_linear_infinite] gap-10 whitespace-nowrap text-sm font-semibold uppercase tracking-widest text-primary/80" style={{ backgroundSize: "200% 100%" }}>
        {[...items, ...items, ...items].map((key, i) => (
          <span key={i} className="inline-flex items-center gap-3">
            <Sparkle className="h-3 w-3 text-secondary" aria-hidden="true" /> {t(key)}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   ANNOUNCEMENTS (latest, from Firestore) — hidden when there are none
============================================================ */
function annDate(ts: unknown): string {
  const a = ts as { toDate?: () => Date; seconds?: number };
  const dt = typeof a?.toDate === "function" ? a.toDate() : typeof a?.seconds === "number" ? new Date(a.seconds * 1000) : null;
  return dt ? dt.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";
}

function AnnouncementsHome() {
  const { t } = useI18n();
  const [items, setItems] = useState<Announcement[]>([]);
  useEffect(() => { getAnnouncements().then((a) => setItems(a.slice(0, 3))).catch(() => {}); }, []);
  if (items.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-secondary">
            <Megaphone className="h-4 w-4" /> {t("ann.eyebrow")}
          </div>
          <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">{t("ann.title")}</h2>
        </div>
        <Link to="/announcements" className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-primary shadow-soft transition-colors hover:bg-muted">
          {t("home.viewAll")} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {items.map((a) => (
          <Link
            key={a.id}
            to="/announcements"
            className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow"
          >
            {a.imageUrl && (
              <img src={normalizeImageUrl(a.imageUrl)} alt={a.title} loading="lazy" referrerPolicy="no-referrer" className="h-40 w-full object-cover" />
            )}
            <div className="flex flex-1 flex-col p-5">
              {annDate(a.createdAt) && (
                <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" /> {annDate(a.createdAt)}
                </div>
              )}
              <h3 className="mt-1.5 font-display text-lg font-bold leading-tight">{a.title}</h3>
              {a.body && <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground">{a.body}</p>}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   ABOUT
============================================================ */
function About() {
  const { t } = useI18n();
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-24 md:px-8">
      <div className="grid gap-12 md:grid-cols-[1.1fr_1fr] md:items-center">
        <div>
          <SectionHeading
            align="left"
            eyebrow={t("home.about.eyebrow")}
            title={t("home.about.title")}
            subtitle={t("home.about.subtitle")}
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              { icon: <ShieldCheck className="h-5 w-5" />, title: t("home.about.c1t"), body: t("home.about.c1b") },
              { icon: <Store className="h-5 w-5" />, title: t("home.about.c2t"), body: t("home.about.c2b") },
              { icon: <Users className="h-5 w-5" />, title: t("home.about.c3t"), body: t("home.about.c3b") },
              { icon: <Gift className="h-5 w-5" />, title: t("home.about.c4t"), body: t("home.about.c4b") },
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
            <img loading="lazy" className="col-span-4 aspect-[4/3] rounded-3xl object-cover shadow-card" src="https://images.unsplash.com/photo-1552071860-9b492bcd8c56?auto=format&fit=crop&w=800&q=80" alt="" />
            <img loading="lazy" className="col-span-2 aspect-[3/4] rounded-3xl object-cover shadow-card" src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80" alt="" />
            <img loading="lazy" className="col-span-2 aspect-[3/4] rounded-3xl object-cover shadow-card" src="https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=600&q=80" alt="" />
            <img loading="lazy" className="col-span-4 aspect-[4/3] rounded-3xl object-cover shadow-card" src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80" alt="" />
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
  const { t } = useI18n();
  const pillars = [
    { icon: Sparkles, title: t("home.empower.p1t"), body: t("home.empower.p1b") },
    { icon: Sprout, title: t("home.empower.p2t"), body: t("home.empower.p2b") },
    { icon: HandHeart, title: t("home.empower.p3t"), body: t("home.empower.p3b") },
    { icon: GraduationCap, title: t("home.empower.p4t"), body: t("home.empower.p4b") },
  ];
  return (
    <section className="relative bg-cream py-24">
      <div className="pointer-events-none absolute inset-0 pattern-dots opacity-40" />
      <div className="relative mx-auto max-w-7xl px-4 md:px-8">
        <SectionHeading
          eyebrow={t("home.empower.eyebrow")}
          title={t("home.empower.title")}
          subtitle={t("home.empower.subtitle")}
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
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                <p.icon className="h-6 w-6" />
              </div>
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
  const { t } = useI18n();
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-24 md:px-8">
      <div className="grid gap-12 md:grid-cols-[1fr_1.2fr] md:items-center">
        <div className="relative">
          <div className="absolute -inset-6 -z-10 rounded-[36px] bg-accent/30 blur-2xl" />
          <img
            loading="lazy"
            className="rounded-[32px] object-cover shadow-card"
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80"
            alt="Nawait Community women together"
          />
          <div className="glass absolute -bottom-6 -right-6 max-w-[220px] rounded-2xl p-4 text-sm shadow-soft">
            <div className="font-display text-lg font-semibold text-primary">{t("home.story.quote")}</div>
            <div className="mt-1 text-muted-foreground">{t("home.story.quoteBy")}</div>
          </div>
        </div>
        <div>
          <SectionHeading
            align="left"
            eyebrow={t("home.story.eyebrow")}
            title={t("home.story.title")}
            subtitle={t("home.story.subtitle")}
          />
          <div className="mt-8 grid grid-cols-3 gap-3">
            {["home.story.chip1", "home.story.chip2", "home.story.chip3"].map((key) => (
              <div key={key} className="rounded-2xl border border-border bg-card p-4 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t(key)}
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
function StatsBand({ d }: { d: HomeData }) {
  const { t } = useI18n();
  const stats = [
    { label: t("home.stat.entrepreneurs"), value: d.entrepreneurs, suffix: d.entrepreneurs ? "+" : "" },
    { label: t("home.stat.categories"), value: d.categories.length, suffix: "" },
    { label: t("home.stat.availStalls"), value: d.availableStalls, suffix: "" },
    { label: t("home.stat.seasons"), value: d.completedSeasons, suffix: "" },
  ];
  return (
    <section className="relative overflow-hidden bg-hero py-16 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-25 pattern-dots" />
      <div className="pointer-events-none absolute -left-16 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-warm opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-accent/30 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 md:grid-cols-4 md:px-8">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="font-display text-4xl font-bold tabular-nums text-accent md:text-6xl">
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
function FeaturedCategories({ d }: { d: HomeData }) {
  const { isAdmin } = useAuth();
  const { t } = useI18n();
  const cats = d.categories.filter((c) => c.status === "active").slice(0, 8);
  if (!d.loading && cats.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          align="left"
          eyebrow={t("home.featCat.eyebrow")}
          title={t("home.featCat.title")}
        />
        {isAdmin && (
          <Link to="/categories" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-secondary">
            {t("home.featCat.exploreAll")} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {cats.map((c, i) => {
          const count = d.categoryCounts[c.id!] ?? 0;
          const cardClass =
            "group relative block h-full overflow-hidden rounded-3xl border border-border bg-card shadow-card transition-all hover:-translate-y-1 hover:shadow-glow";
          const inner = (
            <>
              {c.imageUrl ? (
                <img src={normalizeImageUrl(c.imageUrl)} alt={c.name} loading="lazy" referrerPolicy="no-referrer" className="aspect-[16/10] w-full object-cover" />
              ) : (
                <div className="flex aspect-[16/10] w-full items-center justify-center bg-warm text-5xl">{c.emoji}</div>
              )}
              <div className="p-6">
                <div className="font-display text-xl font-semibold">{c.name}</div>
                {count > 0 && <div className="mt-1 text-sm text-muted-foreground">{count} {t("home.sellersWord")}</div>}
                {c.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>}
                {isAdmin && (
                  <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    {t("home.featCat.explore")} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                )}
              </div>
            </>
          );
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              {isAdmin ? (
                <Link to="/categories" className={cardClass}>{inner}</Link>
              ) : (
                <div className={cardClass}>{inner}</div>
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/* ============================================================
   PREVIOUS HIGHLIGHTS (timeline)
============================================================ */
function PreviousHighlights({ d }: { d: HomeData }) {
  const { t } = useI18n();
  if (!d.loading && d.highlights.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 md:px-8">
      <SectionHeading
        eyebrow={t("home.hl.eyebrow")}
        title={t("home.hl.title")}
      />
      <div className="relative mt-14">
        <div className="absolute left-6 top-0 h-full w-px bg-gradient-to-b from-primary/40 via-secondary/40 to-transparent md:left-1/2" />
        <div className="space-y-10">
          {d.highlights.map((h, i) => (
            <motion.div
              key={h.season.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative flex flex-col gap-4 pl-16 md:flex-row md:pl-0 ${i % 2 === 0 ? "md:pr-[52%]" : "md:pl-[52%] md:pr-0"}`}
            >
              <div className="absolute left-3 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-festive text-white shadow-glow md:left-[calc(50%-12px)]">
                <Sparkle className="h-2.5 w-2.5" aria-hidden="true" />
              </div>
              <div className="w-full rounded-3xl border border-border bg-card p-6 shadow-card">
                <div className="font-display text-2xl font-semibold">{h.season.seasonName}</div>
                {h.season.eventDate && <div className="mt-1 text-sm text-muted-foreground">{h.season.eventDate}</div>}
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <HlStat value={h.registered} label={t("home.hl.registered")} />
                  <HlStat value={h.selected} label={t("home.hl.selected")} />
                  <HlStat value={h.stalls} label={t("home.hl.stalls")} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HlStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-muted/60 p-3">
      <div className="font-display text-2xl font-bold tabular-nums text-primary">{value}</div>
      <div className="mt-0.5 text-[11px] font-medium text-muted-foreground">{label}</div>
    </div>
  );
}

/* ============================================================
   GALLERY PREVIEW
============================================================ */
function GalleryPreview({ d }: { d: HomeData }) {
  const { t } = useI18n();
  const pics = d.galleryPreview;
  if (!d.loading && pics.length === 0) return null;
  return (
    <section className="relative overflow-hidden bg-cream py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading align="left" eyebrow={t("home.gallery.eyebrow")} title={t("home.gallery.title")} />
          <Link to="/gallery" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-secondary">
            {t("home.gallery.open")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid auto-rows-[160px] grid-cols-2 gap-3 md:grid-cols-4">
          {pics.map((p, i) => (
            <div
              key={p.src + i}
              className={`group relative overflow-hidden rounded-3xl shadow-card ${
                i === 0 ? "row-span-2 col-span-2" : i === 3 ? "row-span-2" : ""
              }`}
            >
              <img src={p.src} alt={p.caption} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
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
function VisitorGuidelines({ season }: { season: import("@/lib/seasons-db").Season | null }) {
  const { t } = useI18n();
  const guidelines = season?.guidelines?.filter((g) => g.trim()) ?? [];
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 md:px-8">
      <SectionHeading
        eyebrow={t("home.guide.eyebrow")}
        title={t("home.guide.title")}
        subtitle={t("home.guide.subtitle")}
      />
      {guidelines.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
          {t("home.guide.soon")}
        </div>
      ) : (
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {guidelines.map((g, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="flex gap-4 rounded-3xl border border-border bg-card p-5 shadow-card"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-warm text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="self-center text-sm text-foreground/90">{g}</div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ============================================================
   FAQ
============================================================ */
// Built-in default FAQ (from i18n) shown until an admin saves custom ones.
const DEFAULT_FAQ_COUNT = 6;

function Faq() {
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(0);
  const [custom, setCustom] = useState<FaqItem[] | null>(null);
  useEffect(() => { getFaqs().then((f) => setCustom(f.length ? f : null)).catch(() => {}); }, []);

  const items: FaqItem[] = custom
    ? custom
    : Array.from({ length: DEFAULT_FAQ_COUNT }, (_, i) => ({ q: t(`home.faq.${i}.q`), a: t(`home.faq.${i}.a`) }));

  return (
    <section className="relative bg-cream py-24">
      <div className="mx-auto max-w-3xl px-4 md:px-8">
        <SectionHeading
          eyebrow={t("home.faq.eyebrow")}
          title={t("home.faq.title")}
        />
        <div className="mt-10 space-y-3">
          {items.map((f, i) => (
            <div
              key={f.q + i}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
            >
              <button
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
              >
                <span className="font-display text-base font-semibold text-foreground">{f.q}</span>
                <ChevronDown className={`h-5 w-5 shrink-0 text-primary transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              <div className={`grid transition-all duration-300 ease-out ${open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden">
                  <div className="whitespace-pre-line px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</div>
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
  const { t } = useI18n();
  const { isAdmin } = useAuth();
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-24 md:px-8">
      <div className="relative overflow-hidden rounded-[40px] bg-hero p-8 text-white md:p-16">
        <div className="pointer-events-none absolute inset-0 pattern-dots opacity-25" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-warm opacity-40 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium tracking-wider text-white/90 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {t("home.cta.badge")}
            </div>
            <h3 className="mt-5 font-display text-4xl font-black leading-tight md:text-6xl">
              {t("home.cta.title")}
            </h3>
            <p className="mt-4 max-w-xl text-white/80">
              {t("home.cta.subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {isAdmin ? (
                <span aria-disabled className="inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-festive px-6 py-3 text-sm font-semibold text-white opacity-60">
                  {t("home.cta.start")} <ArrowRight className="h-4 w-4" />
                </span>
              ) : (
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-festive px-6 py-3 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-105"
                >
                  {t("home.cta.start")} <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              {isAdmin ? (
                <span aria-disabled className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white opacity-60">
                  {t("home.cta.status")}
                </span>
              ) : (
                <Link
                  to="/my-registration"
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
                >
                  {t("home.cta.status")}
                </Link>
              )}
            </div>
          </div>
          <div className="relative">
            <div className="grid gap-3">
              {["home.step.1", "home.step.2", "home.step.3", "home.step.4", "home.step.5"].map((key, i) => (
                <div key={key} className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xl">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-festive text-sm font-bold text-white shadow-glow">
                    {i + 1}
                  </div>
                  <div className="text-sm font-medium">{t(key)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
