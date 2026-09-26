# KICKOFF_PROMPT.md
Paste the text below into Antigravity's agent chat, in the project folder, after you've completed SETUP.md and placed all these docs in a `/docs` folder.

---

Before writing any code, read these files in this order:
- docs/PRD.md
- docs/ARCHITECTURE.md
- docs/DATABASE.md
- docs/API.md
- docs/SECURITY.md
- docs/DESIGN_SYSTEM.md
- docs/CODE_STYLE.md
- docs/AGENTS.md

Use these files as the source of truth for what we're building, how it's structured,
and the rules to follow. Do not invent new database models, API routes, dependencies,
or security rules unless ARCHITECTURE.md or DATABASE.md is missing something needed —
if so, stop and ask me before proceeding.

This project (Puga Sutham) has one hard constraint: it must never call any AI/LLM API
(no Groq, no OpenAI, no Hugging Face Inference API, no paid or keyed AI service of any
kind). The only "AI" in this project is a self-hosted TensorFlow.js image classifier
that I will train separately using Google's Teachable Machine and provide as a model
file. Everything else — fire data, wind data, drift calculation, priority logic — uses
either free public data APIs (already documented in API.md) or plain deterministic
code. If you think a feature needs an LLM, propose the non-AI alternative and ask me
first rather than adding one.

Build in this order, and check in with me after each step before moving to the next:

1. Set up the Turso schema from DATABASE.md (schema.sql) and confirm the connection
   works from a simple test query.
2. Build /api/wind (Open-Meteo fetch, cached in Upstash Redis per API.md's TTL rule).
3. Build /api/fires (NASA FIRMS fetch, same caching pattern).
4. Build /lib/drift.ts (bearing + drift-cone + estimated-arrival math) with a few
   unit tests covering a clear "smoke heading toward site" case and a clear
   "smoke heading away" case.
5. Build /api/drift-check wiring steps 2-4 together, writing results to Turso.
6. Build the dashboard page: map (Leaflet) + alert banner + readings chart, following
   DESIGN_SYSTEM.md.
7. Build /api/report + the photo upload component, wiring in the TensorFlow.js model
   (I'll provide the exported model files once trained).
8. Add rate limiting to /api/report per SECURITY.md.
9. Deploy to Cloudflare Pages and confirm the live URL works end to end.

After each step, show me what changed and wait for confirmation before continuing.
If any part of the documentation conflicts with something you discover while coding
(for example, an API response shape that doesn't match what API.md describes), flag
it and propose an update to the relevant doc rather than silently working around it.
