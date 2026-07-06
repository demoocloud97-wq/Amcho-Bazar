import { collection, getDocs, writeBatch, serverTimestamp, type DocumentData } from "firebase/firestore";
import { db } from "./firebase";
import { AMCHO_BAZAR_EVENT_ID } from "./events-db";
import { getSeasons, createSeason, activateSeason, type SeasonStatus } from "./seasons-db";
import { EVENT } from "./dummy-data";

/* One-time migration: seed S1/S2/S3 and backfill eventId + seasonId onto legacy
   records (stalls/gallery carry a numeric `season`; registrations/categories get
   the active season). Idempotent — safe to re-run. */

type Seed = {
  seasonNumber: number; year: number; seasonName: string; status: SeasonStatus;
  maximumStalls: number; maximumSelectedStalls: number; registrationFee: number;
  eventDate?: string; active?: boolean;
};

const SEEDS: Seed[] = [
  { seasonNumber: 1, year: 2024, seasonName: "Amcho Bazar Season 1", status: "Archived", maximumStalls: 45, maximumSelectedStalls: 45, registrationFee: 1000 },
  { seasonNumber: 2, year: 2025, seasonName: "Amcho Bazar Season 2", status: "Completed", maximumStalls: 45, maximumSelectedStalls: 45, registrationFee: 1200 },
  { seasonNumber: EVENT.seasonNumber, year: 2026, seasonName: `Amcho Bazar ${EVENT.season}`, status: "RegistrationOpen", maximumStalls: EVENT.totalStalls, maximumSelectedStalls: EVENT.totalWinners, registrationFee: EVENT.registrationFee, eventDate: EVENT.dateLabel, active: true },
];

async function ensureSeasons(): Promise<{ byNumber: Map<number, string>; created: number }> {
  const existing = await getSeasons(AMCHO_BAZAR_EVENT_ID);
  const byNumber = new Map<number, string>(existing.map((s) => [s.seasonNumber, s.id!]));
  let created = 0;

  for (const seed of SEEDS) {
    if (byNumber.has(seed.seasonNumber)) continue;
    const id = await createSeason({
      eventId: AMCHO_BAZAR_EVENT_ID,
      seasonName: seed.seasonName,
      seasonNumber: seed.seasonNumber,
      year: seed.year,
      venue: EVENT.venue,
      city: EVENT.city,
      eventDate: seed.eventDate,
      maximumStalls: seed.maximumStalls,
      maximumSelectedStalls: seed.maximumSelectedStalls,
      registrationFee: seed.registrationFee,
      status: seed.status,
    });
    byNumber.set(seed.seasonNumber, id);
    created++;
  }

  // Ensure the current season is active.
  const active = (await getSeasons(AMCHO_BAZAR_EVENT_ID)).find((s) => s.isActive);
  if (!active) await activateSeason(byNumber.get(EVENT.seasonNumber)!, AMCHO_BAZAR_EVENT_ID);

  return { byNumber, created };
}

// Attach eventId + seasonId to every doc in `coll` that doesn't have one yet.
async function backfill(coll: string, resolve: (data: DocumentData) => string | undefined): Promise<number> {
  const snap = await getDocs(collection(db, coll));
  let batch = writeBatch(db);
  let pending = 0;
  let updated = 0;

  for (const d of snap.docs) {
    const data = d.data();
    if (data.seasonId) continue; // already migrated
    const seasonId = resolve(data);
    if (!seasonId) continue;
    batch.update(d.ref, { seasonId, eventId: AMCHO_BAZAR_EVENT_ID, updatedAt: serverTimestamp() });
    pending++; updated++;
    if (pending >= 400) { await batch.commit(); batch = writeBatch(db); pending = 0; }
  }
  if (pending > 0) await batch.commit();
  return updated;
}

export type MigrationResult = {
  seasonsCreated: number;
  stalls: number;
  gallery: number;
  registrations: number;
  categories: number;
  subcategories: number;
};

export async function runSeasonMigration(): Promise<MigrationResult> {
  const { byNumber, created } = await ensureSeasons();
  const active = byNumber.get(EVENT.seasonNumber)!; // default target for un-seasoned data
  const bySeasonNumber = (d: DocumentData) => byNumber.get(Number(d.season)) ?? active;

  const stalls = await backfill("stalls", bySeasonNumber);
  const gallery = await backfill("gallery", bySeasonNumber);
  const registrations = await backfill("registrations", () => active);
  const categories = await backfill("categories", () => active);
  const subcategories = await backfill("subcategories", () => active);

  return { seasonsCreated: created, stalls, gallery, registrations, categories, subcategories };
}
