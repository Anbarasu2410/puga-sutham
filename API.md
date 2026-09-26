# API.md — Puga Sutham

## Base Configuration
Development: `http://localhost:3000/api`
Production: `https://<your-project>.pages.dev/api`
Response format: JSON

## Authentication
No user authentication in v1 — this is a public dashboard. Server-only secrets (Turso token, Upstash token, FIRMS key) are read from environment variables and never sent to the browser.

## Endpoints

### GET /api/fires
Fetches current active fires near the site from NASA FIRMS (cached via Redis), stores new ones in Turso.

Response — 200:
```json
{
  "success": true,
  "data": [
    { "id": "...", "latitude": 9.85, "longitude": 78.22, "confidence": 0.8, "detectedAt": "..." }
  ]
}
```

### GET /api/wind
Fetches current wind data for the site from Open-Meteo (cached via Redis).

Response — 200:
```json
{
  "success": true,
  "data": { "windSpeedKmh": 12.4, "windDirectionDeg": 225, "recordedAt": "..." }
}
```

### POST /api/drift-check
Computes drift-cone risk for all current fire events against the latest wind reading. No request body needed — it reads current state from Turso.

Response — 200:
```json
{
  "success": true,
  "data": [
    { "fireEventId": "...", "isWithinDriftCone": true, "estimatedArrivalMinutes": 87 }
  ]
}
```

### POST /api/report
Citizen submits a photo-classification result + location.

Request:
```json
{
  "latitude": 9.851,
  "longitude": 78.219,
  "classification": "smoke",
  "confidenceScore": 0.91
}
```

Success — 201:
```json
{ "success": true, "data": { "id": "report_123" } }
```

Validation error — 400:
```json
{ "success": false, "error": { "code": "INVALID_INPUT", "message": "Latitude and longitude are required." } }
```

## Status Codes
200 - Success · 201 - Created · 400 - Invalid request · 429 - Too many requests · 500 - Unexpected server error

## Error Rules
- Consistent `{ success, data | error }` shape on every endpoint.
- Never return the FIRMS key, Turso token, or Upstash token in any response or error message.

## Rate Limiting
Applied to:
- `/api/report` — sliding window, 10 requests per 10 seconds per IP (Upstash `@upstash/ratelimit`)
- `/api/fires` and `/api/wind` — not rate-limited directly, but responses are cached (Redis, ~15–20 min TTL) so repeated dashboard loads don't re-hit FIRMS/Open-Meteo.

## Third-Party APIs

**NASA FIRMS**
- Purpose: active fire detection
- Env var: `NASA_FIRMS_MAP_KEY` (server only)
- Expected failure behavior: if unreachable or key invalid, `/api/fires` returns the last cached Redis value if available, otherwise an empty array with a `stale: true` flag — the dashboard should show "last updated X minutes ago" rather than breaking.

**Open-Meteo**
- Purpose: wind speed/direction
- Env var: none required
- Expected failure behavior: same stale-cache fallback pattern as FIRMS.
