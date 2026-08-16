import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, Clock3, ShieldCheck, Star, ThumbsDown, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { watchRegistrations, type Registration } from "@/lib/db";
import { watchAllReviews, reviewDate, type Review } from "@/lib/reviews-db";

// Firestore Timestamp | Date | null → epoch ms (0 if unknown).
function ms(ts: unknown): number {
  const any = ts as { toDate?: () => Date; seconds?: number };
  if (any?.toDate) return any.toDate().getTime();
  if (typeof any?.seconds === "number") return any.seconds * 1000;
  return 0;
}
function timeAgo(t: number, now: number): string {
  if (!t) return "";
  const s = Math.max(0, Math.floor((now - t) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

type Tone = "pending" | "new" | "review" | "low";
// `to` stays a literal union so TanStack Router can type-check the navigation.
type FeedItem = { key: string; title: string; sub: string; at: number; tone: Tone; to: "/payments" | "/admin" | "/reviews/manage" };

const TONE_STYLE: Record<Tone, string> = {
  pending: "bg-secondary/15 text-secondary",
  new: "bg-teal/15 text-teal",
  review: "bg-accent/25 text-accent-foreground",
  low: "bg-secondary/15 text-secondary",
};

// Admin-only live bell. Two sources feed it: registrations needing payment
// verification, and customer reviews the admin hasn't opened yet. Both raise a
// toast the moment they arrive and share one badge count.
export function NotificationBell() {
  const { isAdmin } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [regs, setRegs] = useState<Registration[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const prev = useRef<number | null>(null);
  const prevRev = useRef<number | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    const unsub = watchRegistrations((all) => {
      const p = all.filter((r) => r.status === "pending").length;
      if (prev.current !== null && p > prev.current) {
        const latest = all.filter((r) => r.status === "pending").sort((a, b) => ms(b.createdAt) - ms(a.createdAt))[0];
        toast.info(latest ? t("notif.newToast").replace("{name}", latest.seller || t("notif.anOwner")) : t("notif.newToastPlain"));
      }
      prev.current = p;
      setRegs(all);
    });
    return () => unsub();
  }, [isAdmin, t]);

  useEffect(() => {
    if (!isAdmin) return;
    const unsub = watchAllReviews((all) => {
      const unread = all.filter((r) => !r.adminRead);
      if (prevRev.current !== null && unread.length > prevRev.current) {
        const latest = unread[0]; // the list arrives newest-first
        if (latest) {
          toast.info(
            (latest.overallRating <= 2 ? t("rv.notifLow") : t("rv.notifNew"))
              .replace("{n}", String(latest.overallRating))
              .replace("{name}", latest.anonymous ? t("revs.anonymous") : latest.customerName || t("revs.aCustomer"))
          );
        }
      }
      prevRev.current = unread.length;
      setReviews(all);
    });
    return () => unsub();
  }, [isAdmin, t]);

  const pending = useMemo(() => regs.filter((r) => r.status === "pending").length, [regs]);
  const unreadReviews = useMemo(() => reviews.filter((r) => !r.adminRead), [reviews]);
  const badge = pending + unreadReviews.length;

  // Newest 8 across both sources — on-hold registrations and unopened reviews are
  // the actionable ones, so they carry the accent colours.
  const feed = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [
      ...regs.map((r) => ({
        key: `reg-${r.id}`,
        title: r.business || r.seller || t("notif.anOwner"),
        sub: (r.status === "pending" ? t("notif.rowPending") : t("notif.rowNew")) + (r.seller ? ` · ${r.seller}` : ""),
        at: ms(r.createdAt),
        tone: (r.status === "pending" ? "pending" : "new") as Tone,
        to: (r.status === "pending" ? "/payments" : "/admin") as FeedItem["to"],
      })),
      ...unreadReviews.map((r) => ({
        key: `rev-${r.id}`,
        title: r.anonymous ? t("revs.anonymous") : r.customerName || t("revs.aCustomer"),
        sub: `${r.overallRating}★ · ${r.reviewText.slice(0, 48)}`,
        at: reviewDate(r.createdAt)?.getTime() ?? 0,
        tone: (r.overallRating <= 2 ? "low" : "review") as Tone,
        to: "/reviews/manage" as FeedItem["to"],
      })),
    ];
    return items.sort((a, b) => b.at - a.at).slice(0, 8);
  }, [regs, unreadReviews, t]);

  const now = Date.now();

  if (!isAdmin) return null;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={t("notif.aria").replace("{n}", String(badge))}
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground/70 shadow-soft transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-muted data-[state=open]:text-primary"
        >
          <Bell className="h-5 w-5" />
          {badge > 0 && (
            <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold leading-4 text-white ring-2 ring-card">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" collisionPadding={12} className="w-[min(20rem,calc(100vw-1.5rem))] p-0">
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
          <span className="font-display text-sm font-bold">{t("notif.title")}</span>
          {pending > 0 && (
            <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[11px] font-semibold text-secondary">{pending} {t("notif.toVerify")}</span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-0" />

        {feed.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">{t("notif.empty")}</div>
        ) : (
          <div className="max-h-80 overflow-y-auto py-1">
            {feed.map((it) => (
              <DropdownMenuItem key={it.key} onSelect={() => navigate({ to: it.to })} className="flex items-start gap-3 px-4 py-2.5">
                <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${TONE_STYLE[it.tone]}`}>
                  {it.tone === "pending" ? <Clock3 className="h-4 w-4" />
                    : it.tone === "new" ? <UserPlus className="h-4 w-4" />
                    : it.tone === "low" ? <ThumbsDown className="h-4 w-4" />
                    : <Star className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{it.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{it.sub}</div>
                </div>
                <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{timeAgo(it.at, now)}</span>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        <DropdownMenuSeparator className="my-0" />
        {unreadReviews.length > 0 && (
          <DropdownMenuItem onSelect={() => navigate({ to: "/reviews/manage" })} className="justify-center px-4 py-2.5 text-sm font-semibold text-primary focus:text-primary">
            <Star className="h-4 w-4" /> {t("rv.unreadCount").replace("{n}", String(unreadReviews.length))}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => navigate({ to: "/admin" })} className="justify-center px-4 py-2.5 text-sm font-semibold text-primary focus:text-primary">
          <ShieldCheck className="h-4 w-4" /> {t("notif.openAdmin")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
