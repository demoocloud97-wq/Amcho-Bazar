import { normalizeImageUrl } from "@/lib/settings-db";
import { useI18n } from "@/lib/i18n";

// Al Fajar logo (public Drive link — hotlinks reliably via the thumbnail endpoint).
export const AL_FAJR_LOGO = normalizeImageUrl("https://drive.google.com/file/d/14iSFQkcpTI6OfYe7dmklB6r67Pspd_AB/view?usp=sharing");
const LOGO = AL_FAJR_LOGO;

// "Presented by Al Fajar Youth Wing" credit lockup — reused across pages.
export function PresentedBy({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  return (
    <div className={`flex flex-col items-center gap-2 text-center ${className}`}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">{t("footer.poweredBy")}</span>
      <div className="flex items-center gap-3">
        <span className="font-display text-lg font-semibold text-primary md:text-xl">Al Fajar Youth Wing</span>
        <img src={LOGO} alt="Al Fajar Youth Wing" referrerPolicy="no-referrer" className="h-14 w-auto object-contain" />
      </div>
    </div>
  );
}
