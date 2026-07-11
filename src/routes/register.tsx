import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, ImagePlus, Loader2, PartyPopper, Sparkles, X } from "lucide-react";
import { uploadToCloudinary, cloudinaryReady } from "@/lib/cloudinary";
import { CATEGORIES, EVENT, type CategoryKey } from "@/lib/dummy-data";
import { createRegistration, getRegistrationsBySeasonId } from "@/lib/db";
import { getCategories, getSubCategories, type Category, type SubCategory } from "@/lib/categories-db";
import { getUserProfile } from "@/lib/profile-db";
import { useSeason } from "@/lib/season-context";
import { useI18n } from "@/lib/i18n";
import { friendlyAuthError } from "@/lib/firebase-errors";
import { useAuth } from "@/lib/auth-context";
import { RequireAuth } from "@/components/site/require-auth";
import { PresentedBy } from "@/components/site/presented-by";
import { RegistrationFlow, FlowModal } from "@/components/site/auth-flow";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Become a Seller · Amcho Bazar" },
      { name: "description", content: "Register in 5 warm steps to become a seller at Amcho Bazar Season 3 — the Nawait Community's women-only festival." },
      { property: "og:title", content: "Become a Seller · Amcho Bazar" },
      { property: "og:description", content: "Multi-step, joyful seller registration for women entrepreneurs." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <RegisterPage />
    </RequireAuth>
  ),
});

const STEPS = ["reg.step.personal", "reg.step.business", "reg.step.category", "reg.step.review", "reg.step.submitted"];

