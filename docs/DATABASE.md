# DATABASE.md — Puga Sutham

## Database Stack
Database: Turso (libSQL, SQLite-compatible)
Client: `@libsql/client`
Migrations: plain `.sql` files run manually via the Turso CLI (no ORM needed — schema is small and stable)

## Environment
`TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` come from environment variables only. Never hardcode these. Use a separate Turso database for local dev vs. production if you want to keep demo data separate from real data later.

## Core Models

### fire_events
Represents a detected fire — either from NASA FIRMS or a confirmed citizen report.

Fields:
- id (text, primary key)
- source ('firms' | 'citizen_report')
- latitude (real)
- longitude (real)
- confidence (real, nullable — FIRMS provides this, citizen reports don't)
- detected_at (text, ISO timestamp)

### wind_readings
Represents one wind observation for the site's coordinates.

Fields:
- id (text, primary key)
- latitude (real)
- longitude (real)
- wind_speed_kmh (real)
- wind_direction_deg (real)
- recorded_at (text, ISO timestamp)

### drift_alerts
Represents one computed drift-risk result for a fire_event.

Fields:
- id (text, primary key)
- fire_event_id (text, foreign key → fire_events.id)
- bearing_to_site (real)
- is_within_drift_cone (integer, 0 or 1)
- estimated_arrival_minutes (real, nullable)
- computed_at (text, ISO timestamp)

Relationship: one fire_event can have many drift_alerts over time (as wind conditions change, the same fire may be recalculated).

### citizen_reports
Represents a photo-based report submitted by a villager/officer.

Fields:
- id (text, primary key)
- latitude (real)
- longitude (real)
- classification ('smoke' | 'clear')
- confidence_score (real)
- submitted_at (text, ISO timestamp)

## Schema Rules
- Every table has a stable text `id` (use `crypto.randomUUID()` at insert time).
- Timestamps stored as ISO strings, not native SQLite datetime, for simplicity across the JS client.
- `is_within_drift_cone` stored as integer since SQLite has no native boolean.

## Migrations
Since this is a small, stable schema for a hackathon MVP: write the schema once as `schema.sql`, apply it with:
```bash
turso db shell puga-sutham < schema.sql
```
If the schema changes, edit `schema.sql` and re-run only the new `ALTER TABLE`/`CREATE TABLE` statements — never drop and recreate the production database.

## Seed Data
None needed — this app only ever stores live data (no historical dataset dependency), so there's nothing to seed. For local testing without hitting real FIRMS/Open-Meteo repeatedly, insert a few manual rows via `turso db shell` to test the dashboard rendering.

## Production Safety
- Never run destructive commands against the production Turso database from a local terminal without double-checking the target DB name.
- Follow SECURITY.md for how the app authenticates to Turso.
