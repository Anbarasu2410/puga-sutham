# ARCHITECTURE.md — Puga Sutham

## System Overview
```
User (conservator / officer / villager)
        ↓
Next.js Frontend (Cloudflare Pages)
        ↓
Pages Functions (API routes)
   ├── /api/fires        → NASA FIRMS (free, key required)
   ├── /api/wind         → Open-Meteo (free, no key)
   ├── /api/drift-check  → local trig calculation, no external call
   ├── /api/photo-check  → runs TensorFlow.js model (self-hosted, no key)
   └── /api/report       → writes citizen reports
        ↓
Turso (libSQL)  ←→  Upstash Redis (cache + rate limit)
        ↓
Dashboard renders map (Leaflet) + alert banner + chart (Recharts)
```

## Tech Stack
- Framework: Next.js (App Router) + TypeScript
- Hosting: Cloudflare Pages (`@cloudflare/next-on-pages` adapter)
- Database: Turso (libSQL) — `@libsql/client`
- Cache / rate-limit: Upstash Redis — `@upstash/redis`, `@upstash/ratelimit`
- Fire data: NASA FIRMS API (free key)
- Wind data: Open-Meteo API (no key)
- Maps: Leaflet + react-leaflet + OpenStreetMap tiles
- Charts: Recharts
- Image classification: TensorFlow.js + a Teachable Machine-trained model (self-hosted, runs client-side)
- Validation: Zod
- UI components: shadcn/ui + Tailwind CSS
- Deployment: Wrangler CLI → Cloudflare Pages

## Project Structure
```
/app
  /api
    /fires/route.ts
    /wind/route.ts
    /drift-check/route.ts
    /photo-check/route.ts
    /report/route.ts
  /dashboard/page.tsx
  /page.tsx
/components
  Map.tsx
  AlertBanner.tsx
  ReadingsChart.tsx
  PhotoUpload.tsx
/lib
  firms.ts        # FIRMS fetch + parse
  weather.ts       # Open-Meteo fetch
  drift.ts         # bearing + drift-cone math
  db.ts            # Turso client setup
  redis.ts         # Upstash client setup
  model.ts         # TensorFlow.js model loading + inference
/types
/docs             # this folder
```

## Data Flow
1. Scheduled/on-load fetch pulls FIRMS + Open-Meteo data.
2. `/api/drift-check` computes bearing + drift-cone + estimated arrival time for each active fire, writes to Turso.
3. Dashboard queries Turso for current state, renders map + alert + chart.
4. Citizen photo goes through client-side TF.js classification, then `/api/report` validates (Zod) and writes to Turso.
5. Upstash Redis sits in front of the FIRMS/Open-Meteo calls (cache) and the report/photo endpoints (rate limit).

## Database & Storage
All data lives in Turso. No user file storage needed for v1 (photo classification happens client-side; we store only the result, not the image itself, to keep things simple and avoid storage costs).

## External Services
- NASA FIRMS — fire detection, requires free `MAP_KEY`, server-side only.
- Open-Meteo — wind data, no key, server-side call.
- No LLM/AI API of any kind — the only "AI" is the self-hosted TF.js model, which has no external dependency.

## Deployment
```bash
npx @cloudflare/next-on-pages
npx wrangler pages deploy .vercel/output/static
```

## Scalability Notes
- Adding a second heritage site = adding a new row of coordinates, not new code.
- Redis caching keeps FIRMS/Open-Meteo calls low even under multiple simultaneous dashboard viewers.
- No component here has a paid tier we'd hit at hackathon-demo or small-deployment scale.
