import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle, CheckCircle2, ChevronDown, Heart, ImagePlus, Loader2, Send, Store, ThumbsDown, ThumbsUp, X,
} from "lucide-react";
import { StarInput } from "./star-rating";
import { useI18n } from "@/lib/i18n";
import { useSeason } from "@/lib/season-context";
import { cloudinaryReady, uploadToCloudinary } from "@/lib/cloudinary";
import { createReview, isEmail, MAX } from "@/lib/reviews-db";
import { getStallsForRegistration } from "@/lib/stalls-db";
import { friendlyAuthError } from "@/lib/firebase-errors";

// A second submit within this window is treated as an accidental double-tap /
// refresh-and-resend rather than a genuine second review.
const COOLDOWN_MS = 60_000;
const cooldownKey = (businessId: string) => `abz-review-sent:${businessId}`;

// The tone of the follow-up prompt depends on the score — but a low rating is
// never blocked or diverted. Every rating submits through the same path.
function ratingTone(n: number) {
  if (n === 5) return { key: "rev.msg5", cls: "border-teal/30 bg-teal/10 text-teal" };
  if (n >= 3) return { key: "rev.msg34", cls: "border-accent/40 bg-accent/15 text-accent-foreground" };
  return { key: "rev.msg12", cls: "border-secondary/35 bg-secondary/10 text-secondary" };
}

const field =
  "w-full rounded-xl border border-border bg-white/70 px-3.5 py-3 text-base outline-none ring-primary/20 transition-shadow focus:ring-4 md:text-sm";
const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground";

