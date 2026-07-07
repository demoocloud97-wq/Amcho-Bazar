import type { ReactNode } from "react";

// Standard dartboard number order, clockwise from the top.
const NUMBERS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

const BLACK = "#1b1b1b";
const CREAM = "#efe4c4";
// Ring tones — monochrome (no colour): dark grey + muted cream so the ring
// structure stays visible but the board has no hue.
const RED = "#3d3a34";   // dark grey (rings on black sectors)
const GREEN = "#d6c9a6";  // muted cream (rings on cream sectors)

const C = 100; // centre
// Ring radii (viewBox 200).
const R_NUM_OUT = 99, R_NUM_IN = 82;   // number band
const R_DBL_OUT = 82, R_DBL_IN = 75;   // double ring
const R_OUT_IN = 48;                    // outer single inner edge
const R_TRP_OUT = 48, R_TRP_IN = 42;   // treble ring
const R_IN_IN = 15;                     // inner single inner edge
const R_BULL_OUT = 15, R_BULL_IN = 7;  // bull

function polar(r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
}

// Annular sector path.
function sector(rIn: number, rOut: number, a0: number, a1: number): string {
  const [x1, y1] = polar(rOut, a0);
  const [x2, y2] = polar(rOut, a1);
  const [x3, y3] = polar(rIn, a1);
  const [x4, y4] = polar(rIn, a0);
  return `M${x1} ${y1} A${rOut} ${rOut} 0 0 1 ${x2} ${y2} L${x3} ${y3} A${rIn} ${rIn} 0 0 0 ${x4} ${y4} Z`;
}

