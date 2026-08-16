import { Star } from "lucide-react";

const SIZES = {
  sm: { star: "h-3.5 w-3.5", hit: "h-5 w-5" },
  md: { star: "h-5 w-5", hit: "h-8 w-8" },
  lg: { star: "h-8 w-8", hit: "h-12 w-12" },
  xl: { star: "h-11 w-11", hit: "h-14 w-14 sm:h-16 sm:w-16" },
} as const;

export type StarSize = keyof typeof SIZES;

// Read-only star row — used in review cards, tables and the admin detail view.
export function Stars({ value, size = "sm", className = "" }: { value: number; size?: StarSize; className?: string }) {
  const s = SIZES[size].star;
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden="true"
          className={`${s} ${n <= Math.round(value) ? "fill-accent text-accent" : "fill-transparent text-muted-foreground/35"}`}
        />
      ))}
    </span>
  );
}

// Touch-friendly star input. Rendered as a radiogroup so it is keyboard and
// screen-reader operable; the hit area stays at least 44px on the large sizes,
// which is what the QR review page uses on a phone.
export function StarInput({
  value,
  onChange,
  size = "xl",
  label,
  required,
}: {
  value: number;
  onChange: (n: number) => void;
  size?: StarSize;
  label: string;
  required?: boolean;
}) {
  const { star, hit } = SIZES[size];

  // Arrow keys move the rating; Home/End jump to the ends.
  function onKeyDown(e: React.KeyboardEvent) {
    const delta = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0;
    if (delta) {
      e.preventDefault();
      onChange(Math.min(5, Math.max(1, (value || 0) + delta)));
    } else if (e.key === "Home") {
      e.preventDefault(); onChange(1);
    } else if (e.key === "End") {
      e.preventDefault(); onChange(5);
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-required={required || undefined}
      onKeyDown={onKeyDown}
      className="flex items-center gap-0.5 sm:gap-1"
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= value;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            tabIndex={value === n || (!value && n === 1) ? 0 : -1}
            onClick={() => onChange(value === n ? 0 : n)}
            className={`grid ${hit} place-items-center rounded-full transition-transform duration-150 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
          >
            <Star
              aria-hidden="true"
              className={`${star} transition-colors ${on ? "fill-accent text-accent drop-shadow-[0_2px_6px_oklch(0.86_0.15_90/0.55)]" : "fill-transparent text-muted-foreground/40"}`}
            />
          </button>
        );
      })}
    </div>
  );
}