export function ReviewForm({ businessId, businessName }: { businessId: string; businessName?: string }) {
  const { t } = useI18n();
  const { activeSeason } = useSeason();

  const [overall, setOverall] = useState(0);
  const [product, setProduct] = useState(0);
  const [staff, setStaff] = useState(0);
  const [delivery, setDelivery] = useState(0);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [orderId, setOrderId] = useState("");
  const [liked, setLiked] = useState("");
  const [improve, setImprove] = useState("");
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [anonymous, setAnonymous] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null); // the REV-XXXXXX reference
  // Guards against a double submit landing before React re-renders the disabled button.
  const inFlight = useRef(false);

  async function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be re-picked after a removal
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError(t("rev.errImage")); return; }
    if (file.size > 5 * 1024 * 1024) { setError(t("rev.errImageSize")); return; }
    setUploading(true);
    setError("");
    try {
      setPhotoUrl(await uploadToCloudinary(file, "review-photos"));
    } catch {
      setError(t("rev.errUpload"));
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (inFlight.current) return;

    if (!overall) { setError(t("rev.errRating")); return; }
    if (!text.trim()) { setError(t("rev.errText")); return; }
    if (!product || !staff || !delivery) { setError(t("rev.errCats")); return; }
    if (email.trim() && !isEmail(email.trim())) { setError(t("rev.errEmail")); return; }

    const last = Number(localStorage.getItem(cooldownKey(businessId)) || 0);
    if (last && Date.now() - last < COOLDOWN_MS) { setError(t("rev.errDuplicate")); return; }

    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const { ref } = await createReview({
        businessId,
        businessName,
        seasonId: activeSeason?.id,
        overallRating: overall,
        productRating: product,
        staffRating: staff,
        deliveryRating: delivery,
        reviewText: text,
        customerName: name,
        email,
        phone,
        orderId,
        liked,
        improvement: improve,
        recommend: recommend ?? undefined,
        photoUrl: photoUrl || undefined,
        anonymous,
      });
      localStorage.setItem(cooldownKey(businessId), String(Date.now()));
      setDone(ref);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  if (done) return <SuccessCard reference={done} />;

  const tone = overall ? ratingTone(overall) : null;

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {/* ---- Overall rating (required) ---- */}
      <section className="rounded-3xl border border-border bg-card p-5 text-center shadow-card md:p-7">
        <h2 className="font-display text-lg font-bold md:text-xl">
          {t("rev.overall")} <span className="text-secondary">*</span>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("rev.overallHint")}</p>
        <div className="mt-4 flex justify-center">
          <StarInput value={overall} onChange={setOverall} size="xl" label={t("rev.overall")} required />
        </div>
        {tone && (
          <p className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-medium ${tone.cls}`} role="status">
            {t(tone.key)}
          </p>
        )}
      </section>

      {/* ---- Review text (required) ---- */}
      <section className="rounded-3xl border border-border bg-card p-5 shadow-card md:p-7">
        <label htmlFor="rev-text" className={labelCls}>
          {t("rev.yourReview")} <span className="text-secondary">*</span>
        </label>
        <textarea
          id="rev-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX.text}
          placeholder={t("rev.reviewPh")}
          className={`min-h-32 ${field}`}
        />
        <div className="mt-1 text-end text-[11px] tabular-nums text-muted-foreground">{text.length}/{MAX.text}</div>
      </section>

      {/* ---- The category ratings are required, so this stays open; the rest is optional ---- */}
      <details open className="group overflow-hidden rounded-3xl border border-border bg-card shadow-card">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-display text-base font-bold md:px-7 [&::-webkit-details-marker]:hidden">
          <span>{t("rev.more")} <span className="text-secondary">*</span></span>
          <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>

        <div className="space-y-6 border-t border-border/70 px-5 py-6 md:px-7">
          {/* Category ratings */}
          <div className="space-y-4">
            {([
              ["rev.product", product, setProduct],
              ["rev.staff", staff, setStaff],
              ["rev.delivery", delivery, setDelivery],
            ] as const).map(([key, val, set]) => (
              <div key={key} className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold">{t(key)} <span className="text-secondary">*</span></span>
                <StarInput value={val} onChange={set} size="lg" label={t(key)} required />
              </div>
            ))}
          </div>

          {/* Would you recommend us? */}
          <fieldset>
            <legend className={labelCls}>{t("rev.recommend")}</legend>
            <div className="flex gap-2">
              {([
                [true, t("common.yes"), ThumbsUp, "border-teal bg-teal/15 text-teal"],
                [false, t("common.no"), ThumbsDown, "border-secondary bg-secondary/15 text-secondary"],
              ] as const).map(([val, lbl, Icon, on]) => (
                <button
                  key={String(val)}
                  type="button"
                  aria-pressed={recommend === val}
                  onClick={() => setRecommend(recommend === val ? null : val)}
                  className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    recommend === val ? on : "border-border bg-white/70 text-foreground/70 hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {lbl}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Free-text follow-ups */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="rev-liked" className={labelCls}>{t("rev.liked")}</label>
              <textarea id="rev-liked" value={liked} onChange={(e) => setLiked(e.target.value)} maxLength={MAX.note} className={`min-h-20 ${field}`} />
            </div>
            <div>
              <label htmlFor="rev-improve" className={labelCls}>{t("rev.improve")}</label>
              <textarea id="rev-improve" value={improve} onChange={(e) => setImprove(e.target.value)} maxLength={MAX.note} className={`min-h-20 ${field}`} />
            </div>
          </div>

          {/* Contact details */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="rev-name" className={labelCls}>{t("rev.name")}</label>
              <input id="rev-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={MAX.name} autoComplete="name" className={field} />
            </div>
            <div>
              <label htmlFor="rev-order" className={labelCls}>{t("rev.orderId")}</label>
              <input id="rev-order" value={orderId} onChange={(e) => setOrderId(e.target.value)} maxLength={MAX.orderId} className={field} />
            </div>
            <div>
              <label htmlFor="rev-email" className={labelCls}>{t("rev.email")}</label>
              <input id="rev-email" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={MAX.email} autoComplete="email" className={field} />
            </div>
            <div>
              <label htmlFor="rev-phone" className={labelCls}>{t("rev.phone")}</label>
              <input id="rev-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={MAX.phone} autoComplete="tel" className={field} />
            </div>
          </div>

          {/* Photo — only offered when Cloudinary is actually configured. */}
          {cloudinaryReady && (
            <div>
              <span className={labelCls}>{t("rev.photo")}</span>
              {photoUrl ? (
                <div className="relative overflow-hidden rounded-2xl border border-border">
                  <img src={photoUrl} alt={t("rev.photo")} className="max-h-56 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl("")}
                    aria-label={t("rev.removePhoto")}
                    className="absolute end-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition-colors hover:bg-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-white/50 px-4 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  {uploading ? t("rev.uploading") : t("rev.addPhoto")}
                  <input type="file" accept="image/*" onChange={pickPhoto} disabled={uploading} className="sr-only" />
                </label>
              )}
              <p className="mt-1 text-[11px] text-muted-foreground">{t("rev.photoHint")}</p>
            </div>
          )}

          {/* Anonymous */}
          <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl bg-muted/50 p-3.5">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[oklch(0.36_0.13_8)]"
            />
            <span>
              <span className="block text-sm font-semibold">{t("rev.anon")}</span>
              <span className="block text-xs text-muted-foreground">{t("rev.anonHint")}</span>
            </span>
          </label>
        </div>
      </details>

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || uploading}
        className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-festive px-6 text-base font-bold text-white shadow-glow transition-transform hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        {busy ? t("rev.submitting") : t("rev.submit")}
      </button>
      <p className="pb-4 text-center text-xs text-muted-foreground">{t("rev.privacy")}</p>
    </form>
  );
}

// The page a customer lands on after scanning the QR code. Mobile-first: a compact
// hero, then straight into the form — no site chrome to scroll past on a phone.
// `businessId` is the event id for the bazaar-wide code, or a registration id for a
// per-stall code; the stall name is resolved from the world-readable stalls list.
export function ReviewLanding({ businessId }: { businessId: string }) {
  const { t } = useI18n();
  const { eventId } = useSeason();
  const [stallName, setStallName] = useState<string | undefined>();

  useEffect(() => {
    if (!businessId || businessId === eventId) { setStallName(undefined); return; }
    let alive = true;
    getStallsForRegistration(businessId)
      .then((s) => { if (alive) setStallName(s[0]?.name || undefined); })
      .catch(() => {});
    return () => { alive = false; };
  }, [businessId, eventId]);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-8 md:pt-12">
      <header className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-festive text-white shadow-glow">
          <Heart className="h-8 w-8 fill-white/25" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-black leading-tight md:text-4xl">
          {t("rev.heroTitle")} <Heart className="inline h-7 w-7 fill-secondary text-secondary md:h-8 md:w-8" />
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground md:text-base">{t("rev.heroSub")}</p>
        {stallName && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold shadow-soft">
            <Store className="h-4 w-4 text-primary" /> {stallName}
          </p>
        )}
      </header>

      <div className="mt-8">
        <ReviewForm businessId={businessId} businessName={stallName} />
      </div>
    </div>
  );
}

function SuccessCard({ reference }: { reference: string }) {
  const { t } = useI18n();
  return (
    <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-card md:p-12">
      <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-festive text-white shadow-glow">
        <CheckCircle2 className="h-10 w-10" />
      </span>
      <h2 className="mt-6 font-display text-2xl font-black leading-tight md:text-3xl">
        {t("rev.thanksTitle")} <Heart className="inline h-6 w-6 fill-secondary text-secondary" />
      </h2>
      <p className="mt-3 text-sm text-muted-foreground">{t("rev.thanksBody")}</p>

      <div className="mx-auto mt-6 inline-flex flex-col items-center rounded-2xl border border-border bg-muted/50 px-6 py-4">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{t("rev.refId")}</span>
        <code className="mt-1 font-display text-xl font-black tracking-wider text-primary">{reference}</code>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">{t("rev.thanksReview")}</p>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link to="/reviews" className="inline-flex min-h-11 items-center rounded-full bg-festive px-6 text-sm font-bold text-white shadow-soft transition-transform hover:scale-[1.03]">
          {t("rev.readReviews")}
        </Link>
        <Link to="/" className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-6 text-sm font-semibold text-primary transition-colors hover:bg-muted">
          {t("common.backHome")}
        </Link>
      </div>
    </div>
  );
}
