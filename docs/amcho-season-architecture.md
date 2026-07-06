# Amcho Bazar — Event/Season Architecture (Redesign)

> Enterprise, multi-year, multi-event architecture. First implementation: **Amcho Bazar**.
> Stack: React + TanStack Router + **Firebase Firestore** (NoSQL). The logical model below
> is store-agnostic and maps cleanly to SQL too.

---

## 0. Guiding principle

Every record in the system is owned by a **Season**, and every Season is owned by an **Event**.
Nothing is queried, written, or aggregated without a `seasonId` in scope.

```
Event (Amcho Bazar, Ladies Sports Day, …)
  └── Season (S1 2024, S2 2025, S3 2026, …)
        ├── Seller Registrations
        ├── Payments
        ├── Categories / Sub-categories
        ├── Stalls (pool)
        ├── Draw Results (allotments)
        ├── Waiting List
        ├── Gallery
        ├── Announcements
        └── Reports / Analytics (derived)
```

Two hard invariants:
1. **Isolation** — data from Season A can never appear in Season B.
2. **Single active season per event** — exactly one `status = *active*` season per event at a time.

---

## 1. Updated database schema

### Physical strategy (Firestore)

Use **flat top-level collections** where every module document carries denormalized
`eventId` + `seasonId` fields, rather than deep subcollections
(`events/{e}/seasons/{s}/registrations/...`).

**Why flat + `seasonId` (not subcollections):**
- Cross-season admin/analytics queries (e.g. "compare S1 vs S2 revenue") work with a single
  collection + composite index. Subcollections need `collectionGroup` queries and fan-out.
- Moving a registration between seasons is a **field update**, not a document move/copy.
- Security rules and indexes stay simple.
- Trade-off (accepted): you must *always* include `seasonId` in the query `where` clause.
  Enforce this in the repository layer so it can never be forgotten.

### Collections

```
events/{eventId}
  id, name, slug, type ("bazaar" | "sports" | "gala" | …),
  description, logoImage, createdAt, updatedAt

seasons/{seasonId}
  id, eventId (FK → events),
  seasonName, seasonNumber, year,
  bannerImage, description,
  registrationStartDate, registrationEndDate, eventDate,
  venue, city,
  maximumStalls, maximumSelectedStalls, registrationFee,
  status,                       -- see enum below
  isActive (bool, derived from status but indexed for fast "the current season" reads)
  stats: { registrations, paid, selected, revenue }   -- denormalized counters (see §5)
  createdAt, updatedAt

registrations/{regId}
  id, eventId, seasonId,        -- season scope (always both)
  seller, business, phone, email, categoryId, products[],
  status ("pending"|"approved"|"waitlist"|"paid"|"rejected"),
  stallNo (nullable),           -- filled after draw
  createdAt, updatedAt

payments/{paymentId}
  id, eventId, seasonId,
  registrationId (FK → registrations),
  amount, method, reference, status ("paid"|"refunded"|"failed"),
  paidAt, createdAt

categories/{categoryId}
  id, eventId, seasonId,        -- categories are season-scoped (S1 food ≠ S3 food)
  name, emoji, description, status
subcategories/{subId}
  id, eventId, seasonId, categoryId, name

stalls/{stallId}
  id, eventId, seasonId,
  stallNo, name, owner, categoryId, subcategoryId (nullable),
  imageUrl (nullable),
  status ("available"|"pending"|"assigned"),
  registrationId (nullable, FK), createdAt, updatedAt

drawResults/{resultId}          -- one per allotted stall
  id, eventId, seasonId,
  registrationId (FK), seller, business, categoryId,
  stallNo, selectionOrder, selectionTime, status ("selected"|"cancelled")

waitingList/{waitId}
  id, eventId, seasonId, registrationId, position, addedAt

galleryItems/{galleryId}
  id, eventId, seasonId, src, caption, createdAt

announcements/{announcementId}
  id, eventId,
  seasonId (NULLABLE — global vs season-specific),
  title, body, type ("info"|"registration"|"draw"|…),
  publishAt, expiresAt, createdAt

-- derived / read-optimized
reports/{seasonId}              -- optional precomputed analytics snapshot
  id (== seasonId), eventId, generatedAt, metrics { … }
```

### Status enum (Season)