export function Dartboard({ spinning = false, className = "", children, labels, highlightIndex, highlightLabel, doneLabels }: { spinning?: boolean; className?: string; children?: ReactNode; labels?: string[]; highlightIndex?: number; highlightLabel?: string; doneLabels?: Set<string> }) {
  // Number mode: classic 20-wedge dartboard. Labels mode: one wedge PER applicant
  // (a raffle wheel) so every registration shows; names run radially along the spoke.
  const useLabels = !!labels && labels.length > 0;
  const N = useLabels ? labels!.length : 20;
  const per = 360 / N;
  const nameFont = Math.max(2.6, Math.min(5, 240 / N));
  const sectors = Array.from({ length: N }, (_, i) => {
    const a0 = i * per - per / 2;
    const a1 = i * per + per / 2;
    const isBlack = i % 2 === 0;
    return { i, a0, a1, wedge: isBlack ? BLACK : CREAM, ring: isBlack ? RED : GREEN };
  });

  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 200 200" className={`h-full w-full drop-shadow-[0_12px_36px_rgba(0,0,0,0.55)] ${spinning ? "animate-spin-slow" : ""}`}>
        {/* Name/number band */}
        <circle cx={C} cy={C} r={(R_NUM_OUT + R_NUM_IN) / 2} fill="none" stroke="#0d0d0d" strokeWidth={R_NUM_OUT - R_NUM_IN} />
        {/* Outer wire ring */}
        <circle cx={C} cy={C} r={R_NUM_OUT} fill="none" stroke="#7a6a3a" strokeWidth="1" />

        {sectors.map((s) => (
          <g key={s.i}>
            <path d={sector(R_OUT_IN, R_DBL_IN, s.a0, s.a1)} fill={s.wedge} />
            <path d={sector(R_IN_IN, R_TRP_IN, s.a0, s.a1)} fill={s.wedge} />
            <path d={sector(R_DBL_IN, R_DBL_OUT, s.a0, s.a1)} fill={s.ring} />
            <path d={sector(R_TRP_IN, R_TRP_OUT, s.a0, s.a1)} fill={s.ring} />
          </g>
        ))}

        {/* Spider wires between wedges */}
        {sectors.map((s) => {
          const [x, y] = polar(R_DBL_OUT, s.a0);
          return <line key={`w${s.i}`} x1={C} y1={C} x2={x} y2={y} stroke="#00000055" strokeWidth="0.5" />;
        })}

        {/* Winning wedge highlight */}
        {highlightIndex != null && highlightIndex >= 0 && (
          <path d={sector(R_IN_IN, R_DBL_OUT, highlightIndex * per - per / 2, highlightIndex * per + per / 2)} fill="#ffd24a" opacity="0.28" stroke="#ffd24a" strokeWidth="1.2" />
        )}

        {/* Bull */}
        <circle cx={C} cy={C} r={R_BULL_OUT} fill={GREEN} stroke="#0d0d0d" strokeWidth="0.6" />
        <circle cx={C} cy={C} r={R_BULL_IN} fill={RED} stroke="#0d0d0d" strokeWidth="0.6" />
        <ellipse cx={C - 2} cy={C - 2.5} rx="2.4" ry="1.6" fill="#fff" opacity="0.35" />

        {/* Names (radial) — or numbers (upright) */}
        {sectors.map((s) => {
          const full = useLabels ? (labels![s.i] || "") : String(NUMBERS[s.i]);
          const isWin = highlightIndex === s.i && !!highlightLabel;
          const isDone = !isWin && !!doneLabels && doneLabels.has(full);
          const fill = isWin ? "#ffd24a" : isDone ? "#9a9a9a" : "#fff";
          if (useLabels) {
            // Radial name (first word; full on hover), flipped on the lower half.
            const source = isWin ? (highlightLabel || full) : full;
            const disp = (source.split(" ")[0] || source).slice(0, 12);
            const deg = s.i * per;
            const flip = deg > 90 && deg < 270;
            const py = C - 72;
            return (
              <g key={`n${s.i}`} transform={`rotate(${deg} ${C} ${C})`}>
                <text
                  x={C}
                  y={py}
                  transform={`rotate(${flip ? 90 : -90} ${C} ${py})`}
                  fill={fill}
                  fillOpacity={isDone ? 0.65 : 1}
                  fontSize={isWin ? nameFont + 1.4 : nameFont}
                  fontWeight={isWin ? "900" : "700"}
                  textDecoration={isDone ? "line-through" : undefined}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontFamily="system-ui, sans-serif"
                  style={{ paintOrder: "stroke" }}
                  stroke="#000"
                  strokeWidth="0.35"
                  strokeOpacity="0.6"
                >
                  <title>{isWin ? highlightLabel : full}</title>
                  {disp}
                </text>
              </g>
            );
          }
          const [x, y] = polar((R_NUM_OUT + R_NUM_IN) / 2, s.i * 18);
          return (
            <text key={`n${s.i}`} x={x} y={y} fill={fill} fontSize="9.5" fontWeight="700" textAnchor="middle" dominantBaseline="central" fontFamily="system-ui, sans-serif">
              {String(NUMBERS[s.i])}
            </text>
          );
        })}
      </svg>
      {children && <div className="pointer-events-none absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
}

// Premium, casino-grade red tournament dart — feathered gradient flights, thick
// chromed barrel with 3-D highlight + rim light, sharp gold point, soft glow so it
// pops on the dark board. Points straight down so it "sticks" on reveal.
export function RedDart({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 138"
      className={`h-[104px] w-[36px] [filter:drop-shadow(0_0_5px_rgba(255,232,170,0.55))_drop-shadow(0_9px_12px_rgba(0,0,0,0.65))] ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="rdFlightL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff9a9a" /><stop offset="0.55" stopColor="#ef3030" /><stop offset="1" stopColor="#c81c1c" />
        </linearGradient>
        <linearGradient id="rdFlightR" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c61b1b" /><stop offset="0.5" stopColor="#a01414" /><stop offset="1" stopColor="#720a0a" />
        </linearGradient>
        <linearGradient id="rdBarrel" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#54545e" />
          <stop offset="0.24" stopColor="#ffffff" />
          <stop offset="0.46" stopColor="#d4d4dd" />
          <stop offset="0.68" stopColor="#8f8f9a" />
          <stop offset="1" stopColor="#34343e" />
        </linearGradient>
        <linearGradient id="rdTip" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff0b8" /><stop offset="0.5" stopColor="#cda54f" /><stop offset="1" stopColor="#785a20" />
        </linearGradient>
      </defs>
      {/* Flight — feathered fins with a rim-light outline + spine + gloss */}
      <path d="M24 2 L24 27 L3 34 Z" fill="url(#rdFlightL)" stroke="#ffd3d3" strokeOpacity="0.35" strokeWidth="0.6" />
      <path d="M24 2 L45 34 L24 27 Z" fill="url(#rdFlightR)" stroke="#000" strokeOpacity="0.25" strokeWidth="0.6" />
      <path d="M24 2 L3 34 L12.5 30.6 Z" fill="#fff" opacity="0.25" />
      <line x1="24" y1="3" x2="24" y2="27" stroke="#6b0909" strokeWidth="1.3" />
      {/* Nock + thick shaft */}
      <rect x="20.5" y="26" width="7" height="5.5" rx="1.8" fill="url(#rdBarrel)" />
      <rect x="21" y="31" width="6" height="24" rx="3" fill="url(#rdBarrel)" stroke="#00000030" strokeWidth="0.5" />
      {/* Thick chromed barrel */}
      <path d="M14.5 55 L33.5 55 L29.8 108 L18.2 108 Z" fill="url(#rdBarrel)" stroke="#00000038" strokeWidth="0.6" />
      <path d="M17.6 56 L21.4 56 L20 106 L16.9 106 Z" fill="#fff" opacity="0.4" />
      <ellipse cx="19.4" cy="66" rx="1.5" ry="5" fill="#fff" opacity="0.6" />
      {[63, 71, 79, 87, 95, 103].map((y) => (
        <line key={y} x1={15} y1={y} x2={33} y2={y} stroke="#00000045" strokeWidth="1.5" />
      ))}
      {/* Sharp gold point */}
      <path d="M18.2 108 L29.8 108 L24 135 Z" fill="url(#rdTip)" stroke="#00000030" strokeWidth="0.5" />
      <path d="M24 108 L29.8 108 L24 135 Z" fill="#000" opacity="0.22" />
      <line x1="21.4" y1="110" x2="23.6" y2="132" stroke="#fff" strokeWidth="0.7" opacity="0.5" />
    </svg>
  );
}
