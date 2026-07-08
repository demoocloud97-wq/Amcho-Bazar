import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeftRight, BarChart3, CreditCard, Image as ImageIcon,
  LayoutDashboard, ListTree, LogIn, LogOut, Megaphone, MoreVertical, Plus, Settings,
  Store, Ticket, UserCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuSub,
  DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import { useSeason } from "@/lib/season-context";
import { useI18n } from "@/lib/i18n";
import { logout } from "@/lib/auth";

const ROW = "cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium";

// Consistent icon chip used across every menu row.
function Chip({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "danger" | "primary" }) {
  const cls = tone === "danger" ? "bg-destructive/10 text-destructive" : tone === "primary" ? "bg-festive text-white" : "bg-muted/70 text-muted-foreground";
  return <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${cls}`}>{children}</span>;
}

// A link row inside the dropdown.
function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <DropdownMenuItem asChild className={ROW}>
      <Link to={to}>
        <Chip>{icon}</Chip>
        {label}
      </Link>
    </DropdownMenuItem>
  );
}

export function MainMenu() {
  const { user, isAdmin } = useAuth();
  const { seasons, seasonId, season, setSeasonId } = useSeason();
  const { t } = useI18n();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    toast.success("Signed out");
    navigate({ to: "/" });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={t("menu.menu")}
          className="inline-flex h-11 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm font-medium shadow-soft transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MoreVertical className="h-5 w-5" />
          <span className="hidden sm:inline">{t("menu.menu")}</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 rounded-2xl p-1.5 shadow-glow"
      >
        {/* Signed-in identity */}
        {user && (
          <>
            <div className="flex items-center gap-3 px-1.5 pb-1.5 pt-1">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-festive text-sm font-bold text-white shadow-soft ring-2 ring-accent/40">
                {(user.displayName || user.email || "?").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-foreground">{user.displayName || t("menu.profile")}</div>
                <div className="truncate text-xs text-muted-foreground">{user.email}</div>
              </div>
              {isAdmin && <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">{t("nav.admin")}</span>}
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Season indicator + switcher (admins manage seasons) */}
        {isAdmin && season && (
          <>
            <div className="px-1.5 pb-1.5 pt-1">
              <div className="rounded-xl bg-muted/60 p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  {t("menu.activeSeason")}
                </div>
                <div className="mt-1 font-display text-sm font-bold leading-tight">
                  {season.seasonName}{season.year ? ` (${season.year})` : ""}
                </div>
              </div>
            </div>
            {seasons.length > 1 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className={ROW}>
                  <Chip><ArrowLeftRight className="h-4 w-4" /></Chip>
                  <span className="flex-1">{t("menu.switchSeason")}</span>
                  {season && <span className="max-w-[72px] truncate text-xs font-medium text-muted-foreground">{season.seasonName}</span>}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-64 rounded-2xl p-1.5 shadow-glow">
                  <DropdownMenuLabel className="px-2 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{t("menu.switchSeason")}</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={seasonId ?? ""} onValueChange={setSeasonId}>
                    {seasons.map((s) => (
                      <DropdownMenuRadioItem key={s.id} value={s.id!} className="cursor-pointer rounded-lg py-2 data-[state=checked]:bg-primary/5">
                        <div className="flex w-full items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold leading-tight">{s.seasonName}</div>
                            {s.year != null && <div className="text-[11px] text-muted-foreground">{s.year}</div>}
                          </div>
                          {s.isActive && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              </span>
                              {t("menu.active")}
                            </span>
                          )}
                        </div>
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            <DropdownMenuSeparator />
          </>
        )}

        {isAdmin ? (
          <>
            <DropdownMenuGroup>
              <NavItem to="/admin" icon={<LayoutDashboard className="h-4 w-4" />} label={t("menu.adminDashboard")} />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className={ROW}>
                  <Chip><ListTree className="h-4 w-4" /></Chip> {t("menu.seasons")}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="rounded-xl">
                  <NavItem to="/seasons" icon={<ListTree className="h-4 w-4" />} label={t("menu.allSeasons")} />
                  <NavItem to="/seasons" icon={<Plus className="h-4 w-4" />} label={t("menu.createSeason")} />
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className={ROW}>
                  <Chip><Store className="h-4 w-4" /></Chip> {t("menu.amchoBazar")}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="rounded-xl">
                  <NavItem to="/payments" icon={<CreditCard className="h-4 w-4" />} label={t("menu.payments")} />
                  <NavItem to="/reports" icon={<BarChart3 className="h-4 w-4" />} label={t("menu.reports")} />
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <NavItem to="/announcements" icon={<Megaphone className="h-4 w-4" />} label={t("menu.announcements")} />
              <NavItem to="/stalls" icon={<Store className="h-4 w-4" />} label={t("nav.stalls")} />
              <NavItem to="/gallery" icon={<ImageIcon className="h-4 w-4" />} label={t("nav.gallery")} />
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <NavItem to="/settings" icon={<Settings className="h-4 w-4" />} label={t("menu.settings")} />
            <DropdownMenuItem onSelect={handleLogout} className={`${ROW} text-destructive focus:bg-destructive/10 focus:text-destructive`}>
              <Chip tone="danger"><LogOut className="h-4 w-4" /></Chip> {t("menu.signOut")}
            </DropdownMenuItem>
          </>
        ) : user ? (
          <>
            <DropdownMenuGroup>
              <NavItem to="/my-registration" icon={<Ticket className="h-4 w-4" />} label={t("menu.myRegistration")} />
              <NavItem to="/stalls" icon={<Store className="h-4 w-4" />} label={t("nav.stalls")} />
              <NavItem to="/gallery" icon={<ImageIcon className="h-4 w-4" />} label={t("nav.gallery")} />
              <NavItem to="/announcements" icon={<Megaphone className="h-4 w-4" />} label={t("menu.announcements")} />
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <NavItem to="/settings" icon={<Settings className="h-4 w-4" />} label={t("menu.settings")} />
            <DropdownMenuItem onSelect={handleLogout} className={`${ROW} text-destructive focus:bg-destructive/10 focus:text-destructive`}>
              <Chip tone="danger"><LogOut className="h-4 w-4" /></Chip> {t("menu.signOut")}
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel className="px-2.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("footer.explore")}</DropdownMenuLabel>
            <NavItem to="/" icon={<LayoutDashboard className="h-4 w-4" />} label={t("nav.home")} />
            <NavItem to="/gallery" icon={<ImageIcon className="h-4 w-4" />} label={t("nav.gallery")} />
            <NavItem to="/stalls" icon={<Store className="h-4 w-4" />} label={t("nav.stalls")} />
            <DropdownMenuSeparator />
            {/* Primary CTA */}
            <DropdownMenuItem asChild className={`${ROW} bg-festive font-semibold text-white shadow-soft focus:bg-festive focus:text-white`}>
              <Link to="/register">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/20 text-white"><Ticket className="h-4 w-4" /></span>
                {t("menu.becomeSeller")}
              </Link>
            </DropdownMenuItem>
            <NavItem to="/login" icon={<LogIn className="h-4 w-4" />} label={t("menu.signIn")} />
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
