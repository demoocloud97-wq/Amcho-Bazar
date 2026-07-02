import logoAsset from "@/assets/amcho-bazar-logo.png.asset.json";

export function Logo({ className = "h-10 w-10", withWordmark = false }: { className?: string; withWordmark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={logoAsset.url}
        alt="Amcho Bazar — Season 2"
        className={`${className} rounded-full object-cover shadow-soft ring-2 ring-accent/60`}
      />
      {withWordmark && (
        <div className="leading-tight">
          <div className="font-display text-xl font-bold text-primary">Amcho Bazar</div>
          <div className="font-script text-sm text-secondary -mt-1">Season 2</div>
        </div>
      )}
    </div>
  );
}