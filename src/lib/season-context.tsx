import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AMCHO_BAZAR_EVENT_ID } from "./events-db";
import { getSeasons, watchSeasons, type Season } from "./seasons-db";

type SeasonContextValue = {
  eventId: string;
  seasons: Season[];
  seasonId: string | null;       // currently selected
  season: Season | null;         // resolved selected season
  activeSeason: Season | null;   // the operationally-active season
  loading: boolean;
  setSeasonId: (id: string) => void;
  refresh: () => Promise<void>;
};

const SeasonContext = createContext<SeasonContextValue | null>(null);

export function SeasonProvider({ children }: { children: ReactNode }) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonId, setSeasonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const list = await getSeasons(AMCHO_BAZAR_EVENT_ID);
      setSeasons(list);
      // Default selection: active season → else newest → keep current if still present.
      setSeasonId((cur) => {
        if (cur && list.some((s) => s.id === cur)) return cur;
        return list.find((s) => s.isActive)?.id ?? list[0]?.id ?? null;
      });
    } catch (e) {
      console.error("Failed to load seasons", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Live subscription — any admin edit (fee, dates, active season) reflects instantly
  // across registration/home/admin without a reload. `refresh` stays for manual callers.
  useEffect(() => {
    const unsub = watchSeasons(AMCHO_BAZAR_EVENT_ID, (list) => {
      setSeasons(list);
      setSeasonId((cur) => (cur && list.some((s) => s.id === cur)) ? cur : (list.find((s) => s.isActive)?.id ?? list[0]?.id ?? null));
      setLoading(false);
    });
    return unsub;
  }, []);

  const value = useMemo<SeasonContextValue>(() => ({
    eventId: AMCHO_BAZAR_EVENT_ID,
    seasons,
    seasonId,
    season: seasons.find((s) => s.id === seasonId) ?? null,
    activeSeason: seasons.find((s) => s.isActive) ?? null,
    loading,
    setSeasonId,
    refresh,
  }), [seasons, seasonId, loading, refresh]);

  return <SeasonContext.Provider value={value}>{children}</SeasonContext.Provider>;
}

export function useSeason(): SeasonContextValue {
  const ctx = useContext(SeasonContext);
  if (!ctx) throw new Error("useSeason must be used within a SeasonProvider");
  return ctx;
}