```
Upcoming → RegistrationOpen → RegistrationClosed → DrawPending
        → DrawRunning → Completed → Archived
```
`isActive = status ∈ {RegistrationOpen, RegistrationClosed, DrawPending, DrawRunning}`
(the "operationally current" states). Only **one** active season per event.

---

## 2. ER Diagram

```mermaid
erDiagram
    EVENT ||--o{ SEASON : "has many"
    SEASON ||--o{ REGISTRATION : "has"
    SEASON ||--o{ CATEGORY : "has"
    CATEGORY ||--o{ SUBCATEGORY : "has"
    SEASON ||--o{ STALL : "has"
    CATEGORY ||--o{ STALL : "classifies"
    REGISTRATION ||--o| PAYMENT : "pays"
    REGISTRATION ||--o| DRAWRESULT : "allotted"
    STALL ||--o| DRAWRESULT : "assigned to"
    SEASON ||--o{ DRAWRESULT : "produces"
    SEASON ||--o{ WAITINGLIST : "has"
    SEASON ||--o{ GALLERYITEM : "has"
    EVENT ||--o{ ANNOUNCEMENT : "has"
    SEASON ||--o{ ANNOUNCEMENT : "optionally scopes"
    SEASON ||--|| REPORT : "summarized by"

    EVENT { string id PK; string name; string slug; string type }
    SEASON { string id PK; string eventId FK; int seasonNumber; int year; string status; bool isActive }
    REGISTRATION { string id PK; string seasonId FK; string seller; string status; int stallNo }
    PAYMENT { string id PK; string seasonId FK; string registrationId FK; number amount; string status }
    STALL { string id PK; string seasonId FK; int stallNo; string status }
    DRAWRESULT { string id PK; string seasonId FK; int stallNo; int selectionOrder }
    CATEGORY { string id PK; string seasonId FK; string name }
    GALLERYITEM { string id PK; string seasonId FK; string src }
    ANNOUNCEMENT { string id PK; string eventId FK; string seasonId FK_nullable }
```

---

## 3. Relationships & cardinality

| From | To | Cardinality | Notes |
|------|----|-------------|-------|
| Event | Season | 1 : N | An event runs yearly. |
| Season | Registration | 1 : N | Never crosses seasons. |
| Registration | Payment | 1 : 0..1 | One paid registration → one payment (extend to 1:N for refunds). |
| Season | Category | 1 : N | Categories re-declared per season (independent counts). |
| Category | Subcategory | 1 : N | |
| Season | Stall | 1 : N | The season's stall **pool** (maximumStalls). |
| Stall | DrawResult | 1 : 0..1 | A stall is allotted at most once per season. |
| Registration | DrawResult | 1 : 0..1 | A seller wins at most one stall. |
| Season | DrawResult | 1 : N | Up to `maximumSelectedStalls`. |
| Season | WaitingList | 1 : N | Overflow of approved-but-not-drawn sellers. |
| Season | GalleryItem | 1 : N | |
| Event/Season | Announcement | 1 : N | `seasonId` nullable ⇒ event-wide announcement. |

Referential integrity rules (enforced in service layer / Cloud Functions):
- A child's `seasonId`/`eventId` **must equal** its parent's. Reject writes that mismatch.
- `DrawResult.stallNo` must reference a `Stall` in the **same** season with `status=available`.

---

## 4. API design (repository/service layer)

Firestore has no server routes; the "API" is a typed **repository layer** (`src/lib/*-db.ts`)
that always injects `seasonId`. Each function maps 1:1 to a logical REST endpoint (useful if you
later add Cloud Functions / a real backend).

