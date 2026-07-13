import { useEffect, useRef, useState } from "react";

export function AnimatedCounter({ value, suffix = "", duration = 1400 }: { value: number; suffix?: string; duration?: number }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  // The tick reads the LATEST target from a ref, so a value that arrives mid-animation
  // (e.g. counts loading just after mount) is animated to — never overwritten back to 0.
  const valueRef = useRef(value);
  useEffect(() => { valueRef.current = value; }, [value]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (t: number) => {
            const p = Math.min(1, (t - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setN(Math.round(valueRef.current * eased));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      });
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [duration]);

  // After the reveal animation has started, reflect later value changes immediately.
  useEffect(() => {
    if (started.current) setN(value);
  }, [value]);

  return <span ref={ref}>{n.toLocaleString()}{suffix}</span>;
}