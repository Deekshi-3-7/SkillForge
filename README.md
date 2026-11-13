# SkillForge

Small learning. Daily consistency. Visible growth.

SkillForge is a private daily learning tracker built with React, TypeScript, Vite, Tailwind CSS, React Router, Lucide, and Supabase. It is independent of MicroRead.

## Run locally

Requires Node 22 or newer. This machine also has Node 26 at `/opt/homebrew/opt/node/bin/node`.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Create a **separate Supabase project** for SkillForge. Review and apply [`supabase/migrations/202611070001_initial.sql`](supabase/migrations/202611070001_initial.sql), [`supabase/migrations/202611130001_daily_accountability.sql`](supabase/migrations/202611130001_daily_accountability.sql), then [`supabase/migrations/202611130002_learning_circle.sql`](supabase/migrations/202611130002_learning_circle.sql), in that order. For an existing project, apply only the pending migration after review. Then put the project URL and publishable key in `.env.local`:

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
```

Never put a secret or service role key in a Vite variable.

Apply the migration **before** creating test accounts. For an initial account, use Authentication → Users in the Supabase Dashboard to create a user with an email and password. The migration creates that user's profile and suggested categories automatically. Existing Auth users from before the migration are not backfilled. The browser app has email/password login but no public signup flow; a simple invitation flow is planned for Phase 3.

Without Supabase configuration, the app shows setup instructions instead of invented learning data.

## Commands

```bash
npm run dev
npm run build
npm test
```

## Phase 2 behavior

- Home shows personal streaks, days, hours, today's status, month/year activity heatmap, and recent sessions.
- The learning form starts with a title, category, and duration. Notes and a reference link are optional.
- Multiple sessions on one date are summed before deciding whether that date is active. Five minutes total makes the date active. Individual sessions can be shorter so two sessions can reach five together.
- Course progress accepts a manual percentage when no lecture count is supplied.
- Members can create learning entries only for their local calendar day and cannot edit or delete them. The existing `owner` role can manage entries from all members, while each member's dashboard remains private. Category foreign keys require the same user on each record.
- Learning Circle shares member names and aggregate learning progress through an authenticated database function. It never returns notes, links, titles, or complete entries. All accounts in this dedicated project form one circle.
- Settings offers Emerald Obsidian, Arctic Blue, and Midnight Violet. The choice is saved in the current browser.

The browser uses the user's local calendar date when creating a new learning entry and sends its IANA timezone to PostgREST for database validation. Streaks are calculated from saved dates and never stored as a counter. The database migration leaves historical entries unchanged.

MVP limitation: a caller using the direct API can supply a different valid timezone header and shift which calendar date the database considers "today." The app uses the browser's local timezone; this is an acknowledged trust boundary for the first version.

## Current verification limit

The build and pure streak tests run locally. End-to-end persistence, Supabase RLS, and responsive browser behavior require a configured SkillForge Supabase project and browser preview access.
