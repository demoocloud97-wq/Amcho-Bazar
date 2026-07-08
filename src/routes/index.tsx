import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Heart, Sparkles, Sparkle, Users, Store, Gift, ShieldCheck, PartyPopper, ChevronDown, Flower2, Star, Sprout, HandHeart, GraduationCap, Megaphone, CalendarDays, MapPin, Navigation, CalendarPlus, Clock, Car, Landmark, Phone, Utensils, Shirt, Gem, Smile, NotebookPen, Home as HomeIcon, Palette, type LucideIcon } from "lucide-react";
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
      <EventLocation season={d.activeSeason} />
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
    <div className="marquee-pause relative -mt-1 overflow-hidden border-y border-primary/15 bg-cream py-4">
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap text-sm font-semibold uppercase tracking-widest text-primary/80">
        {[...items, ...items].map((key, i) => (
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
  const single = items.length === 1;
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

      {single ? (
        /* One announcement — a wide card. */
        <Link
          to="/announcements"
          className="group mt-8 grid overflow-hidden rounded-3xl border border-border bg-card shadow-card transition-shadow hover:shadow-glow md:grid-cols-2"
        >
          <div className="relative min-h-[220px] overflow-hidden">
            {items[0].imageUrl ? (
              <img src={normalizeImageUrl(items[0].imageUrl)} alt={items[0].title} loading="lazy" referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <div className="flex h-full min-h-[220px] w-full items-center justify-center bg-hero"><Megaphone className="h-10 w-10 text-white/80" /></div>
            )}
          </div>
          <div className="flex flex-col justify-center p-6 md:p-8">
            {annDate(items[0].createdAt) && (
              <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" /> {annDate(items[0].createdAt)}</div>
            )}
            <h3 className="mt-1.5 font-display text-2xl font-bold leading-tight">{items[0].title}</h3>
            {items[0].body && <p className="mt-2 line-clamp-4 text-sm text-muted-foreground">{items[0].body}</p>}
          </div>
        </Link>
      ) : (
        /* A few announcements — a clean grid, each shown once. */
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <Link
              key={a.id}
              to="/announcements"
              className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow"
            >
              <div className="relative h-44 w-full overflow-hidden">
                {a.imageUrl ? (
                  <img src={normalizeImageUrl(a.imageUrl)} alt={a.title} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-hero"><Megaphone className="h-8 w-8 text-white/80" /></div>
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              <div className="flex flex-1 flex-col p-5">
                {annDate(a.createdAt) && (
                  <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" /> {annDate(a.createdAt)}</div>
                )}
                <h3 className="mt-1.5 line-clamp-1 font-display text-lg font-bold leading-tight">{a.title}</h3>
                {a.body && <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{a.body}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
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
            <img loading="lazy" referrerPolicy="no-referrer" className="col-span-4 aspect-[4/3] rounded-3xl object-cover shadow-card" src={normalizeImageUrl("https://drive.google.com/file/d/1WVsMfO5_rQ2F_D1jsnbfkA_FBQIsEOz5/view?usp=drive_link")} alt="Amcho Bazar" />
            <img loading="lazy" referrerPolicy="no-referrer" className="col-span-2 aspect-[3/4] rounded-3xl object-cover shadow-card" src={normalizeImageUrl("https://drive.google.com/file/d/1POtdIPj5FzrCTLjXkuYw9KFohR_RZzfu/view?usp=drive_link")} alt="Amcho Bazar" />
            <img loading="lazy" referrerPolicy="no-referrer" className="col-span-2 aspect-[3/4] rounded-3xl object-cover shadow-card" src={normalizeImageUrl("https://drive.google.com/file/d/10fIzT0b7omcnqrpkbMFPHHAd_xlxaWL4/view?usp=drive_link")} alt="Amcho Bazar" />
            <img loading="lazy" referrerPolicy="no-referrer" className="col-span-4 aspect-[4/3] rounded-3xl object-cover shadow-card" src={normalizeImageUrl("https://drive.google.com/file/d/1uar8c2TTHouCWZvHcQWVx9dcdidD6GKf/view?usp=drive_link")} alt="Amcho Bazar" />
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
            referrerPolicy="no-referrer"
            className="w-full rounded-[32px] object-cover shadow-card"
            src={normalizeImageUrl("https://drive.google.com/file/d/1hXOPpdaFwJ3-V_Uh1HZGHmJsigOO-zHB/view?usp=drive_link")}
            alt="Amcho Bazar — stalls and sellers"
          />
          <div className="absolute -bottom-8 -right-12 z-10 max-w-[210px] rounded-2xl border border-border bg-card p-3.5 shadow-glow md:-right-32">
            <div className="font-display text-xs font-semibold leading-snug text-primary">{t("home.story.quote")}</div>
            {t("home.story.quoteBy") && <div className="mt-1 text-[11px] text-muted-foreground">{t("home.story.quoteBy")}</div>}
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
// Colour themes keyed by colour name (Tailwind default palette).
const CAT_THEMES: Record<string, { grad: string; text: string; badgeBg: string; badgeText: string; strip: string }> = {
  orange: { grad: "from-orange-100 to-orange-200", text: "text-orange-600", badgeBg: "bg-orange-100", badgeText: "text-orange-600", strip: "bg-orange-500" },
  purple: { grad: "from-purple-100 to-purple-200", text: "text-purple-600", badgeBg: "bg-purple-100", badgeText: "text-purple-600", strip: "bg-purple-500" },
  amber: { grad: "from-amber-100 to-amber-200", text: "text-amber-700", badgeBg: "bg-amber-100", badgeText: "text-amber-700", strip: "bg-amber-500" },
  pink: { grad: "from-pink-100 to-pink-200", text: "text-pink-600", badgeBg: "bg-pink-100", badgeText: "text-pink-600", strip: "bg-pink-500" },
  blue: { grad: "from-blue-100 to-blue-200", text: "text-blue-600", badgeBg: "bg-blue-100", badgeText: "text-blue-600", strip: "bg-blue-500" },
  teal: { grad: "from-teal-100 to-teal-200", text: "text-teal-700", badgeBg: "bg-teal-100", badgeText: "text-teal-700", strip: "bg-teal-500" },
  green: { grad: "from-green-100 to-green-200", text: "text-green-700", badgeBg: "bg-green-100", badgeText: "text-green-700", strip: "bg-green-500" },
  stone: { grad: "from-stone-200 to-stone-300", text: "text-stone-700", badgeBg: "bg-stone-200", badgeText: "text-stone-700", strip: "bg-stone-500" },
  rose: { grad: "from-rose-100 to-rose-200", text: "text-rose-600", badgeBg: "bg-rose-100", badgeText: "text-rose-600", strip: "bg-rose-500" },
  indigo: { grad: "from-indigo-100 to-indigo-200", text: "text-indigo-600", badgeBg: "bg-indigo-100", badgeText: "text-indigo-600", strip: "bg-indigo-500" },
};
const THEME_ORDER = ["orange", "purple", "amber", "pink", "blue", "teal", "green", "stone", "rose", "indigo"];

// Match each category to a fixed colour by name; unknown names cycle by position.
function catColor(name: string, i: number): string {
  const n = name.toLowerCase();
  if (/food|snack|eat|biryani|sweet|bak|drink|juice/.test(n)) return "orange";
  if (/cloth|dress|fashion|frock|wear|boutique|lawn|garment/.test(n)) return "purple";
  if (/jewel|gold|ornament/.test(n)) return "amber";
  if (/beauty|cosmet|skincare|henna|makeup|salon/.test(n)) return "pink";
  if (/kid|child|toy|baby/.test(n)) return "blue";
  if (/station|book|paper|art suppl/.test(n)) return "teal";
  if (/house|home|decor|crockery|kitchenware|plastic|gadget/.test(n)) return "green";
  if (/handmade|artisan|craft/.test(n)) return "stone";
  if (/gift/.test(n)) return "rose";
  if (/shop|store|misc/.test(n)) return "indigo";
  return THEME_ORDER[i % THEME_ORDER.length];
}

function ZigzagStrip({ colorClass }: { colorClass: string }) {
  return (
    <div className="relative z-10 -mb-2 flex gap-6 px-3">
      <span className={`zigzag-bunting block h-3 w-[45%] rounded-t-md ${colorClass}`} />
      <span className={`zigzag-bunting block h-3 w-[45%] rounded-t-md ${colorClass}`} />
    </div>
  );
}

// Map a category name to a themed line icon; unknown names fall back to the emoji/logo.
function catIcon(name: string): LucideIcon | null {
  const n = name.toLowerCase();
  if (/food|snack|eat|kitchen|bak|sweet|biryani|drink|juice|chai/.test(n)) return Utensils;
  if (/cloth|dress|fashion|frock|wear|boutique|lawn|garment/.test(n)) return Shirt;
  if (/jewel|gold|ornament/.test(n)) return Gem;
  if (/beauty|cosmet|skincare|henna|makeup|salon/.test(n)) return Sparkles;
  if (/kid|child|toy|baby/.test(n)) return Smile;
  if (/station|book|paper|art suppl/.test(n)) return NotebookPen;
  if (/house|home|decor|crockery|gadget|kitchenware|plastic/.test(n)) return HomeIcon;
  if (/handmade|artisan|craft|show ?piece/.test(n)) return Palette;
  if (/gift/.test(n)) return Gift;
  return null;
}

// Use the category's own description; otherwise fall back to a sensible one by name.
function catDesc(name: string, existing?: string): string {
  if (existing && existing.trim()) return existing.trim();
  const n = name.toLowerCase();
  if (/food|snack|eat|biryani|sweet|bak|drink|juice/.test(n)) return "Traditional dishes, homemade snacks, desserts and beverages.";
  if (/cloth|dress|fashion|frock|wear|boutique|lawn|garment/.test(n)) return "Ethnic wear, contemporary styles and festive fashion from local designers.";
  if (/jewel|gold|ornament/.test(n)) return "Handcrafted ornaments, traditional gold designs and modern statement pieces.";
  if (/beauty|cosmet|skincare|henna|makeup|salon/.test(n)) return "Natural skincare, cosmetics and wellness essentials curated with care.";
  if (/kid|child|toy|baby/.test(n)) return "Playful clothing, toys and treats made for the little ones.";
  if (/station|book|paper|art suppl/.test(n)) return "Notebooks, art supplies and paper goods from independent makers.";
  if (/house|home|decor|crockery|kitchenware|plastic|gadget/.test(n)) return "Home decor, kitchenware and everyday essentials with a local touch.";
  if (/handmade|artisan|craft/.test(n)) return "One-of-a-kind creations from artisans across the community.";
  if (/gift/.test(n)) return "Thoughtful gifts, hampers and keepsakes for every occasion.";
  if (/shop|store|misc/.test(n)) return "A little bit of everything from your favourite local sellers.";
  return "Discover unique products from talented local entrepreneurs.";
}

function FeaturedCategories({ d }: { d: HomeData }) {
  const { isAdmin } = useAuth();
  const { t } = useI18n();
  const cats = d.categories.filter((c) => c.status === "active").slice(0, 8);
  if (!d.loading && cats.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 md:px-8">
      {/* Heading */}
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-secondary/25 bg-secondary/5 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-secondary">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary" /> {t("home.featCat.eyebrow")}
        </span>
        <h2 className="mt-6 font-display text-4xl font-bold leading-tight text-foreground md:text-5xl">
          {t("home.featCat.title")}{" "}
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Amcho Bazar</span>
        </h2>
        <p className="mt-5 text-lg text-muted-foreground">{t("home.featCat.subtitle")}</p>
      </div>

      {/* Grid */}
      <div className="mt-14 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {cats.map((c, i) => {
          const count = d.categoryCounts[c.id!] ?? 0;
          const th = CAT_THEMES[catColor(c.name, i)];
          const Icon = catIcon(c.name);
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: (i % 4) * 0.05 }}
            >
              <div className="group h-full transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.02]">
                <ZigzagStrip colorClass={th.strip} />
                <div className="flex h-full min-h-[320px] flex-col rounded-2xl border border-slate-100 bg-white p-8 pt-10 shadow-sm transition-shadow duration-200 group-hover:shadow-xl">
                <div className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${th.grad}`}>
                  {Icon ? (
                    <Icon className={`h-7 w-7 ${th.text}`} strokeWidth={2} />
                  ) : c.imageUrl ? (
                    <img src={normalizeImageUrl(c.imageUrl)} alt={c.name} loading="lazy" referrerPolicy="no-referrer" className="h-9 w-9 object-contain" />
                  ) : (
                    <span className="text-3xl leading-none">{c.emoji}</span>
                  )}
                </div>
                <h3 className="mt-5 font-display text-2xl font-bold text-slate-900">{c.name}</h3>
                <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-slate-500">{catDesc(c.name, c.description)}</p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-6">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${th.badgeBg} ${th.badgeText}`}>
                    🏠 {count} {t("home.sellersWord")}
                  </span>
                  <Link to={isAdmin ? "/categories" : "/stalls"} className={`inline-flex items-center gap-1 text-sm font-semibold ${th.text} hover:underline`}>
                    {t("home.featCat.explore")} <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </div>
                </div>
              </div>
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
   EVENT LOCATION (from active season)
============================================================ */
// Default venue — used until an admin sets the location on the active season.
const DEFAULT_LOCATION = {
  venue: "Chandi Banquet",
  fullAddress: "Chandi Banquet, Karachi",
  latitude: 24.9105986,
  longitude: 67.0374058,
  googleMapsLink: "https://maps.app.goo.gl/jpzXHpzZJwtWS5Xo8",
};

type LocData = {
  seasonName: string; city?: string; venue: string; fullAddress: string;
  latitude: number; longitude: number; googleMapsLink: string;
  eventDate?: string; eventTime?: string; parkingDetails?: string; nearbyLandmark?: string; contactNumber?: string;
};

function EventLocation({ season }: { season: import("@/lib/seasons-db").Season | null }) {
  const { t } = useI18n();
  const s = season;
  // Active season's location wins; fall back to the default venue so the map always works.
  const loc: LocData = {
    seasonName: s?.seasonName ?? EVENT.season,
    city: s?.city,
    venue: s?.venue || DEFAULT_LOCATION.venue,
    fullAddress: s?.fullAddress || DEFAULT_LOCATION.fullAddress,
    latitude: s?.latitude ?? DEFAULT_LOCATION.latitude,
    longitude: s?.longitude ?? DEFAULT_LOCATION.longitude,
    googleMapsLink: s?.googleMapsLink || DEFAULT_LOCATION.googleMapsLink,
    eventDate: s?.eventDate,
    eventTime: s?.eventTime,
    parkingDetails: s?.parkingDetails,
    nearbyLandmark: s?.nearbyLandmark,
    contactNumber: s?.contactNumber,
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-24 md:px-8">
      <SectionHeading eyebrow={t("loc.eyebrow")} title={t("loc.title")} subtitle={t("loc.subtitle")} />
      <LocationCard loc={loc} />
    </section>
  );
}

function LocationRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</span>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}

function LocationCard({ loc }: { loc: LocData }) {
  const { t } = useI18n();
  const q = `${loc.latitude},${loc.longitude}`;
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=16&output=embed`;
  const directionsUrl = loc.googleMapsLink || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
  const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(loc.seasonName || "Amcho Bazar")}&location=${encodeURIComponent(loc.fullAddress || loc.venue)}&details=${encodeURIComponent([loc.eventDate, loc.eventTime].filter(Boolean).join(" · "))}`;

  return (
    <div className="mt-12 grid gap-6 lg:grid-cols-2">
      {/* Left — info card */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-card md:p-8">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-festive via-accent to-secondary" />
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-warm opacity-30 blur-2xl" />
        <div className="relative flex items-start gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-festive text-white shadow-soft"><MapPin className="h-6 w-6" /></span>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-secondary">{t("loc.venue")}</div>
            <h3 className="font-display text-2xl font-bold leading-tight">{loc.venue}</h3>
            {loc.city && <div className="text-sm text-muted-foreground">{loc.city}</div>}
          </div>
        </div>

        <div className="relative mt-6 divide-y divide-border overflow-hidden rounded-2xl border border-border">
          <LocationRow icon={<MapPin className="h-4 w-4" />} label={t("loc.address")} value={loc.fullAddress} />
          <LocationRow icon={<CalendarDays className="h-4 w-4" />} label={t("loc.date")} value={loc.eventDate} />
          <LocationRow icon={<Clock className="h-4 w-4" />} label={t("loc.time")} value={loc.eventTime} />
          <LocationRow icon={<Car className="h-4 w-4" />} label={t("loc.parking")} value={loc.parkingDetails} />
          <LocationRow icon={<Landmark className="h-4 w-4" />} label={t("loc.landmark")} value={loc.nearbyLandmark} />
          <LocationRow icon={<Phone className="h-4 w-4" />} label={t("loc.contact")} value={loc.contactNumber} />
        </div>
      </div>

      {/* Right — map + actions */}
      <div className="flex flex-col gap-4">
        <div className="group relative min-h-[300px] flex-1 overflow-hidden rounded-3xl border border-border shadow-card ring-1 ring-accent/20">
          <iframe
            title={loc.venue}
            src={mapSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            className="absolute inset-0 h-full w-full grayscale-[0.2] transition-all duration-500 group-hover:grayscale-0"
          />
          {/* Floating venue chip */}
          <div className="pointer-events-none absolute left-4 top-4 inline-flex max-w-[75%] items-center gap-2 rounded-full bg-card/90 px-3 py-1.5 text-xs font-semibold text-foreground shadow-soft ring-1 ring-border backdrop-blur">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-festive text-white"><MapPin className="h-3 w-3" /></span>
            <span className="truncate">{loc.venue}</span>
          </div>
          {/* Subtle inner border for depth */}
          <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="group/btn inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-festive px-5 py-3 text-sm font-bold text-white shadow-soft transition-all hover:scale-[1.02] hover:shadow-glow">
            <Navigation className="h-4 w-4 transition-transform group-hover/btn:-rotate-12" /> {t("loc.directions")}
          </a>
          <a href={calUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-semibold text-primary shadow-soft transition-colors hover:border-primary/40 hover:bg-muted">
            <CalendarPlus className="h-4 w-4" /> {t("loc.addCalendar")}
          </a>
        </div>
      </div>
    </div>
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
