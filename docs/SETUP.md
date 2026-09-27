# SETUP.md — Puga Sutham Project Setup

## 1. Scaffold the Next.js project

```bash
# Create a new Next.js app with TypeScript + Tailwind pre-configured
npx create-next-app@latest puga-sutham --typescript --tailwind --app --eslint

cd puga-sutham
```

## 2. Install shadcn/ui (component library)

```bash
# Initializes shadcn/ui config in your project — pick "Default" style when asked
npx shadcn@latest init

# Add the specific components we'll use for the dashboard
npx shadcn@latest add button card badge alert
```

## 3. Install mapping + charts

```bash
# Leaflet for the map, react-leaflet for React bindings, types for TypeScript
npm install leaflet react-leaflet
npm install -D @types/leaflet

# Recharts for the time-series alert chart
npm install recharts
```

## 4. Install the database + cache clients

```bash
# Turso's libSQL client — talks to our database over HTTP
npm install @libsql/client

# Upstash Redis client + rate-limiting helper — both HTTP-based, edge-safe
npm install @upstash/redis @upstash/ratelimit
```

## 5. Install the self-hosted AI model runtime

```bash
# TensorFlow.js — runs our Teachable Machine smoke-classifier model
# in the browser, no server call, no API key
npm install @tensorflow/tfjs @teachablemachine/image
```

## 6. Install validation + Cloudflare deployment tooling

```bash
# Zod — validates incoming form/report data before it touches the database
npm install zod

# Cloudflare's CLI (Wrangler) + the Next.js-on-Pages adapter
npm install -D wrangler @cloudflare/next-on-pages
```

## 7. Create your environment file

```bash
# Create the file that holds your keys — never commit this
touch .env.local
```

Paste this into `.env.local`, filled in with your own values from Part 2:

```
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
NASA_FIRMS_MAP_KEY=
SITE_LATITUDE=9.8449
SITE_LONGITUDE=78.2144
```

(Coordinates above are Keeladi's approximate lat/long — verify and adjust if needed.)

Also create `.env.example` with the same variable names but empty values, and commit *that* one — it tells anyone cloning the repo what they need without leaking your actual keys.

## 8. Log in to your free service CLIs

```bash
# Turso CLI login (creates your DB from here too)
curl -sSfL https://get.tur.so/install.sh | bash
turso auth login
turso db create puga-sutham
turso db show puga-sutham --url        # copy this into TURSO_DATABASE_URL
turso db tokens create puga-sutham     # copy this into TURSO_AUTH_TOKEN

# Cloudflare login (for deployment later)
npx wrangler login
```

## 9. Run it locally to confirm everything installed cleanly

```bash
npm run dev
```

Open `http://localhost:3000` — you should see the default Next.js page. Once you see that, setup is done and you're ready to start building.