function RegisterPage() {
  const { user } = useAuth();
  const { activeSeason } = useSeason();
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [catCounts, setCatCounts] = useState<Record<string, number>>({});
  const [fsCats, setFsCats] = useState<Category[]>([]);
  const [subs, setSubs] = useState<SubCategory[]>([]);

  // Firestore categories + sub-categories (to offer a sub-category choice).
  useEffect(() => {
    Promise.all([getCategories(), getSubCategories()])
      .then(([c, s]) => { setFsCats(c); setSubs(s); })
      .catch(() => {});
  }, []);

  // Live per-category registration counts for the active season.
  useEffect(() => {
    if (!activeSeason?.id) { setCatCounts({}); return; }
    getRegistrationsBySeasonId(activeSeason.id)
      .then((regs) => {
        const m: Record<string, number> = {};
        regs.forEach((r) => {
          const cats = r.categories?.length ? r.categories : [r.category];
          cats.forEach((c) => { if (c) m[c] = (m[c] ?? 0) + 1; });
        });
        setCatCounts(m);
      })
      .catch(() => {});
  }, [activeSeason?.id]);
  const [data, setData] = useState({
    fullName: "",
    phone: "",
    email: user?.email ?? "", // taken from the logged-in account, not entered manually
    city: "Karachi",
    business: "",
    tagline: "",
    yearsRunning: "",
    instagram: "",
    logoUrl: "",
    products: "",
    category: "",
    categoryId: "",
    categories: [] as string[],
    categoryIds: [] as string[],
    subcategory: "",
    subcategoryId: "",
  });

  function update<K extends keyof typeof data>(k: K, v: (typeof data)[K]) {
    setData((d) => ({ ...d, [k]: v }));
  }

  // Email always comes from the signed-in account (no manual field); sync if auth hydrates late.
  useEffect(() => {
    if (user?.email) setData((d) => (d.email === user.email ? d : { ...d, email: user.email! }));
  }, [user?.email]);

  // Pre-fill name/phone/city from the profile captured at sign-up (only empty fields,
  // so we never clobber what the user has already typed). Name falls back to displayName.
  useEffect(() => {
    if (!user?.uid) return;
    getUserProfile(user.uid).then((p) => {
      setData((d) => ({
        ...d,
        fullName: d.fullName || p?.fullName || user.displayName || "",
        phone: d.phone || p?.phone || "",
        city: d.city !== "Karachi" ? d.city : (p?.city || d.city),
      }));
    }).catch(() => {});
  }, [user?.uid, user?.displayName]);

  // Toggle a category in/out of the multi-select; keep primary = first chosen.
  function toggleCategory(name: string, id: string) {
    setData((d) => {
      const has = d.categories.includes(name);
      const categories = has ? d.categories.filter((c) => c !== name) : [...d.categories, name];
      let categoryIds = d.categoryIds.filter(Boolean);
      if (id) categoryIds = has ? categoryIds.filter((x) => x !== id) : [...categoryIds, id];
      return {
        ...d, categories, categoryIds,
        category: categories[0] ?? "",
        categoryId: categoryIds[0] ?? "",
        subcategory: "", subcategoryId: "",
      };
    });
  }

  async function next() {
    // On the Review step, save the registration to Firestore before advancing.
    if (step === 3) {
      setSubmitting(true);
      try {
        await createRegistration({
          uid: user?.uid,
          status: "waitlist", // new flow: everyone waits; live-draw winners get approved
          seasonId: activeSeason?.id,
          season: activeSeason?.seasonNumber ?? EVENT.seasonNumber,
          seller: data.fullName,
          business: data.business,
          tagline: data.tagline || undefined,
          yearsRunning: data.yearsRunning || undefined,
          instagram: data.instagram || undefined,
          city: data.city || undefined,
          category: (data.categories[0] || "Others") as CategoryKey,
          categoryId: data.categoryIds[0] || undefined,
          categories: data.categories.length ? data.categories : undefined,
          categoryIds: data.categoryIds.length ? data.categoryIds : undefined,
          subcategoryId: data.subcategoryId || undefined,
          subcategory: data.subcategory || undefined,
          phone: data.phone,
          email: data.email || user?.email || "",
          logoUrl: data.logoUrl || undefined,
          products: data.products
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean),
        });
        confetti({ particleCount: 160, spread: 90, origin: { y: 0.4 }, colors: ["#7A1E3D", "#F26B2A", "#FFC94A", "#1FA7A6"] });
        toast.success(t("reg.toast.submitted"));
        setStep(4);
      } catch (err) {
        toast.error(friendlyAuthError(err));
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setStep((s) => Math.min(4, s + 1));
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  const canContinue =
    (step === 0 && data.fullName.trim() && data.phone.trim()) ||
    (step === 1 && data.business.trim() && data.yearsRunning.trim() && data.products.trim()) ||
    (step === 2 && data.categories.length > 0) ||
    step === 3;

  // Registration follows the active season's status: open only when RegistrationOpen.
  // No active season ⇒ don't gate (legacy/dummy fallback).
  const gate = activeSeason && activeSeason.status !== "RegistrationOpen"
    ? (activeSeason.status === "Upcoming" ? "soon" : "closed")
    : null;
  if (gate) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[720px] -translate-x-1/2 rounded-full bg-warm opacity-30 blur-3xl" />
        <div className="relative w-full max-w-md rounded-3xl border border-primary/15 bg-card p-8 text-center shadow-soft">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-primary">{t(gate === "soon" ? "reg.gate.soonTitle" : "reg.gate.closedTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t(gate === "soon" ? "reg.gate.soon" : "reg.gate.closed")}</p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-full bg-festive px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.03]">
            <ArrowLeft className="h-4 w-4" /> {t("reg.gate.home")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* soft festive backdrop */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[720px] -translate-x-1/2 rounded-full bg-warm opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute -left-32 top-40 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-96 h-64 w-64 rounded-full bg-accent/40 blur-3xl" />

      <section className="relative mx-auto max-w-3xl px-4 py-16 md:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
            <Sparkles className="h-3 w-3" /> {t("reg.hero.eyebrow")}
          </div>
          <h1 className="mt-4 font-display text-4xl font-black md:text-6xl">
            {t("reg.hero.title")}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            {t("reg.hero.subtitle")}
          </p>
        </div>

        {/* Progress */}
        <div className="mt-10">
          <div className="flex items-center justify-between">
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-1 items-center">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    i < step
                      ? "bg-festive text-white shadow-soft"
                      : i === step
                      ? "bg-primary text-white ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`mx-1 h-0.5 flex-1 rounded transition-colors ${i < step ? "bg-festive" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between text-[10px] font-semibold uppercase tracking-widest text-muted-foreground md:text-xs">
            {STEPS.map((s) => <span key={s} className="flex-1 text-center">{t(s)}</span>)}
          </div>
        </div>

        {/* Card */}
        <div className="mt-8 rounded-[32px] border border-border bg-card p-6 shadow-card md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 0 && (
                <StepPersonal data={data} update={update} />
              )}
              {step === 1 && (
                <StepBusiness data={data} update={update} />
              )}
              {step === 2 && (
                <StepCategory data={data} update={update} toggleCategory={toggleCategory} counts={catCounts} seasonName={activeSeason?.seasonName} fsCats={fsCats} subs={subs} />
              )}
              {step === 3 && <StepReview data={data} />}
              {step === 4 && <StepSubmitted />}
            </motion.div>
          </AnimatePresence>

          {step < 4 && (
            <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
              <button
                onClick={back}
                disabled={step === 0}
                className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary disabled:opacity-30"
              >
                <ArrowLeft className="h-4 w-4" /> {t("reg.back")}
              </button>
              <button
                onClick={next}
                disabled={!canContinue || submitting}
                className="inline-flex items-center gap-2 rounded-full bg-festive px-6 py-3 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              >
                {step === 3 ? (submitting ? t("reg.submitting") : t("reg.submit")) : t("reg.continue")} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          <FlowModal
            label="View registration flow"
            buttonClassName="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-white/60 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
          >
            <RegistrationFlow currentStep={step} />
          </FlowModal>
        </div>

        <PresentedBy className="mt-2" />
      </section>
    </div>
  );
}

