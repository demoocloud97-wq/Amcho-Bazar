import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { Award, PartyPopper, Play, Pause, RotateCcw, Sparkles } from "lucide-react";
import { EVENT, SELLERS } from "@/lib/dummy-data";

const CATEGORY_COLORS: Record<string, { bg: string; ring: string; canopy: string; label: string }> = {
  Food:       { bg: "#F26B2A", ring: "rgba(242,107,42,0.55)",  canopy: "#C24E17", label: "Food" },
  Clothing:   { bg: "#8B5CF6", ring: "rgba(139,92,246,0.55)",  canopy: "#5B21B6", label: "Clothing" },
  Jewellery:  { bg: "#FFC94A", ring: "rgba(255,201,74,0.6)",   canopy: "#B8860B", label: "Jewellery" },
  Beauty:     { bg: "#EC4899", ring: "rgba(236,72,153,0.55)",  canopy: "#9D174D", label: "Beauty" },
  Household:  { bg: "#22C55E", ring: "rgba(34,197,94,0.55)",   canopy: "#15803D", label: "Household" },
  Kids:       { bg: "#3B82F6", ring: "rgba(59,130,246,0.55)",  canopy: "#1D4ED8", label: "Kids" },
  Handmade:   { bg: "#A16207", ring: "rgba(161,98,7,0.55)",    canopy: "#5C3A08", label: "Handmade" },
  Stationery: { bg: "#1FA7A6", ring: "rgba(31,167,166,0.55)",  canopy: "#0E5F5E", label: "Stationery" },
  Others:     { bg: "#7A1E3D", ring: "rgba(122,30,61,0.55)",   canopy: "#4A0E23", label: "Others" },
};

export const Route = createFileRoute("/draw")({
  head: () => ({
    meta: [
      { title: "Live Stall Draw Ceremony · Amcho Bazar" },
      { name: "description", content: "Watch the live stall draw ceremony — 45 lucky women entrepreneurs assigned their stalls in real time." },
      { property: "og:title", content: "Live Stall Draw · Amcho Bazar Season 2" },
      { property: "og:description", content: "A festival-worthy random draw ceremony — with lottery drum, confetti and celebration." },
    ],
  }),
  component: DrawPage,
});

type Selected = {
  order: number;
  stallNo: number;
  seller: string;
  business: string;
  category: string;
  avatar: string;
  id: string;
  at: string;
};

const TARGET = EVENT.totalWinners; // 45
const TOTAL_STALLS = EVENT.totalStalls; // 75

