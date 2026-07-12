import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { watchRegistrations } from "@/lib/db";

// Admin-only live bell: badges the pending-registration count and toasts when a
// new request arrives (real-time via Firestore).
export function NotificationBell() {
  const { isAdmin } = useAuth();
  const [pending, setPending] = useState(0);
  const prev = useRef<number | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    const unsub = watchRegistrations((regs) => {
      const p = regs.filter((r) => r.status === "pending").length;
      if (prev.current !== null && p > prev.current) {
        const latest = regs.find((r) => r.status === "pending");
        toast.info(latest ? `New registration request from ${latest.seller || "an owner"}` : "New registration request");
      }
      prev.current = p;
      setPending(p);
    });
    return () => unsub();
  }, [isAdmin]);

  if (!isAdmin) return null;

  return (
    <Link
      to="/admin"
      aria-label={`${pending} pending registration requests`}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground/70 shadow-soft transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Bell className="h-5 w-5" />
      {pending > 0 && (
        <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold leading-4 text-white ring-2 ring-card">
          {pending > 99 ? "99+" : pending}
        </span>
      )}
    </Link>
  );
}