function Field({ label, children, hint, required = false }: { label: string; children: React.ReactNode; hint?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}{required && <span className="text-destructive"> *</span>}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted-foreground/80">{hint}</span>}
    </label>
  );
}

const inputCls = "w-full rounded-2xl border border-border bg-white/70 px-4 py-3 text-sm outline-none ring-primary/20 transition-all focus:ring-4";

function StepPersonal({ data, update }: any) {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">{t("reg.personal.h2")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("reg.personal.sub")}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("reg.f.fullName")} required>
          <input value={data.fullName} onChange={(e) => update("fullName", e.target.value)} autoComplete="name" className={inputCls} placeholder="Ayesha Sherif" />
        </Field>
        <Field label={t("reg.f.phone")} required>
          <input value={data.phone} onChange={(e) => update("phone", e.target.value)} type="tel" inputMode="tel" autoComplete="tel" className={inputCls} placeholder="+91 98800 12345" />
        </Field>
        <Field label={t("reg.f.city")}>
          <input value={data.city} onChange={(e) => update("city", e.target.value)} autoComplete="address-level2" className={inputCls} />
        </Field>
      </div>
    </div>
  );
}

function StepBusiness({ data, update }: any) {
  const { t } = useI18n();
  const [uploading, setUploading] = useState(false);

  async function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setUploading(true);
    try {
      update("logoUrl", await uploadToCloudinary(file));
    } catch (err) {
      toast.error(friendlyAuthError(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">{t("reg.business.h2")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("reg.business.sub")}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("reg.f.business")} required>
          <input value={data.business} onChange={(e) => update("business", e.target.value)} className={inputCls} placeholder="Ayesha's Kitchen" />
        </Field>
        <Field label={t("reg.f.tagline")} hint={t("reg.f.taglineHint")}>
          <input value={data.tagline} onChange={(e) => update("tagline", e.target.value)} className={inputCls} placeholder="Homemade biryani, made with love." />
        </Field>
        <Field label={t("reg.f.years")} required>
          <input value={data.yearsRunning} onChange={(e) => update("yearsRunning", e.target.value)} className={inputCls} placeholder="2 years" />
        </Field>
        <Field label={t("reg.f.instagram")}>
          <input value={data.instagram} onChange={(e) => update("instagram", e.target.value)} className={inputCls} placeholder="@ayeshas.kitchen" />
        </Field>
        {cloudinaryReady && (
          <div className="md:col-span-2">
            <Field label={t("reg.f.logo")} hint={t("reg.f.logoHint")}>
              <div className="flex items-center gap-4">
                {data.logoUrl ? (
                  <div className="relative">
                    <img src={data.logoUrl} alt="" className="h-16 w-16 rounded-2xl border border-border object-cover" />
                    <button
                      type="button"
                      onClick={() => update("logoUrl", "")}
                      aria-label="Remove logo"
                      className="absolute -right-2 -top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white shadow-soft"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-border bg-white/70 px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                    {uploading ? t("reg.f.logoUploading") : t("reg.f.logo")}
                    <input type="file" accept="image/*" onChange={onLogo} disabled={uploading} className="hidden" />
                  </label>
                )}
              </div>
            </Field>
          </div>
        )}
        <div className="md:col-span-2">
          <Field label={t("reg.f.sell")} hint={t("reg.f.sellHint")} required>
            <textarea value={data.products} onChange={(e) => update("products", e.target.value)} className={`${inputCls} min-h-[100px]`} placeholder="Chicken biryani, kheema samosa, date rolls…" />
          </Field>
        </div>
      </div>
    </div>
  );
}

function StepCategory({ data, update, toggleCategory, counts, seasonName, fsCats, subs }: { data: any; update: any; toggleCategory: (name: string, id: string) => void; counts: Record<string, number>; seasonName?: string; fsCats: Category[]; subs: SubCategory[] }) {
  const { t } = useI18n();
  // Prefer real Firestore categories (so a chosen category has a known id and its
  // sub-categories link reliably); fall back to the static list if none exist.
  const grid = fsCats.length
    ? fsCats.map((c) => ({ key: c.name, id: c.id ?? "", emoji: c.emoji || "🏷️" }))
    : CATEGORIES.map((c) => ({ key: c.key as string, id: "", emoji: c.emoji }));

  // Sub-categories belong to any of the chosen categories (by id).
  const catSubs = data.categoryIds.length ? subs.filter((s) => data.categoryIds.includes(s.categoryId)) : [];

  return (
    <div>
      <h2 className="font-display text-2xl font-bold">{t("reg.category.h2")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("reg.category.pick")}{data.categories.length ? ` ${data.categories.length} ${t("reg.category.selected")}` : ""}{seasonName ? ` ${t("reg.category.countsFor")} ${seasonName}.` : ""}
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {grid.map((c) => {
          const active = data.categories.includes(c.key);
          const count = counts[c.key] ?? 0;
          return (
            <button
              key={c.key}
              onClick={() => toggleCategory(c.key, c.id)}
              className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all ${
                active ? "border-transparent bg-festive text-white shadow-glow" : "border-border bg-white/70 hover:-translate-y-0.5 hover:shadow-soft"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-3xl">{c.emoji}</div>
                {active && <Check className="h-5 w-5" />}
              </div>
              <div className="mt-3 font-display text-lg font-semibold">{c.key}</div>
              <div className={`mt-1 text-xs ${active ? "text-white/80" : "text-muted-foreground"}`}>{count} {count === 1 ? t("reg.seller") : t("reg.sellers")}</div>
            </button>
          );
        })}
      </div>

      {/* Sub-category — shown once a category with sub-categories is chosen */}
      {data.categories.length > 0 && catSubs.length > 0 && (
        <div className="mt-8">
          <h3 className="font-display text-lg font-semibold">
            {t("reg.sub.h3")} <span className="text-sm font-normal text-muted-foreground">{t("reg.sub.optional")}</span>
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("reg.sub.help")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {catSubs.map((s) => {
              const on = data.subcategoryId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    if (on) { update("subcategory", ""); update("subcategoryId", ""); }
                    else { update("subcategory", s.name); update("subcategoryId", s.id!); }
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    on ? "border-transparent bg-festive text-white shadow-soft" : "border-border bg-white/70 hover:border-primary/30 hover:text-primary"
                  }`}
                >
                  {on && <Check className="h-4 w-4" />} {s.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StepReview({ data }: any) {
  const { t } = useI18n();
  const { activeSeason } = useSeason();
  const fee = activeSeason?.registrationFee ?? EVENT.registrationFee;
  const rows = [
    [t("reg.row.name"), data.fullName], [t("reg.row.phone"), data.phone], [t("reg.row.email"), data.email], [t("reg.row.city"), data.city],
    [t("reg.row.business"), data.business], [t("reg.row.tagline"), data.tagline], [t("reg.row.years"), data.yearsRunning], [t("reg.row.instagram"), data.instagram],
    [t("reg.row.products"), data.products], [t("reg.row.categories"), (data.categories || []).join(", ")], [t("reg.row.subcategory"), data.subcategory],
  ];
  return (
    <div>
      <h2 className="font-display text-2xl font-bold">{t("reg.review.h2")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("reg.review.sub")}</p>
      <div className="mt-6 divide-y divide-border rounded-2xl border border-border">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
            <div className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{k}</div>
            <div className="flex-1 text-right font-medium text-foreground">{v || <span className="italic text-muted-foreground">{t("reg.review.notProvided")}</span>}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl bg-accent/20 p-4 text-sm text-primary">
        {t("reg.review.fee").replace("{fee}", fee.toLocaleString("en-IN"))}
      </div>
    </div>
  );
}

function StepSubmitted() {
  const { t } = useI18n();
  return (
    <div className="py-6 text-center">
      <motion.div
        initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-festive text-white shadow-glow"
      >
        <PartyPopper className="h-10 w-10" />
      </motion.div>
      <h2 className="mt-6 font-display text-3xl font-bold md:text-4xl">
        {t("reg.done.title")} <span className="text-festive">{t("reg.done.welcome")}</span>
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
        {t("reg.done.body")}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/my-registration" className="inline-flex items-center gap-2 rounded-full bg-festive px-6 py-3 text-sm font-semibold text-white shadow-soft">
          {t("reg.done.goReg")} <ArrowRight className="h-4 w-4" />
        </Link>
        <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-6 py-3 text-sm font-semibold text-primary">
          {t("reg.done.home")}
        </Link>
      </div>
    </div>
  );
}