```
Events
  GET    /events                          listEvents()
  POST   /events                          createEvent(data)

Seasons
  GET    /events/:eventId/seasons         listSeasons(eventId)
  GET    /seasons/:id                     getSeason(id)
  POST   /events/:eventId/seasons         createSeason(eventId, data)
  PATCH  /seasons/:id                     updateSeason(id, patch)
  DELETE /seasons/:id                     deleteSeason(id)        // only if empty (§5)
  POST   /seasons/:id/activate            activateSeason(id)      // transaction, single-active
  POST   /seasons/:id/archive             archiveSeason(id)
  GET    /events/:eventId/active-season   getActiveSeason(eventId)

Registrations (all season-scoped)
  GET    /seasons/:sid/registrations                 listRegistrations(sid, filters)
  POST   /seasons/:sid/registrations                 createRegistration(sid, data)
  PATCH  /registrations/:id                          updateRegistration(id, patch)
  POST   /registrations/:id/move                     moveRegistration(id, toSeasonId)  // §5

Stalls / Directory
  GET    /seasons/:sid/stalls                        listStalls(sid, filters)
  POST   /seasons/:sid/stalls                        createStall(sid, data)
  ...

Draw
  GET    /seasons/:sid/draw/state                    getDrawState(sid)
  POST   /seasons/:sid/draw/pick                     commitPick(sid, result)   // transaction
  POST   /seasons/:sid/draw/reset                    resetDraw(sid)

Payments
  GET    /seasons/:sid/payments                      listPayments(sid, filters)
  POST   /seasons/:sid/payments                      recordPayment(sid, data)

Gallery / Announcements / Reports
  GET    /seasons/:sid/gallery                       listGallery(sid)
  GET    /events/:eid/announcements?seasonId=        listAnnouncements(eid, sid?)
  GET    /seasons/:sid/report                        getSeasonReport(sid)
  GET    /events/:eid/report/compare?seasons=a,b     compareSeasons(eid, [a,b])
```

**Golden rule for the repo layer:** every query builder starts from a
`seasonScoped(collection, seasonId)` helper that appends `where("seasonId","==",seasonId)`.
No screen ever builds a raw query.

---

## 5. Backend flow (critical transactions)

Invariants that can't be trusted to the client run in a **Firestore transaction** (or a
Cloud Function for server-authoritative cases like revenue/counters).

**Activate season** (single-active):
```
tx:
  read all seasons where eventId == e AND isActive == true
  set each → isActive:false (status → previous or Completed as appropriate)
  set target → isActive:true, status:"RegistrationOpen" (or requested)
  write event.activeSeasonId = target.id   // fast lookup cache
```

**Delete season** (safe delete):
```
guard: count registrations/stalls/payments/drawResults/gallery where seasonId == s
       must all be 0  → else 409 "Season has data; archive instead"
then delete season doc.
```

**Commit a draw pick** (isolation + no double-allot):
```
tx (scoped to seasonId):
  read stall by (seasonId, stallNo) → assert status == "available"
  read registration → assert seasonId matches, not already allotted
  write stall.status = "assigned", stall.registrationId
  write registration.status = "paid"/"selected", registration.stallNo
  create drawResult { seasonId, registrationId, stallNo, selectionOrder, selectionTime }
  increment season.stats.selected
```

**Counters/revenue** (denormalized on `season.stats`): update inside the same transaction as the
mutating write, or via a Cloud Function `onWrite` trigger for eventual consistency. This keeps
the dashboard O(1) instead of counting the whole collection on every load.

---

## 6. Folder structure

```
src/
  lib/
    firebase.ts
    season-context.tsx        # React context: activeEvent, selectedSeason, switch()
    db/
      _scope.ts               # seasonScoped(), assertSameSeason() guards
      events-db.ts
      seasons-db.ts
      registrations-db.ts
      payments-db.ts
      categories-db.ts
      stalls-db.ts
      draw-db.ts              # draw state + commitPick transaction
      gallery-db.ts
      announcements-db.ts
      reports-db.ts           # season report + compareSeasons
    types/
      season.ts               # Event, Season, Status enums
      registration.ts, stall.ts, payment.ts, drawResult.ts …
  components/
    site/
      season-switcher.tsx     # the global 🟢/🟡/⚪ selector
      season-badge.tsx
  routes/
    admin.tsx                 # dashboard reads selectedSeason from context
    seasons.tsx               # NEW: season CRUD (create/edit/activate/archive)
    stalls.tsx, draw.tsx, gallery.tsx, register.tsx …   # all read season from context
```

- **`season-context.tsx`** is the single source of truth for "which season am I looking at".
  Public pages default to the **active** season; admin can switch.
- Every `*-db.ts` takes `seasonId` as its first argument — no implicit globals.

---

## 7. Best practices

- **Season in every path.** Repository functions require `seasonId`; screens get it from
  `useSeason()`. Lint/review rule: no `collection(db, "registrations")` without a `seasonId` filter.
- **Denormalize `eventId` + `seasonId`** on every doc (2 fields) → cheap filtering & future
  multi-event queries without joins.
- **Denormalized counters** on `season.stats` for O(1) dashboards; keep them consistent inside
  transactions or triggers, never by client-side counting.
