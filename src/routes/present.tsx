import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { Maximize, PartyPopper, Sparkles, Trophy } from "lucide-react";
import { EVENT } from "@/lib/dummy-data";
import { useSeason } from "@/lib/season-context";
import { watchDrawResultsBySeasonId, type DrawResult } from "@/lib/draw-results-db";
import { watchDrawPool, type PoolApplicant } from "@/lib/draw-pool-db";
import { watchDrawSpeed, watchDrawCountdown } from "@/lib/settings-db";
import { colorFor } from "@/lib/category-colors";
import { Dartboard, RedDart } from "@/components/site/dartboard";
import { StallArena, type Selected } from "./draw";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/present")({
  head: () => ({ meta: [{ title: "Live Draw · Presentation" }] }),
  component: PresentationPage,
});

type Speed = "slow" | "medium" | "fast";
type Phase = "idle" | "prep" | "spin" | "seller" | "stall" | "celebrate";

const SPEEDS: Record<Speed, { prep: number; spin: number; seller: number; stall: number; celebrate: number }> = {
  slow:   { prep: 3000, spin: 1900, seller: 2000, stall: 1500, celebrate: 3200 },
  medium: { prep: 2200, spin: 1300, seller: 1500, stall: 1100, celebrate: 2400 },
  fast:   { prep: 1300, spin: 800,  seller: 1000, stall: 800,  celebrate: 1500 },
};

function fireConfetti() {
  const colors = ["#7A1E3D", "#F26B2A", "#FFC94A", "#1FA7A6", "#ffffff"];
  confetti({ particleCount: 140, spread: 100, origin: { y: 0.45 }, colors, scalar: 1.3 });
  confetti({ particleCount: 60, angle: 60, spread: 70, origin: { x: 0 }, colors });
  confetti({ particleCount: 60, angle: 120, spread: 70, origin: { x: 1 }, colors });
}

