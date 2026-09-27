AGENTS.md — Agent Instructions for Puga Sutham
Project Context

Puga Sutham is a Next.js + TypeScript web app that warns heritage-site conservators when agricultural burning's smoke is likely to drift toward their site, using only free, keyless or free-key public data sources (NASA FIRMS, Open-Meteo), a self-hosted TensorFlow.js image classifier, Turso as the database, and Upstash Redis for caching/rate-limiting. Deployed on Cloudflare Pages. No LLM/AI API of any kind is used anywhere in this project.

Before You Start
Read PRD.md
Read ARCHITECTURE.md
Read DATABASE.md
Read API.md
Read SECURITY.md
Read DESIGN_SYSTEM.md
Inspect existing files in /app, /components, /lib before creating new ones
General Rules
Use TypeScript everywhere, no plain .js files.
Reuse existing components before creating new ones.
Keep components modular — one responsibility per file.
Follow the folder structure defined in ARCHITECTURE.md exactly; ask before deviating.
Do not introduce a new npm package without checking it's not already covered by something in ARCHITECTURE.md's tech stack.
Do not add any AI/LLM API (Groq, OpenAI, Hugging Face Inference API, etc.) — this project is explicitly built without one. If a feature seems to need one, propose the non-AI-API alternative first (rule-based logic, self-hosted model) and ask before adding an external AI dependency.
Code Guidelines

Follow CODE_STYLE.md for naming, formatting, and component structure.

Design Rules

Follow DESIGN_SYSTEM.md for colors, spacing, and component look — the app must work cleanly on a phone screen (villager use case) and a desktop browser (conservator's office).

Security Rules

Follow SECURITY.md exactly — especially: never expose the Turso, Upstash, or NASA FIRMS credentials client-side, and always validate /api/report input with Zod before it reaches the database.

Commands
bash
npm install
npm run dev
npm run build
npm run lint
npx @cloudflare/next-on-pages
npx wrangler pages deploy .vercel/output/static
Boundaries

Do not change without explicit approval:

The database schema in DATABASE.md
The choice of Turso/Upstash/Cloudflare (no swapping to Supabase, Firebase, etc. without discussion)
The "no AI API key" constraint — this is a deliberate project requirement, not an oversight