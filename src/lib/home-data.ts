import { useEffect, useState } from "react";
import { useSeason } from "./season-context";
import { getCategories, type Category } from "./categories-db";
import { getRegistrationsBySeasonId } from "./db";
import { getStallsBySeasonId } from "./stalls-db";
import { getGalleryItemsBySeasonId } from "./gallery-db";
import type { Season } from "./seasons-db";

export type SeasonHighlight = {
  season: Season;
  registered: number;   // total registrations that season
  selected: number;     // approved + paid
  stalls: number;       // total stalls that season
};

export type HomeData = {
  loading: boolean;
  activeSeason: Season | null;
  entrepreneurs: number;                 // active-season registrations
  categories: Category[];                // all Firestore categories
  categoryCounts: Record<string, number>; // stalls per categoryId (active season)
  availableStalls: number;               // active season: max − assigned
  completedSeasons: number;              // Completed + Archived count
  highlights: SeasonHighlight[];         // Completed + Archived, newest first
  galleryPreview: { src: string; caption: string }[]; // active season, latest 6
};

const PAST = new Set(["Completed", "Archived"]);

const EMPTY: Omit<HomeData, "loading" | "activeSeason"> = {
  entrepreneurs: 0, categories: [], categoryCounts: {}, availableStalls: 0,
  completedSeasons: 0, highlights: [], galleryPreview: [],
};

// One-shot aggregate loader for the home page — reads live Firestore data so
// stats/highlights/gallery reflect the real event instead of dummy constants.
export function useHomeData(): HomeData {
  const { seasons, activeSeason, loading: seasonsLoading } = useSeason();
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (seasonsLoading) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const past = seasons.filter((s) => PAST.has(s.status)).sort((a, b) => b.seasonNumber - a.seasonNumber);

        // Everything the home page needs, fetched in one parallel wave (was partly
        // sequential — categories, then active season, then a per-season loop).
        const active = activeSeason?.id;
        const [categories, activeReads, pastRegs] = await Promise.all([
          getCategories(),
          active
            ? Promise.all([
                getRegistrationsBySeasonId(active).catch(() => []),
                getStallsBySeasonId(active).catch(() => []),
                getGalleryItemsBySeasonId(active).catch(() => []),
              ])
            : Promise.resolve(null),
          Promise.all(past.map((s) => (s.id ? getRegistrationsBySeasonId(s.id).catch(() => []) : Promise.resolve([])))),
        ]);

        let entrepreneurs = 0, availableStalls = 0;
        const categoryCounts: Record<string, number> = {};
        let galleryPreview: { src: string; caption: string }[] = [];
        if (activeReads) {
          const [regs, stalls, gallery] = activeReads;
          entrepreneurs = regs.length || stalls.length;
          availableStalls = Math.max(0, (activeSeason?.maximumStalls ?? 0) - stalls.length);
          // Sellers-per-category: count registrations (real applicants, incl. multi-category);
          // fall back to assigned stalls for public visitors who can't read registrations.
          const source = regs.length ? regs : stalls;
          for (const item of source) {
            const ids = "categoryIds" in item && item.categoryIds?.length ? item.categoryIds : (item.categoryId ? [item.categoryId] : []);
            for (const id of ids) categoryCounts[id] = (categoryCounts[id] ?? 0) + 1;
          }
          galleryPreview = gallery.slice(0, 6).map((g) => ({ src: g.src, caption: g.caption }));
        }

        // Real registration counts for admins; falls back to season config for the
        // public (registrations are not publicly readable).
        const highlights: SeasonHighlight[] = past.map((s, i) => {
          const regs = pastRegs[i];
          const registered = regs.length;
          const selected = regs.filter((r) => r.status === "approved" || r.status === "paid").length;
          return {
            season: s,
            // Prefer the admin's display override, then real docs, then season config.
            registered: (s.recordedRegistrations && s.recordedRegistrations > 0 ? s.recordedRegistrations : registered) || s.maximumStalls,
            selected: selected || s.maximumSelectedStalls,
            stalls: s.maximumStalls,
          };
        });

        if (!alive) return;
        setData({ entrepreneurs, categories, categoryCounts, availableStalls, completedSeasons: past.length, highlights, galleryPreview });
      } catch (e) {
        console.error("Failed to load home data", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [seasonsLoading, seasons, activeSeason?.id]);

  return { loading: loading || seasonsLoading, activeSeason, ...data };
}
