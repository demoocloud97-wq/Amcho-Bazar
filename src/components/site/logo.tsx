import logoAsset from "@/assets/amcho-bazar-logo.png.asset.json";
import { asset } from "@/lib/asset";

export function Logo({ className = "h-10 w-10", withWordmark = false }: { className?: string; withWordmark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={asset(logoAsset.url)}
        alt="Amcho Bazar — Season 3"
        className={`${className} rounded-xl object-contain shadow-soft ring-1 ring-accent/40`}
      />
      {withWordmark && (
        <div className="leading-tight">
          <div className="font-display text-xl font-bold text-primary">Amcho Bazar</div>
          <div className="font-script text-sm text-secondary -mt-1">Season 3</div>
        </div>
      )}
    </div>
  );
}