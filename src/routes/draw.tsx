import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { friendlyAuthError } from "@/lib/firebase-errors";
import { Award, PartyPopper, Play, Pause, RotateCcw, Sparkles, Store, DoorOpen, Flower2, Zap, ListChecks, Target, Search, Trophy, Radio, Download, CheckCircle2, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/site/confirm-dialog";
import { EVENT } from "@/lib/dummy-data";
import { getDrawNonStop, getDrawLive, setDrawLive, watchDrawCountdown, watchDrawSpinMs, watchRevealFields, watchRevealHold, DEFAULT_REVEAL, type RevealFields } from "@/lib/settings-db";
import { useSeason } from "@/lib/season-context";
import { watchRegistrationsForAdmin, updateRegistration, type Registration } from "@/lib/db";
import { materializeRegistrationStalls, deleteStallForRegistration } from "@/lib/stalls-db";
import { getDrawResultsBySeasonId, saveDrawResult, clearDrawResultsBySeasonId, deleteDrawResultByCandidate, type DrawResult } from "@/lib/draw-results-db";
import { updateSeason, type Season } from "@/lib/seasons-db";
import { publishDrawPool, setPoolSpinning } from "@/lib/draw-pool-db";
import { RequireAdmin } from "@/components/site/require-admin";
import { RedDart } from "@/components/site/dartboard";
import { useI18n } from "@/lib/i18n";
import { CATEGORY_COLORS } from "@/lib/category-colors";

// Real registrations have no photo; derive a stable avatar from the record id.
const avatarFor = (id: string) => `https://i.pravatar.cc/160?u=${encodeURIComponent(id)}`;

export const Route = createFileRoute("/draw")({
  head: () => ({
    meta: [
      { title: "Live Stall Draw Ceremony · Amcho Bazar" },
      { name: "description", content: "Watch the live stall draw ceremony — 45 lucky women entrepreneurs assigned their stalls in real time." },
      { property: "og:title", content: "Live Stall Draw · Amcho Bazar Season 3" },
      { property: "og:description", content: "A festival-worthy random draw ceremony — with lottery drum, confetti and celebration." },
    ],
  }),
  component: () => (
    <RequireAdmin>
      <DrawPage />
    </RequireAdmin>
  ),
});

export type Selected = {
  order: number;
  stallNo: number;
  seller: string;
  business: string;
  category: string;
  avatar: string;
  id: string;
  at: string;
  tagline?: string;
  products?: string[];
};

// Fallback if no season is loaded yet.
const DEFAULT_TARGET = EVENT.totalWinners; // 45

/* ponytail: one-time Season-3 reconciliation. The agreed final allotment — the
   draw's selected list is set to exactly this, everyone else goes back to the
   waitlist (merged businesses share a stall but are NOT separately approved).
   Delete this block, applyFinalList() and its button/dialog once run. */
const FINAL_STALLS: { n: number; o: string; b: string; p: boolean }[] = [
  { n: 1, o: "Mrs. Waqas", b: "Shan-e-Mithas by Shiror's", p: true },
  { n: 2, o: "Saima zain", b: "Abaan Nawati Tradition", p: true },
  { n: 3, o: "Javeriya Riaz Maddas", b: "Paper Joy", p: true },
  { n: 4, o: "Safia", b: "First Come, First Serve", p: false },
  { n: 5, o: "Irfana jewelry", b: "Irfana jewelry", p: false },
  { n: 6, o: "Ayesha Siddiqa", b: "Chatpatta Point", p: false },
  { n: 7, o: "Madiha Munif", b: "Diya's cuisine", p: true },
  { n: 8, o: "Saba", b: "Saba's kitchen", p: true },
  { n: 9, o: "HURIYA EMAN", b: "S and H crochet", p: true },
  { n: 10, o: "Wareesha muntaha Khattal", b: "Gurlzzz. Stop", p: true },
  { n: 11, o: "Binte Abdul Qadir HajiAmeen", b: "Zeenat", p: true },
  { n: 12, o: "Farah Jabir Muhammad Husaina", b: "Chatpata Chaat Inn", p: true },
  { n: 13, o: "Umme bara", b: "oven charm", p: false },
  { n: 14, o: "Iqra shaikh", b: "Khawsuey by walk n roll", p: true },
  { n: 15, o: "Asmat Ismail", b: "Asmat's food Corner", p: true },
  { n: 16, o: "Mrs. Faisal Khattal", b: "P for Pizza,P for Papri Chaat", p: true },
  { n: 17, o: "umme huzaifa", b: "choco magic", p: false },
  { n: 18, o: "duha irfan", b: "Jewellerystore.pk", p: true },
  { n: 19, o: "Hafsa Mehmood", b: "Fun Space", p: true },
  { n: 20, o: "Sadia Adil", b: "Gems and glow", p: true },
  { n: 21, o: "Ummewaqad Khattal", b: "Sip and Crunch", p: false },
  { n: 22, o: "Hafiza Taqwa", b: "Hafiza's mart", p: true },
  { n: 23, o: "Zohra", b: "Zohra's Kitchen", p: true },
  { n: 24, o: "ROQaiya aijaz Chadkhan", b: "Umar garments", p: false },
  { n: 25, o: "Umme Abuhuraira", b: "The little shine collection", p: true },
  { n: 26, o: "Ume Sehar Humair Ali", b: "Mantasha's food stall", p: true },
  { n: 27, o: "Sakina Ismail", b: "I S jewelery &hair accessories", p: true },
  { n: 28, o: "Shumaila asif", b: "Shumaila s kitchen", p: true },
  { n: 29, o: "Sunny Adnan", b: "Hooriya mini Mart", p: false },
  { n: 30, o: "Darakhshan Nishat", b: "Biryani Spot (By Umm-e-Usman)", p: true },
  { n: 31, o: "nayab", b: "Wrapped With Love", p: true },
  { n: 32, o: "Durrah Sohail", b: "Chatpata pocket", p: false },
  { n: 33, o: "Abeer yasir sidi ali", b: "Spice n slice", p: false },
  { n: 34, o: "Fatima Shaheen", b: "Khatta Meetha corner", p: true },
  { n: 35, o: "Mehrun nisa mazhar shingati", b: "Mix item", p: false },
  { n: 36, o: "Azra nigar", b: "Khana pinaa", p: true },
  { n: 37, o: "Hawwa Tufail Bidchol", b: "Khausay station season 3", p: true },
  { n: 38, o: "Aunbreen mairaj", b: "Adan Jewels", p: true },
  { n: 39, o: "Umme salar", b: "Khana peena", p: false },
  { n: 40, o: "Kulsoom Muhammad aslam", b: "Traditional bites", p: true },
  { n: 41, o: "Umm e Mohammed Hegday", b: "Food n mood", p: false },
  { n: 42, o: "Khoula Usama", b: "M/S Store", p: false },
  { n: 43, o: "Umama Wahab", b: "Gehna Fashion and Foods", p: true },
  { n: 44, o: "Hajiameen ali", b: "Little stars", p: false },
  { n: 45, o: "Dua Faizan", b: "Twinkle charms", p: true },
];
const fnKey = (s?: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

// The lowest stall number not in use. On a fresh draw this is just 1,2,3…; after a
// winner is removed it reuses that freed number instead of running past the target.
function nextStallNo(cur: Selected[]): number {
  const used = new Set(cur.map((s) => s.stallNo));
  let n = 1;
  while (used.has(n)) n++;
  return n;
}
// Draw order always moves forward so the live feed keeps its sequence.
const nextOrder = (cur: Selected[]) => cur.reduce((m, s) => Math.max(m, s.order), 0) + 1;

type Candidate = { id: string; seller: string; business: string; category: string; avatar: string };

function DrawPage() {
  const { season, seasonId, seasons } = useSeason();
  const { t } = useI18n();
  const TARGET = season && season.maximumSelectedStalls > 0 ? season.maximumSelectedStalls : DEFAULT_TARGET;
  const targetRef = useRef(TARGET); // read inside the run loop so a raised target takes effect immediately
  useEffect(() => { targetRef.current = TARGET; }, [TARGET]);

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [allRegs, setAllRegs] = useState<Candidate[]>([]); // every applicant — the venue map cells (by name)
  const [registeredCount, setRegisteredCount] = useState(0); // total registered this season (live)
  const [selected, setSelected] = useState<Selected[]>([]);
  const [phase, setPhase] = useState<"idle" | "countdown" | "spinning" | "reveal" | "done">("idle");
  const [count, setCount] = useState(3);
  const [reel, setReel] = useState<{ seller: string; business: string } | null>(null);
  const [current, setCurrent] = useState<Selected | null>(null);
  const [showWinner, setShowWinner] = useState(false); // delay the name until the dart has visibly landed
  const [spinRegId, setSpinRegId] = useState<string | null>(null); // applicant cell lit up while the picker runs
  const [confirmReset, setConfirmReset] = useState(false);
  const [newTarget, setNewTarget] = useState(""); // raise-target input (shown when a draw is complete)
  const [finishBusy, setFinishBusy] = useState(false);
  const [viewOpen, setViewOpen] = useState(false); // "View draws" dialog
  const [running, setRunning] = useState(false);
  const [nonStop, setNonStop] = useState(false); // admin toggle: show one-click Non-Stop button
  const [live, setLive] = useState(false); // broadcast the draw live to everyone (view-only)
  const [liveBusy, setLiveBusy] = useState(false);
  const [speed, setSpeed] = useState<"slow" | "medium" | "fast">("medium"); // presentation reveal speed
  const timers = useRef<number[]>([]);
  const selectedRef = useRef<Selected[]>([]); // latest picks for the fast loop (avoids stale closures)
  const candidatesRef = useRef<Candidate[]>([]); // latest candidates for the fast loop
  const spinRegIdRef = useRef<string | null>(null); // applicant cell the picker is currently on
  const regByIdRef = useRef<Map<string, Registration>>(new Map()); // full registrations, to approve a winner
  const runningRef = useRef(false); // latest running flag (chained runOne avoids the stale closure)

  useEffect(() => { getDrawNonStop().then(setNonStop).catch(() => {}); }, []);
  useEffect(() => { getDrawLive().then(setLive).catch(() => {}); }, []);
  // Admin-set countdown (Settings → Live Draw) — the spin lasts this long so the
  // public countdown (which uses the same value) reaches 1 exactly as the winner reveals.
  const [countdownSecs, setCountdownSecs] = useState(3);
  useEffect(() => watchDrawCountdown(setCountdownSecs), []);
  const countdownRef = useRef(3);
  useEffect(() => { countdownRef.current = countdownSecs; }, [countdownSecs]);
  // Admin-set sweep speed + which winner details to reveal (Settings → Live Draw).
  const spinMsRef = useRef(150); // admin-set hop time (ms) — free value, not a preset
  useEffect(() => watchDrawSpinMs((ms) => { spinMsRef.current = ms; }), []);
  const [revealFields, setRevealFields] = useState<RevealFields>(DEFAULT_REVEAL);
  useEffect(() => watchRevealFields(setRevealFields), []);
  const revealHoldRef = useRef(3); // seconds the winner card stays up (Settings → Live Draw)
  useEffect(() => watchRevealHold((s) => { revealHoldRef.current = s; }), []);

  async function toggleLive() {
    const next = !live;
    setLiveBusy(true);
    try {
      await setDrawLive(next);
      setLive(next);
      toast.success(next ? t("draw.liveOn") : t("draw.liveOff"));
    } catch (e) {
      toast.error(t("draw.liveErr"));
    } finally {
      setLiveBusy(false);
    }
  }
  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { candidatesRef.current = candidates; }, [candidates]);
  useEffect(() => { runningRef.current = running; }, [running]);
  // The picker highlight only means anything while spinning — clear it otherwise so a
  // cell doesn't stay blinking at idle/READY if a spin was interrupted (e.g. navigation).
  useEffect(() => {
    if (phase !== "spinning") { setSpinRegId(null); spinRegIdRef.current = null; }
    // A winner cell only stays glowing between picks (selected > 0). At a fresh/ready
    // board (idle, nothing picked) any lingering glow is stale — drop it.
    if (phase === "idle" && selected.length === 0) setCurrent(null);
  }, [phase, selected.length]);

  // One-time per season: load already-saved draw picks and reset the machine.
  useEffect(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
    setRunning(false);
    setPhase("idle");
    setCurrent(null);
    setReel(null);
    if (!seasonId) { setSelected([]); selectedRef.current = []; return; }
    getDrawResultsBySeasonId(seasonId)
      .then((results) => {
        const picks: Selected[] = results.map((r) => ({
          order: r.order, stallNo: r.stallNo, seller: r.seller, business: r.business,
          category: r.category, avatar: avatarFor(r.candidateId), id: r.candidateId, at: r.at,
          products: r.products,
        })).sort((a, b) => b.order - a.order);
        setSelected(picks);
        selectedRef.current = picks;
        if (picks.length >= TARGET && picks.length > 0) setPhase("done");
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seasonId, season?.seasonNumber]);

  // Live: registered applicants + the draw pool update in real time — new sign-ups
  // appear mid-ceremony, and winners leave the pool as they get approved.
  useEffect(() => {
    if (!seasonId) { setCandidates([]); setAllRegs([]); setRegisteredCount(0); regByIdRef.current = new Map(); return; }
    const unsub = watchRegistrationsForAdmin(seasonId, season?.seasonNumber, (regs) => {
      const map = new Map<string, Registration>();
      regs.forEach((r) => { if (r.id) map.set(r.id, r); });
      regByIdRef.current = map; // full lookup so a winner can be approved + listed
      setRegisteredCount(map.size);
      const toCand = (r: Registration): Candidate => ({ id: r.id!, seller: r.seller, business: r.business, category: r.category as string, avatar: avatarFor(r.id!) });
      // Every applicant is a cell on the venue map (stable order by id so cells don't jump).
      setAllRegs([...map.values()].map(toCand).sort((a, b) => a.id.localeCompare(b.id)));
      // Only waitlisted applicants enter the draw; winning is what approves them.
      // "pending" = payment proof not verified yet (on hold), so it stays out, and
      // already-approved/paid are past winners — both excluded from the pool.
      setCandidates([...map.values()].filter((r) => r.status === "waitlist").map(toCand));
    });
    return unsub;
  }, [seasonId, season?.seasonNumber]);

  // Publish the name-only applicant pool so the public /present live map can show
  // every applicant as a named cell (registrations themselves are auth-gated).
  useEffect(() => {
    if (!seasonId || allRegs.length === 0) return;
    publishDrawPool(seasonId, allRegs.map(({ id, seller, business, category }) => ({ id, seller, business, category }))).catch(() => {});
  }, [seasonId, allRegs]);

  const available = useMemo(() => {
    const usedIds = new Set(selected.map((s) => s.id));
    return candidates.filter((s) => !usedIds.has(s.id));
  }, [selected, candidates]);

  const usedStalls = useMemo(() => new Set(selected.map((s) => s.stallNo)), [selected]);
  const selectedIds = useMemo(() => new Set(selected.map((s) => s.id)), [selected]); // winning applicant cells

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

  // Persist a pick to this season's results (fire-and-forget; season-scoped).
  // A winner is also approved and listed in the stall directory — the draw is
  // what promotes waitlisted applicants to sellers.
  function persist(s: Selected) {
    if (!seasonId) return;
    saveDrawResult({
      seasonId, order: s.order, stallNo: s.stallNo, candidateId: s.id,
      seller: s.seller, business: s.business, category: s.category, at: s.at,
      ...(s.tagline ? { tagline: s.tagline } : {}),
      ...(s.products?.length ? { products: s.products } : {}),
    }).catch(() => {});
    updateRegistration(s.id, { status: "approved", seasonId, season: season?.seasonNumber }).catch(() => {});
    const reg = regByIdRef.current.get(s.id);
    if (reg) materializeRegistrationStalls(reg, seasonId, season?.seasonNumber).catch(() => {});
  }

  function runOne() {
    // Read the LATEST picks/pool from refs so each chained pick excludes prior winners
    // (a closure over `available`/`selected` would freeze at ceremony start).
    const cur = selectedRef.current;
    const usedIds = new Set(cur.map((s) => s.id));
    const avail = candidatesRef.current.filter((c) => !usedIds.has(c.id));
    if (cur.length >= targetRef.current || avail.length === 0) {
      setPhase(cur.length >= targetRef.current ? "done" : "idle");
      setRunning(false);
      return;
    }
    const prevWinnerId = cur[0]?.id ?? null; // the last winner — the next spin starts from its cell
    // Pick the winner up front, then sweep the picker SEQUENTIALLY (cell by cell, in
    // order) starting from the previous winner's cell and coming to rest on the new
    // one — like a wheel that keeps turning from wherever it last stopped.
    const order = candidatesRef.current; // cells in the same order the grid renders
    const n = order.length;
    const winner = avail[Math.floor(Math.random() * avail.length)];
    const prevIdx = prevWinnerId ? Math.max(0, order.findIndex((c) => c.id === prevWinnerId)) : Math.floor(Math.random() * n);
    const winnerIdx = order.findIndex((c) => c.id === winner.id);
    const forward = (((winnerIdx - prevIdx) % n) + n) % n; // steps from the previous winner to this one
    // Bound the sweep so a slow hop speed can't make a far winner take forever: sweep
    // the last ~16 cells leading into the winner (a few more when it's very close).
    const CAP = 16;
    let steps = forward;
    let sweepStart = prevIdx; // ideally the previous winner's cell
    if (steps > CAP) { steps = CAP; sweepStart = (((winnerIdx - CAP) % n) + n) % n; }
    else if (steps < 6) { const add = 6 - steps; steps += add; sweepStart = (((sweepStart - add) % n) + n) % n; }
    const totalSteps = steps;
    // Per-cell hop time from the admin-set spin speed (Settings → Live Draw).
    const tickMs = spinMsRef.current;
    const spinMs = totalSteps * tickMs; // the reveal fires when the sweep actually lands
    setPhase("spinning");
    setCurrent(null); // drop the lingering winner glow…
    // …and start the picker where the sweep begins so it visibly travels into the winner.
    spinRegIdRef.current = order[sweepStart]?.id ?? prevWinnerId;
    setSpinRegId(spinRegIdRef.current);
    if (seasonId) setPoolSpinning(seasonId, true).catch(() => {}); // public map starts moving now
    let step = 0;
    let idx = sweepStart;
    const spinId = window.setInterval(() => {
      step++;
      idx = (idx + 1) % n; // advance one cell, in order
      const cell = order[idx];
      if (cell) {
        setReel({ seller: cell.seller, business: cell.business });
        spinRegIdRef.current = cell.id;
        setSpinRegId(cell.id);
      }
      if (step >= totalSteps) window.clearInterval(spinId);
    }, tickMs);
    timers.current.push(spinId as unknown as number);

    addTimer(() => {
      // The sweep comes to rest on the pre-chosen winner.
      const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const reg = regByIdRef.current.get(winner.id); // full registration → tagline / products for the reveal
      const s: Selected = {
        order: nextOrder(cur),
        stallNo: nextStallNo(cur), // lowest free number — refills a removed winner's slot
        seller: winner.seller,
        business: winner.business,
        category: winner.category,
        avatar: winner.avatar,
        id: winner.id,
        at: nowStr,
        tagline: reg?.tagline,
        products: reg?.products,
      };
      const next = [s, ...cur];
      selectedRef.current = next; // update the ref now so the NEXT runOne excludes this winner
      setSpinRegId(null);
      if (seasonId) setPoolSpinning(seasonId, false).catch(() => {}); // stop the public hop; winner reveals
      setCurrent(s);        // dart now strikes this applicant's cell on the venue map
      setReel(null);
      setPhase("reveal");
      persist(s);

      // Hold on the landed dart so everyone sees where it struck, THEN name.
      const HOLD = 1400;
      const showMs = Math.max(1, revealHoldRef.current) * 1000; // admin-set winner display time
      addTimer(() => { fireConfetti(); setShowWinner(true); }, HOLD);
      addTimer(() => {
        setSelected(next);
        setShowWinner(false);
        setPhase("idle");
        // Keep `current` = winner so its cell stays glowing until the admin clicks
        // Continue (which clears it and starts the next pick). Non-Stop still auto-chains.
        if (runningRef.current) { setCurrent(null); addTimer(runOne, 800); }
      }, HOLD + showMs);
    }, spinMs); // spin lasts the admin-set countdown so the public count reaches 1 at reveal
  }

  // One-time: match the agreed final list to real registrations. Business+owner
  // first, then a unique business, then a unique owner — so duplicate business
  // names (e.g. several "Hafiza's mart") can't grab the wrong registration.
  const [finalOpen, setFinalOpen] = useState(false);
  const [finalBusy, setFinalBusy] = useState(false);
  // Stall no → registration id, picked by hand when the names don't match
  // (e.g. the business was registered under a different spelling).
  const [manual, setManual] = useState<Record<number, string>>({});
  const finalPlan = useMemo(() => {
    const byBiz = new Map<string, Candidate[]>();
    const byOwner = new Map<string, Candidate[]>();
    const push = (m: Map<string, Candidate[]>, k: string, c: Candidate) => { const l = m.get(k); l ? l.push(c) : m.set(k, [c]); };
    allRegs.forEach((c) => { push(byBiz, fnKey(c.business), c); push(byOwner, fnKey(c.seller), c); });
    const used = new Set<string>();
    const matched: { row: (typeof FINAL_STALLS)[number]; cand: Candidate }[] = [];
    const unmatched: (typeof FINAL_STALLS)[number][] = [];
    const free = (l?: Candidate[]) => (l ?? []).filter((c) => !used.has(c.id));
    const byId = new Map(allRegs.map((c) => [c.id, c]));
    // A hand-picked registration wins over name matching, so claim those first.
    for (const row of FINAL_STALLS) { const c = manual[row.n] && byId.get(manual[row.n]); if (c) used.add(c.id); }
    for (const row of FINAL_STALLS) {
      let cand = manual[row.n] ? byId.get(manual[row.n]) : undefined;
      if (!cand) cand = free(byBiz.get(fnKey(row.b))).find((c) => fnKey(c.seller) === fnKey(row.o));
      if (!cand) { const l = free(byBiz.get(fnKey(row.b))); if (l.length === 1) cand = l[0]; }
      if (!cand) { const l = free(byOwner.get(fnKey(row.o))); if (l.length === 1) cand = l[0]; }
      if (cand) { used.add(cand.id); matched.push({ row, cand }); } else unmatched.push(row);
    }
    return { matched, unmatched, toWaitlist: allRegs.filter((c) => !used.has(c.id)) };
  }, [allRegs, manual]);

  // Set the draw to exactly the final list: rewrite results, approve those 45,
  // and put every other applicant back on the waitlist (their stall removed).
  async function applyFinalList() {
    if (!seasonId) return;
    setFinalBusy(true);
    try {
      await clearDrawResultsBySeasonId(seasonId);
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      let order = 0;
      for (const { row, cand } of finalPlan.matched) {
        order++;
        await saveDrawResult({ seasonId, order, stallNo: row.n, candidateId: cand.id, seller: cand.seller, business: cand.business, category: cand.category, at: now });
        // Paid in the agreed list → status "paid" (still a winner, just settled).
        await updateRegistration(cand.id, { status: row.p ? "paid" : "approved", seasonId, season: season?.seasonNumber });
        const reg = regByIdRef.current.get(cand.id);
        if (reg) await materializeRegistrationStalls(reg, seasonId, season?.seasonNumber).catch(() => {});
      }
      for (const c of finalPlan.toWaitlist) {
        await updateRegistration(c.id, { status: "waitlist", season: season?.seasonNumber });
        await deleteStallForRegistration(c.id).catch(() => {});
      }
      const picks: Selected[] = finalPlan.matched.map(({ row, cand }, i) => ({
        order: i + 1, stallNo: row.n, seller: cand.seller, business: cand.business,
        category: cand.category, avatar: cand.avatar, id: cand.id, at: now,
      })).sort((a, b) => b.order - a.order);
      selectedRef.current = picks;
      setSelected(picks);
      setPhase("done");
      setFinalOpen(false);
      toast.success(`${finalPlan.matched.length} stalls set · ${finalPlan.toWaitlist.length} back on waitlist`);
    } catch (e) {
      toast.error(friendlyAuthError(e));
    } finally {
      setFinalBusy(false);
    }
  }

  // Drop one winner from the draw: their result is deleted, they go back to the
  // waitlist pool (stall removed), and their stall number frees up for a re-draw.
  async function removeWinner(s: Selected) {
    if (!seasonId) return;
    const next = selectedRef.current.filter((x) => x.id !== s.id);
    selectedRef.current = next;
    setSelected(next);
    if (current?.id === s.id) setCurrent(null);
    setPhase("idle"); // target is no longer met — the machine can draw again
    try {
      await deleteDrawResultByCandidate(seasonId, s.id);
      await updateRegistration(s.id, { status: "waitlist", season: season?.seasonNumber });
      await deleteStallForRegistration(s.id).catch(() => {});
      toast.success(`${s.business} ${t("draw.removedBack")}`);
    } catch (e) {
      toast.error(friendlyAuthError(e));
    }
  }

  // Raise the target then reopen the machine so the extra winners can be drawn —
  // existing winners are kept (no reset). Effective immediately via targetRef.
  async function raiseTargetAndContinue() {
    const n = parseInt(newTarget, 10);
    if (!seasonId || !Number.isFinite(n) || n <= selected.length) { toast.error(t("draw.raiseInvalid").replace("{n}", String(selected.length))); return; }
    try {
      await updateSeason(seasonId, { maximumSelectedStalls: n });
      targetRef.current = n;
      setNewTarget("");
      setPhase("idle");
      toast.success(t("draw.raiseOk").replace("{n}", String(n)));
    } catch { toast.error(t("draw.saveErr")); }
  }
  // Finalise: mark the season Completed (locks the draw, hides the ceremony) and
  // stop the live broadcast. Winners are already saved as each was drawn.
  async function finishDraw() {
    if (!seasonId) return;
    setFinishBusy(true);
    try {
      await updateSeason(seasonId, { status: "Completed" });
      await setDrawLive(false).catch(() => {});
      setLive(false);
      toast.success(t("draw.finishOk"));
    } catch { toast.error(t("draw.saveErr")); } finally { setFinishBusy(false); }
  }
  // Admin: bring a completed draw back to the ceremony screen (e.g. to draw more).
  async function reopenDraw() {
    if (!seasonId) return;
    setFinishBusy(true);
    try {
      await updateSeason(seasonId, { status: "DrawRunning" });
      toast.success(t("draw.reopenOk"));
    } catch { toast.error(t("draw.saveErr")); } finally { setFinishBusy(false); }
  }

  // Draw runs only while the season is in a draw phase (no season ⇒ legacy fallback, allow).
  const canDraw = !season || season.status === "DrawPending" || season.status === "DrawRunning";

  function startCeremony() {
    if (phase !== "idle") return;
    if (!canDraw) { toast.error(t("draw.notPhase")); return; }
    if (available.length === 0) {
      toast.error(candidates.length === 0 ? t("draw.noRegs") : t("draw.allAssigned"));
      return;
    }
    // Single step: one pick per click. runOne won't auto-chain (running stays false);
    // the button disables during the pick, then returns as "Continue" for the next.
    runOne();
  }

  /* Non-Stop: rapid-fire picks (no countdown, no full-screen reveal) until all
     TARGET are assigned. Reads the latest picks from a ref so it never stalls. */
  function fastStep() {
    const cur = selectedRef.current;
    const usedIds = new Set(cur.map((s) => s.id));
    const avail = candidatesRef.current.filter((s) => !usedIds.has(s.id));
    if (cur.length >= targetRef.current || avail.length === 0) {
      setReel(null);
      setCurrent(null);
      setPhase(cur.length >= targetRef.current ? "done" : "idle");
      setRunning(false);
      if (seasonId) setPoolSpinning(seasonId, false).catch(() => {});
      if (cur.length >= targetRef.current) fireConfetti();
      return;
    }
    const winner = avail[Math.floor(Math.random() * avail.length)];
    const s: Selected = {
      order: nextOrder(cur),
      stallNo: nextStallNo(cur), // lowest free number — refills a removed winner's slot
      seller: winner.seller,
      business: winner.business,
      category: winner.category,
      avatar: winner.avatar,
      id: winner.id,
      at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const next = [s, ...cur];
    selectedRef.current = next;
    persist(s);
    setReel({ seller: s.seller, business: s.business });
    setCurrent(s);
    setSelected(next);
    addTimer(fastStep, 300);
  }
  function startNonStop() {
    if (phase !== "idle") return;
    if (!canDraw) { toast.error(t("draw.notPhase")); return; }
    if (available.length === 0) {
      toast.error(candidates.length === 0 ? t("draw.noRegs") : t("draw.allAssigned"));
      return;
    }
    setRunning(true);
    setPhase("spinning");
    if (seasonId) setPoolSpinning(seasonId, true).catch(() => {}); // public map hops through the non-stop run
    addTimer(fastStep, 250);
  }

  function pauseCeremony() {
    setRunning(false);
    if (seasonId) setPoolSpinning(seasonId, false).catch(() => {});
  }
  function reset() {
    const wonIds = selectedRef.current.map((s) => s.id); // registration ids of the current winners
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
    selectedRef.current = [];
    setSelected([]);
    setCurrent(null);
    setShowWinner(false);
    setReel(null);
    setSpinRegId(null);
    spinRegIdRef.current = null;
    setPhase("idle");
    setRunning(false);
    if (seasonId) { setPoolSpinning(seasonId, false).catch(() => {}); clearDrawResultsBySeasonId(seasonId).catch(() => {}); } // wipe this season's saved draw
    // Undo the win: put every winner back in the waitlist pool and drop their stall.
    wonIds.forEach((id) => {
      updateRegistration(id, { status: "waitlist", season: season?.seasonNumber }).catch(() => {});
      deleteStallForRegistration(id).catch(() => {});
    });
  }

  const progress = selected.length / TARGET;

  // Draw finalised → hide the live ceremony; show a completed summary. Admin can
  // still review past/current draws or reopen to draw more.
  if (season?.status === "Completed") {
    return (
      <div className="relative flex min-h-[82vh] flex-col items-center justify-center overflow-hidden bg-hero px-4 py-20 text-center text-white">
        <div className="pointer-events-none absolute inset-0 pattern-dots opacity-20" />
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-warm opacity-30 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
          className="relative w-full max-w-lg overflow-hidden rounded-[36px] border border-white/15 bg-black/25 p-8 shadow-glow backdrop-blur-xl md:p-12"
        >
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-accent/20 text-accent ring-1 ring-white/20"><Trophy className="h-8 w-8" /></span>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-teal/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white/90">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> {t("draw.completedTag")}
          </div>
          <h1 className="mt-3 font-display text-4xl font-black leading-tight md:text-5xl">{t("draw.completedTitle")}</h1>
          <p className="mt-2 text-white/70">{season.seasonName} · <span className="font-semibold text-white">{selected.length}</span> {t("draw.winnersWord")}</p>
          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <button
              onClick={() => setViewOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-festive px-6 py-3 text-sm font-bold text-white shadow-glow transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-95"
            >
              <ListChecks className="h-4 w-4" /> {t("draw.viewDraws")}
            </button>
            <button
              onClick={reopenDraw}
              disabled={finishBusy}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 backdrop-blur transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-95 disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" /> {t("draw.reopen")}
            </button>
          </div>
        </motion.div>
        <DrawsViewer open={viewOpen} onOpenChange={setViewOpen} seasons={seasons} currentSeasonId={seasonId} />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-hero pb-24 text-white">
      <div className="pointer-events-none absolute inset-0 pattern-dots opacity-20" />
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-warm opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute -left-32 top-1/2 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />

      {/* HEADER */}
      <section className="relative mx-auto max-w-7xl px-4 pt-16 md:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white/90 backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> {t("draw.liveCeremony")}
          </div>
          <h1 className="mt-4 font-display text-5xl font-black leading-[1.1] md:text-7xl">
            {t("draw.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/80">
            {t("draw.subtitle").replace("{n}", String(candidates.length)).replace("{total}", String(TARGET))}
          </p>
        </div>

        {/* STATS + CONTROLS */}
        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
          <StatChip label={t("draw.registered")} value={registeredCount} />
          <StatChip label={t("draw.totalWinners")} value={TARGET} />
          <StatChip label={t("draw.progress")} value={`${selected.length}/${TARGET}`} accent />
        </div>

        <div className="mx-auto mt-8 flex w-fit max-w-full flex-col items-center gap-3 rounded-3xl border border-white/12 bg-black/20 p-3.5 shadow-glow backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-center gap-3">
          {nonStop && phase !== "done" && !running && (
            <button
              onClick={startNonStop}
              disabled={phase !== "idle"}
              className="inline-flex items-center gap-2 rounded-full bg-warm px-6 py-3 text-sm font-bold text-primary shadow-glow transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 active:scale-95 touch-manipulation"
            >
              <Zap className="h-4 w-4" /> {t("draw.beginNonstop")}
            </button>
          )}
          {phase !== "done" && !running && (
            <button
              onClick={startCeremony}
              disabled={phase !== "idle"}
              className="inline-flex items-center gap-2 rounded-full bg-festive px-6 py-3 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 active:scale-95 touch-manipulation"
            >
              <Play className="h-4 w-4" /> {selected.length === 0 ? t("draw.begin") : t("draw.continue")}
            </button>
          )}
          {running && (
            <button
              onClick={pauseCeremony}
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-transform hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-95 touch-manipulation"
            >
              <Pause className="h-4 w-4" /> {t("draw.pause")}
            </button>
          )}
          <button
            onClick={() => setConfirmReset(true)}
            disabled={selected.length === 0 && phase === "idle"}
            title={t("draw.reset")}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-red-400/40 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-200 backdrop-blur transition-colors hover:border-red-400/60 hover:bg-red-500/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 touch-manipulation"
          >
            <RotateCcw className="h-4 w-4" /> {t("draw.reset")}
          </button>
        </div>

          {/* Draw complete → raise the count & keep drawing, or finish & save. */}
          {phase === "done" && (
            <div className="w-full max-w-md rounded-2xl border border-accent/30 bg-white/[0.04] p-3.5">
              <div className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-accent">
                <Target className="h-3.5 w-3.5" /> {t("draw.targetReached").replace("{n}", String(selected.length))}
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <div className="flex flex-1 items-stretch overflow-hidden rounded-full border border-white/20 bg-black/20">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={selected.length + 1}
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    placeholder={t("draw.newTotal").replace("{n}", String(selected.length + 5))}
                    aria-label={t("draw.newTotal").replace("{n}", String(selected.length + 5))}
                    className="w-full bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={raiseTargetAndContinue}
                    disabled={!newTarget}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap bg-warm px-4 text-sm font-bold text-primary transition-colors hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Play className="h-4 w-4" /> {t("draw.continueDraw")}
                  </button>
                </div>
                <button
                  onClick={finishDraw}
                  disabled={finishBusy}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-festive px-5 py-2.5 text-sm font-bold text-white shadow-glow transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {finishBusy ? <Sparkles className="h-4 w-4 animate-pulse" /> : <CheckCircle2 className="h-4 w-4" />} {t("draw.finishSave")}
                </button>
              </div>
            </div>
          )}

          {/* Broadcast: when ON, every visitor sees a "watch live" banner → /present */}
          <div className="flex flex-wrap items-center justify-center gap-3">
          {/* ponytail: one-time — apply the agreed final allotment, then remove. */}
          <button
            onClick={() => setFinalOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-accent/50 bg-accent/15 px-5 py-3 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 active:scale-95"
          >
            <ListChecks className="h-4 w-4" /> Apply final list ({finalPlan.matched.length}/45)
          </button>
          <button
            onClick={() => setViewOpen(true)}
            title={t("draw.viewDraws")}
            className="group inline-flex min-h-11 items-center gap-2.5 rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-bold text-white/85 backdrop-blur transition-all hover:border-white/40 hover:bg-white/10 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-95"
          >
            <ListChecks className="h-4 w-4 transition-transform group-hover:scale-110" /> {t("draw.viewDraws")}
          </button>
          <button
            onClick={toggleLive}
            disabled={liveBusy}
            aria-pressed={live}
            title={live ? t("draw.liveHint") : t("draw.goLiveHint")}
            className={`group inline-flex min-h-11 items-center gap-2.5 rounded-full px-6 py-3 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-95 disabled:opacity-50 touch-manipulation ${
              live
                ? "bg-festive text-white shadow-glow ring-2 ring-white/25"
                : "border border-white/25 bg-white/5 text-white/85 hover:border-white/40 hover:bg-white/10 hover:shadow-glow"
            }`}
          >
            {live ? (
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
              </span>
            ) : (
              <Radio className="h-4 w-4 transition-transform group-hover:scale-110" />
            )}
            {live ? t("draw.liveOnBtn") : t("draw.goLive")}
          </button>
          </div>
        </div>
      </section>

      {/* MAIN GRID */}
      <section className="relative mx-auto mt-14 grid max-w-7xl gap-6 px-4 md:px-8 lg:grid-cols-[1.4fr_1fr]">
        {/* LEFT — draw machine & venue */}
        <div className="space-y-6">
          <StallArena
            total={TARGET}
            target={TARGET}
            regs={allRegs}
            selectedIds={selectedIds}
            usedStalls={usedStalls}
            selected={selected}
            current={current}
            done={phase === "done"}
            reveal={phase === "reveal"}
            phase={phase}
            reel={reel}
            spinRegId={spinRegId}
          />
        </div>

        {/* RIGHT — one card: progress ring + live feed */}
        <div className="space-y-6 rounded-[36px] border border-white/15 bg-black/30 p-6 backdrop-blur-xl md:p-8">
          <ProgressRing value={progress} selected={selected.length} target={TARGET} />
          <div className="h-px bg-white/10" />
          <SelectedPanel selected={selected} target={TARGET} onRemove={removeWinner} />
        </div>
      </section>

      {/* Full-screen reveal overlay — only after the dart has landed */}
      <AnimatePresence>
        {showWinner && current && (
          <RevealOverlay s={current} target={TARGET} fields={revealFields} />
        )}
      </AnimatePresence>

      {phase === "done" && <DoneBanner target={TARGET} seasonName={season?.seasonName ?? EVENT.season} />}

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title={t("draw.resetTitle")}
        description={t("draw.resetDesc")}
        confirmLabel={t("draw.reset")}
        onConfirm={reset}
      />

      <DrawsViewer open={viewOpen} onOpenChange={setViewOpen} seasons={seasons} currentSeasonId={seasonId} />

      {/* ponytail: one-time final-allotment preview + apply. */}
      <Dialog open={finalOpen} onOpenChange={(o) => !o && !finalBusy && setFinalOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Apply final stall list</DialogTitle></DialogHeader>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto text-sm">
            <ul className="space-y-1 rounded-xl border border-border bg-muted/40 p-3">
              <li>✅ <b>{finalPlan.matched.length}</b> stalls matched → set as the draw (#1–45)</li>
              <li>💰 <b>{finalPlan.matched.filter((m) => m.row.p).length}</b> marked <b>Paid</b>, {finalPlan.matched.filter((m) => !m.row.p).length} approved (unpaid)</li>
              <li>↩️ <b>{finalPlan.toWaitlist.length}</b> others → back to Waitlist (stalls removed)</li>
            </ul>
            {finalPlan.unmatched.length > 0 && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3">
                <div className="font-semibold text-destructive">⚠ {finalPlan.unmatched.length} not matched by name — pick the registration, or they are SKIPPED:</div>
                <ul className="mt-2 space-y-2">
                  {finalPlan.unmatched.map((r) => (
                    <li key={r.n}>
                      <div className="text-xs font-medium">#{r.n} {r.b} — {r.o}</div>
                      <select
                        value={manual[r.n] ?? ""}
                        onChange={(e) => setManual((m) => ({ ...m, [r.n]: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-border bg-white/80 px-2 py-1.5 text-xs"
                      >
                        <option value="">— skip —</option>
                        {/* every applicant, not just the waitlist — a skipped seller may already be approved */}
                        {allRegs.map((c) => <option key={c.id} value={c.id}>{c.business} — {c.seller}</option>)}
                      </select>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <div className="mb-1 font-semibold">Back to waitlist</div>
              <ul className="max-h-40 space-y-0.5 overflow-y-auto rounded-xl border border-border bg-muted/40 p-3 text-xs">
                {finalPlan.toWaitlist.map((c) => <li key={c.id} className="truncate">{c.business} — {c.seller}</li>)}
                {finalPlan.toWaitlist.length === 0 && <li className="text-muted-foreground">—</li>}
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">This rewrites the season's draw results and every applicant's status. Merged businesses are not approved separately.</p>
          </div>
          <DialogFooter>
            <button type="button" onClick={() => setFinalOpen(false)} disabled={finalBusy} className="rounded-full border border-border px-4 py-2 text-sm font-medium disabled:opacity-50">Cancel</button>
            <button type="button" onClick={applyFinalList} disabled={finalBusy || finalPlan.matched.length === 0} className="inline-flex items-center gap-2 rounded-full bg-festive px-5 py-2 text-sm font-semibold text-white shadow-soft disabled:opacity-50">
              {finalBusy && <Loader2 className="h-4 w-4 animate-spin" />} Apply
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ==== View draws: pick a season, see its saved winners, download CSV ==== */
function DrawsViewer({ open, onOpenChange, seasons, currentSeasonId }: { open: boolean; onOpenChange: (o: boolean) => void; seasons: Season[]; currentSeasonId: string | null }) {
  const { t } = useI18n();
  const [sid, setSid] = useState<string>(currentSeasonId ?? "");
  const [rows, setRows] = useState<DrawResult[]>([]);
  const [loading, setLoading] = useState(false);
  const ordered = useMemo(() => [...seasons].sort((a, b) => b.seasonNumber - a.seasonNumber), [seasons]);
  useEffect(() => { if (open && !sid && (currentSeasonId || ordered[0]?.id)) setSid(currentSeasonId ?? ordered[0]!.id!); }, [open, currentSeasonId, ordered, sid]);
  useEffect(() => {
    if (!open || !sid) { setRows([]); return; }
    setLoading(true);
    getDrawResultsBySeasonId(sid)
      .then((r) => setRows([...r].sort((a, b) => a.order - b.order)))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [open, sid]);
  const activeName = ordered.find((s) => s.id === sid)?.seasonName ?? "";
  function download() {
    const cols = ["Stall", "Order", "Business", "Owner", "Category", "Time"];
    const esc = (v: unknown) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const body = rows.map((r) => [r.stallNo, r.order, r.business, r.seller, r.category, r.at].map(esc).join(","));
    const csv = "﻿" + [cols.join(","), ...body].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `draw-${activeName.replace(/\s+/g, "-").toLowerCase() || "results"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-3xl lg:max-w-4xl">
        {/* Header band */}
        <div className="relative overflow-hidden bg-hero px-6 py-5 text-white">
          <div className="pointer-events-none absolute inset-0 pattern-dots opacity-15" />
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-warm opacity-30 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/15 text-accent ring-1 ring-white/20"><ListChecks className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <DialogHeader className="space-y-0 text-left">
                <DialogTitle className="font-display text-xl font-bold text-white">{t("draw.viewDraws")}</DialogTitle>
              </DialogHeader>
              <div className="mt-0.5 text-xs text-white/70">{t("draw.viewDrawsSub")}</div>
            </div>
            <button
              onClick={download}
              disabled={rows.length === 0}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
          </div>
        </div>

        {/* Season chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ordered.map((s) => {
            const on = s.id === sid;
            const isCurrent = s.id === currentSeasonId;
            return (
              <button
                key={s.id}
                onClick={() => setSid(s.id!)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${on ? "bg-festive text-white shadow-soft" : "bg-muted/60 text-foreground/70 hover:bg-muted"}`}
              >
                {s.seasonName}
                {isCurrent && <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${on ? "bg-white/20 text-white" : "bg-primary/15 text-primary"}`}>{t("draw.currentTag")}</span>}
              </button>
            );
          })}
        </div>

        {/* Winners list */}
        <div className="max-h-[62vh] overflow-y-auto px-3 py-3">
          {loading ? (
            <div className="flex justify-center py-14"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
          ) : rows.length === 0 ? (
            <div className="py-14 text-center text-sm text-muted-foreground">{t("draw.noDraws")}</div>
          ) : (
            <>
              <div className="px-3 pb-2 text-xs text-muted-foreground"><span className="font-semibold text-foreground">{rows.length}</span> {t("draw.winnersWord")}</div>
              <ul className="space-y-1.5">
                {rows.map((r) => {
                  const palette = CATEGORY_COLORS[r.category] ?? CATEGORY_COLORS.Others;
                  return (
                    <li key={r.id ?? r.order} className="flex items-center gap-3 rounded-2xl px-3 py-2 transition-colors hover:bg-muted/50">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-sm font-black tabular-nums text-white shadow-soft" style={{ background: `linear-gradient(180deg, ${palette.bg} 0%, ${palette.canopy} 100%)` }}>
                        #{r.stallNo.toString().padStart(2, "0")}
                      </div>
                      <img src={avatarFor(r.candidateId)} loading="lazy" alt={r.seller} className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-border" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-foreground">{r.business}</div>
                        {r.seller && <div className="truncate text-xs text-muted-foreground">{r.seller}</div>}
                        <div className="mt-0.5 inline-flex sm:hidden rounded-full px-2 py-0.5 text-[10px] font-medium text-primary" style={{ backgroundColor: `${palette.bg}22` }}>{r.category}</div>
                        {r.products && r.products.length > 0 && (
                          <div className="truncate text-[11px] text-muted-foreground/80" title={r.products.join(", ")}>
                            <span className="font-medium text-foreground/60">{t("draw.sells")}:</span> {r.products.join(", ")}
                          </div>
                        )}
                      </div>
                      <span className="hidden shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-primary sm:inline-flex" style={{ backgroundColor: `${palette.bg}22` }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: palette.bg }} /> {r.category}
                      </span>
                      <div className="shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">
                        <div className="font-semibold text-foreground/70">#{r.order}</div>
                        <div>{r.at}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ==== small chip ==== */
function StatChip({ label, value, accent = false }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 text-center backdrop-blur-xl ${accent ? "border-accent/40 bg-white/10 shadow-soft" : "border-white/12 bg-white/[0.06]"}`}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">{label}</div>
      <div className={`mt-1.5 font-display text-3xl font-black tabular-nums md:text-4xl ${accent ? "text-accent" : "text-white"}`}>{value}</div>
    </div>
  );
}

/* ==== FULL SCREEN REVEAL ==== */
function RevealOverlay({ s, target, fields }: { s: Selected; target: number; fields: RevealFields }) {
  const { t } = useI18n();
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
        className="relative w-full max-w-2xl overflow-hidden rounded-[36px] bg-hero p-8 text-center text-white shadow-glow md:p-10"
      >
        <div className="pointer-events-none absolute inset-0 pattern-dots opacity-25" />
        <div className="pointer-events-none absolute -inset-1 rounded-[38px] bg-festive opacity-30 blur-2xl" />

        <div className="relative">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-1.5 text-sm font-semibold uppercase tracking-widest text-accent">
            <PartyPopper className="h-5 w-5" /> {t("draw.congrats")}
          </div>
          <div className="mt-4 text-xs font-semibold uppercase tracking-[0.4em] text-white/70">{t("draw.stallAssigned")}</div>
          <div className="font-display text-7xl font-black text-warm drop-shadow-[0_0_40px_rgba(255,201,74,0.7)] md:text-8xl">
            #{s.stallNo.toString().padStart(2, "0")}
          </div>
          <div className="mt-2 font-script text-4xl text-accent">{t("draw.assignedTo")}</div>
          <div className="mt-5 flex items-center justify-center gap-5">
            <img src={s.avatar} className="h-20 w-20 rounded-full object-cover ring-4 ring-accent/60" alt={s.seller} />
            <div className="min-w-0 text-left">
              <div className="font-display text-3xl font-black leading-tight md:text-4xl">{s.business}</div>
              <div className="text-lg text-white/80">{t("home.by")} {s.seller}</div>
              {fields.category && s.category && <div className="mt-1.5 inline-block rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">{s.category}</div>}
            </div>
          </div>
          {fields.tagline && s.tagline && <div className="mt-5 font-script text-2xl text-accent">“{s.tagline}”</div>}
          {fields.products && s.products && s.products.length > 0 && (
            <div className="mt-5">
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">{t("draw.sells")}</div>
              <div className="mt-2.5 flex flex-wrap justify-center gap-2">
                {s.products.slice(0, 8).map((p, i) => (
                  <span key={i} className="rounded-full bg-white/10 px-3.5 py-1 text-sm font-medium text-white/90">{p}</span>
                ))}
              </div>
            </div>
          )}
          <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-teal/20 px-5 py-2 text-sm font-semibold text-white">
            <Award className="h-5 w-5 text-accent" /> {t("draw.selection")} {s.order} / {target}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ==== STALL ARENA ==== */
export function StallArena({
  total,
  target,
  regs,
  selectedIds,
  usedStalls,
  selected,
  current,
  done,
  reveal = false,
  phase = "idle",
  reel = null,
  spinRegId = null,
  controls = true,
}: {
  total: number;
  target: number;
  regs: Candidate[];
  selectedIds: Set<string>;
  usedStalls: Set<number>;
  selected: Selected[];
  current: Selected | null;
  done: boolean;
  reveal?: boolean;
  phase?: string;
  reel?: { seller: string; business: string } | null;
  spinRegId?: string | null;
  controls?: boolean;
}) {
  const { t } = useI18n();
  // Board at rest (ready, nothing picked) → no cell should be lit; guards against any
  // leftover current/spin highlight blinking after an interrupted or reset draw.
  const atRest = phase === "idle" && selected.length === 0;
  // Memoised so a benign parent re-render doesn't rebuild these (and re-thrash the
  // booth grid) — a common source of flicker.
  const byStall = useMemo(() => new Map(selected.map((s) => [s.stallNo, s])), [selected]);
  const winnersById = useMemo(() => new Map(selected.map((s) => [s.id, s])), [selected]); // winning applicant cells
  // The arena shows the SELECTED stall numbers (sorted) laid out in the pattern:
  // left wing (first 22) · right wing (next 22) · last one centred below.
  const picks = useMemo(() => [...new Set(selected.map((s) => s.stallNo))].sort((a, b) => a - b), [selected]);
  const leftStalls = picks.slice(0, 22);
  const rightStalls = picks.slice(22, 44);
  const centerStall = picks[44]; // 45th pick, centred
  const [arenaW, setArenaW] = useState(900); // wings max-width (px) — high = columns hug both edges

  // No overflow-hidden on the card: booth hover tooltips must be able to escape it
  // (edge booths were getting their name clipped). The dots overlay keeps the rounding.
  return (
    <div className="relative rounded-[28px] border border-white/15 bg-gradient-to-b from-black/40 via-black/30 to-black/50 p-4 pt-3 backdrop-blur-xl md:p-6 md:pt-4">
      <div className="pointer-events-none absolute inset-0 rounded-[28px] pattern-dots opacity-10" />

      {/* Header */}
      <div className="relative mb-3">
        <div className="text-[9px] font-semibold uppercase tracking-[0.35em] text-accent/90">
          {done ? t("draw.liveAlloc") : t("draw.liveVenueMap")}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="inline-flex items-center gap-2 font-display text-base font-black text-white md:text-lg">
            {done && <Store className="h-4 w-4 text-accent" aria-hidden="true" />}
            {done ? t("draw.stallArena") : t("draw.venueMap")}
          </span>
          <span className="inline-flex items-center gap-1.5 font-script text-sm text-accent">
            {done && <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />}
            {done ? `${total} ${t("draw.stall")} · ${target} ${t("draw.randomlySelected")}` : `${regs.length} ${t("draw.registered")} · ${t("draw.lightingUp")}`}
          </span>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold tabular-nums text-white/80 ring-1 ring-white/15">
            {selected.length} / {target} {t("draw.assignedWord")}
          </span>
          <span className={`ms-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ${
            phase === "idle" || done ? "bg-white/5 text-white/60 ring-white/15"
              : phase === "reveal" ? "bg-teal/20 text-teal ring-teal/40"
              : "bg-accent/20 text-accent ring-accent/40"
          }`}>
            <span className="relative flex h-1.5 w-1.5">
              {phase !== "idle" && !done && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-70" />}
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
            </span>
            {done ? t("draw.chipReady") : phase === "idle" ? t("draw.chipReady") : phase === "reveal" ? t("draw.chipWinner") : t("draw.chipDrawing")}
          </span>
        </div>
        {/* Live picker readout — the business being drawn as the map runs */}
        <AnimatePresence mode="wait">
          {phase === "spinning" && reel && (
            <motion.div
              key={reel.business}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="mt-1.5 flex items-baseline gap-2"
            >
              <span className="text-[9px] font-semibold uppercase tracking-widest text-white/50">{t("draw.selecting")}</span>
              <span className="truncate font-display text-sm font-bold text-white">{reel.business}</span>
              <span className="truncate text-[10px] text-white/60">{t("home.by")} {reel.seller}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative mb-3 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[9px] font-semibold uppercase tracking-wider text-white/70">
        <LegendDot color="rgba(255,255,255,0.15)" label={t("draw.empty")} ring />
        {Object.entries(CATEGORY_COLORS).map(([k, v]) => (
          <LegendDot key={k} color={v.bg} label={v.label} />
        ))}
      </div>

      {!done && (
        <SimpleStallGrid regs={regs} winnersById={winnersById} selectedIds={selectedIds} current={atRest ? null : current} throwing={reveal && !atRest} spinRegId={atRest ? null : spinRegId} />
      )}

      {/* Arena — appears after all 45 stalls are assigned */}
      {done && (
      <div className="relative rounded-[24px] border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-3 pt-1.5 md:p-4 md:pt-2">
        {/* Arena size control */}
        {controls && (
        <div className="mb-1.5 flex items-center justify-end gap-2">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-white/60">{t("draw.arenaSize")}</span>
          <input
            type="range"
            min={300}
            max={900}
            step={10}
            value={arenaW}
            onChange={(e) => setArenaW(Number(e.target.value))}
            aria-label="Arena size"
            className="h-1 w-28 cursor-pointer accent-accent"
          />
        </div>
        )}

        {/* Front stalls banner */}
        <div className="mb-2 flex items-center justify-center gap-2">
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-accent/50" />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.3em] text-accent">
            <DoorOpen className="h-3 w-3" aria-hidden="true" /> {t("draw.frontEntrance")}
          </span>
          <span className="h-px w-10 bg-gradient-to-l from-transparent to-accent/50" />
        </div>

        <div style={{ maxWidth: arenaW }} className="grid w-full grid-cols-[1fr_auto_1fr] items-start gap-2 md:gap-3">
          {/* Left wing */}
          <StallColumn
            stalls={leftStalls}
            byStall={byStall}
            usedStalls={usedStalls}
            current={current}
          />

          {/* Center walkway */}
          <div className="relative flex min-h-full flex-col items-center justify-between py-2">
            <div className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/55 [writing-mode:vertical-rl]">
              {t("draw.walkingAisle")}
            </div>
            <div className="my-2 flex-1 w-[2px] rounded-full bg-gradient-to-b from-accent/40 via-white/10 to-accent/40" />
            <div className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/55 [writing-mode:vertical-rl]">
              {t("draw.aisle")}
            </div>
          </div>

          {/* Right wing */}
          <StallColumn
            stalls={rightStalls}
            byStall={byStall}
            usedStalls={usedStalls}
            current={current}
          />
        </div>

        {/* Last pick — sits alone, centred below the two wings */}
        {centerStall != null && (
          <div className="mt-3 flex justify-center">
            <div className="w-12 sm:w-14">
              <StallBooth
                n={centerStall}
                index={44}
                info={byStall.get(centerStall)}
                assigned={usedStalls.has(centerStall)}
                isCurrent={current?.stallNo === centerStall}
              />
            </div>
          </div>
        )}

        {/* Stage / branding */}
        <div className="mx-auto mt-4 max-w-[200px] overflow-hidden rounded-xl bg-festive px-3 py-2 text-center shadow-glow ring-1 ring-white/20">
          <div className="inline-flex items-center justify-center gap-1 text-[7px] font-bold uppercase tracking-[0.3em] text-white/90">
            <Flower2 className="h-2.5 w-2.5" aria-hidden="true" /> {t("draw.grandStage")} <Flower2 className="h-2.5 w-2.5" aria-hidden="true" />
          </div>
          <div className="mt-0.5 font-display text-base font-black text-white md:text-lg">
            AMCHO BAZAR
          </div>
          <div className="font-script text-[11px] text-white/90">{t("present.tagline")}</div>
        </div>
      </div>
      )}
    </div>
  );
}

function SimpleStallGrid({
  regs,
  winnersById,
  selectedIds,
  current,
  throwing = false,
  spinRegId = null,
}: {
  regs: Candidate[];
  winnersById: Map<string, Selected>;
  selectedIds: Set<string>;
  current: Selected | null;
  throwing?: boolean;
  spinRegId?: string | null;
}) {
  const { t } = useI18n();
  if (regs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center text-sm text-white/60">
        {t("draw.noRegs")}
      </div>
    );
  }
  // One cell per applicant, labelled by name. Winners light up in their category
  // colour; the picker glows across cells and the dart strikes the winning cell.
  return (
    <div className="relative grid grid-cols-3 gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-4 md:grid-cols-5">
      {regs.map((r) => {
        const info = winnersById.get(r.id);
        const won = selectedIds.has(r.id);
        const isCurrent = current?.id === r.id;
        const isSpin = !isCurrent && spinRegId === r.id; // cell lit up as the picker runs
        const palette = info ? CATEGORY_COLORS[info.category] ?? CATEGORY_COLORS.Others : null;
        return (
          <div key={r.id} className="group relative">
            <div
              className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-lg px-1.5 py-1 text-center transition-transform duration-200 ${
                isCurrent ? "animate-pulse-glow" : ""
              }`}
              style={{
                transform: isCurrent ? "scale(1.12)" : isSpin ? "scale(1.06)" : "scale(1)",
                background: palette
                  ? `linear-gradient(180deg, ${palette.bg} 0%, ${palette.canopy} 100%)`
                  : isSpin
                    ? "rgba(255,201,74,0.22)"
                    : "rgba(255,255,255,0.05)",
                color: won ? "#fff" : isSpin ? "#fff" : "rgba(255,255,255,0.55)",
                boxShadow: isCurrent
                  ? `0 0 0 2px #FFC94A, 0 0 18px 3px ${palette?.ring ?? "rgba(255,201,74,0.7)"}`
                  : isSpin
                    ? "0 0 0 2px rgba(255,201,74,0.8), 0 0 14px 2px rgba(255,201,74,0.5)"
                    : won
                      ? `0 4px 10px -4px ${palette?.ring ?? "rgba(0,0,0,0.4)"}, inset 0 -2px 0 rgba(0,0,0,0.18)`
                      : "inset 0 0 0 1px rgba(255,255,255,0.07)",
              }}
            >
              <span className="line-clamp-2 text-[10px] font-bold leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">{r.business}</span>
              {r.seller && <span className="line-clamp-1 text-[9px] font-medium leading-tight opacity-75">{r.seller}</span>}
              {won && <span className="text-[8px] font-semibold tabular-nums opacity-80">#{info!.stallNo.toString().padStart(2, "0")}</span>}
            </div>
            {/* Thrown dart — strikes the winning applicant's cell */}
            <AnimatePresence>
              {isCurrent && throwing && (
                <motion.div
                  key="dart"
                  initial={{ y: -60, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 340, damping: 14 }}
                  className="pointer-events-none absolute bottom-full left-1/2 z-40 -mb-1 -translate-x-1/2"
                >
                  <RedDart className="h-12 w-[18px]" />
                </motion.div>
              )}
            </AnimatePresence>
            <div className="pointer-events-none absolute left-1/2 top-full z-40 mt-2 hidden w-max max-w-[60vw] -translate-x-1/2 rounded-lg bg-black/90 px-3 py-2 text-[11px] shadow-glow group-hover:block">
              <div className="font-semibold text-white">{r.business}</div>
              <div className="text-white/70">{r.seller}{won ? ` · ${t("draw.chipWinner")}` : ""}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LegendDot({ color, label, ring = false }: { color: string; label: string; ring?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className="h-2 w-2 rounded-sm"
        style={{
          background: color,
          boxShadow: ring ? "inset 0 0 0 1px rgba(255,255,255,0.25)" : `0 0 8px ${color}`,
        }}
      />
      {label}
    </span>
  );
}

function StallColumn({
  stalls,
  byStall,
  usedStalls,
  current,
}: {
  stalls: number[];
  byStall: Map<number, Selected>;
  usedStalls: Set<number>;
  current: Selected | null;
}) {
  // 2 per row
  const rows: number[][] = [];
  for (let i = 0; i < stalls.length; i += 2) rows.push(stalls.slice(i, i + 2));
  return (
    <div className="flex flex-col gap-1 md:gap-1.5">
      {rows.map((row, idx) => (
        <div key={idx} className="flex items-center justify-between gap-2">
          {row.map((n, cIdx) => (
            <div key={n} className="w-12 sm:w-14">
              <StallBooth
                n={n}
                index={idx * 2 + cIdx}
                info={byStall.get(n)}
                assigned={usedStalls.has(n)}
                isCurrent={current?.stallNo === n}
              />
            </div>
          ))}
          {row.length === 1 && <div className="w-12 sm:w-14" />}
        </div>
      ))}
    </div>
  );
}

function StallBooth({
  n,
  info,
  assigned,
  isCurrent,
  index = 0,
}: {
  n: number;
  info?: Selected;
  assigned: boolean;
  isCurrent: boolean;
  index?: number;
}) {
  const palette = info ? CATEGORY_COLORS[info.category] ?? CATEGORY_COLORS.Others : null;

  return (
    <div className="group relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: 12 }}
        animate={isCurrent ? { opacity: 1, scale: 1.18, y: -4 } : { opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.015, 0.7), type: "spring", stiffness: 260, damping: 20 }}
        whileHover={{ y: -2, scale: 1.06 }}
        className="relative"
      >
        {/* Canopy */}
        <div
          className="mx-auto h-1 w-[86%] rounded-t-md transition-all duration-500"
          style={{
            background: palette
              ? `repeating-linear-gradient(90deg, ${palette.canopy} 0 6px, ${palette.bg} 6px 12px)`
              : "repeating-linear-gradient(90deg, rgba(255,255,255,0.18) 0 6px, rgba(255,255,255,0.08) 6px 12px)",
            boxShadow: isCurrent ? `0 0 22px ${palette?.ring ?? "rgba(255,201,74,0.7)"}` : "none",
          }}
        />
        {/* Booth body */}
        <div
          className={`relative flex aspect-square items-center justify-center rounded-b-lg rounded-t-sm text-[10px] font-black tabular-nums transition-all duration-500 ${
            isCurrent ? "animate-pulse-glow" : ""
          }`}
          style={{
            background: palette
              ? `linear-gradient(180deg, ${palette.bg} 0%, ${palette.canopy} 100%)`
              : "rgba(255,255,255,0.06)",
            color: palette ? "#fff" : "rgba(255,255,255,0.45)",
            boxShadow: isCurrent
              ? `0 0 0 2px #FFC94A, 0 0 30px 4px ${palette?.ring ?? "rgba(255,201,74,0.8)"}`
              : assigned
                ? `0 4px 14px -4px ${palette?.ring ?? "rgba(0,0,0,0.4)"}, inset 0 -3px 0 rgba(0,0,0,0.2)`
                : "inset 0 0 0 1px rgba(255,255,255,0.08)",
          }}
        >
          <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
            {n.toString().padStart(2, "0")}
          </span>

          {/* Sparkle on current */}
          {isCurrent && (
            <>
              <span className="pointer-events-none absolute -right-1 -top-1 h-2 w-2 rounded-full bg-white shadow-[0_0_10px_2px_#FFC94A]" />
              <span className="pointer-events-none absolute -left-1 top-1/2 h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_2px_#FFC94A]" />
              <span className="pointer-events-none absolute -bottom-1 right-1/3 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_2px_#FFC94A]" />
            </>
          )}
        </div>
      </motion.div>

      {/* Tooltip */}
      {info && (
        <div className="pointer-events-none absolute left-1/2 top-full z-40 mt-2 hidden w-max max-w-[60vw] -translate-x-1/2 rounded-lg bg-black/90 px-3 py-2 text-[11px] shadow-glow group-hover:block">
          <div className="font-semibold text-white">{info.business}</div>
          <div className="text-white/70">
            {info.seller} · {info.category}
          </div>
        </div>
      )}
    </div>
  );
}

/* ==== PROGRESS RING ==== */
function ProgressRing({ value, selected, target }: { value: number; selected: number; target: number }) {
  const { t } = useI18n();
  const R = 68;
  const C = 2 * Math.PI * R;
  const dash = C * value;
  return (
    <div>
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
        <div className="relative h-36 w-36 shrink-0 sm:h-40 sm:w-40">
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
            <div className="font-display text-3xl font-black tabular-nums text-white">{selected}<span className="text-white/50">/{target}</span></div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/60">{t("draw.assignedLabel")}</div>
          </div>
        </div>
        <div className="w-full flex-1 text-center sm:text-left">
          <div className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/60">{t("draw.drawProgress")}</div>
          <div className="mt-1 font-display text-xl font-semibold text-white">{t("draw.liveCounter")}</div>
          <div className="mt-2 text-sm text-white/70">{t("draw.fairRandom")}</div>
          <div className="mt-4 text-xs">
            <div className="rounded-xl bg-white/5 p-2 text-center">
              <div className="text-white/60">{t("draw.remaining")}</div>
              <div className="font-display text-lg font-bold tabular-nums text-white">{target - selected}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==== SELECTED PANEL ==== */
function SelectedPanel({ selected, target, onRemove }: { selected: Selected[]; target: number; onRemove?: (s: Selected) => void }) {
  const { t } = useI18n();
  const [showAll, setShowAll] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<Selected | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  // Category chips with counts (draw order preserved elsewhere).
  const catCounts = selected.reduce<Record<string, number>>((m, s) => { m[s.category] = (m[s.category] ?? 0) + 1; return m; }, {});
  const cats = Object.keys(catCounts).sort();
  const rows = [...selected]
    .sort((a, b) => a.order - b.order)
    .filter((s) => (!cat || s.category === cat))
    .filter((s) => { const n = q.trim().toLowerCase(); return !n || `${s.business} ${s.seller} ${s.category} ${s.stallNo} ${(s.products ?? []).join(" ")}`.toLowerCase().includes(n); });
  const pct = target > 0 ? Math.min(100, Math.round((selected.length / target) * 100)) : 0;
  // Download the currently-listed picks (respects search + category filter) as CSV.
  function downloadCsv() {
    const cols = ["Order", "Stall", "Business", "Owner", "Category", "Will sell"];
    const esc = (v: unknown) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const body = rows.map((s) => [s.order, s.stallNo, s.business, s.seller, s.category, (s.products ?? []).join(" | ")].map(esc).join(","));
    const csv = "﻿" + [cols.join(","), ...body].join("\n"); // BOM so Excel reads UTF-8
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "selected-sellers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  // Live feed shows draw order (first winner first); the latest pick is highlighted.
  const feed = [...selected].sort((a, b) => a.order - b.order);
  const latestOrder = selected.length ? Math.max(...selected.map((s) => s.order)) : 0;
  return (
    <div className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10 md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/60">{t("draw.selectedSellers")}</div>
          <div className="mt-1 flex items-center gap-2 font-display text-xl font-semibold text-white">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-secondary" />
            </span>
            {t("draw.liveFeed")}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {selected.length > 0 && (
            <button
              onClick={() => setShowAll(true)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/85 backdrop-blur transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <ListChecks className="h-3.5 w-3.5" /> {t("draw.viewSelected")}
            </button>
          )}
        </div>
      </div>

      <Dialog open={showAll} onOpenChange={setShowAll}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl">
          {/* Header band */}
          <div className="relative overflow-hidden bg-hero px-6 py-5 text-white">
            <div className="pointer-events-none absolute inset-0 pattern-dots opacity-15" />
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-warm opacity-30 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/15 text-accent ring-1 ring-white/20"><Trophy className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <DialogHeader className="space-y-0 text-left">
                  <DialogTitle className="font-display text-xl font-bold text-white">{t("draw.selectedTitle")}</DialogTitle>
                </DialogHeader>
                <div className="mt-0.5 text-xs text-white/70">{t("draw.selectedSub")}</div>
              </div>
              <button
                onClick={downloadCsv}
                aria-label={t("adm.export")}
                title={t("adm.export")}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <Download className="h-3.5 w-3.5" /> {t("adm.export")}
              </button>
              <div className="shrink-0 text-right">
                <div className="font-display text-2xl font-black tabular-nums leading-none">{selected.length}<span className="text-base font-bold text-white/60">/{target}</span></div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-white/60">{pct}%</div>
              </div>
            </div>
            <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-gradient-to-r from-accent via-secondary to-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Search + category filter */}
          <div className="space-y-2.5 border-b border-border px-6 py-3">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("draw.searchSelected")}
                aria-label={t("draw.searchSelected")}
                className="w-full rounded-full border border-border bg-muted/40 py-2 ps-9 pe-4 text-sm outline-none ring-primary/20 focus:ring-4"
              />
            </div>
            {cats.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setCat(null)} className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${!cat ? "bg-festive text-white" : "bg-muted/60 text-foreground/70 hover:bg-muted"}`}>
                  {t("stalls.allCategories")} · {selected.length}
                </button>
                {cats.map((c) => {
                  const p = CATEGORY_COLORS[c] ?? CATEGORY_COLORS.Others;
                  const on = cat === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setCat(on ? null : c)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${on ? "text-white" : "text-foreground/70 hover:opacity-90"}`}
                      style={on ? { background: p.bg } : { backgroundColor: `${p.bg}1f` }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: on ? "#fff" : p.bg }} /> {c} · {catCounts[c]}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* List */}
          <div className="max-h-[72vh] overflow-y-auto px-3 py-3">
            {rows.length === 0 ? (
              <div className="py-10 text-center text-base text-muted-foreground">{t("draw.noMatch")}</div>
            ) : (
              <ul className="space-y-2">
                {rows.map((s) => {
                  const palette = CATEGORY_COLORS[s.category] ?? CATEGORY_COLORS.Others;
                  return (
                    <li key={s.id} className="flex items-center gap-4 rounded-2xl px-4 py-3 transition-colors hover:bg-muted/50">
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl font-display text-lg font-black tabular-nums text-white shadow-soft" style={{ background: `linear-gradient(180deg, ${palette.bg} 0%, ${palette.canopy} 100%)` }}>
                        #{s.stallNo.toString().padStart(2, "0")}
                      </div>
                      <img src={s.avatar} loading="lazy" alt={s.seller} className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-border" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-lg font-bold text-foreground">{s.business}</div>
                        <div className="truncate text-sm text-muted-foreground">{s.seller}</div>
                        <div className="mt-1 inline-flex sm:hidden rounded-full px-2.5 py-0.5 text-xs font-semibold text-primary" style={{ backgroundColor: `${palette.bg}22` }}>{s.category}</div>
                        {s.products && s.products.length > 0 && (
                          <div className="mt-0.5 line-clamp-2 text-sm text-muted-foreground" title={s.products.join(", ")}>
                            <span className="font-semibold text-foreground/70">{t("draw.sells")}:</span> {s.products.join(", ")}
                          </div>
                        )}
                      </div>
                      <span className="hidden shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-primary sm:inline-flex" style={{ backgroundColor: `${palette.bg}22` }}>
                        <span className="h-2 w-2 rounded-full" style={{ background: palette.bg }} /> {s.category}
                      </span>
                      <div className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                        <div className="text-sm font-bold text-foreground/70">#{s.order}</div>
                        <div>{s.at}</div>
                      </div>
                      {onRemove && (
                        <button
                          type="button"
                          onClick={() => setConfirmRemove(s)}
                          aria-label={`${t("draw.removeWinner")} — ${s.business}`}
                          title={t("draw.removeWinner")}
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmRemove}
        onOpenChange={(o) => !o && setConfirmRemove(null)}
        title={t("draw.removeTitle")}
        description={confirmRemove ? t("draw.removeDesc").replace("{b}", confirmRemove.business).replace("{n}", String(confirmRemove.stallNo)) : ""}
        confirmLabel={t("draw.removeWinner")}
        onConfirm={() => { if (confirmRemove) onRemove?.(confirmRemove); setConfirmRemove(null); }}
      />

      {selected.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/75">
          {t("draw.stageSet")}
        </div>
      ) : (
        <div className="relative">
          <div className="max-h-[520px] space-y-2.5 overflow-y-auto pr-1.5 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.25)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 hover:[&::-webkit-scrollbar-thumb]:bg-white/30">
            <AnimatePresence initial={false}>
              {feed.map((s) => {
                const palette = CATEGORY_COLORS[s.category] ?? CATEGORY_COLORS.Others;
                const isNew = s.order === latestOrder;
                return (
                  <motion.div
                    key={s.id}
                    layout
                    initial={{ opacity: 0, y: -20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 24 }}
                    className={`flex items-center gap-3 rounded-2xl p-3 ring-1 transition-colors ${
                      isNew ? "bg-accent/10 ring-accent/50 shadow-[0_0_24px_-8px_rgba(255,201,74,0.6)]" : "bg-white/5 ring-white/10"
                    }`}
                  >
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-display text-sm font-black tabular-nums text-white shadow-glow"
                      style={{ background: `linear-gradient(180deg, ${palette.bg} 0%, ${palette.canopy} 100%)` }}
                    >
                      #{s.stallNo.toString().padStart(2, "0")}
                    </div>
                    <img src={s.avatar} loading="lazy" className="h-10 w-10 rounded-full object-cover ring-2 ring-accent/60" alt={s.seller} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-semibold text-white">{s.business}</span>
                        {isNew && <span className="shrink-0 rounded-full bg-accent/25 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-accent">{t("draw.new")}</span>}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-white/75">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: palette.bg }} />
                        <span className="truncate">{s.seller} · {s.category}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-[10px] tabular-nums text-white/55">
                      <div className="font-semibold text-white/70">#{s.order}</div>
                      <div>{s.at}</div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          {selected.length > 5 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 rounded-b-2xl bg-gradient-to-t from-black/40 to-transparent" />
          )}
        </div>
      )}
    </div>
  );
}

function DoneBanner({ target, seasonName }: { target: number; seasonName: string }) {
  const { t } = useI18n();
  return (
    <div className="relative mx-auto mt-14 max-w-3xl px-4 md:px-8">
      <div className="rounded-[36px] bg-festive p-8 text-center text-white shadow-glow">
        <PartyPopper className="mx-auto h-10 w-10" />
        <div className="mt-3 font-display text-4xl font-black">{t("draw.allAssignedBanner").replace("{target}", String(target))}</div>
        <div className="mt-2 text-white/90">{t("draw.officiallySet").replace("{season}", seasonName)}</div>
      </div>
    </div>
  );
}