function DrawPage() {
  const [selected, setSelected] = useState<Selected[]>([]);
  const [phase, setPhase] = useState<"idle" | "countdown" | "spinning" | "reveal" | "done">("idle");
  const [count, setCount] = useState(3);
  const [reel, setReel] = useState<{ seller: string; business: string } | null>(null);
  const [current, setCurrent] = useState<Selected | null>(null);
  const [running, setRunning] = useState(false);
  const timers = useRef<number[]>([]);

  const available = useMemo(() => {
    const usedIds = new Set(selected.map((s) => s.id));
    return SELLERS.filter((s) => !usedIds.has(s.id));
  }, [selected]);

  const usedStalls = useMemo(() => new Set(selected.map((s) => s.stallNo)), [selected]);

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  function addTimer(fn: () => void, ms: number) {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  }

  function fireConfetti() {
    const end = Date.now() + 800;
    const colors = ["#7A1E3D", "#F26B2A", "#FFC94A", "#1FA7A6", "#ffffff"];
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 70, origin: { x: 0 }, colors, scalar: 1.1 });
      confetti({ particleCount: 5, angle: 120, spread: 70, origin: { x: 1 }, colors, scalar: 1.1 });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
    confetti({ particleCount: 120, spread: 100, origin: { y: 0.4 }, colors, scalar: 1.2 });
  }

  function runOne() {
    if (selected.length >= TARGET) {
      setPhase("done");
      setRunning(false);
      return;
    }
    setPhase("countdown");
    setCount(3);
    addTimer(() => setCount(2), 900);
    addTimer(() => setCount(1), 1800);
    addTimer(() => {
      setPhase("spinning");
      // spin reel
      let ticks = 0;
      const spinId = window.setInterval(() => {
        const pick = available[Math.floor(Math.random() * available.length)];
        if (pick) setReel({ seller: pick.seller, business: pick.business });
        ticks++;
        if (ticks > 18) window.clearInterval(spinId);
      }, 90);
      timers.current.push(spinId as unknown as number);

      addTimer(() => {
        // final pick
        const winner = available[Math.floor(Math.random() * available.length)];
        // pick a random unused stall
        const remaining: number[] = [];
        for (let i = 1; i <= TOTAL_STALLS; i++) if (!usedStalls.has(i)) remaining.push(i);
        const stallNo = remaining[Math.floor(Math.random() * remaining.length)];
        const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const s: Selected = {
          order: selected.length + 1,
          stallNo,
          seller: winner.seller,
          business: winner.business,
          category: winner.category,
          avatar: winner.avatar,
          id: winner.id,
          at: nowStr,
        };
        setCurrent(s);
        setReel(null);
        setPhase("reveal");
        fireConfetti();

        addTimer(() => {
          setSelected((prev) => [s, ...prev]);
          setCurrent(null);
          setPhase("idle");
          if (running) addTimer(runOne, 800);
        }, 3400);
      }, 2000);
    }, 2700);
  }

  function startCeremony() {
    if (phase !== "idle") return;
    setRunning(true);
    runOne();
  }
  function pauseCeremony() {
    setRunning(false);
  }
  function reset() {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
    setSelected([]);
    setCurrent(null);
    setReel(null);
    setPhase("idle");
    setRunning(false);
  }

  const progress = selected.length / TARGET;

  return (
    <div className="relative overflow-hidden bg-hero pb-24 text-white">
      <div className="pointer-events-none absolute inset-0 pattern-dots opacity-20" />
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-warm opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute -left-32 top-1/2 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />

      {/* HEADER */}
      <section className="relative mx-auto max-w-7xl px-4 pt-16 md:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white/90 backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> Live ceremony
          </div>
          <h1 className="mt-4 font-display text-5xl font-black leading-[1.05] md:text-7xl">
            The <span className="text-festive">Stall Draw</span> Ceremony
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/80">
            Hundreds are watching. 120 women registered. 75 stalls. 45 will be assigned live — one lucky pick at a time.
          </p>
        </div>

        {/* STATS + CONTROLS */}
        <div className="mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-3 md:grid-cols-4">
          <StatChip label="Registered" value={EVENT.registeredSellers} />
          <StatChip label="Available Stalls" value={TOTAL_STALLS} />
          <StatChip label="Total Winners" value={TARGET} />
          <StatChip label="Progress" value={`${selected.length}/${TARGET}`} accent />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {phase !== "done" && !running && (
            <button
              onClick={startCeremony}
              disabled={phase !== "idle"}
              className="inline-flex items-center gap-2 rounded-full bg-festive px-6 py-3 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-105 disabled:opacity-50"
            >
              <Play className="h-4 w-4" /> {selected.length === 0 ? "Begin Ceremony" : "Continue"}
            </button>
          )}
          {running && (
            <button
              onClick={pauseCeremony}
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
            >
              <Pause className="h-4 w-4" /> Pause after this pick
            </button>
          )}
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-medium text-white/80 backdrop-blur hover:bg-white/15"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        </div>
      </section>

      {/* MAIN GRID */}
      <section className="relative mx-auto mt-14 grid max-w-7xl gap-6 px-4 md:px-8 lg:grid-cols-[1.4fr_1fr]">
        {/* LEFT — draw machine & venue */}
        <div className="space-y-6">
          <DrawStage phase={phase} count={count} reel={reel} current={current} />
          <VenueMap total={TOTAL_STALLS} usedStalls={usedStalls} selected={selected} />
        </div>

        {/* RIGHT — progress ring + selected list */}
        <div className="space-y-6">
          <ProgressRing value={progress} selected={selected.length} target={TARGET} />
          <SelectedPanel selected={selected} />
        </div>
      </section>

      {/* Full-screen reveal overlay */}
      <AnimatePresence>
        {phase === "reveal" && current && <RevealOverlay s={current} />}
      </AnimatePresence>

      {phase === "done" && <DoneBanner />}
    </div>
  );
}

