# PRD.md — Puga Sutham (Smoke-Drift Early Warning)

## Product Overview
Product: Puga Sutham
One-line description: A live dashboard that warns heritage-site conservators when nearby agricultural burning's smoke is likely to drift toward their site.
Vision: Turn scattered, after-the-fact smoke problems into an early-warning system built entirely on free public data — deployable at zero recurring cost by a resource-constrained heritage site anywhere in India.

## Problem
Agricultural burning happens routinely near the Keeladi excavation site. Conservators currently have no advance warning — they only notice smoke once it's already affecting exposed excavation trenches and open-air conservation work. There is no system connecting "a fire is burning nearby" with "the wind is currently carrying it this way."

## Goal
Give the site conservator a clear, live warning — with an estimated arrival time — before smoke reaches the site, so they have time to cover exposed areas or pause outdoor work.

## Target Users
- ASI site conservators (primary)
- District agriculture/pollution-control officers (secondary)
- Nearby villagers/farmers who can submit photo confirmations (tertiary)

## Core Features (v1 — hackathon MVP)
- Live fire-detection feed (NASA FIRMS) for a radius around the site
- Live wind data (Open-Meteo) for the site's coordinates
- Drift-cone calculation: is any detected fire's smoke currently heading toward the site, and roughly when will it arrive
- Map view (Leaflet) showing fires, site, and drift cones
- Alert banner when a drift risk is active
- Citizen photo upload + self-hosted smoke/clear classification
- Simple time-series view of recent readings

## User Flows
**Conservator flow:** open dashboard → see map + alert banner (if any) → note estimated arrival time → take protective action.
**Citizen flow:** open same page → upload photo of smoke → get instant classification → submission appears on the shared map.

## Requirements
- Functional: fetch FIRMS + Open-Meteo on a schedule (every 15–30 min) or on page load; compute drift geometry server-side; store all readings.
- Performance: dashboard should load in under 3 seconds even after a cache miss.
- Platform: mobile-friendly web page (villagers will use phones), works on desktop for the conservator's office computer.

## Success Metrics
- Time between a fire event's detection and an alert appearing on the dashboard.
- Whether the drift-cone calculation correctly flags historically known burning-season smoke patterns (a manual spot-check, not automated).
- Uptime / whether the app stays reachable with zero maintenance for weeks at a time.

## Out of Scope (v1)
- Automated alerts to authorities (SMS/email) — this version is dashboard-only, human-checked.
- Multi-site support (build for Keeladi only in v1; multi-site is a config change for later).
- User accounts/login — the dashboard is open, no auth needed for v1.
