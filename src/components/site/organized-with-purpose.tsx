import { useEffect, useRef, useState } from "react";
import { normalizeImageUrl } from "@/lib/settings-db";

// Al Fajar logo (public Drive link — hotlinks reliably via the thumbnail endpoint).
const logo = normalizeImageUrl("https://drive.google.com/file/d/14iSFQkcpTI6OfYe7dmklB6r67Pspd_AB/view?usp=sharing");

const missions = [
  {
    icon: "👩",
    title: "Women Empowerment",
    desc: "Providing women with opportunities to showcase their talents, launch businesses, and achieve financial independence.",
  },
  {
    icon: "🏪",
    title: "Entrepreneurship",
    desc: "Supporting local businesses and home-based entrepreneurs through community-driven initiatives.",
  },
  {
    icon: "🤝",
    title: "Community Impact",
    desc: "Bringing families together through events that promote unity, collaboration, and shared values.",
  },
];

const values = [
  { icon: "💙", label: "Service" },
  { icon: "🌱", label: "Growth" },
  { icon: "🤝", label: "Unity" },
  { icon: "✨", label: "Innovation" },
];

function useInView<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, inView };
}

export function OrganizedWithPurpose() {
  const { ref, inView } = useInView<HTMLDivElement>();

  const particles = Array.from({ length: 14 });

  return (
    <section
      ref={ref}
      className="relative overflow-hidden py-14 md:py-20"
      style={{
        background:
          "radial-gradient(1200px 600px at 15% 20%, color-mix(in oklch, var(--color-maroon) 10%, transparent), transparent 60%), radial-gradient(1000px 500px at 85% 80%, color-mix(in oklch, var(--color-orange) 12%, transparent), transparent 60%), var(--color-cream)",
      }}
    >
      {/* Ambient decorative glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full blur-3xl animate-glow-drift"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--color-gold) 40%, transparent), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* LEFT — Logo showcase */}
          <div className={inView ? "animate-rise-in" : "opacity-0"}>
            <div className="relative mx-auto aspect-square w-full max-w-[340px]">
              {/* Rotating gradient border */}
              <div
                aria-hidden
                className="absolute inset-0 rounded-[2rem] animate-spin-slow"
                style={{
                  background:
                    "conic-gradient(from 0deg, var(--color-gold), var(--color-orange), var(--color-fajar-gold), var(--color-maroon), var(--color-gold))",
                  filter: "blur(1px)",
                  opacity: 0.55,
                }}
              />
              {/* Glass card */}
              <div
                className="absolute inset-[6px] rounded-[calc(2rem-6px)] backdrop-blur-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, color-mix(in oklch, white 70%, transparent), color-mix(in oklch, var(--color-cream) 55%, transparent))",
                  boxShadow:
                    "0 40px 80px -30px color-mix(in oklch, var(--color-maroon) 45%, transparent), inset 0 1px 0 rgba(255,255,255,0.6)",
                  border: "1px solid color-mix(in oklch, white 60%, transparent)",
                }}
              >
                {/* Radial golden glow behind logo */}
                <div
                  aria-hidden
                  className="absolute inset-0 animate-glow-drift"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 45%, color-mix(in oklch, var(--color-gold) 55%, transparent), transparent 60%)",
                  }}
                />
                {/* Floating particles */}
                {particles.map((_, i) => {
                  const top = (i * 37) % 90 + 5;
                  const left = (i * 53) % 90 + 5;
                  const size = 3 + (i % 4);
                  const delay = (i * 0.4) % 5;
                  const tx = (i % 2 === 0 ? 1 : -1) * (8 + (i % 5) * 2);
                  const ty = (i % 3 === 0 ? -1 : 1) * (10 + (i % 4) * 2);
                  return (
                    <span
                      key={i}
                      aria-hidden
                      className="absolute rounded-full animate-particle"
                      style={{
                        top: `${top}%`,
                        left: `${left}%`,
                        width: size,
                        height: size,
                        background:
                          "radial-gradient(circle, var(--color-gold), transparent 70%)",
                        boxShadow: "0 0 8px var(--color-gold)",
                        animationDelay: `${delay}s`,
                        // @ts-expect-error CSS vars
                        "--tx": `${tx}px`,
                        "--ty": `${ty}px`,
                      }}
                    />
                  );
                })}
                {/* Logo */}
                <div className="relative flex h-full w-full items-center justify-center p-10">
                  <img
                    src={logo}
                    alt="Al Fajar Youth Wing logo"
                    width={1024}
                    height={1024}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="h-auto w-[78%] animate-float-slow drop-shadow-[0_20px_40px_rgba(0,20,80,0.35)]"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <h3
                className="font-display text-2xl font-semibold tracking-[0.2em] md:text-3xl"
                style={{ color: "var(--color-fajar-blue)" }}
              >
                AL FAJAR YOUTH WING
              </h3>
              <p
                className="mt-2 text-sm tracking-[0.3em] uppercase"
                style={{ color: "color-mix(in oklch, var(--color-maroon) 80%, black)" }}
              >
                Community · Service · Leadership
              </p>
            </div>
          </div>

          {/* RIGHT — Story */}
          <div className={inView ? "animate-rise-in [animation-delay:150ms]" : "opacity-0"}>
            {/* Badge */}
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-[0.2em] uppercase"
              style={{
                background:
                  "linear-gradient(135deg, color-mix(in oklch, var(--color-gold) 30%, white), color-mix(in oklch, var(--color-orange) 20%, white))",
                color: "var(--color-maroon)",
                border: "1px solid color-mix(in oklch, var(--color-gold) 55%, transparent)",
              }}
            >
              ✨ Organized With Purpose
            </span>

            <h2
              className="mt-5 font-display text-3xl leading-[1.05] font-black tracking-tight md:text-4xl lg:text-5xl"
              style={{
                background:
                  "linear-gradient(120deg, var(--color-maroon), var(--color-orange) 55%, var(--color-gold))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Building Communities.
              <br />
              Empowering Women.
              <br />
              Creating Opportunities.
            </h2>

            <p
              className="mt-4 max-w-xl text-sm leading-relaxed md:text-base"
              style={{ color: "color-mix(in oklch, var(--color-maroon) 75%, black)" }}
            >
              Behind every successful season of Amcho Bazar is the dedication of Al Fajar
              Youth Wing — a community-driven organization committed to empowering women,
              supporting local entrepreneurs, and creating meaningful experiences that
              strengthen the bonds of our community. Through service, leadership, and
              innovation, we strive to create opportunities that inspire confidence,
              encourage entrepreneurship, and leave a lasting positive impact.
            </p>

            {/* Mission cards */}
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {missions.map((m, i) => (
                <article
                  key={m.title}
                  className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-500 hover:-translate-y-2 ${
                    inView ? "animate-rise-in" : "opacity-0"
                  }`}
                  style={{
                    animationDelay: `${300 + i * 150}ms`,
                    background:
                      "linear-gradient(160deg, color-mix(in oklch, white 90%, var(--color-cream)), color-mix(in oklch, var(--color-cream) 80%, white))",
                    border: "1px solid color-mix(in oklch, var(--color-gold) 25%, transparent)",
                    boxShadow:
                      "0 10px 30px -18px color-mix(in oklch, var(--color-maroon) 45%, transparent)",
                  }}
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -inset-1 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background:
                        "radial-gradient(300px 120px at 50% 0%, color-mix(in oklch, var(--color-gold) 50%, transparent), transparent 70%)",
                    }}
                  />
                  <div
                    className="relative flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                    style={{
                      background:
                        "linear-gradient(135deg, color-mix(in oklch, var(--color-orange) 35%, white), color-mix(in oklch, var(--color-gold) 40%, white))",
                      boxShadow:
                        "inset 0 1px 0 rgba(255,255,255,0.7), 0 8px 20px -12px color-mix(in oklch, var(--color-orange) 60%, transparent)",
                    }}
                  >
                    {m.icon}
                  </div>
                  <h4
                    className="relative mt-3 font-display text-base font-semibold"
                    style={{ color: "var(--color-maroon)" }}
                  >
                    {m.title}
                  </h4>
                  <p
                    className="relative mt-1.5 text-sm leading-relaxed"
                    style={{ color: "color-mix(in oklch, var(--color-maroon) 65%, black)" }}
                  >
                    {m.desc}
                  </p>
                </article>
              ))}
            </div>

            {/* Value badges */}
            <div className="mt-6 flex flex-wrap gap-2">
              {values.map((v, i) => (
                <span
                  key={v.label}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 ${
                    inView ? "animate-rise-in" : "opacity-0"
                  }`}
                  style={{
                    animationDelay: `${700 + i * 100}ms`,
                    background:
                      "linear-gradient(135deg, color-mix(in oklch, white 85%, transparent), color-mix(in oklch, var(--color-cream) 70%, transparent))",
                    border: "1px solid color-mix(in oklch, var(--color-gold) 40%, transparent)",
                    color: "var(--color-maroon)",
                    boxShadow: "0 6px 18px -12px color-mix(in oklch, var(--color-maroon) 40%, transparent)",
                  }}
                >
                  <span className="text-base">{v.icon}</span>
                  {v.label}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div
              className="mt-8 flex flex-col items-center gap-4 rounded-2xl px-5 py-5 text-center sm:flex-row sm:justify-between sm:text-left"
              style={{
                background:
                  "linear-gradient(120deg, color-mix(in oklch, var(--color-maroon) 8%, white), color-mix(in oklch, var(--color-gold) 12%, white))",
                border: "1px solid color-mix(in oklch, var(--color-gold) 30%, transparent)",
              }}
            >
              <div>
                <p
                  className="font-display text-lg font-semibold italic"
                  style={{ color: "var(--color-maroon)" }}
                >
                  &ldquo;Together, we&rsquo;re building a stronger community.&rdquo;
                </p>
                <p
                  className="mt-1 text-sm"
                  style={{ color: "color-mix(in oklch, var(--color-maroon) 70%, black)" }}
                >
                  Organized with <span style={{ color: "var(--color-orange)" }}>❤</span> by{" "}
                  <span className="font-semibold" style={{ color: "var(--color-fajar-blue)" }}>
                    Al Fajar Youth Wing
                  </span>
                </p>
              </div>
              <img
                src={logo}
                alt=""
                width={96}
                height={96}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="h-28 w-auto shrink-0 object-contain md:h-32"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