function PresentationPage() {
  const { seasons, activeSeason, season } = useSeason();
  const { t } = useI18n();
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  // Admin-selected pace from Settings (live); a ?speed= URL param still overrides it.
  const [settingSpeed, setSettingSpeed] = useState<Speed>("medium");
  useEffect(() => watchDrawSpeed(setSettingSpeed), []);
  // Admin-selected pre-pick countdown length (seconds), live from Settings.
  const [countdownSecs, setCountdownSecs] = useState(3);
  useEffect(() => watchDrawCountdown(setCountdownSecs), []);
  const speed = useMemo<Speed>(() => {
    const s = params.get("speed");
    return s === "slow" || s === "medium" || s === "fast" ? s : settingSpeed;
  }, [params, settingSpeed]);

  // Follow the season the admin passed (so a non-active draw still mirrors), else the active one.
  const seasonParam = params.get("season");
  const show = useMemo(
    () => seasons.find((s) => s.id === seasonParam) ?? activeSeason ?? season,
    [seasons, seasonParam, activeSeason, season]
  );
  const target = show && show.maximumSelectedStalls > 0 ? show.maximumSelectedStalls : EVENT.totalWinners;
  const totalStalls = show && show.maximumStalls > 0 ? show.maximumStalls : EVENT.totalStalls;

  const [results, setResults] = useState<DrawResult[]>([]);
  const [pool, setPool] = useState<PoolApplicant[]>([]); // all applicants — the live-map cells (by name)
  const [spinning, setSpinning] = useState(false); // admin's picker is running → hop the map
  const [hopId, setHopId] = useState<string | null>(null); // cell glowing during the local hop
  const [preCount, setPreCount] = useState(3); // countdown shown on the stage while the admin picks
  const [shownCount, setShownCount] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [count, setCount] = useState(3);
  const [current, setCurrent] = useState<DrawResult | null>(null);

  const initRef = useRef(false);
  const playingRef = useRef(false);
  const timers = useRef<number[]>([]);
  const [tick, setTick] = useState(0);

  // Live mirror of the admin's draw for this season.
  useEffect(() => {
    if (!show?.id) return;
    initRef.current = false;
    const unsub = watchDrawResultsBySeasonId(show.id, (list) => {
      setResults(list);
      // On first load, treat everything already drawn as shown — only animate new picks.
      if (!initRef.current) { initRef.current = true; setShownCount(list.length); }
    });
    return () => unsub();
  }, [show?.id]);

  // Live applicant pool (name-only) + spinning flag → named cells + hop on the map.
  useEffect(() => {
    if (!show?.id) { setPool([]); setSpinning(false); return; }
    const unsub = watchDrawPool(show.id, ({ applicants, spinning }) => {
      setPool([...applicants].sort((a, b) => a.id.localeCompare(b.id)));
      setSpinning(spinning);
    });
    return () => unsub();
  }, [show?.id]);

  // While the admin's picker spins, hop a random applicant cell so the public map
  // "runs" the instant Begin is clicked. Landing/reveal comes from drawResults.
  useEffect(() => {
    if (!spinning || pool.length === 0) { setHopId(null); return; }
    const id = window.setInterval(() => {
      setHopId(pool[Math.floor(Math.random() * pool.length)].id);
    }, 120);
    return () => { window.clearInterval(id); setHopId(null); };
  }, [spinning, pool]);

  // Admin-set countdown on the stage while the picker runs (N → 1, then holds).
  useEffect(() => {
    if (!spinning || countdownSecs < 1) return;
    setPreCount(countdownSecs);
    const id = window.setInterval(() => setPreCount((c) => (c > 1 ? c - 1 : c)), 1000);
    return () => window.clearInterval(id);
  }, [spinning, countdownSecs]);

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  // Sequence driver — plays one pick at a time; re-checks when a pick finishes.
  useEffect(() => {
    if (playingRef.current) return;
    if (results.length < shownCount) { setShownCount(results.length); setCurrent(null); setPhase("idle"); return; }
    if (results.length <= shownCount) return;

    // Stay live: if several picks landed faster than one animation (Non-Stop, or the
    // audience joined mid-draw), skip the backlog and animate only the most recent so
    // the screen mirrors the admin "now" instead of replaying a slow queue.
    if (results.length - shownCount > 1) { setShownCount(results.length - 1); return; }

    playingRef.current = true;
    const pick = results[shownCount];
    const t = SPEEDS[speed];
    const at = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

    // No countdown — straight into the spin (every registered applicant cycles).
    setCurrent(pick);
    setPhase("spin");
    at(() => setPhase("seller"), t.spin);
    at(() => setPhase("stall"), t.spin + t.seller);
    at(() => { setPhase("celebrate"); fireConfetti(); }, t.spin + t.seller + t.stall);
    at(() => {
      setShownCount((c) => c + 1);
      setCurrent(null);
      setPhase("idle");
      playingRef.current = false;
      setTick((x) => x + 1); // re-run driver for the next pick
    }, t.spin + t.seller + t.stall + t.celebrate);
  }, [results, shownCount, tick, speed]);

  const revealing = phase === "stall" || phase === "celebrate";
  const doneCount = shownCount + (revealing ? 1 : 0);
  // Winners keyed by applicant id (candidateId) — which cell lights up on the map.
  const wonById = useMemo(() => {
    const m = new Map<string, DrawResult>(results.slice(0, shownCount).map((r) => [r.candidateId, r]));
    if (revealing && current) m.set(current.candidateId, current);
    return m;
  }, [results, shownCount, revealing, current]);
  // The cell being drawn glows through the whole reveal sequence.
  const currentId = current?.candidateId ?? null;
  // Draw order — first winner first (matches the admin live feed).
  const history = useMemo(() => results.slice(0, shownCount), [results, shownCount]);
  const denom = pool.length || target; // progress shown against how many actually registered
  // "Complete" = every possible pick is done — target reached, or the whole pool drawn if fewer registered.
  const complete = shownCount > 0 && shownCount >= Math.min(target, denom) && phase === "idle";
  // Winners mapped to the arena's shape — rendered on the stage once every pick is done.
  const arenaSelected = useMemo<Selected[]>(
    () => results.map((r) => ({ order: r.order, stallNo: r.stallNo, seller: r.seller, business: r.business, category: r.category, avatar: "", id: r.candidateId, at: r.at })),
    [results]
  );

  function goFullscreen() {
    document.documentElement.requestFullscreen?.().catch(() => {});
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-hero text-white">
      <div className="pointer-events-none absolute inset-0 pattern-dots opacity-20" />
      <div className="pointer-events-none absolute -right-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-warm opacity-25 blur-3xl" />
      <div className="pointer-events-none absolute -left-40 top-1/3 h-[32rem] w-[32rem] rounded-full bg-accent/25 blur-3xl" />

      {/* HEADER — branding · season · progress */}
      <header className="relative z-10 flex items-center justify-between gap-4 px-6 py-4 md:px-10 md:py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-festive shadow-glow md:h-14 md:w-14">
            <Sparkles className="h-6 w-6 md:h-7 md:w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-black leading-none tracking-tight md:text-2xl">AMCHO BAZAR</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white ring-1 ring-white/20 md:text-[10px]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-80" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                </span>
                {t("present.live")}
              </span>
            </div>
            <div className="mt-1 font-script text-sm text-accent md:text-base">{show?.seasonName ?? EVENT.season}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-2 text-right backdrop-blur-xl">
            <div className="text-[9px] font-semibold uppercase tracking-[0.35em] text-white/55 md:text-[10px]">{t("present.progress")}</div>
            <div className="font-display text-2xl font-black tabular-nums leading-none md:text-4xl">
              {doneCount}<span className="text-white/40">/{denom}</span>
            </div>
          </div>
          <button
            onClick={goFullscreen}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 backdrop-blur transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            aria-label="Enter fullscreen"
          >
            <Maximize className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* progress bar */}
      <div className="relative z-10 mx-6 h-1.5 overflow-hidden rounded-full bg-white/10 md:mx-10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-accent"
          animate={{ width: `${denom ? (doneCount / denom) * 100 : 0}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>

      {/* MAIN — stage + venue/history */}
      <main className="relative z-10 grid flex-1 gap-5 p-6 md:gap-6 md:p-10 lg:grid-cols-[1.55fr_1fr]">
        <Stage phase={phase} count={count} current={current} complete={complete} target={target} spinning={spinning} preCount={preCount} arenaSelected={arenaSelected} totalStalls={totalStalls} />

        <aside className="flex min-h-0 flex-col gap-5">
          <VenueMap pool={pool} wonById={wonById} currentId={currentId} hopId={hopId} fallbackTotal={totalStalls} />
          <HistoryPanel history={history} />
        </aside>
      </main>
    </div>
  );
}

/* ============ STAGE ============ */
function Stage({ phase, count, current, complete, target, spinning, preCount, arenaSelected, totalStalls }: { phase: Phase; count: number; current: DrawResult | null; complete: boolean; target: number; spinning: boolean; preCount: number; arenaSelected: Selected[]; totalStalls: number }) {
  const { t } = useI18n();
  const palette = current ? colorFor(current.category) : null;
  const centered = !complete; // arena fills the card; other states stay centred
  return (
    <section className={`relative flex rounded-[40px] border border-white/15 bg-black/25 p-6 backdrop-blur-xl md:p-10 ${centered ? "items-center justify-center" : "items-stretch"}`}>
      <AnimatePresence mode="wait">
        {complete ? (
          <motion.div key="complete" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
            <div className="mb-4 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-1.5 text-sm font-semibold uppercase tracking-widest text-accent md:text-base">
                <Trophy className="h-5 w-5" /> {t("present.allAssigned").replace("{target}", String(target))}
              </div>
            </div>
            <StallArena
              done
              controls={false}
              total={totalStalls}
              target={target}
              regs={[]}
              selectedIds={new Set(arenaSelected.map((s) => s.id))}
              usedStalls={new Set(arenaSelected.map((s) => s.stallNo))}
              selected={arenaSelected}
              current={null}
            />
          </motion.div>
        ) : phase === "idle" && spinning ? (
          // Admin has begun the pick — show a countdown instead of a static stage.
          <motion.div key="count" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <div className="text-sm font-semibold uppercase tracking-[0.4em] text-accent md:text-lg">{t("present.prep")}</div>
            <motion.div
              key={preCount}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.8, opacity: 0 }}
              className="mt-6 font-display text-[9rem] font-black leading-none text-white drop-shadow-[0_0_50px_rgba(255,201,74,0.7)] md:text-[15rem]"
            >
              {preCount}
            </motion.div>
            <div className="mt-4 font-display text-2xl font-bold text-white/90 md:text-4xl">{t("present.selecting")}</div>
          </motion.div>
        ) : phase === "idle" ? (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-white/25 md:h-28 md:w-28">
              <Sparkles className="h-9 w-9 animate-pulse text-accent md:h-12 md:w-12" />
            </div>
            <div className="mt-6 font-display text-3xl font-bold text-white/90 md:text-5xl">{t("present.stageSet")}</div>
            <div className="mt-2 text-white/60 md:text-lg">{t("present.waiting")}</div>
          </motion.div>
        ) : phase === "prep" ? (
          <motion.div key="prep" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <div className="text-sm font-semibold uppercase tracking-[0.4em] text-accent md:text-lg">{t("present.prep")}</div>
            <motion.div
              key={count}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.8, opacity: 0 }}
              className="mt-6 font-display text-[10rem] font-black leading-none text-white drop-shadow-[0_0_50px_rgba(255,201,74,0.7)] md:text-[16rem]"
            >
              {count}
            </motion.div>
          </motion.div>
        ) : phase === "spin" ? (
          <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <div className="relative mx-auto h-52 w-52 md:h-72 md:w-72">
              <Dartboard spinning className="absolute inset-0" />
              {/* Thrown red dart sticks into the upper board at an angle */}
              <motion.div
                initial={{ x: 76, y: -130, rotate: 58, opacity: 0 }}
                animate={{ x: 0, y: 0, rotate: 34, opacity: 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 13, delay: 0.2 }}
                className="pointer-events-none absolute left-[57%] top-[30%] z-30 origin-bottom -translate-x-1/2 -translate-y-full"
              >
                <RedDart />
              </motion.div>
            </div>
            <div className="mt-8 font-display text-2xl font-bold text-white/90 md:text-4xl">{t("present.selecting")}</div>
          </motion.div>
        ) : (
          <motion.div
            key={`reveal-${current?.order}`}
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
            className="w-full max-w-xl text-center"
          >
            {phase === "celebrate" && (
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-1.5 text-sm font-semibold uppercase tracking-widest text-accent md:text-base">
                <PartyPopper className="h-5 w-5" /> {t("present.congrats")}
              </div>
            )}

            {/* Business + category */}
            <div className="font-display text-4xl font-black leading-tight md:text-6xl">{current?.business}</div>
            {current?.seller && <div className="mt-2 text-lg text-white/70 md:text-2xl">{t("home.by")} {current.seller}</div>}
            {palette && (
              <span
                className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold text-white md:text-base"
                style={{ background: `linear-gradient(180deg, ${palette.bg}, ${palette.canopy})` }}
              >
                {current?.category}
              </span>
            )}

            {/* Stall number */}
            <AnimatePresence>
              {(phase === "stall" || phase === "celebrate") && current && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 240, damping: 16 }}
                  className="mt-8"
                >
                  <div className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/60 md:text-xs">{t("present.assignedStall")}</div>
                  <div className="font-display text-8xl font-black text-warm drop-shadow-[0_0_45px_rgba(255,201,74,0.8)] md:text-[11rem] md:leading-[0.9]">
                    #{current.stallNo.toString().padStart(2, "0")}
                  </div>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white/80">
                    <Trophy className="h-4 w-4 text-accent" /> {t("present.selection")} {current.order} / {target}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ============ VENUE MAP ============ */
// One cell per applicant, labelled by business name. Winners light up in their
// category colour; the applicant being drawn glows. Falls back to a numbered grid
// only if the pool hasn't published yet (older season / admin screen not open).
function VenueMap({ pool, wonById, currentId, hopId, fallbackTotal }: { pool: PoolApplicant[]; wonById: Map<string, DrawResult>; currentId: string | null; hopId: string | null; fallbackTotal: number }) {
  const { t } = useI18n();
  return (
    <div className="rounded-[28px] border border-white/15 bg-black/25 p-4 backdrop-blur-xl md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-accent md:text-xs">{t("present.liveMap")}</div>
        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold tabular-nums text-white/80">{wonById.size} {t("present.lit")}</span>
      </div>
      {pool.length === 0 ? (
        // No published pool yet — keep the original numbered grid so the screen isn't blank.
        <div className="grid grid-cols-10 gap-1">
          {Array.from({ length: fallbackTotal }, (_, i) => i + 1).map((n) => (
            <div key={n} className="flex aspect-square items-center justify-center rounded-md text-[8px] font-black tabular-nums text-white/40 md:text-[10px]" style={{ background: "rgba(255,255,255,0.05)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }}>
              {n.toString().padStart(2, "0")}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-5">
          {pool.map((a) => {
            const info = wonById.get(a.id);
            const won = !!info;
            const isCurrent = currentId === a.id;
            const isHop = !isCurrent && !won && hopId === a.id; // lit up as the picker runs
            const palette = info ? colorFor(info.category) : null;
            return (
              <div
                key={a.id}
                className={`flex min-h-[3rem] flex-col items-center justify-center gap-0.5 rounded-md px-1.5 py-1 text-center transition-all ${isCurrent ? "animate-pulse-glow" : ""}`}
                style={{
                  background: palette ? `linear-gradient(180deg, ${palette.bg}, ${palette.canopy})` : isCurrent || isHop ? "rgba(255,201,74,0.22)" : "rgba(255,255,255,0.05)",
                  color: won || isCurrent || isHop ? "#fff" : "rgba(255,255,255,0.55)",
                  boxShadow: isCurrent
                    ? `0 0 0 2px #FFC94A, 0 0 16px 3px ${palette?.ring ?? "rgba(255,201,74,0.7)"}`
                    : isHop ? "0 0 0 2px rgba(255,201,74,0.8), 0 0 12px 2px rgba(255,201,74,0.5)"
                    : won ? `0 2px 8px -3px ${palette?.ring ?? "rgba(0,0,0,0.4)"}` : "inset 0 0 0 1px rgba(255,255,255,0.06)",
                }}
              >
                <span className="line-clamp-2 text-[9px] font-bold leading-tight md:text-[10px]">{a.business}</span>
                {a.seller && <span className="line-clamp-1 text-[8px] font-medium leading-tight opacity-75 md:text-[9px]">{a.seller}</span>}
                {won && <span className="text-[7px] font-semibold tabular-nums opacity-80">#{info!.stallNo.toString().padStart(2, "0")}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============ HISTORY (all allotments, newest first) ============ */
function HistoryPanel({ history }: { history: DrawResult[] }) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-[28px] border border-white/15 bg-black/25 p-4 backdrop-blur-xl md:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-accent md:text-xs">{t("present.recentAllot")}</span>
        {history.length > 0 && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-white/70">{history.length}</span>}
      </div>
      {history.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 py-6 text-center text-sm text-white/50">{t("present.selectionsHere")}</div>
      ) : (
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {history.map((r) => {
              const palette = colorFor(r.category);
              return (
                <motion.div
                  key={r.id ?? r.order}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 rounded-2xl bg-white/5 p-2.5 ring-1 ring-white/10"
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display text-sm font-black tabular-nums text-white shadow-glow"
                    style={{ background: `linear-gradient(180deg, ${palette.bg}, ${palette.canopy})` }}
                  >
                    #{r.stallNo.toString().padStart(2, "0")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-white">{r.business}</div>
                    <div className="truncate text-xs text-white/60">{r.category}</div>
                  </div>
                  <div className="shrink-0 font-display text-sm font-bold text-white/50">#{r.order}</div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