/* ==== small chip ==== */
function StatChip({ label, value, accent = false }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border border-white/15 p-4 backdrop-blur-xl ${accent ? "bg-festive/30" : "bg-white/10"}`}>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-white/70">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold text-white md:text-3xl">{value}</div>
    </div>
  );
}

/* ==== DRAW STAGE: lottery drum ==== */
function DrawStage({ phase, count, reel, current }: { phase: string; count: number; reel: { seller: string; business: string } | null; current: Selected | null }) {
  return (
    <div className="relative overflow-hidden rounded-[36px] border border-white/15 bg-black/30 p-6 backdrop-blur-xl md:p-10">
      <div className="pointer-events-none absolute inset-0 pattern-dots opacity-10" />
      <div className="relative flex flex-col items-center gap-6">
        <div className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">Lottery Drum</div>

        {/* Drum */}
        <div className="relative h-64 w-64 md:h-80 md:w-80">
          {/* Outer decorative ring */}
          <div className="absolute inset-0 rounded-full border-[6px] border-accent/40" />
          <div className={`absolute inset-2 rounded-full border-2 border-dashed border-white/20 ${phase === "spinning" ? "animate-spin-slow" : ""}`} />

          {/* Glass ball */}
          <div className="absolute inset-6 overflow-hidden rounded-full bg-gradient-to-br from-white/30 via-white/5 to-transparent shadow-[inset_0_10px_40px_rgba(255,255,255,0.15)]">
            {/* Bouncing capsules */}
            <div className={`absolute inset-0 ${phase === "spinning" ? "animate-spin-slow" : ""}`}>
              {Array.from({ length: 20 }).map((_, i) => {
                const angle = (i / 20) * Math.PI * 2;
                const r = 90 + (i % 3) * 8;
                const x = 50 + Math.cos(angle) * (r / 3);
                const y = 50 + Math.sin(angle) * (r / 3);
                const colors = ["bg-secondary", "bg-accent", "bg-primary", "bg-teal/80"];
                return (
                  <span
                    key={i}
                    className={`absolute h-5 w-5 rounded-full shadow ${colors[i % colors.length]}`}
                    style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
                  />
                );
              })}
            </div>

            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center">
              {phase === "idle" && (
                <div className="text-center">
                  <Sparkles className="mx-auto h-8 w-8 text-accent" />
                  <div className="mt-2 text-sm font-semibold text-white/80">Ready to draw</div>
                </div>
              )}
              {phase === "countdown" && (
                <motion.div
                  key={count}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.6, opacity: 0 }}
                  className="font-display text-8xl font-black text-white drop-shadow-[0_0_30px_rgba(255,201,74,0.7)]"
                >
                  {count}
                </motion.div>
              )}
              {phase === "spinning" && reel && (
                <div className="text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Selecting…</div>
                  <div className="mt-2 font-display text-xl font-bold text-white">{reel.business}</div>
                  <div className="text-xs text-white/70">by {reel.seller}</div>
                </div>
              )}
              {phase === "reveal" && current && (
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center"
                >
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-accent">Stall</div>
                  <div className="font-display text-6xl font-black text-white drop-shadow-[0_0_30px_rgba(255,201,74,0.9)]">
                    #{current.stallNo.toString().padStart(2, "0")}
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Glow ring while spinning */}
          {(phase === "spinning" || phase === "reveal") && (
            <div className="pointer-events-none absolute inset-0 rounded-full animate-pulse-glow" />
          )}
        </div>

        <div className="text-center text-sm text-white/70">
          {phase === "idle" && "Press Begin Ceremony to spin the drum."}
          {phase === "countdown" && "The community holds its breath…"}
          {phase === "spinning" && "Capsules tumbling — the next winner is emerging."}
          {phase === "reveal" && "Congratulations! A new seller joins the bazaar."}
        </div>
      </div>
    </div>
  );
}

/* ==== FULL SCREEN REVEAL ==== */
function RevealOverlay({ s }: { s: Selected }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.7, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="relative w-full max-w-lg overflow-hidden rounded-[36px] bg-hero p-8 text-center text-white shadow-glow"
      >
        <div className="pointer-events-none absolute inset-0 pattern-dots opacity-25" />
        <div className="pointer-events-none absolute -inset-1 rounded-[38px] bg-festive opacity-30 blur-2xl" />

        <div className="relative">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent">
            <PartyPopper className="h-4 w-4" /> Congratulations!
          </div>
          <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.4em] text-white/70">Stall assigned</div>
          <div className="font-display text-7xl font-black text-festive drop-shadow-[0_0_40px_rgba(255,201,74,0.7)]">
            #{s.stallNo.toString().padStart(2, "0")}
          </div>
          <div className="mt-2 font-script text-3xl text-accent">assigned to</div>
          <div className="mt-4 flex items-center justify-center gap-4">
            <img src={s.avatar} className="h-16 w-16 rounded-full object-cover ring-4 ring-accent/60" alt="" />
            <div className="text-left">
              <div className="font-display text-2xl font-bold">{s.business}</div>
              <div className="text-sm text-white/70">by {s.seller}</div>
              <div className="mt-1 inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium">{s.category}</div>
            </div>
          </div>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-teal/20 px-3 py-1 text-xs font-semibold text-white">
            <Award className="h-4 w-4 text-accent" /> Successfully selected
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ==== VENUE MAP ==== */
function VenueMap({ total, usedStalls, selected }: { total: number; usedStalls: Set<number>; selected: Selected[] }) {
  const byStall = new Map(selected.map((s) => [s.stallNo, s]));
  return (
    <div className="rounded-[36px] border border-white/15 bg-black/30 p-6 backdrop-blur-xl md:p-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/60">Live Venue Map</div>
          <div className="mt-1 font-display text-xl font-semibold text-white">Nawait Community Hall</div>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/70">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-white/20" /> Empty</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-festive shadow-glow" /> Assigned</span>
        </div>
      </div>
      <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10 md:grid-cols-[repeat(15,minmax(0,1fr))]">
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => {
          const used = usedStalls.has(n);
          const info = byStall.get(n);
          return (
            <div key={n} className="group relative">
              <div
                className={`aspect-square rounded-md border text-[10px] font-bold transition-all duration-500 ${
                  used
                    ? "border-transparent bg-festive text-white shadow-[0_0_16px_rgba(242,107,42,0.6)]"
                    : "border-white/10 bg-white/5 text-white/40"
                } flex items-center justify-center`}
              >
                {n}
              </div>
              {info && (
                <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/90 px-3 py-2 text-[11px] shadow-glow group-hover:block">
                  <div className="font-semibold text-white">{info.business}</div>
                  <div className="text-white/70">{info.seller} · {info.category}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ==== PROGRESS RING ==== */
function ProgressRing({ value, selected, target }: { value: number; selected: number; target: number }) {
  const R = 68;
  const C = 2 * Math.PI * R;
  const dash = C * value;
  return (
    <div className="rounded-[36px] border border-white/15 bg-black/30 p-6 backdrop-blur-xl md:p-8">
      <div className="flex items-center gap-6">
        <div className="relative h-40 w-40 shrink-0">
          <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
            <circle cx="80" cy="80" r={R} strokeWidth="12" className="fill-none stroke-white/10" />
            <defs>
              <linearGradient id="ring-grad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#7A1E3D" />
                <stop offset="50%" stopColor="#F26B2A" />
                <stop offset="100%" stopColor="#FFC94A" />
              </linearGradient>
            </defs>
            <circle
              cx="80" cy="80" r={R} strokeWidth="12"
              className="fill-none transition-all duration-700"
              stroke="url(#ring-grad)"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${C - dash}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-display text-3xl font-black text-white">{selected}<span className="text-white/50">/{target}</span></div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/60">Assigned</div>
          </div>
        </div>
        <div className="flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/60">Draw Progress</div>
          <div className="mt-1 font-display text-xl font-semibold text-white">Live counter</div>
          <div className="mt-2 text-sm text-white/70">Every pick is fair, random and celebrated together.</div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-white/5 p-2 text-center">
              <div className="text-white/60">Selected</div>
              <div className="font-display text-lg font-bold text-accent">{selected}</div>
            </div>
            <div className="rounded-xl bg-white/5 p-2 text-center">
              <div className="text-white/60">Remaining</div>
              <div className="font-display text-lg font-bold text-white">{target - selected}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==== SELECTED PANEL ==== */
function SelectedPanel({ selected }: { selected: Selected[] }) {
  return (
    <div className="rounded-[36px] border border-white/15 bg-black/30 p-6 backdrop-blur-xl md:p-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/60">Selected Sellers</div>
          <div className="mt-1 font-display text-xl font-semibold text-white">Live feed</div>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">{selected.length}</span>
      </div>

      {selected.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/60">
          The stage is set. Selected sellers will appear here as the drum spins.
        </div>
      ) : (
        <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {selected.map((s) => (
              <motion.div
                key={s.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-festive font-display text-sm font-black text-white shadow-glow">
                  #{s.stallNo.toString().padStart(2, "0")}
                </div>
                <img src={s.avatar} className="h-10 w-10 rounded-full object-cover ring-2 ring-accent/60" alt="" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-white">{s.business}</div>
                  <div className="truncate text-xs text-white/60">{s.seller} · {s.category}</div>
                </div>
                <div className="text-right text-[10px] text-white/60">
                  <div>#{s.order}</div>
                  <div>{s.at}</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function DoneBanner() {
  return (
    <div className="relative mx-auto mt-14 max-w-3xl px-4 md:px-8">
      <div className="rounded-[36px] bg-festive p-8 text-center text-white shadow-glow">
        <PartyPopper className="mx-auto h-10 w-10" />
        <div className="mt-3 font-display text-4xl font-black">All 45 stalls assigned!</div>
        <div className="mt-2 text-white/90">Season 2 is officially set. See you at Nawait Community Hall.</div>
      </div>
    </div>
  );
}