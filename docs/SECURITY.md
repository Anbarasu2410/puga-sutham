# SECURITY.md — Puga Sutham

## Purpose
This file defines the security rules for this project. The AI coding agent must follow these when generating any code.

## Authentication & Authorization
- No user accounts in v1 — the dashboard is public by design.
- No admin/privileged actions exist yet, so no role checks are needed for v1.

## Secrets & Environment Variables
- `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `NASA_FIRMS_MAP_KEY` all live in environment variables only.
- Never hardcode any of these in source code, even temporarily "to test."
- Never commit `.env.local`. Commit `.env.example` with empty values only.
- These five values must never be sent to the browser or included in any client-side bundle — they are used only inside `/app/api/*` route handlers, which run server-side.

## Input Validation
- Every value coming from a citizen submission (`/api/report`) must be validated with Zod before touching the database — latitude/longitude must be plausible numbers, classification must be one of the two allowed enum values, confidence score must be between 0 and 1.
- Reject any request with unexpected extra fields.

## API Security
- Apply rate limiting (via Upstash) to `/api/report` — this is the only endpoint an anonymous user can trigger repeatedly.
- Use HTTPS in production (Cloudflare Pages provides this automatically).
- Do not expose raw error objects or stack traces in any API response — return a generic message and log details server-side only.

## Data Protection
- Store only what the product needs: location, classification result, timestamp. Do not store uploaded photo files themselves — classification happens client-side and only the result is persisted, which also avoids any storage/privacy overhead.
- Use parameterized queries via the `@libsql/client` query builder — never string-concatenate user input into SQL.

## Error Handling
User-facing errors must never reveal: Turso/Upstash credentials, the FIRMS key, stack traces, or internal file paths.

## AI Agent Rules
The coding agent must:
- Never invent or hardcode production credentials, even placeholder-looking ones that could be mistaken for real.
- Never disable the Zod validation on `/api/report` to "make it work faster."
- Never log the full request body of `/api/report` in a way that could leak location data broadly — log only what's needed to debug (e.g., request ID + status).
- Ask for clarification before adding any new external API dependency not already listed in ARCHITECTURE.md.