- **Security rules** must assert scope, e.g. writes require `request.resource.data.seasonId`
  to exist and (for admin ops) `request.auth.token.admin == true`. Reads may stay public per season.
- **Composite indexes**: `(seasonId, status)`, `(seasonId, categoryId)`, `(seasonId, createdAt)`,
  `(eventId, seasonNumber)`.
- **Immutability after Completed/Archived**: reject writes to child records when the parent
  season is `Completed`/`Archived` (rules + service guard) — historical data stays trustworthy.
- **Idempotent draw**: `drawResult` keyed by `${seasonId}_${stallNo}` prevents double writes.
- **UI always shows the season** (badge + switcher) so an admin never edits the wrong season.

---

## 8. Future scalability

- **Multi-event ready today**: because `Event` is the root and every doc has `eventId`, adding
  "Ladies Sports Day" is *data*, not schema change. Reuse the same collections; the UI filters by
  `eventId` then `seasonId`. Sports-specific fields live in a `meta` map or a typed extension doc.
- **Volume**: flat collections scale to millions; the `(seasonId, …)` indexes keep queries fast.
  If one season grows huge, nothing else is affected (queries are already partitioned by season).
- **Archival/cold storage**: `Archived` seasons can be exported (BigQuery / Cloud Storage) and
  optionally removed from hot Firestore without touching active data.
- **Reporting at scale**: precompute `reports/{seasonId}` via scheduled Cloud Function; the
  compare view reads snapshots, not live scans.
- **Extensibility**: new module (e.g. "Vendors", "Volunteers") = new collection with
  `eventId`+`seasonId` — same pattern, zero coupling.

---

## 9. Migration strategy (current → season-based)

Current state: flat collections `registrations`, `categories`, `subcategories`, `stalls`,
`gallery`, `settings/site`. Event config lives in a hardcoded `EVENT` constant. `stalls` and
`gallery` already carry a numeric `season`; `registrations` do not.

**Phased, zero-downtime migration:**

1. **Introduce entities (additive, no breaking change).**
   - Create `events/amcho-bazar`.
   - Create `seasons/*` for S1(2024), S2(2025), S3(2026). Seed S3 from the `EVENT` constant
     (venue, dates, fee, maximumStalls=75, maximumSelectedStalls=45). Mark S3 `isActive`.

2. **Backfill `eventId`/`seasonId` on existing docs (one-time script).**
   - `stalls`/`galleryItems`: map existing numeric `season` (2,3) → the matching `seasonId`;
     set `eventId`. Keep the old `season` field temporarily for read-fallback.
   - `registrations`: assign to the active season (S3) `seasonId`; set `eventId`.
   - `categories`/`subcategories`: attach to S3 (or clone per season if S1/S2 need their own).
   - Move `settings/site` per-season values into the season doc:
     `heroImageUrl → season.bannerImage`, `drawNonStopEnabled → season.meta`,
     `drawWinnerNumber → season draw state`.

3. **Dual-read compatibility window.**
   - Update repo functions to filter by `seasonId`, but fall back to legacy (no-season) reads
     for any doc not yet backfilled. Log misses. Once misses = 0, drop the fallback.

4. **Introduce `SeasonContext` + `SeasonSwitcher`.**
   - Public pages default to active season; admin pages read the selected season.
   - Refactor screens to pass `seasonId` into every `*-db` call.

5. **Enforce & clean up.**
   - Deploy security rules requiring `seasonId` on writes.
   - Add composite indexes.
   - Remove the deprecated numeric `season` field and the `EVENT` constant (now data-driven).

6. **Verify isolation** with a test: run a draw in S3, assert S2 stalls/registrations unchanged.

**Rollback**: steps 1–3 are additive; if issues arise, revert repo changes (fallback reads keep
the old app working) before dropping legacy fields in step 5.

---

## Summary of key decisions
1. `Event → Season → module data`; every doc denormalizes `eventId` + `seasonId`.
2. Flat collections + `seasonId` filter (not subcollections) for easy cross-season analytics & moves.
3. One repository layer that *forces* season scope; screens get season from `SeasonContext`.
4. Invariants (single-active, safe-delete, draw allotment, counters) enforced in transactions/Functions.
5. Migration is additive & phased with a dual-read window → zero downtime, safe rollback.
