import { useEffect, useState } from "react";

export function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, new Date(target).getTime() - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff / 3600000) % 24);
  const mins = Math.floor((diff / 60000) % 60);
  const secs = Math.floor((diff / 1000) % 60);
  const units = [
    { label: "Days", value: days },
    { label: "Hours", value: hours },
    { label: "Minutes", value: mins },
    { label: "Seconds", value: secs },
  ];
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4">
      {units.map((u) => (
        <div
          key={u.label}
          className="relative overflow-hidden rounded-2xl bg-white/10 px-2 py-4 text-center backdrop-blur-xl ring-1 ring-white/20 sm:px-4 sm:py-6"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
          <div className="relative font-display text-3xl font-bold text-white sm:text-5xl">
            {u.value.toString().padStart(2, "0")}
          </div>
          <div className="relative mt-1 text-[10px] font-medium uppercase tracking-widest text-white/70 sm:text-xs">
            {u.label}
          </div>
        </div>
      ))}
    </div>
  );
}