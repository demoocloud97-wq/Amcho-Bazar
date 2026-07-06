import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeftRight, BarChart3, ClipboardList, CreditCard, Dices, Image as ImageIcon,
  LayoutDashboard, ListTree, LogIn, LogOut, Megaphone, MoreVertical, Plus, Tags,
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

// A link row inside the dropdown.
function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <DropdownMenuItem asChild className="gap-2.5">
      <Link to={to}>
        <span className="text-muted-foreground">{icon}</span>
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
                <DropdownMenuSubTrigger className="gap-2.5">
                  <ArrowLeftRight className="h-4 w-4 text-muted-foreground" /> {t("menu.switchSeason")}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="rounded-xl">
                  <DropdownMenuRadioGroup value={seasonId ?? ""} onValueChange={setSeasonId}>
                    {seasons.map((s) => (
                      <DropdownMenuRadioItem key={s.id} value={s.id!}>
                        {s.seasonName}{s.isActive ? " · Active" : ""}
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
                <DropdownMenuSubTrigger className="gap-2.5">
                  <ListTree className="h-4 w-4 text-muted-foreground" /> {t("menu.seasons")}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="rounded-xl">
                  <NavItem to="/seasons" icon={<ListTree className="h-4 w-4" />} label={t("menu.allSeasons")} />
                  <NavItem to="/seasons" icon={<Plus className="h-4 w-4" />} label={t("menu.createSeason")} />
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="gap-2.5">
                  <Store className="h-4 w-4 text-muted-foreground" /> {t("menu.amchoBazar")}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="rounded-xl">
                  <NavItem to="/admin" icon={<ClipboardList className="h-4 w-4" />} label={t("menu.registrations")} />
                  <NavItem to="/categories" icon={<Tags className="h-4 w-4" />} label={t("nav.categories")} />
                  <NavItem to="/stalls" icon={<Store className="h-4 w-4" />} label={t("nav.stalls")} />
                  <NavItem to="/draw" icon={<Dices className="h-4 w-4" />} label={t("nav.liveDraw")} />
                  <NavItem to="/payments" icon={<CreditCard className="h-4 w-4" />} label={t("menu.payments")} />
                  <NavItem to="/reports" icon={<BarChart3 className="h-4 w-4" />} label={t("menu.reports")} />
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <NavItem to="/announcements" icon={<Megaphone className="h-4 w-4" />} label={t("menu.announcements")} />
              <NavItem to="/gallery" icon={<ImageIcon className="h-4 w-4" />} label={t("nav.gallery")} />
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <NavItem to="/profile" icon={<UserCircle className="h-4 w-4" />} label={t("menu.profile")} />
            <DropdownMenuItem onSelect={handleLogout} className="gap-2.5 text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" /> {t("menu.signOut")}
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
            <NavItem to="/profile" icon={<UserCircle className="h-4 w-4" />} label={t("menu.profile")} />
            <DropdownMenuItem onSelect={handleLogout} className="gap-2.5 text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" /> {t("menu.signOut")}
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel className="text-muted-foreground">{t("menu.amchoBazar")}</DropdownMenuLabel>
            <NavItem to="/" icon={<LayoutDashboard className="h-4 w-4" />} label={t("nav.home")} />
            <NavItem to="/gallery" icon={<ImageIcon className="h-4 w-4" />} label={t("nav.gallery")} />
            <DropdownMenuSeparator />
            <NavItem to="/register" icon={<Ticket className="h-4 w-4" />} label={t("menu.becomeSeller")} />
            <NavItem to="/login" icon={<LogIn className="h-4 w-4" />} label={t("menu.signIn")} />
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
